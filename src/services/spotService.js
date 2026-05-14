import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  orderBy,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '../FireBase/firebaseConfig.js'

const allowedSpotTypes = new Set(['study', 'coffee', 'duo', 'quiz', 'event', 'game'])
const allowedSpotLocations = new Set(['Söylemek istemiyorum', 'Kampüs', 'Kafeterya', 'Kütüphane', 'BM Fakültesi', 'Amfi', 'Bahçe', 'Ring', 'Fakülte', 'Yurt önü'])
const allowedReactions = new Set(['pin', 'coffee', 'wave', 'heart', 'book', 'game', 'fire'])

const normalizeText = (value = '', maxLength) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength)

const getDisplayName = () => {
  const user = auth.currentUser
  return user?.displayName || user?.email?.split('@')[0] || 'MAKÜLink üyesi'
}

const getCurrentUserMeta = async () => {
  const user = auth.currentUser
  if (!user) throw new Error('auth-required')

  const profileSnapshot = await getDoc(doc(db, 'users', user.uid))
  const profile = profileSnapshot.exists() ? profileSnapshot.data() : {}

  return {
    displayName: profile.name || getDisplayName(),
    avatarId: profile.avatarId || 'women',
    department: profile.department || '',
  }
}

export function subscribeCampusSpots(callback) {
  const spotsQuery = query(
    collection(db, 'campusSpots'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(spotsQuery, (snapshot) => {
    const spots = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    const activeSpots = spots.filter(s => s.deleted !== true);
    callback(activeSpots);
  });
}

export function subscribeCampusSpotComments(callback) {
  const commentsQuery = query(collection(db, 'campusSpotComments'), limit(140))

  return onSnapshot(commentsQuery, (snapshot) => {
    const comments = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))

    callback(comments)
  })
}

export async function createCampusSpot({ text, location, type }) {
  const user = auth.currentUser
  if (!user) throw new Error('auth-required')

  const cleanText = normalizeText(text, 280)
  const cleanLocation = normalizeText(location || 'Söylemek istemiyorum', 42)
  const cleanType = normalizeText(type || 'study', 24)

  if (cleanText.length < 2) throw new Error('empty-spot')
  if (!allowedSpotLocations.has(cleanLocation)) throw new Error('invalid-location')
  if (!allowedSpotTypes.has(cleanType)) throw new Error('invalid-spot-type')

  const userMeta = await getCurrentUserMeta()
  const spotRef = await addDoc(collection(db, 'campusSpots'), {
    uid: user.uid,
    authorName: normalizeText(userMeta.displayName, 48),
    authorAvatarId: userMeta.avatarId,
    department: userMeta.department,
    text: cleanText,
    location: cleanLocation,
    type: cleanType,
    reactions: {},
    commentCount: 0,
    viewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return spotRef.id
}

export async function updateCampusSpot(spotId, text) {
  const cleanText = normalizeText(text, 280)
  if (cleanText.length < 2) throw new Error('empty-spot')

  await updateDoc(doc(db, 'campusSpots', spotId), {
    text: cleanText,
    editedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCampusSpot(spotId) {
  await updateDoc(doc(db, 'campusSpots', spotId), {
    deleted: true,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function toggleCampusSpotReaction(spotId, reactionKey) {
  const user = auth.currentUser
  if (!user) throw new Error('auth-required')
  if (!allowedReactions.has(reactionKey)) throw new Error('invalid-reaction')

  const spotRef = doc(db, 'campusSpots', spotId)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(spotRef)
    if (!snapshot.exists()) return

    const reactions = snapshot.data().reactions || {}
    const currentList = Array.isArray(reactions[reactionKey]) ? reactions[reactionKey] : []
    const nextList = currentList.includes(user.uid)
      ? currentList.filter((uid) => uid !== user.uid)
      : [...currentList, user.uid]

    transaction.update(spotRef, {
      [`reactions.${reactionKey}`]: nextList,
      updatedAt: serverTimestamp(),
    })
  })
}

export async function createCampusSpotComment({ spotId, text }) {
  const user = auth.currentUser
  if (!user) throw new Error('auth-required')

  const cleanText = normalizeText(text, 180)
  if (cleanText.length < 1) throw new Error('empty-comment')

  const userMeta = await getCurrentUserMeta()
  await addDoc(collection(db, 'campusSpotComments'), {
    uid: user.uid,
    spotId,
    authorName: normalizeText(userMeta.displayName, 48),
    authorAvatarId: userMeta.avatarId,
    text: cleanText,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await updateDoc(doc(db, 'campusSpots', spotId), {
    commentCount: increment(1),
    updatedAt: serverTimestamp(),
  })
}

export async function updateCampusSpotComment(commentId, text) {
  const cleanText = normalizeText(text, 180)
  if (cleanText.length < 1) throw new Error('empty-comment')

  await updateDoc(doc(db, 'campusSpotComments', commentId), {
    text: cleanText,
    editedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCampusSpotComment(commentId, spotId) {
  const commentRef = doc(db, 'campusSpotComments', commentId)
  const spotRef = doc(db, 'campusSpots', spotId)

  await runTransaction(db, async (transaction) => {
    const commentSnapshot = await transaction.get(commentRef)
    const spotSnapshot = await transaction.get(spotRef)
    if (!commentSnapshot.exists()) return

    const commentCount = Math.max(0, (spotSnapshot.data()?.commentCount || 0) - 1)

    transaction.update(commentRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    transaction.update(spotRef, {
      commentCount,
      updatedAt: serverTimestamp(),
    })
  })
}
