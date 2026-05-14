import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import Navbar from '../components/Navbar/Navbar.jsx'
import { auth, db } from '../FireBase/firebaseConfig.js'
import {
  deleteNotification as removeNotification,
  markNotificationAsRead,
  markNotificationsAsRead,
} from '../services/notificationService.js'

const notificationMeta = {
  spot: { icon: '📍', label: 'Spot', color: '#468BE6' },
  quiz: { icon: '🎯', label: 'Quiz', color: '#93BFEF' },
  leaderboard: { icon: '🏆', label: 'Puan', color: '#E9F5FF' },
  event: { icon: '🌿', label: 'Etkinlik', color: '#93BFEF' },
  system: { icon: '✨', label: 'Sistem', color: '#468BE6' },
}

const filters = [
  ['all', 'Tümü'],
  ['unread', 'Okunmamış'],
  ['spot', 'Spot'],
  ['quiz', 'Quiz'],
  ['event', 'Etkinlik'],
]

function formatNotificationTime(createdAt) {
  const date = createdAt?.toDate?.()

  if (!date) return 'az önce'

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))

  if (minutes < 60) return `${minutes} dk önce`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} saat önce`

  return `${Math.floor(hours / 24)} gün önce`
}

function NotificationCard({ notification, onRead, onDelete }) {
  const meta = notificationMeta[notification.type] || notificationMeta.system

  return (
    <motion.article
      className={`theme-card rounded-[28px] border p-4 shadow-[0_18px_58px_rgba(9,47,100,0.10)] backdrop-blur-2xl ${
        notification.read ? 'border-white/40 bg-white/34' : 'border-[#468BE6]/50 bg-white/52'
      }`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] text-2xl font-black text-[#092F64] shadow-[0_14px_34px_rgba(9,47,100,0.12)]"
          style={{ backgroundColor: meta.color }}
        >
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#E9F5FF]/72 px-2.5 py-1 text-[11px] font-black text-[#1A5799]">{meta.label}</span>
            {!notification.read && <span className="h-2.5 w-2.5 rounded-full bg-[#468BE6] shadow-[0_0_0_4px_rgba(70,139,230,0.14)]" />}
            <span className="theme-muted text-xs font-bold text-[#1F1F1F]/46">{formatNotificationTime(notification.createdAt)}</span>
          </div>
          <h3 className="theme-title mt-2 text-lg font-black text-[#092F64]">{notification.title}</h3>
          <p className="theme-muted mt-1 text-sm font-semibold leading-6 text-[#1F1F1F]/62">{notification.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!notification.read && (
              <motion.button
                type="button"
                onClick={() => onRead(notification.id)}
                className="rounded-full bg-[#092F64] px-4 py-2 text-xs font-black text-[#E9F5FF]"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
              >
                Okundu yap
              </motion.button>
            )}
            <motion.button
              type="button"
              onClick={() => onDelete(notification.id)}
              className="theme-pill rounded-full border border-white/55 bg-white/52 px-4 py-2 text-xs font-black text-[#092F64]"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              Sil
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return undefined
    }

    return onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        const nextNotifications = snapshot.data()?.notifications
        const safeNotifications = Array.isArray(nextNotifications) ? nextNotifications : []

        setNotifications([...safeNotifications].sort((first, second) => {
          const firstDate = first.createdAt?.toDate?.()?.getTime?.() || 0
          const secondDate = second.createdAt?.toDate?.()?.getTime?.() || 0

          return secondDate - firstDate
        }))
        setIsLoading(false)
      },
      () => {
        setMessage('Bildirimlere şu an ulaşamadık. Birazdan tekrar dene.')
        setIsLoading(false)
      },
    )
  }, [user])

  const unreadCount = notifications.filter((item) => !item.read).length
  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((item) => !item.read)
    if (filter === 'all') return notifications
    return notifications.filter((item) => item.type === filter)
  }, [filter, notifications])

  const markAsRead = async (notificationId) => {
    if (!user) return
    try {
      await markNotificationAsRead(user.uid, notificationId)
    } catch {
      setMessage('Bildirim okundu yapılamadı. Birazdan tekrar dene.')
    }
  }

  const deleteNotification = async (notificationId) => {
    if (!user) return
    try {
      await removeNotification(user.uid, notificationId)
    } catch {
      setMessage('Bildirim silinemedi. Birazdan tekrar dene.')
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      await markNotificationsAsRead(user.uid, notifications)
      setMessage('Tüm bildirimler okundu.')
    } catch {
      setMessage('Bildirimler okundu yapılamadı. Birazdan tekrar dene.')
    }
  }

  return (
    <section className="app-page relative min-h-screen overflow-hidden bg-[#E9F5FF] text-[#1F1F1F]">
      <div className="ambient-blob pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(70,139,230,0.34),transparent_27%),radial-gradient(circle_at_84%_16%,rgba(147,191,239,0.48),transparent_30%),radial-gradient(circle_at_52%_82%,rgba(26,87,153,0.18),transparent_34%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#092F64_1px,transparent_0)] [background-size:18px_18px]" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-5 pb-28 sm:px-5 lg:px-6 lg:pb-10">
        <motion.header
          className="theme-card rounded-[38px] border border-white/55 bg-white/38 p-6 shadow-[0_28px_90px_rgba(9,47,100,0.15)] backdrop-blur-2xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#468BE6]">Bildirim merkezi</p>
              <h1 className="theme-title mt-2 text-5xl font-black leading-none text-[#092F64] sm:text-6xl">Kampüsten sinyaller.</h1>
              <p className="theme-muted mt-3 max-w-2xl text-base font-semibold leading-7 text-[#1F1F1F]/62">
                Spot cevapları, quizler, etkinlikler ve puan hareketleri burada toplanır.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <motion.button type="button" onClick={() => navigate('/')} className="theme-card rounded-[20px] bg-white/62 px-5 py-3 text-sm font-black text-[#092F64] shadow-[0_12px_32px_rgba(9,47,100,0.10)]" whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.96 }}>
                Ana sayfaya dön
              </motion.button>
              <motion.button type="button" onClick={markAllAsRead} disabled={unreadCount === 0} className="rounded-[20px] bg-[#092F64] px-5 py-3 text-sm font-black text-[#E9F5FF] shadow-[0_16px_40px_rgba(9,47,100,0.20)] disabled:cursor-not-allowed disabled:opacity-60" whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.96 }}>
                Tümünü okundu yap
              </motion.button>
            </div>
          </div>
          {message && <p className="mt-4 inline-flex rounded-full bg-[#E9F5FF]/80 px-4 py-2 text-xs font-black text-[#1A5799] shadow-[0_10px_28px_rgba(9,47,100,0.08)]">{message}</p>}
        </motion.header>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="theme-card flex gap-1 rounded-full border border-white/55 bg-white/45 p-1 shadow-[0_16px_45px_rgba(9,47,100,0.08)] backdrop-blur-xl">
            {filters.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-2 text-xs font-black transition ${
                  filter === key ? 'bg-[#092F64] text-[#E9F5FF]' : 'theme-pill-muted text-[#092F64]/70 hover:bg-[#E9F5FF]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="theme-pill rounded-full border border-white/55 bg-white/45 px-4 py-2 text-xs font-black text-[#092F64]">
            {unreadCount} okunmamış
          </span>
        </div>

        <section className="mt-5 grid gap-3">
          {isLoading ? (
            <div className="theme-card rounded-[28px] bg-white/44 p-5 text-sm font-black text-[#092F64] shadow-[0_18px_58px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
              Bildirimler yükleniyor...
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} onRead={markAsRead} onDelete={deleteNotification} />
            ))
          ) : (
            <div className="theme-card rounded-[34px] border border-white/50 bg-white/44 p-8 text-center shadow-[0_22px_72px_rgba(9,47,100,0.11)] backdrop-blur-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#93BFEF] text-3xl">🔔</div>
              <h2 className="theme-title mt-4 text-2xl font-black text-[#092F64]">Şimdilik sessiz.</h2>
              <p className="theme-muted mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#1F1F1F]/58">
                Yeni spot cevapları, quiz duyuruları ve kampüs aktiviteleri geldiğinde burada görünecek.
              </p>
            </div>
          )}
        </section>
      </main>
    </section>
  )
}
