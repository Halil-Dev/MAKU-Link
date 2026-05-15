import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import Navbar from '../components/Navbar/Navbar.jsx'
import { auth, db } from '../FireBase/firebaseConfig.js'

const modes = [
  { id: 'focus', label: 'Odak', minutes: 25, accent: '#468BE6', description: 'Sessiz çalışma sprinti' },
  { id: 'short', label: 'Kısa mola', minutes: 5, accent: '#93BFEF', description: 'Nefes al, su iç' },
  { id: 'long', label: 'Uzun mola', minutes: 15, accent: '#1A5799', description: 'Mini reset zamanı' },
  { id: 'custom', label: 'Custom', minutes: 40, accent: '#468BE6', description: 'Kendi dakikanı seç' },
]

const studyCards = [
  { icon: '📚', title: 'Konu tekrarı', text: 'Zorlandığın başlığı 25 dakikaya böl.' },
  { icon: '📝', title: 'Soru turu', text: 'Yanlış yaptığın soruları ayrı notla.' },
  { icon: '☕', title: 'Mola ritmi', text: 'Mola bitince masaya geri dönme sinyali ver.' },
]

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function createRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function getRoomSeconds(room) {
  if (!room) return 0

  const baseSeconds = Number(room.secondsLeft || 0)

  if (!room.isRunning || !room.startedAtMs) {
    return baseSeconds
  }

  const elapsed = Math.floor((Date.now() - Number(room.startedAtMs)) / 1000)

  return Math.max(0, baseSeconds - elapsed)
}

export default function ExamPage() {
  const [modeId, setModeId] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(modes[0].minutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedFocus, setCompletedFocus] = useState(0)
  const [customMinutes, setCustomMinutes] = useState(40)
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [roomData, setRoomData] = useState(null)
  const [duoMessage, setDuoMessage] = useState('')

  const activeMode = useMemo(() => {
    const mode = modes.find((item) => item.id === modeId) || modes[0]

    return mode.id === 'custom' ? { ...mode, minutes: customMinutes } : mode
  }, [customMinutes, modeId])
  const totalSeconds = activeMode.minutes * 60
  const progress = Math.max(0, Math.min(1, 1 - secondsLeft / totalSeconds))
  const roomRef = useMemo(() => (roomCode ? doc(db, 'pomodoroRooms', roomCode) : null), [roomCode])
  const participantCount = roomData?.participants ? Object.keys(roomData.participants).length : 0

  useEffect(() => {
    const user = auth.currentUser
    const initialCode = new URLSearchParams(window.location.search).get('pomodoro')?.trim().toUpperCase()

    if (!user || !initialCode) return

    setDoc(doc(db, 'pomodoroRooms', initialCode), {
      code: initialCode,
      participants: {
        [user.uid]: true,
      },
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => { })
    setRoomCode(initialCode)
    setDuoMessage('Linkten duo odaya katıldın.')
  }, [])

  useEffect(() => {
    if (roomCode) return
    setSecondsLeft(totalSeconds)
    setIsRunning(false)
  }, [roomCode, totalSeconds])

  useEffect(() => {
    if (!roomCode || !roomRef) return undefined

    return onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        setRoomData(null)
        return
      }

      const data = snapshot.data()
      setRoomData(data)
      setModeId(data.modeId || 'focus')
      setCustomMinutes(Number(data.customMinutes || 40))
      setIsRunning(Boolean(data.isRunning))
      setSecondsLeft(getRoomSeconds(data))
    })
  }, [roomCode])

  useEffect(() => {
    if (!isRunning) return undefined

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setIsRunning(false)

          if (modeId === 'focus') {
            setCompletedFocus((count) => count + 1)
            setModeId((completedFocus + 1) % 4 === 0 ? 'long' : 'short')
          } else {
            setModeId('focus')
          }

          if (roomRef) {
            setDoc(roomRef, {
              isRunning: false,
              secondsLeft: 0,
              updatedAt: serverTimestamp(),
            }, { merge: true }).catch(() => { })
          }

          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [completedFocus, isRunning, modeId, roomRef])

  const syncRoom = async (payload) => {
    if (!roomRef) return
    await setDoc(roomRef, {
      ...payload,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  const handleModeChange = async (nextModeId) => {
    const nextMode = modes.find((mode) => mode.id === nextModeId) || modes[0]
    const nextSeconds = (nextModeId === 'custom' ? customMinutes : nextMode.minutes) * 60

    setModeId(nextModeId)
    setSecondsLeft(nextSeconds)
    setIsRunning(false)

    await syncRoom({
      modeId: nextModeId,
      customMinutes,
      secondsLeft: nextSeconds,
      isRunning: false,
      startedAtMs: null,
    })
  }

  const handleCustomMinutesChange = async (value) => {
    const nextMinutes = Math.max(1, Math.min(180, Number(value || 1)))
    setCustomMinutes(nextMinutes)

    if (modeId === 'custom') {
      setSecondsLeft(nextMinutes * 60)
      setIsRunning(false)
      await syncRoom({
        modeId: 'custom',
        customMinutes: nextMinutes,
        secondsLeft: nextMinutes * 60,
        isRunning: false,
        startedAtMs: null,
      })
    }
  }

  const handleToggleTimer = async () => {
    const nextRunning = !isRunning
    const nextSeconds = roomData ? getRoomSeconds(roomData) : secondsLeft

    setSecondsLeft(nextSeconds)
    setIsRunning(nextRunning)

    await syncRoom({
      isRunning: nextRunning,
      secondsLeft: nextSeconds,
      startedAtMs: nextRunning ? Date.now() : null,
    })
  }

  const handleResetTimer = async () => {
    setIsRunning(false)
    setSecondsLeft(totalSeconds)
    await syncRoom({
      isRunning: false,
      secondsLeft: totalSeconds,
      startedAtMs: null,
    })
  }

  const createRoom = async () => {
    const user = auth.currentUser
    if (!user) return

    const nextCode = createRoomCode()
    const nextRoomRef = doc(db, 'pomodoroRooms', nextCode)

    await setDoc(nextRoomRef, {
      code: nextCode,
      hostUid: user.uid,
      modeId,
      customMinutes,
      secondsLeft,
      isRunning,
      startedAtMs: isRunning ? Date.now() : null,
      participants: {
        [user.uid]: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true })

    setRoomCode(nextCode)
    setDuoMessage('Duo oda açıldı. Kodu arkadaşına gönder.')
  }

  const joinRoom = async () => {
    const user = auth.currentUser
    const normalizedCode = joinCode.trim().toUpperCase()
    if (!user || !normalizedCode) return
    const nextRoomRef = doc(db, 'pomodoroRooms', normalizedCode)
    const roomSnapshot = await getDoc(nextRoomRef)
    const fallbackRoom = roomSnapshot.exists()
      ? {}
      : {
        modeId,
        customMinutes,
        secondsLeft,
        isRunning,
        startedAtMs: isRunning ? Date.now() : null,
        createdAt: serverTimestamp(),
      }

    await setDoc(nextRoomRef, {
      ...fallbackRoom,
      code: normalizedCode,
      participants: {
        [user.uid]: true,
      },
      updatedAt: serverTimestamp(),
    }, { merge: true })

    setRoomCode(normalizedCode)
    setDuoMessage('Duo odaya katıldın.')
  }

  return (
    <section className="app-page relative min-h-screen overflow-hidden bg-[#E9F5FF] text-[#1F1F1F]">
      <div className="ambient-blob pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(70,139,230,0.34),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(147,191,239,0.48),transparent_30%),radial-gradient(circle_at_50%_86%,rgba(26,87,153,0.14),transparent_34%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#092F64_1px,transparent_0)] [background-size:18px_18px]" />

      <Navbar />

      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 px-4 pb-28 pt-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8 lg:pb-14 lg:pt-12">
        <motion.section
          className="theme-card rounded-[42px] border border-white/55 bg-white/38 p-6 shadow-[0_28px_90px_rgba(9,47,100,0.15)] backdrop-blur-2xl sm:p-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#468BE6]">Pomodoro</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="theme-title max-w-3xl text-5xl font-black leading-none text-[#092F64] sm:text-7xl">
                Pomodoro odası.
              </h1>
              <p className="theme-muted mt-4 max-w-2xl text-base font-semibold leading-7 text-[#1F1F1F]/62">
                Odaklan, mola ver, tekrar dön. İstersen oda koduyla biriyle aynı timer’da çalış.
              </p>
            </div>
            <span className="theme-pill rounded-full border border-white/55 bg-white/45 px-4 py-2 text-xs font-black text-[#092F64]">
              {completedFocus} odak turu
            </span>
          </div>

          <div className="mt-8 grid gap-3 rounded-[30px] border border-white/55 bg-white/30 p-2 shadow-[0_16px_45px_rgba(9,47,100,0.08)] backdrop-blur-xl sm:grid-cols-3">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleModeChange(mode.id)}
                className={`rounded-[24px] px-5 py-4 text-left transition ${modeId === mode.id
                    ? 'bg-[#092F64] text-[#E9F5FF] shadow-[0_14px_32px_rgba(9,47,100,0.18)]'
                    : 'theme-pill-muted text-[#092F64]/70 hover:bg-white/44'
                  }`}
              >
                <p className="text-lg font-black">{mode.label}</p>
                <p className="mt-1 text-xs font-bold opacity-70">{mode.minutes} dk · {mode.description}</p>
                {mode.id === 'custom' && modeId === 'custom' && (
                  <input
                    value={customMinutes}
                    onChange={(event) => handleCustomMinutesChange(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    type="number"
                    min="1"
                    max="180"
                    className="mt-3 w-full rounded-2xl border border-white/45 bg-white/30 px-3 py-2 text-sm font-black text-inherit outline-none"
                    aria-label="Custom dakika"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center">
            <div className="relative flex h-72 w-72 items-center justify-center rounded-full bg-[#E9F5FF]/48 shadow-[inset_0_0_0_14px_rgba(255,255,255,0.35),0_28px_80px_rgba(9,47,100,0.12)]">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 288 288" aria-hidden="true">
                <circle cx="144" cy="144" r="126" fill="none" stroke="rgba(147,191,239,0.28)" strokeWidth="16" />
                <motion.circle
                  cx="144"
                  cy="144"
                  r="126"
                  fill="none"
                  stroke={activeMode.accent}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={791.68}
                  strokeDashoffset={791.68 * (1 - progress)}
                  transition={{ duration: 0.35 }}
                />
              </svg>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#468BE6]">{activeMode.label}</p>
                <p className="theme-title mt-3 text-6xl font-black tabular-nums text-[#092F64]">{formatTime(secondsLeft)}</p>
                <p className="theme-muted mt-2 text-sm font-bold text-[#1F1F1F]/55">{activeMode.description}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleToggleTimer}
                className="rounded-2xl bg-[#092F64] px-8 py-4 text-sm font-black text-[#E9F5FF] shadow-[0_16px_42px_rgba(9,47,100,0.22)] transition hover:-translate-y-1"
              >
                {isRunning ? 'Duraklat' : 'Başlat'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleResetTimer()
                }}
                className="theme-pill rounded-2xl border border-white/55 bg-white/45 px-8 py-4 text-sm font-black text-[#092F64] transition hover:-translate-y-1"
              >
                Sıfırla
              </button>
            </div>
          </div>
        </motion.section>

        <aside className="grid gap-4">
          <motion.article
            className="theme-card rounded-[30px] border border-white/50 bg-white/42 p-5 shadow-[0_18px_58px_rgba(9,47,100,0.10)] backdrop-blur-2xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#E9F5FF]/80 text-2xl shadow-[0_12px_28px_rgba(9,47,100,0.10)]">
              👥
            </div>
            <h2 className="theme-title mt-4 text-2xl font-black text-[#092F64]">Duo çalışma</h2>
            <p className="theme-muted mt-2 text-sm font-semibold leading-6 text-[#1F1F1F]/58">
              Oda kodu oluştur veya arkadaşının koduyla aynı Pomodoro timer’ına katıl.
            </p>

            {roomCode ? (
              <div className="mt-4 rounded-[24px] bg-[#E9F5FF]/64 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#468BE6]">Oda kodu</p>
                <p className="theme-title mt-1 text-3xl font-black tracking-widest text-[#092F64]">{roomCode}</p>
                <p className="theme-muted mt-1 text-xs font-bold text-[#1F1F1F]/58">{participantCount || 1} kişi bağlı</p>
                <button
                  type="button"
                  onClick={() => {
                    const roomLink = `${window.location.origin}${window.location.pathname}?pomodoro=${roomCode}`
                    navigator.clipboard?.writeText(roomLink).catch(() => { })
                    setDuoMessage('Duo link kopyalandı.')
                  }}
                  className="mt-3 rounded-2xl bg-[#092F64] px-4 py-2 text-xs font-black text-[#E9F5FF]"
                >
                  Linki kopyala
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={createRoom}
                  className="w-full rounded-2xl bg-[#092F64] px-4 py-3 text-sm font-black text-[#E9F5FF]"
                >
                  Duo oda aç
                </button>
                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    placeholder="Kod"
                    maxLength={6}
                    className="theme-input min-w-0 flex-1 rounded-2xl border border-white/55 bg-[#E9F5FF]/62 px-4 py-3 text-sm font-black text-[#092F64] outline-none"
                  />
                  <button
                    type="button"
                    onClick={joinRoom}
                    className="rounded-2xl bg-[#468BE6] px-4 py-3 text-sm font-black text-[#E9F5FF]"
                  >
                    Gir
                  </button>
                </div>
              </div>
            )}
            {duoMessage && <p className="mt-3 text-xs font-black text-[#468BE6]">{duoMessage}</p>}
          </motion.article>

          {studyCards.map((card, index) => (
            <motion.article
              key={card.title}
              className="theme-card rounded-[30px] border border-white/50 bg-white/42 p-5 shadow-[0_18px_58px_rgba(9,47,100,0.10)] backdrop-blur-2xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.06, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, scale: 1.004 }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#E9F5FF]/80 text-2xl shadow-[0_12px_28px_rgba(9,47,100,0.10)]">
                {card.icon}
              </div>
              <h2 className="theme-title mt-4 text-2xl font-black text-[#092F64]">{card.title}</h2>
              <p className="theme-muted mt-2 text-sm font-semibold leading-6 text-[#1F1F1F]/58">{card.text}</p>
            </motion.article>
          ))}
        </aside>
      </main>
    </section>
  )
}
