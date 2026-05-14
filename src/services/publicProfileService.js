import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../FireBase/firebaseConfig.js'

const normalizeText = (value = '', maxLength = 80) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength)

export function buildPublicProfile(uid, data = {}) {
  return {
    uid,
    name: normalizeText(data.name || data.displayName || 'MAKÜLink üyesi', 48),
    department: normalizeText(data.department || '', 48),
    bio: normalizeText(data.bio || data.miniBio || '', 120),
    avatarId: normalizeText(data.avatarId || 'women', 24),
    interests: Array.isArray(data.interests) ? data.interests.slice(0, 8).map((item) => normalizeText(item, 32)) : [],
    searchName: normalizeText(data.name || data.displayName || '', 48).toLocaleLowerCase('tr-TR'),
    updatedAt: serverTimestamp(),
  }
}

export async function syncPublicProfile(uid, userData = {}) {
  if (!uid) return

  await setDoc(doc(db, 'publicProfiles', uid), buildPublicProfile(uid, userData), { merge: true })
}

export async function getPublicProfile(uid) {
  if (!uid) return null

  const snapshot = await getDoc(doc(db, 'publicProfiles', uid))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}
