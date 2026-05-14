import { motion } from 'framer-motion'

export default function CommunityCard({ name, members, color = '#93BFEF', delay = 0 }) {
  return (
    <motion.div
      className="flex items-center justify-between rounded-[20px] border border-[#092F64]/[0.06] bg-[#E9F5FF]/60 p-3 transition hover:bg-white/50"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-[#092F64]"
          style={{ backgroundColor: color }}
        >
          {name[0]}
        </div>
        <div>
          <h3 className="font-semibold text-[#092F64]">{name}</h3>
          <p className="text-sm text-[#1F1F1F]/55">{members} üye</p>
        </div>
      </div>
      <button className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-bold text-[#1A5799]">
        Katıl
      </button>
    </motion.div>
  )
}
