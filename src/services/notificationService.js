import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../FireBase/firebaseConfig.js'

const dailyCampusNotifications = [
  {
    key: 'morning-spot',
    hour: 10,
    type: 'spot',
    title: 'Bugünün ilk spotu senden gelsin',
    body: 'Kampüste neredesin? Kütüphane, kafe ya da fakülteden kısa bir spot bırak.',
  },
  {
    key: 'lunch-social',
    hour: 13,
    type: 'event',
    title: 'Öğle arası sosyalleşme zamanı',
    body: 'Kafeteryada, bahçede ya da kantinde takılanları yakala. Bir kahve spotu iyi gider.',
  },
  {
    key: 'evening-game',
    hour: 17,
    type: 'quiz',
    title: 'Oyun ve quiz molası',
    body: 'Duo arayanlar, quiz puanı kasanlar ve oyun spotları akışta canlanıyor.',
  },
  {
    key: 'night-campus',
    hour: 21,
    type: 'system',
    title: 'Günün kampüs ritmini kaçırma',
    body: 'Son spotlara bak, yeni insanlarla tanış ve yarına küçük bir plan bırak.',
  },
]

function getUserRef(userId) {
  return doc(db, 'users', userId)
}

function createNotificationId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function getExistingNotifications(userId) {
  const snapshot = await getDoc(getUserRef(userId))
  const notifications = snapshot.data()?.notifications

  return Array.isArray(notifications) ? notifications : []
}

function getDateKey(date) {
  return date.toLocaleDateString('en-CA')
}

export async function createNotification(userId, notification) {
  const notifications = await getExistingNotifications(userId)
  const nextNotification = {
    id: createNotificationId(),
    type: notification.type || 'system',
    title: notification.title,
    body: notification.body,
    read: false,
    metadata: notification.metadata || {},
    createdAt: Timestamp.now(),
  }

  return setDoc(getUserRef(userId), {
    notifications: [nextNotification, ...notifications].slice(0, 80),
  }, { merge: true })
}

export async function syncDailyCampusNotifications(userId, now = new Date()) {
  const userRef = getUserRef(userId)
  const snapshot = await getDoc(userRef)
  const data = snapshot.data() || {}

  if (data.settings?.muteAllNotifications) {
    return undefined
  }

  const dateKey = getDateKey(now)
  const hour = now.getHours()
  const scheduleState = data.notificationSchedule || {}
  const sentKeys = scheduleState.dateKey === dateKey && Array.isArray(scheduleState.sentKeys)
    ? scheduleState.sentKeys
    : []
  const dueNotifications = dailyCampusNotifications.filter((item) => (
    item.hour <= hour && !sentKeys.includes(item.key)
  ))

  if (dueNotifications.length === 0) {
    return undefined
  }

  const notifications = Array.isArray(data.notifications) ? data.notifications : []
  const nextNotifications = dueNotifications.map((item) => ({
    id: createNotificationId(),
    type: item.type,
    title: item.title,
    body: item.body,
    read: false,
    metadata: {
      source: 'daily-campus',
      scheduleKey: item.key,
    },
    createdAt: Timestamp.now(),
  }))

  return setDoc(userRef, {
    notifications: [...nextNotifications, ...notifications].slice(0, 80),
    notificationSchedule: {
      dateKey,
      sentKeys: [...sentKeys, ...dueNotifications.map((item) => item.key)],
      lastSyncedAt: Timestamp.now(),
    },
  }, { merge: true })
}

export async function markNotificationAsRead(userId, notificationId) {
  const notifications = await getExistingNotifications(userId)

  return updateDoc(getUserRef(userId), {
    notifications: notifications.map((item) => (
      item.id === notificationId
        ? { ...item, read: true, readAt: Timestamp.now() }
        : item
    )),
  })
}

export async function deleteNotification(userId, notificationId) {
  const notifications = await getExistingNotifications(userId)

  return updateDoc(getUserRef(userId), {
    notifications: notifications.filter((item) => item.id !== notificationId),
  })
}

export async function markNotificationsAsRead(userId, notifications) {
  if (notifications.every((item) => item.read)) {
    return undefined
  }

  return updateDoc(getUserRef(userId), {
    notifications: notifications.map((item) => ({
      ...item,
      read: true,
      readAt: item.readAt || Timestamp.now(),
    })),
  })
}
