import { motion } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

const mascotStates = {
  idle: {
    rotate: 0,
    scale: 1,
    x: 0,
    y: 0,
    filter: 'drop-shadow(0 18px 42px rgba(70,139,230,0.22))',
  },
  email: {
    rotate: -4,
    scale: 1.02,
    x: 8,
    y: -3,
    filter: 'drop-shadow(0 22px 52px rgba(70,139,230,0.34))',
  },
  password: {
    rotate: 4,
    scale: 0.98,
    x: -6,
    y: 2,
    filter: 'drop-shadow(0 18px 45px rgba(9,47,100,0.28))',
  },
  typing: {
    rotate: 0,
    scale: 1.05,
    x: 0,
    y: -5,
    filter: 'drop-shadow(0 26px 64px rgba(70,139,230,0.42))',
  },
  success: {
    rotate: [0, -6, 6, -4, 4, 0],
    scale: [1, 1.14, 1.06, 1.16, 1.08],
    x: 0,
    y: [-8, -18, -8, -15, -6],
    filter: 'drop-shadow(0 30px 78px rgba(70,139,230,0.55))',
  },
  error: {
    rotate: 0,
    scale: 1,
    x: [0, -8, 8, -5, 5, 0],
    y: 0,
    filter: 'drop-shadow(0 18px 42px rgba(9,47,100,0.24))',
  },
}

export default function MascotAnimation({ state = 'idle', cursor = { x: 0, y: 0 } }) {
  const isPassword = state === 'password'
  const isSuccess = state === 'success'
  const isError = state === 'error'
  const isTyping = state === 'typing'
  const cursorX = Math.max(-7, Math.min(7, cursor.x * 5))
  const cursorY = Math.max(-6, Math.min(6, cursor.y * 4))

  return (
    <div className="relative flex min-h-[330px] items-center justify-center">
      <motion.div
        className="ambient-blob absolute h-64 w-64 rounded-full bg-[#93BFEF]/35 blur-3xl"
        animate={{ scale: isSuccess ? [1, 1.24, 1.06] : [0.94, 1.06, 0.94], opacity: [0.46, 0.78, 0.46] }}
        transition={{ duration: isSuccess ? 1.2 : 5.5, repeat: isSuccess ? 0 : Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="ambient-blob absolute h-32 w-32 rounded-full bg-[#468BE6]/20 blur-2xl"
        animate={{ x: [0, 18, 0], y: [0, -12, 0], opacity: [0.4, 0.72, 0.4] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.svg
        className="relative z-10 h-[190px] w-[350px] max-w-[88vw] overflow-visible"
        viewBox="0 0 260 140"
        fill="none"
        animate={{
          ...mascotStates[state],
          x: isError ? mascotStates.error.x : mascotStates[state].x + cursorX,
          y: mascotStates[state].y + cursorY,
        }}
        transition={{ duration: isSuccess ? 1.15 : isError ? 0.46 : 0.62, ease }}
      >
        <defs>
          <filter id="authLeftGlow" x="-35%" y="-65%" width="170%" height="230%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#468BE6" floodOpacity="0.34" />
          </filter>
          <filter id="authRightGlow" x="-35%" y="-65%" width="170%" height="230%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#092F64" floodOpacity="0.22" />
          </filter>
        </defs>

        <motion.path
          d="M34 88 C62 54 102 44 133 63 C141 68 148 70 156 70 L134 52 L156 70 L139 94"
          stroke="#93BFEF"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#authLeftGlow)"
          animate={{
            pathLength: isSuccess ? [1, 0.72, 1] : 1,
            x: isPassword ? -20 : isSuccess ? [0, 8, -4, 5, 0] : 0,
            y: isPassword ? 4 : isSuccess ? [0, -9, 2, -7, 0] : 0,
            rotate: isTyping ? -2 : isPassword ? 18 : isSuccess ? [0, -10, 8, -5, 0] : 0,
          }}
          transition={{ duration: isSuccess ? 0.9 : 0.55, ease }}
          style={{ transformOrigin: '130px 70px' }}
        />
        <motion.path
          d="M226 52 C198 86 158 96 127 77 C119 72 112 70 104 70 L126 88 L104 70 L121 46"
          stroke="#468BE6"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#authRightGlow)"
          animate={{
            pathLength: isSuccess ? [1, 0.72, 1] : 1,
            x: isPassword ? 20 : isSuccess ? [0, -8, 4, -5, 0] : 0,
            y: isPassword ? -4 : isSuccess ? [0, -7, 3, -8, 0] : 0,
            rotate: isTyping ? 2 : isPassword ? -18 : isSuccess ? [0, 10, -8, 5, 0] : 0,
          }}
          transition={{ duration: isSuccess ? 0.9 : 0.55, ease }}
          style={{ transformOrigin: '130px 70px' }}
        />

        <motion.g
          animate={{
            opacity: isPassword ? 0 : 0.82,
            x: cursorX * 0.35,
            y: cursorY * 0.35,
            scale: isTyping ? [1, 1.12, 1] : 1,
          }}
          transition={{ duration: 0.38, ease }}
        >
          <circle cx="118" cy="69" r="3.2" fill="#092F64" />
          <circle cx="142" cy="69" r="3.2" fill="#092F64" />
        </motion.g>

        {isPassword && (
          <motion.g
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ duration: 0.28, ease }}
          >
            <path d="M112 67 C116 64 121 64 125 67" stroke="#092F64" strokeWidth="4" strokeLinecap="round" />
            <path d="M136 67 C140 64 145 64 149 67" stroke="#092F64" strokeWidth="4" strokeLinecap="round" />
            <path
              d="M88 56 C110 44 150 44 172 56"
              stroke="#E9F5FF"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.82"
            />
          </motion.g>
        )}

        <motion.path
          d="M116 83 C124 89 136 89 144 83"
          stroke="#092F64"
          strokeWidth="4"
          strokeLinecap="round"
          animate={{
            opacity: isError ? 0 : isPassword ? 0.24 : 0.72,
            pathLength: isSuccess ? [0, 1] : 1,
            d: 'M116 83 C124 89 136 89 144 83',
          }}
          transition={{ duration: 0.5, ease }}
        />
        <motion.path
          d="M117 83 C125 78 135 78 143 83"
          stroke="#092F64"
          strokeWidth="4"
          strokeLinecap="round"
          animate={{ opacity: isError ? 0.7 : 0 }}
          transition={{ duration: 0.3, ease }}
        />
      </motion.svg>

      {isSuccess && (
        <motion.div
          className="absolute right-[8%] top-10 z-20 max-w-[210px] rounded-[24px] border border-white/65 bg-white/70 px-5 py-3 text-sm font-black leading-5 text-[#092F64] shadow-[0_18px_48px_rgba(9,47,100,0.13)] backdrop-blur-xl"
          initial={{ opacity: 0, y: 14, scale: 0.86, rotate: -2 }}
          animate={{ opacity: 1, y: 0, scale: [0.96, 1.06, 1], rotate: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          Hoş geldin! Spotlar seni bekliyor ✨
          <span className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-white/70" />
        </motion.div>
      )}
    </div>
  )
}
