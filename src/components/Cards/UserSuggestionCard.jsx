import { motion } from 'framer-motion'

export default function UserSuggestionCard({ name, detail, color = '#93BFEF', online = false, vibe = 'şu an aktif', delay = 0 }) {
  return (
    <motion.div
      className="rounded-[24px] border border-white/45 bg-white/60 p-3.5 shadow-[0_16px_48px_rgba(9,47,100,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/75"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-[#092F64]"
            style={{ backgroundColor: color }}
          >
            {name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </div>
          {online && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#468BE6]" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-[#092F64]">{name}</h3>
          <p className="text-sm text-[#1F1F1F]/55">{detail}</p>
          <p className="mt-0.5 text-xs font-semibold text-[#468BE6]">{online ? vibe : 'ortak topluluk'}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-full bg-[#E9F5FF]/75 px-3 py-1.5 text-xs font-bold text-[#1A5799]">
        <span className={`h-2 w-2 rounded-full ${online ? 'bg-[#468BE6]' : 'bg-[#93BFEF]'}`} />
        <span>{online ? 'şu an aktif' : 'tanıyor olabilirsin'}</span>
      </div>
    </motion.div>
  )
}
