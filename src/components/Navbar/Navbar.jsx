import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom' // Yeni ekledik
import { collection, doc, limit, onSnapshot, query } from 'firebase/firestore'
import makulinkLogo from '../../assets/ChatGPT Image 7 May 2026 22_31_53.png'
import { auth, db } from '../../FireBase/firebaseConfig.js'
import { getAvatarById } from '../../data/avatarOptions.js'

const navItems = [
  { label: 'Ana Sayfa', path: '/', icon: 'home' },
  { label: 'Topluluklar', path: '/communities', icon: 'users' },
  { label: 'Oyunlar', path: '/games', icon: 'game' },
  { label: 'Quizler', path: '/quiz', icon: 'quiz' },
  { label: 'Pomodoro', path: '/exam', icon: 'calendar' },
  { label: 'Leaderboard', path: '/leaderboard', icon: 'trophy' },
]

function Icon({ name, className = 'h-5 w-5' }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20 L16.5 16.5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 9.5 C18 6.2 15.6 4 12 4 C8.4 4 6 6.2 6 9.5 C6 14 4.5 15.5 4.5 15.5 H19.5 C19.5 15.5 18 14 18 9.5 Z" />
        <path d="M10 19 C10.5 19.7 11.2 20 12 20 C12.8 20 13.5 19.7 14 19" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.2 C13.8 15.2 15.2 13.8 15.2 12 C15.2 10.2 13.8 8.8 12 8.8 C10.2 8.8 8.8 10.2 8.8 12 C8.8 13.8 10.2 15.2 12 15.2 Z" />
        <path d="M19.4 13.4 C19.5 12.9 19.5 12.5 19.5 12 C19.5 11.5 19.5 11.1 19.4 10.6 L21 9.4 L19.2 6.3 L17.3 7.1 C16.6 6.5 15.9 6.1 15.1 5.8 L14.8 3.8 H11.2 L10.9 5.8 C10.1 6.1 9.4 6.5 8.7 7.1 L6.8 6.3 L5 9.4 L6.6 10.6 C6.5 11.1 6.5 11.5 6.5 12 C6.5 12.5 6.5 12.9 6.6 13.4 L5 14.6 L6.8 17.7 L8.7 16.9 C9.4 17.5 10.1 17.9 10.9 18.2 L11.2 20.2 H14.8 L15.1 18.2 C15.9 17.9 16.6 17.5 17.3 16.9 L19.2 17.7 L21 14.6 Z" />
      </>
    ),
    home: (
      <>
        <path d="M4 11 L12 4 L20 11" />
        <path d="M7 10.5 V20 H17 V10.5" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M15 9 L13.3 13.3 L9 15 L10.7 10.7 Z" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="4" />
        <path d="M8 3 V7 M16 3 V7 M4 10 H20" />
      </>
    ),
    users: (
      <>
        <path d="M9.5 11.5 C11.4 11.5 13 9.9 13 8 C13 6.1 11.4 4.5 9.5 4.5 C7.6 4.5 6 6.1 6 8 C6 9.9 7.6 11.5 9.5 11.5 Z" />
        <path d="M3.5 19 C4.4 16.5 6.5 15 9.5 15 C12.5 15 14.6 16.5 15.5 19" />
        <path d="M15 11 C16.7 10.7 18 9.3 18 7.5 C18 6.4 17.5 5.4 16.7 4.8" />
        <path d="M17 14.5 C18.8 15.1 20 16.5 20.5 18.5" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4 H16 V9 C16 12 14.2 14 12 14 C9.8 14 8 12 8 9 Z" />
        <path d="M8 6 H5 C5 9 6.5 11 8.5 11" />
        <path d="M16 6 H19 C19 9 17.5 11 15.5 11" />
        <path d="M12 14 V18 M9 20 H15" />
      </>
    ),
    game: (
      <>
        <path d="M7 9 H17 C19 9 20.5 10.7 20.5 13.4 C20.5 16.1 19.4 18 17.8 18 C16.9 18 16.2 17.3 15.4 16.4 H8.6 C7.8 17.3 7.1 18 6.2 18 C4.6 18 3.5 16.1 3.5 13.4 C3.5 10.7 5 9 7 9 Z" />
        <path d="M8 12 V15 M6.5 13.5 H9.5 M16 13 H16.1 M18 15 H18.1" />
      </>
    ),
    quiz: (
      <>
        <path d="M8.5 8 C8.9 6.3 10.2 5.5 12 5.5 C14 5.5 15.5 6.7 15.5 8.5 C15.5 10.7 13 11 12.3 12.5" />
        <path d="M12 17 H12.1" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export default function Navbar() {
  const navigate = useNavigate() 
  const location = useLocation() 
  const [avatarId, setAvatarId] = useState('women')
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [profiles, setProfiles] = useState([])
  const [communities, setCommunities] = useState([])
  const selectedAvatar = getAvatarById(avatarId)

  const navigationHandlers = {
    home: () => navigate('/'),
    communities: () => navigate('/communities'),
    games: () => navigate('/games'),
    quiz: () => navigate('/quiz'),
    exam: () => navigate('/exam'),
    leaderboard: () => navigate('/leaderboard'),
  }

  useEffect(() => {
    const user = auth.currentUser

    if (!user) {
      return undefined
    }

    return onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        const nextAvatarId = snapshot.data()?.avatarId

        if (nextAvatarId) {
          setAvatarId(nextAvatarId)
        }
      },
      (error) => {
        console.warn('Navbar avatar could not be loaded:', error)
      },
    )
  }, [])

  useEffect(() => {
    if (!auth.currentUser) return undefined

    const profilesUnsubscribe = onSnapshot(query(collection(db, 'publicProfiles'), limit(60)), (snapshot) => {
      setProfiles(snapshot.docs.map((item) => ({ id: item.id, ...item.data(), type: 'profile' })))
    })
    const communitiesUnsubscribe = onSnapshot(query(collection(db, 'communities'), limit(60)), (snapshot) => {
      setCommunities(snapshot.docs.map((item) => ({ id: item.id, ...item.data(), type: 'community' })))
    })

    return () => {
      profilesUnsubscribe()
      communitiesUnsubscribe()
    }
  }, [])

  const cleanSearch = searchTerm.trim().toLocaleLowerCase('tr-TR')
  const staticResults = [
    { id: 'games', type: 'page', title: 'Oyunlar', subtitle: 'Kelime, refleks ve mini oyunlar', action: () => navigate('/games') },
    { id: 'quiz', type: 'page', title: 'Quizler', subtitle: 'Günlük kampüs quizleri', action: () => navigate('/quiz') },
    { id: 'exam', type: 'page', title: 'Pomodoro', subtitle: 'Duo çalışma odaları', action: () => navigate('/exam') },
    { id: 'leaderboard', type: 'page', title: 'Leaderboard', subtitle: 'Oyun, quiz ve sosyallik sıralaması', action: () => navigate('/leaderboard') },
  ]
  const searchResults = cleanSearch
    ? [
      ...profiles
        .filter((item) => `${item.name || ''} ${item.department || ''}`.toLocaleLowerCase('tr-TR').includes(cleanSearch))
        .slice(0, 5),
      ...communities
        .filter((item) => `${item.name || ''} ${item.about || ''}`.toLocaleLowerCase('tr-TR').includes(cleanSearch))
        .slice(0, 4),
      ...staticResults.filter((item) => `${item.title} ${item.subtitle}`.toLocaleLowerCase('tr-TR').includes(cleanSearch)),
    ].slice(0, 9)
    : []

  const openSearchResult = (item) => {
    setSearchTerm('')
    if (item.type === 'profile') {
      navigate(`/user/${item.uid || item.id}`) 
      return
    }
    if (item.type === 'community') {
      navigate('/communities', { state: { initialCommunityId: item.id } }) 
      return
    }
    const targetPath = navItems.find(nav => nav.label === item.title)?.path || '/'
    navigate(targetPath)
  }

  useEffect(() => {
    const user = auth.currentUser

    if (!user) {
      return undefined
    }

    return onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        const notifications = snapshot.data()?.notifications
        const unreadNotifications = Array.isArray(notifications)
          ? notifications.filter((item) => !item.read)
          : []

        setUnreadCount(unreadNotifications.length)
      },
      () => {},
    )
  }, [])

  return (
    <>
      <motion.header
        className="sticky top-0 z-40 px-3 pt-3"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav className="theme-card mx-auto flex min-h-24 w-full max-w-[1680px] items-center justify-between gap-3 sm:gap-5 rounded-[34px] border border-white/45 bg-[#E9F5FF]/72 px-3 sm:px-7 lg:px-8 xl:px-10 shadow-[0_20px_70px_rgba(9,47,100,0.12)] backdrop-blur-2xl">
          <button type="button" onClick={() => navigate('/')} className="flex min-w-fit items-center gap-3 text-left">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-[18px] border border-white/60 bg-[#E9F5FF] shadow-[0_14px_34px_rgba(9,47,100,0.20)]">
              <img
                src={makulinkLogo}
                alt="MAKÜLink logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="leading-tight">
              <p className="theme-title text-lg font-semibold text-[#092F64]">
                MAKÜ<span className="text-[#468BE6]">Link</span>
              </p>
              <p className="theme-muted hidden sm:block text-xs font-medium text-[#1F1F1F]/60">Spot bırak, kampüsü yakala</p>
            </div>
          </button>

          <div className="theme-pill hidden min-w-max items-center gap-1 rounded-full border border-white/55 bg-white/45 p-1.5 shadow-[0_16px_45px_rgba(9,47,100,0.08)] backdrop-blur-xl lg:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition xl:px-5 ${
                    isActive
                      ? 'bg-[#092F64] text-[#E9F5FF] shadow-[0_10px_26px_rgba(9,47,100,0.18)]'
                      : 'theme-pill-muted text-[#092F64]/70 hover:bg-[#E9F5FF] hover:text-[#092F64]'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                {item.label}
              </button>
              )
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="relative hidden xl:block">
              <label className="theme-pill flex h-12 items-center gap-2 rounded-full border border-white/55 bg-white/50 px-4 text-[#1F1F1F]/60 shadow-[0_12px_34px_rgba(9,47,100,0.07)] backdrop-blur-xl">
                <Icon name="search" className="h-4 w-4" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value.slice(0, 48))}
                  className="theme-title w-32 bg-transparent text-sm font-medium text-[#092F64] outline-none placeholder:text-[#1F1F1F]/45 2xl:w-52"
                  placeholder="Kullanıcı, grup, oyun ara"
                />
              </label>

              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-[28px] border border-white/60 bg-[#E9F5FF]/95 p-2 shadow-[0_28px_80px_rgba(9,47,100,0.20)] backdrop-blur-2xl"
                >
                  {searchResults.map((item) => {
                    const avatar = item.type === 'profile' ? getAvatarById(item.avatarId) : null
                    const icon = item.type === 'community' ? item.emoji : item.type === 'page' ? '✨' : null
                    const title = item.name || item.title
                    const subtitle = item.type === 'profile' ? item.department || 'MAKÜLink üyesi' : item.about || item.subtitle

                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openSearchResult(item)}
                        className="flex w-full items-center gap-3 rounded-[22px] px-3 py-2.5 text-left transition hover:bg-white/70"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#93BFEF]/70 text-xl font-black text-[#092F64]">
                          {avatar ? <img src={avatar.src} alt="" className="h-full w-full object-cover" draggable="false" /> : icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black text-[#092F64]">{title}</span>
                          <span className="block truncate text-xs font-bold text-[#1F1F1F]/55">{subtitle}</span>
                        </span>
                        <span className="ml-auto rounded-full bg-[#468BE6]/10 px-2 py-1 text-[10px] font-black uppercase text-[#1A5799]">
                          {item.type === 'profile' ? 'kişi' : item.type === 'community' ? 'grup' : 'sayfa'}
                        </span>
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="theme-pill relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/55 bg-white/50 text-[#092F64] shadow-[0_12px_30px_rgba(9,47,100,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
              aria-label="Bildirimleri aç"
            >
              <Icon name="bell" className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#468BE6] px-1 text-[10px] font-black text-[#E9F5FF] ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="theme-pill flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/55 bg-white/50 text-[#092F64] shadow-[0_12px_30px_rgba(9,47,100,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:rotate-12 hover:bg-white"
              aria-label="Ayarları aç"
            >
              <Icon name="settings" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full border border-white bg-[#93BFEF] text-sm font-bold text-[#092F64] shadow-[0_12px_30px_rgba(9,47,100,0.12)] transition hover:-translate-y-0.5 hover:scale-105"
            >
              <img
                src={selectedAvatar.src}
                alt="Profil avatarı"
                className="h-full w-full object-cover object-center"
                draggable="false"
              />
            </button>
          </div>
        </nav>
      </motion.header>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[28px] border border-[#092F64]/[0.08] bg-[#E9F5FF]/85 p-2 shadow-[0_18px_55px_rgba(9,47,100,0.18)] backdrop-blur-2xl lg:hidden">
        <div className="flex gap-1 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)} 
                className={`flex min-h-12 min-w-[74px] flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-semibold transition ${
                  isActive ? 'bg-[#092F64] text-[#E9F5FF]' : 'text-[#092F64]/70'
                } disabled:opacity-50`}
                >
                <Icon name={item.icon} className="h-5 w-5" />
                <span>{item.path === '/leaderboard' ? 'Puan' : item.path === '/communities' ? 'Topluluk' : item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
