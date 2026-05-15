import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import Navbar from '../components/Navbar/Navbar.jsx'
import { db } from '../FireBase/firebaseConfig.js'

const leaderboardTypes = [
  { id: 'games', label: 'Oyunlar', title: 'Oyun sıralaması', scoreKey: 'gameScore', empty: 'Oyun oynayınca bu tablo canlanacak.', badge: 'Oyun odası', emoji: '🎮' },
  { id: 'quiz', label: 'Quizler', title: 'Quiz sıralaması', scoreKey: 'quizScore', empty: 'Quiz çözenler burada yükselecek.', badge: 'Quiz avcısı', emoji: '🎯' },
  { id: 'social', label: 'Sosyallik', title: 'Sosyallik sıralaması', scoreKey: 'socialScore', fallbackKey: 'spotScore', empty: 'Spot bırakanlar burada yarışacak.', badge: 'Spot bıraktı', emoji: '🔥' },
]

function normalizeLeader(snapshotDoc) {
  const data = snapshotDoc.data()

  return {
    name: data.name || 'MAKÜLink üyesi',
    totalScore: Number(data.totalScore || 0),
    quizScore: Number(data.quizScore || 0),
    gameScore: Number(data.gameScore || 0),
    socialScore: Number(data.socialScore || data.spotScore || 0),
    spotScore: Number(data.spotScore || 0),
    uid: data.uid || snapshotDoc.id,
  }
}

function TrophyIcon() {
  return (
    <motion.svg
      className="mx-auto h-20 w-20 sm:h-24 sm:w-24"
      viewBox="0 0 140 140"
      fill="none"
      initial={{ opacity: 0, y: 10, scale: 0.92 }}
      animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
      transition={{ y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.45 }, scale: { duration: 0.45 } }}
      aria-hidden="true"
    >
      <path d="M45 32H25C24 55 34 69 52 73" stroke="#93BFEF" strokeWidth="9" strokeLinecap="round" />
      <path d="M95 32H115C116 55 106 69 88 73" stroke="#93BFEF" strokeWidth="9" strokeLinecap="round" />
      <path d="M45 24H95L88 70C86 84 78 92 70 92C62 92 54 84 52 70L45 24Z" fill="#468BE6" />
      <path d="M70 92V113" stroke="#468BE6" strokeWidth="9" strokeLinecap="round" />
      <path d="M56 116H84" stroke="#468BE6" strokeWidth="9" strokeLinecap="round" />
      <path d="M95 24L89 70C87 84 78 92 70 92V24H95Z" fill="#1A5799" opacity="0.32" />
      <path d="M53 31H85" stroke="#E9F5FF" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
    </motion.svg>
  )
}

function PodiumColumn({ leader, place, className, textClassName, delay }) {
  return (
    <motion.div
      className={`flex min-w-0 flex-col items-center justify-end p-3 text-center sm:p-4 ${className}`}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className={`font-black leading-none ${textClassName}`}>{place}</span>
      <p className="mt-2 max-w-full truncate text-xs font-black sm:text-sm">{leader?.name || 'Henüz yok'}</p>
      <p className="text-xs font-bold opacity-75">{leader ? `${leader.score} puan` : 'Puan bekleniyor'}</p>
    </motion.div>
  )
}

function PodiumStage({ leaders, activeType }) {
  if (leaders.length === 0) {
    return (
      <motion.div
        className="theme-card rounded-[34px] border border-white/50 bg-white/36 px-5 py-12 text-center shadow-[0_22px_70px_rgba(9,47,100,0.12)] backdrop-blur-2xl"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <TrophyIcon />
        <h3 className="mt-4 text-2xl font-black text-[#092F64]">Henüz gerçek puan yok.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm font-bold text-[#1F1F1F]/55">
          {activeType.empty}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="theme-card overflow-hidden rounded-[34px] border border-white/50 bg-white/36 px-5 pb-6 pt-6 shadow-[0_22px_70px_rgba(9,47,100,0.12)] backdrop-blur-2xl sm:px-7 sm:pb-7 sm:pt-7"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <TrophyIcon />
      <div className="mx-auto mt-4 grid h-[230px] max-w-2xl grid-cols-3 items-end gap-0 sm:h-[280px]">
        <PodiumColumn leader={leaders[1]} place="2" className="h-32 rounded-l-[22px] border border-[#E9F5FF]/50 bg-[#93BFEF] text-[#092F64] shadow-[inset_-8px_0_0_rgba(9,47,100,0.08)] sm:h-40" textClassName="text-5xl text-[#E9F5FF] sm:text-6xl" delay={0.2} />
        <PodiumColumn leader={leaders[0]} place="1" className="h-48 border border-[#E9F5FF]/50 bg-[#468BE6] text-[#E9F5FF] shadow-[inset_-10px_0_0_rgba(9,47,100,0.14)] sm:h-56" textClassName="text-6xl text-[#E9F5FF] sm:text-7xl" delay={0.28} />
        <PodiumColumn leader={leaders[2]} place="3" className="h-28 rounded-r-[22px] border border-[#E9F5FF]/50 bg-[#1A5799] text-[#E9F5FF] shadow-[inset_-8px_0_0_rgba(0,0,0,0.10)] sm:h-36" textClassName="text-5xl text-[#E9F5FF] sm:text-6xl" delay={0.36} />
      </div>
    </motion.div>
  )
}

function LeaderRow({ leader, index }) {
  return (
    <motion.article
      className="theme-card flex items-center justify-between gap-4 rounded-[28px] border border-white/45 bg-white/42 p-4 shadow-[0_18px_58px_rgba(9,47,100,0.10)] backdrop-blur-2xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 + index * 0.05, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, scale: 1.004 }}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#092F64] text-xl font-black text-[#E9F5FF]">
          #{leader.rank}
        </div>
        <div className="min-w-0">
          <h2 className="theme-title truncate text-xl font-black text-[#092F64]">{leader.name}</h2>
          <p className="theme-muted mt-1 text-sm font-bold text-[#1F1F1F]/58">
            {leader.emoji} {leader.badge}
          </p>
        </div>
      </div>
      <div className="shrink-0 rounded-full bg-[#E9F5FF]/80 px-4 py-2 text-sm font-black text-[#1A5799]">
        {leader.score} puan
      </div>
    </motion.article>
  )
}

export default function LeaderboardPage() {
  const [rawLeaders, setRawLeaders] = useState([])
  const [activeLeaderboard, setActiveLeaderboard] = useState('games')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const activeType = leaderboardTypes.find((item) => item.id === activeLeaderboard) || leaderboardTypes[0]

  useEffect(() => {
    setIsLoading(true)
    setLoadError('')
    const leaderboardQuery = query(collection(db, 'publicLeaderboard'), orderBy(activeType.scoreKey, 'desc'), limit(50))

    return onSnapshot(
      leaderboardQuery,
      (snapshot) => {
        setRawLeaders(snapshot.docs.map(normalizeLeader))
        setIsLoading(false)
      },
      (error) => {
        console.warn('Leaderboard could not be loaded:', error)
        setLoadError('Sıralama şu an yüklenemedi. Firestore kurallarını ve bağlantıyı kontrol et.')
        setIsLoading(false)
      },
    )
  }, [activeType.scoreKey])

  const leaders = useMemo(() => {
    return rawLeaders
      .map((leader) => {
        const score = Number(leader[activeType.scoreKey] || leader[activeType.fallbackKey] || 0)

        return {
          ...leader,
          score,
          badge: activeType.badge,
          emoji: activeType.emoji,
        }
      })
      .filter((leader) => leader.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((leader, index) => ({ ...leader, rank: index + 1 }))
  }, [activeType, rawLeaders])

  const restLeaders = leaders.slice(3)

  return (
    <section className="app-page relative min-h-screen overflow-x-hidden bg-[#E9F5FF] text-[#1F1F1F]">
      <div className="ambient-blob pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(70,139,230,0.38),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(147,191,239,0.52),transparent_30%),radial-gradient(circle_at_52%_82%,rgba(26,87,153,0.16),transparent_34%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#092F64_1px,transparent_0)] [background-size:18px_18px]" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-28 pt-10 sm:px-6 lg:px-8 lg:pb-14 lg:pt-12">
        <motion.header
          className="theme-card rounded-[38px] border border-white/55 bg-white/38 p-6 shadow-[0_28px_90px_rgba(9,47,100,0.15)] backdrop-blur-2xl sm:p-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#468BE6]">Leaderboard</p>
          <h1 className="theme-title mt-3 max-w-4xl text-4xl font-black leading-[0.95] text-[#092F64] sm:text-6xl lg:text-7xl">
            Kampüs puanları.
          </h1>
          <p className="theme-muted mt-4 max-w-2xl text-base font-semibold leading-7 text-[#1F1F1F]/62">
            Oyun, quiz ve sosyallik puanları artık ayrı ayrı yarışıyor.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 rounded-[28px] border border-white/55 bg-white/34 p-2 backdrop-blur-xl">
            {leaderboardTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveLeaderboard(item.id)}
                className={`rounded-[22px] px-5 py-3 text-sm font-black transition ${activeLeaderboard === item.id
                    ? 'bg-[#092F64] text-[#E9F5FF] shadow-[0_14px_32px_rgba(9,47,100,0.18)]'
                    : 'text-[#092F64]/60 hover:bg-white/44 hover:text-[#092F64]'
                  }`}
              >
                {item.emoji} {item.label}
              </button>
            ))}
          </div>
        </motion.header>

        <div className="h-16 sm:h-20" aria-hidden="true" />

        <section>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#468BE6]">Haftanın podiumu</p>
              <h2 className="theme-title mt-1 text-3xl font-black text-[#092F64]">{activeType.title}</h2>
            </div>
            <span className="theme-pill rounded-full border border-white/55 bg-white/45 px-4 py-2 text-xs font-black text-[#092F64]">
              Yenilenme: Pazar 23:59
            </span>
          </div>

          {isLoading && leaders.length === 0 ? (
            <div className="theme-card rounded-[34px] border border-white/50 bg-white/36 px-5 py-12 text-center shadow-[0_22px_70px_rgba(9,47,100,0.12)] backdrop-blur-2xl">
              <TrophyIcon />
              <p className="mt-4 text-sm font-black text-[#468BE6]">Sıralama yükleniyor...</p>
            </div>
          ) : (
            <PodiumStage leaders={leaders} activeType={activeType} />
          )}
          {loadError && (
            <p className="mt-4 rounded-full border border-white/55 bg-white/45 px-4 py-3 text-center text-sm font-black text-[#092F64]">
              {loadError}
            </p>
          )}
        </section>

        <section className="mt-8 grid gap-3">
          {restLeaders.map((leader, index) => (
            <LeaderRow key={leader.uid} leader={leader} index={index} />
          ))}
        </section>
      </main>
    </section>
  )
}
