import { motion } from 'framer-motion'

export default function EventCard({ date, title, location, color = '#468BE6', delay = 0 }) {
  return (
    <motion.div
      className="rounded-[20px] border border-[#092F64]/[0.06] bg-[#E9F5FF]/60 p-3 transition hover:bg-white/50"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex gap-3">
        <div
          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-xs font-bold text-[#092F64]"
          style={{ backgroundColor: color }}
        >
          {date}
        </div>
        <div>
          <h3 className="font-semibold leading-snug text-[#092F64]">{title}</h3>
          <p className="mt-1 text-sm text-[#1F1F1F]/60">{location}</p>
        </div>
      </div>
    </motion.div>
  )
}
