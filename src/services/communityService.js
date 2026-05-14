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
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from '../FireBase/firebaseConfig.js'

export const defaultCommunities = [
  {
    id: 'espor',
    name: 'Espor Arenası',
    emoji: '🎮',
    category: 'Oyun',
    tags: ['duo', 'turnuva', 'gece lobby'],
    color: '#468BE6',
    cover: '#092F64',
    about: 'Oyun odaları, duo çağrıları, turnuva planları ve kampüs içi e-spor muhabbetleri.',
    prompt: 'Bugün duo, lobby veya turnuva çağrını buraya bırak.',
    visibility: 'public',
    joinPolicy: 'open',
    ownerUid: 'system',
    ownerName: 'MAKÜLink',
  },
  {
    id: 'yazilim',
    name: 'Yazılım Kulübü',
    emoji: '💻',
    category: 'Çalışma',
    tags: ['hack night', 'proje', 'staj'],
    color: '#1A5799',
    cover: '#468BE6',
    about: 'Projeler, staj duyumları, mini code challenge ve birlikte öğrenme alanı.',
    prompt: 'Kod, proje, staj veya debug çağrını paylaş.',
    visibility: 'public',
    joinPolicy: 'open',
    ownerUid: 'system',
    ownerName: 'MAKÜLink',
  },
  {
    id: 'kahve',
    name: 'Kahve & Muhabbet',
    emoji: '☕',
    category: 'Kahve',
    tags: ['kafeterya', 'mola', 'tanışma'],
    color: '#93BFEF',
    cover: '#1A5799',
    about: 'Kafeterya masaları, kahve molaları ve yeni insanlarla rahat tanışma odası.',
    prompt: 'Kahve molası, masa çağrısı veya kısa muhabbet spotu yaz.',
    visibility: 'public',
    joinPolicy: 'open',
    ownerUid: 'system',
    ownerName: 'MAKÜLink',
  },
  {
    id: 'study',
    name: 'Study Buddies',
    emoji: '📚',
    category: 'Çalışma',
    tags: ['pomodoro', 'sessiz kat', 'not'],
    color: '#E9F5FF',
    cover: '#468BE6',
    about: 'Sessiz kat, boş masa, not paylaşımı ve pomodoro partneri bulma topluluğu.',
    prompt: 'Çalışma planını, boş masa bilgisini veya pomodoro çağrını yaz.',
    visibility: 'public',
    joinPolicy: 'open',
    ownerUid: 'system',
    ownerName: 'MAKÜLink',
  },
  {
    id: 'fotograf',
    name: 'Fotoğraf Turu',
    emoji: '📸',
    category: 'Yaratıcı',
    tags: ['kampüs turu', 'portre', 'reels'],
    color: '#93BFEF',
    cover: '#1A5799',
    about: 'Kampüs rotaları, portre çekimleri ve yaratıcı içerik buluşmaları.',
    prompt: 'Çekim rotanı, saatini veya model arayışını paylaş.',
    visibility: 'public',
    joinPolicy: 'open',
    ownerUid: 'system',
    ownerName: 'MAKÜLink',
  },
  {
    id: 'muzik',
    name: 'Müzik Odası',
    emoji: '🎵',
    category: 'Yaratıcı',
    tags: ['playlist', 'jam', 'konser'],
    color: '#468BE6',
    cover: '#092F64',
    about: 'Playlist, prova, açık sahne ve kampüs konser planlarının döndüğü oda.',
    prompt: 'Playlist, prova veya mini konser planını bırak.',
    visibility: 'public',
    joinPolicy: 'open',
    ownerUid: 'system',
    ownerName: 'MAKÜLink',
  },
]

const allowedCommunityReactions = new Set(['heart', 'fire', 'coffee', 'laugh', 'wave'])

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
  }
}

const mergeCommunity = (community) => ({
  memberCount: 0,
  postCount: 0,
  messageCount: 0,
  requestCount: 0,
  visibility: 'public',
  joinPolicy: 'open',
  ownerUid: 'system',
  ownerName: 'MAKÜLink',
  ...community,
})

export async function ensureDefaultCommunities() {
  await Promise.all(
    defaultCommunities.map(async (community) => {
      const communityRef = doc(db, 'communities', community.id)
      const snapshot = await getDoc(communityRef)
      const syncedDefaults = {
        ...community,
        id: community.id,
        visibility: 'public',
        joinPolicy: 'open',
        updatedAt: serverTimestamp(),
      }

      if (!snapshot.exists()) {
        await setDoc(communityRef, {
          ...syncedDefaults,
          memberCount: 0,
          postCount: 0,
          messageCount: 0,
          requestCount: 0,
          createdAt: serverTimestamp(),
        })
        return
      }

      // Sadece metadata alanlarını güncelle, sayaçlara dokunma
      const { memberCount, postCount, messageCount, requestCount, ...metaOnly } = syncedDefaults
      await setDoc(communityRef, metaOnly, { merge: true })
    }),
  )
}

export function subscribeCommunities(callback) {
  return onSnapshot(collection(db, 'communities'), (snapshot) => {
    const docs = new Map(snapshot.docs.map((item) => [item.id, { id: item.id, ...item.data() }]))
    const mergedDefaults = defaultCommunities.map((community) => mergeCommunity({ ...community, ...(docs.get(community.id) || {}) }))
    const customCommunities = snapshot.docs
      .filter((item) => !defaultCommunities.some((community) => community.id === item.id))
      .map((item) => mergeCommunity({ id: item.id, ...item.data() }))

    callback([...mergedDefaults, ...customCommunities])
  })
}

export function subscribeJoinedCommunities(userId, callback) {
  const joinedQuery = query(collection(db, 'communityMembers'), where('uid', '==', userId))

  return onSnapshot(joinedQuery, (snapshot) => {
    callback(new Map(snapshot.docs.map((item) => [item.data().communityId, { id: item.id, ...item.data() }])))
  })
}

export function subscribeCommunityMembers(communityId, callback) {
  const membersQuery = query(collection(db, 'communityMembers'), where('communityId', '==', communityId), limit(30))

  return onSnapshot(membersQuery, (snapshot) => {
    const members = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    callback(members.sort((a, b) => (b.joinedAt?.toMillis?.() || b.requestedAt?.toMillis?.() || 0) - (a.joinedAt?.toMillis?.() || a.requestedAt?.toMillis?.() || 0)))
  })
}

export function subscribeCommunityRequests(communityId, callback) {
  const requestsQuery = query(
    collection(db, 'communityMembers'),
    where('communityId', '==', communityId),
    where('status', '==', 'pending'),
    limit(40),
  )

  return onSnapshot(requestsQuery, (snapshot) => {
    const requests = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.requestedAt?.toMillis?.() || 0) - (a.requestedAt?.toMillis?.() || 0))

    callback(requests)
  })
}

export async function createCommunity({ name, about, emoji, visibility }) {
  const user = auth.currentUser
  if (!user) throw new Error('auth-required')

  const cleanName = normalizeText(name, 42)
  const cleanAbout = normalizeText(about, 220)
  if (cleanName.length < 3) throw new Error('name-required')
  if (cleanAbout.length < 3) throw new Error('about-required')

  const userMeta = await getCurrentUserMeta()
  const communityRef = doc(collection(db, 'communities'))
  const memberRef = doc(db, 'communityMembers', `${communityRef.id}_${user.uid}`)
  const isPrivate = visibility === 'private'
  const community = {
    id: communityRef.id,
    name: cleanName,
    emoji: emoji || '✨',
    category: 'Topluluk',
    tags: [isPrivate ? 'private' : 'public'],
    color: '#468BE6',
    cover: '#092F64',
    about: cleanAbout,
    prompt: `${cleanName} içinde ne paylaşmak istersin?`,
    visibility: isPrivate ? 'private' : 'public',
    joinPolicy: isPrivate ? 'approval' : 'open',
    ownerUid: user.uid,
    ownerName: userMeta.displayName,
    memberCount: 1,
    postCount: 0,
    messageCount: 0,
    requestCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(communityRef, community)
  await setDoc(memberRef, {
    uid: user.uid,
    communityId: communityRef.id,
    communityName: cleanName,
    displayName: userMeta.displayName,
    avatarId: userMeta.avatarId,
    role: 'owner',
    status: 'active',
    joinedAt: serverTimestamp(),
  })

  return communityRef.id
}

export async function joinCommunity(community, currentMembership = null) {
  const user = auth.currentUser
  if (!user) throw new Error('auth-required')

  const memberRef = doc(db, 'communityMembers', `${community.id}_${user.uid}`)
  const communityRef = doc(db, 'communities', community.id)
  const userMeta = await getCurrentUserMeta()

  const batch = writeBatch(db)
  const requiresApproval = community.visibility === 'private' || community.joinPolicy === 'approval'

  if (currentMembership) {
    const status = currentMembership.status
    if (status === 'banned') throw new Error('banned')
    if (status === 'pending' && !requiresApproval) {
      batch.update(memberRef, {
        status: 'active',
        joinedAt: serverTimestamp(),
        requestedAt: null,
        displayName: userMeta.displayName,
        avatarId: userMeta.avatarId,
      })
      batch.set(
        communityRef,
        {
          memberCount: increment(1),
          requestCount: increment(-1),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    }
    await batch.commit()
    return
  }

  const status = requiresApproval ? 'pending' : 'active'

  batch.set(memberRef, {
    uid: user.uid,
    communityId: community.id,
    communityName: community.name,
    displayName: userMeta.displayName,
    avatarId: userMeta.avatarId,
    role: 'member',
    status,
    joinedAt: status === 'active' ? serverTimestamp() : null,
    requestedAt: status === 'pending' ? serverTimestamp() : null,
  })

  batch.set(
    communityRef,
    {
      memberCount: status === 'active' ? increment(1) : increment(0),
      requestCount: status === 'pending' ? increment(1) : increment(0),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  await batch.commit()
}

export async function leaveCommunity(communityId, currentMembership = null) {
  const user = auth.currentUser
  if (!user) throw new Error('auth-required')

  if (!currentMembership) return

  const memberRef = doc(db, 'communityMembers', `${communityId}_${user.uid}`)
  const communityRef = doc(db, 'communities', communityId)

  const batch = writeBatch(db)
  const status = currentMembership.status

  batch.delete(memberRef)
  batch.set(
    communityRef,
    {
      memberCount: status === 'active' ? increment(-1) : increment(0),
      requestCount: status === 'pending' ? increment(-1) : increment(0),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  await batch.commit()
}

export async function approveCommunityRequest(communityId, uid) {
  const memberRef = doc(db, 'communityMembers', `${communityId}_${uid}`)
  const communityRef = doc(db, 'communities', communityId)

  await runTransaction(db, async (transaction) => {
    const memberSnapshot = await transaction.get(memberRef)
    if (!memberSnapshot.exists() || memberSnapshot.data().status !== 'pending') return

    transaction.update(memberRef, {
      status: 'active',
      joinedAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
    })
    transaction.update(communityRef, {
      memberCount: increment(1),
      requestCount: increment(-1),
      updatedAt: serverTimestamp(),
    })
  })
}

export async function rejectCommunityRequest(communityId, uid) {
  const memberRef = doc(db, 'communityMembers', `${communityId}_${uid}`)
  const communityRef = doc(db, 'communities', communityId)

  await runTransaction(db, async (transaction) => {
    const memberSnapshot = await transaction.get(memberRef)
    if (!memberSnapshot.exists()) return

    const status = memberSnapshot.data().status
    transaction.delete(memberRef)
    if (status === 'pending') {
      transaction.update(communityRef, {
        requestCount: increment(-1),
        updatedAt: serverTimestamp(),
      })
    }
  })
}

export async function banCommunityMember(communityId, uid) {
  const memberRef = doc(db, 'communityMembers', `${communityId}_${uid}`)
  const communityRef = doc(db, 'communities', communityId)

  await runTransaction(db, async (transaction) => {
    const memberSnapshot = await transaction.get(memberRef)
    if (!memberSnapshot.exists()) return
    const status = memberSnapshot.data().status
    if (memberSnapshot.data().role === 'owner') throw new Error('owner-cannot-be-banned')

    transaction.update(memberRef, {
      status: 'banned',
      role: 'member',
      bannedAt: serverTimestamp(),
    })
    transaction.update(communityRef, {
      memberCount: status === 'active' ? increment(-1) : increment(0),
      requestCount: status === 'pending' ? increment(-1) : increment(0),
      updatedAt: serverTimestamp(),
    })
  })
}

export async function updateCommunityRole(communityId, uid, role) {
  await updateDoc(doc(db, 'communityMembers', `${communityId}_${uid}`), {
    role: role === 'admin' ? 'admin' : 'member',
    roleUpdatedAt: serverTimestamp(),
  })
}

export async function updateCommunityDetails(communityId, { name, about, emoji, visibility }) {
  const cleanName = normalizeText(name, 42)
  const cleanAbout = normalizeText(about, 220)
  if (cleanName.length < 3) throw new Error('name-required')
  if (cleanAbout.length < 3) throw new Error('about-required')

  const isPrivate = visibility === 'private'
  await updateDoc(doc(db, 'communities', communityId), {
    name: cleanName,
    about: cleanAbout,
    emoji: emoji || '✨',
    visibility: isPrivate ? 'private' : 'public',
    joinPolicy: isPrivate ? 'approval' : 'open',
    tags: [isPrivate ? 'private' : 'public'],
    updatedAt: serverTimestamp(),
  })
}

export function subscribeCommunityPosts(communityId, callback) {
  const postsQuery = query(collection(db, 'communityPosts'), where('communityId', '==', communityId), limit(30))

  return onSnapshot(postsQuery, (snapshot) => {
    const posts = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))

    callback(posts)
  })
}

export async function createCommunityPost({ communityId, text, authorName }) {
  const user = auth.currentUser
  const cleanText = normalizeText(text, 280)

  if (!user) throw new Error('auth-required')
  if (cleanText.length < 2) throw new Error('empty-post')

  const userMeta = await getCurrentUserMeta()
  await addDoc(collection(db, 'communityPosts'), {
    uid: user.uid,
    communityId,
    authorName: normalizeText(authorName || userMeta.displayName, 48),
    authorAvatarId: userMeta.avatarId,
    text: cleanText,
    reactions: {},
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await updateDoc(doc(db, 'communities', communityId), {
    postCount: increment(1),
    updatedAt: serverTimestamp(),
  })
}

export async function updateCommunityPost(postId, text) {
  const cleanText = normalizeText(text, 280)
  if (cleanText.length < 2) throw new Error('empty-post')

  await updateDoc(doc(db, 'communityPosts', postId), {
    text: cleanText,
    editedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCommunityPost(postId, communityId) {
  const postRef = doc(db, 'communityPosts', postId)
  const communityRef = doc(db, 'communities', communityId)

  await runTransaction(db, async (transaction) => {
    const communitySnapshot = await transaction.get(communityRef)
    const postCount = Math.max(0, (communitySnapshot.data()?.postCount || 0) - 1)

    transaction.delete(postRef)
    transaction.update(communityRef, {
      postCount,
      updatedAt: serverTimestamp(),
    })
  })
}

export async function toggleCommunityPostReaction(postId, reactionKey) {
  const user = auth.currentUser
  if (!user) throw new Error('auth-required')
  if (!allowedCommunityReactions.has(reactionKey)) throw new Error('invalid-reaction')

  const postRef = doc(db, 'communityPosts', postId)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(postRef)
    if (!snapshot.exists()) return

    const reactions = snapshot.data().reactions || {}
    const currentList = Array.isArray(reactions[reactionKey]) ? reactions[reactionKey] : []
    const nextList = currentList.includes(user.uid)
      ? currentList.filter((uid) => uid !== user.uid)
      : [...currentList, user.uid]

    transaction.update(postRef, {
      [`reactions.${reactionKey}`]: nextList,
      updatedAt: serverTimestamp(),
    })
  })
}

export function subscribeCommunityPostComments(communityId, callback) {
  const commentsQuery = query(collection(db, 'communityPostComments'), where('communityId', '==', communityId), limit(100))

  return onSnapshot(commentsQuery, (snapshot) => {
    const comments = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))

    callback(comments)
  })
}

export async function createCommunityPostComment({ communityId, postId, text }) {
  const user = auth.currentUser
  const cleanText = normalizeText(text, 180)

  if (!user) throw new Error('auth-required')
  if (cleanText.length < 1) throw new Error('empty-comment')

  const userMeta = await getCurrentUserMeta()
  await addDoc(collection(db, 'communityPostComments'), {
    uid: user.uid,
    communityId,
    postId,
    authorName: normalizeText(userMeta.displayName, 48),
    authorAvatarId: userMeta.avatarId,
    text: cleanText,
    createdAt: serverTimestamp(),
  })

  await updateDoc(doc(db, 'communityPosts', postId), {
    commentCount: increment(1),
    updatedAt: serverTimestamp(),
  })
}

export async function updateCommunityPostComment(commentId, text) {
  const cleanText = normalizeText(text, 180)
  if (cleanText.length < 1) throw new Error('empty-comment')

  await updateDoc(doc(db, 'communityPostComments', commentId), {
    text: cleanText,
    editedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCommunityPostComment(commentId, postId) {
  const commentRef = doc(db, 'communityPostComments', commentId)
  const postRef = doc(db, 'communityPosts', postId)

  await runTransaction(db, async (transaction) => {
    const postSnapshot = await transaction.get(postRef)
    const commentCount = Math.max(0, (postSnapshot.data()?.commentCount || 0) - 1)

    transaction.delete(commentRef)
    transaction.update(postRef, {
      commentCount,
      updatedAt: serverTimestamp(),
    })
  })
}

export function subscribeCommunityMessages(communityId, callback) {
  const messagesQuery = query(collection(db, 'communityMessages'), where('communityId', '==', communityId), limit(50))

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))

    callback(messages)
  })
}

export async function sendCommunityMessage({ communityId, text, authorName }) {
  const user = auth.currentUser
  const cleanText = normalizeText(text, 180)

  if (!user) throw new Error('auth-required')
  if (cleanText.length < 1) throw new Error('empty-message')

  const userMeta = await getCurrentUserMeta()
  await addDoc(collection(db, 'communityMessages'), {
    uid: user.uid,
    communityId,
    authorName: normalizeText(authorName || userMeta.displayName, 48),
    authorAvatarId: userMeta.avatarId,
    text: cleanText,
    reactions: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await updateDoc(doc(db, 'communities', communityId), {
    messageCount: increment(1),
    updatedAt: serverTimestamp(),
  })
}

export async function updateCommunityMessage(messageId, text) {
  const cleanText = normalizeText(text, 180)
  if (cleanText.length < 1) throw new Error('empty-message')

  await updateDoc(doc(db, 'communityMessages', messageId), {
    text: cleanText,
    editedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCommunityMessage(messageId, communityId) {
  const messageRef = doc(db, 'communityMessages', messageId)
  const communityRef = doc(db, 'communities', communityId)

  await runTransaction(db, async (transaction) => {
    const communitySnapshot = await transaction.get(communityRef)
    const messageCount = Math.max(0, (communitySnapshot.data()?.messageCount || 0) - 1)

    transaction.delete(messageRef)
    transaction.update(communityRef, {
      messageCount,
      updatedAt: serverTimestamp(),
    })
  })
}

export async function toggleCommunityMessageReaction(messageId, reactionKey) {
  const user = auth.currentUser
  if (!user) throw new Error('auth-required')
  if (!allowedCommunityReactions.has(reactionKey)) throw new Error('invalid-reaction')

  const messageRef = doc(db, 'communityMessages', messageId)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(messageRef)
    if (!snapshot.exists()) return

    const reactions = snapshot.data().reactions || {}
    const currentList = Array.isArray(reactions[reactionKey]) ? reactions[reactionKey] : []
    const nextList = currentList.includes(user.uid)
      ? currentList.filter((uid) => uid !== user.uid)
      : [...currentList, user.uid]

    transaction.update(messageRef, {
      [`reactions.${reactionKey}`]: nextList,
      updatedAt: serverTimestamp(),
    })
  })
}
