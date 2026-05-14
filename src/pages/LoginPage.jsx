import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import AuthCard from '../components/Auth/AuthCard.jsx'
import MascotAnimation from '../components/Auth/MascotAnimation.jsx'

const activityPills = [
  ['🔥', '124 aktif spot'],
  ['☕', '32 kahve spotu'],
  ['🎮', '18 duo aranıyor'],
  ['📚', 'Sessiz katta 12 öğrenci'],
]

const particles = [
  ['12%', '18%', '#93BFEF', 0],
  ['20%', '78%', '#468BE6', 0.7],
  ['42%', '28%', '#E9F5FF', 1.1],
  ['68%', '72%', '#93BFEF', 0.3],
  ['84%', '22%', '#468BE6', 0.9],
]

export default function LoginPage({ onAuthenticated }) {
  const [mascotState, setMascotState] = useState('idle')
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const cursorFrame = useRef(null)

  const handleMouseMove = (event) => {
    if (cursorFrame.current) {
      return
    }

    const clientX = event.clientX
    const clientY = event.clientY

    cursorFrame.current = window.requestAnimationFrame(() => {
      cursorFrame.current = null
    const { innerWidth, innerHeight } = window
    setCursor({
        x: (clientX / innerWidth - 0.5) * 2,
        y: (clientY / innerHeight - 0.5) * 2,
    })
    })
  }

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-[#E9F5FF] text-[#1F1F1F]"
      onMouseMove={handleMouseMove}
    >
      <div className="ambient-blob pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(70,139,230,0.42),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(147,191,239,0.54),transparent_28%),radial-gradient(circle_at_54%_82%,rgba(26,87,153,0.20),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,#092F64_1px,transparent_0)] [background-size:18px_18px]" />
      <motion.div
        className="ambient-blob pointer-events-none absolute left-[8%] top-[18%] h-80 w-80 rounded-full bg-[#93BFEF]/35 blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, -18, 0], opacity: [0.42, 0.76, 0.42] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="ambient-blob pointer-events-none absolute bottom-[8%] right-[12%] h-96 w-96 rounded-full bg-[#468BE6]/20 blur-3xl"
        animate={{ x: [0, -22, 0], y: [0, 18, 0], opacity: [0.28, 0.52, 0.28] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {particles.map(([left, top, color, delay]) => (
        <motion.span
          key={`${left}-${top}`}
          className="pointer-events-none absolute h-2 w-2 rounded-full"
          style={{ left, top, backgroundColor: color }}
          animate={{ y: [0, -18, 0], opacity: [0.2, 0.55, 0.2], scale: [1, 1.4, 1] }}
          transition={{ delay, duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <main className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-8 px-5 py-8 lg:grid-cols-[1fr_470px] lg:px-8">
        <section className="relative hidden min-h-[620px] flex-col justify-center lg:flex">
          <motion.div
            className="mb-8 max-w-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="mt-4 text-6xl font-black leading-[0.95] tracking-normal text-[#092F64]">
              Kampüsün canlı tarafına hoş geldin.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#1F1F1F]/65">
              Spot bırak, kahve arkadaşı bul, quiz puanı kas, kampüsün o an nerede aktığını hisset.
            </p>
          </motion.div>

          <MascotAnimation state={mascotState} cursor={cursor} />

          <div className="pointer-events-none absolute inset-0">
            {activityPills.map(([emoji, text], index) => (
              <motion.div
                key={text}
                className="absolute rounded-full border border-white/50 bg-white/42 px-4 py-2 text-sm font-black text-[#092F64] shadow-[0_14px_38px_rgba(9,47,100,0.10)] backdrop-blur-xl"
                style={{
                  left: ['2%', '68%', '10%', '62%'][index],
                  top: ['46%', '52%', '74%', '82%'][index],
                }}
                animate={{ y: [0, -12, 0], rotate: [0, index % 2 ? -1.5 : 1.5, 0] }}
                transition={{ delay: index * 0.25, duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="mr-2">{emoji}</span>
                {text}
              </motion.div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center py-10 lg:min-h-0">
          <div className="w-full">
            <div className="mb-8 text-center lg:hidden">
              <MascotAnimation state={mascotState} cursor={cursor} />
              <h1 className="text-4xl font-black text-[#092F64]">MAKÜLink</h1>
              <p className="mt-2 text-sm font-semibold text-[#1F1F1F]/60">Spot bırak, kampüsü yakala.</p>
            </div>
            <AuthCard onMascotState={setMascotState} onSuccess={onAuthenticated} />
          </div>
        </section>
      </main>
    </section>
  )
}
