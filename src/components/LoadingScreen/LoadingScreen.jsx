import { motion } from 'framer-motion'

const easeOut = [0.22, 1, 0.36, 1]

function ArrowLinkLogo() {
  return (
    <motion.svg
      className="h-[140px] w-[260px] max-w-[76vw] overflow-visible"
      viewBox="0 0 260 140"
      fill="none"
      aria-label="Animated arrow link logo"
      initial="hidden"
      animate="visible"
    >
      <defs>
        <filter id="leftArrowGlow" x="-35%" y="-65%" width="170%" height="230%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#468BE6" floodOpacity="0.32" />
        </filter>
        <filter id="rightArrowGlow" x="-35%" y="-65%" width="170%" height="230%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#092F64" floodOpacity="0.22" />
        </filter>
      </defs>

      <motion.path
        d="M34 88 C62 54 102 44 133 63 C141 68 148 70 156 70 L134 52 L156 70 L139 94"
        stroke="#93BFEF"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'url(#leftArrowGlow)' }}
        initial={{
          pathLength: 0,
          opacity: 0,
          x: -96,
          y: 26,
          rotate: -14,
          scale: 0.98,
        }}
        animate={{
          pathLength: [0, 0.42, 0.86, 1, 1],
          opacity: [0, 0.92, 1, 1, 1],
          x: [-96, -34, -6, 0, 0],
          y: [26, -12, -2, 0, 0],
          rotate: [-14, 5, 1, 0, 0],
          scale: [0.98, 1, 1, 1.04, 1],
        }}
        transition={{
          duration: 0.8,
          times: [0, 0.34, 0.8, 0.93, 1],
          ease: easeOut,
        }}
      />

      <motion.path
        d="M226 52 C198 86 158 96 127 77 C119 72 112 70 104 70 L126 88 L104 70 L121 46"
        stroke="#468BE6"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'url(#rightArrowGlow)' }}
        initial={{
          pathLength: 0,
          opacity: 0,
          x: 96,
          y: -26,
          rotate: 14,
          scale: 0.98,
        }}
        animate={{
          pathLength: [0, 0.42, 0.86, 1, 1],
          opacity: [0, 0.92, 1, 1, 1],
          x: [96, 34, 6, 0, 0],
          y: [-26, 12, 2, 0, 0],
          rotate: [14, -5, -1, 0, 0],
          scale: [0.98, 1, 1, 1.04, 1],
        }}
        transition={{
          duration: 0.8,
          times: [0, 0.34, 0.8, 0.93, 1],
          ease: easeOut,
        }}
      />
    </motion.svg>
  )
}

export default function LoadingScreen() {
  return (
    <motion.section
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      <div className="absolute inset-0 bg-[#E9F5FF]" />

      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        <ArrowLinkLogo />
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5, ease: easeOut }}
        >
          <p className="text-xl font-semibold tracking-normal sm:text-2xl">
            <span className="text-[#092F64]">MAKÜ</span>
            <span className="text-[#468BE6] drop-shadow-[0_0_14px_rgba(70,139,230,0.35)]">
              Link
            </span>
          </p>
          <p className="mt-2 text-sm font-medium text-[#1A5799] sm:text-base">
            Bağlan, topluluğunu keşfet, sosyalleş.
          </p>
        </motion.div>
      </div>
    </motion.section>
  )
}
