import { motion } from 'framer-motion'

export default function FeedCard({
  author,
  meta,
  text,
  tag,
  accent = '#468BE6',
  mood = '✨',
  reactions = ['💙', '🔥', '🙋'],
  replies = 8,
  online = false,
  delay = 0,
}) {
  return (
    <motion.article
      className="group rounded-[20px] border border-white/45 bg-white/44 p-5 shadow-[0_18px_54px_rgba(9,47,100,0.10)] backdrop-blur-2xl"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -3,
        boxShadow: '0 26px 78px rgba(70,139,230,0.18)',
        backgroundColor: 'rgba(255,255,255,0.58)',
      }}
      whileTap={{ scale: 0.992 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-xs font-bold text-[#092F64] shadow-[0_12px_28px_rgba(9,47,100,0.12)] ring-2 ring-white/65"
            style={{ backgroundColor: accent }}
          >
            {author
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </div>
          {online && (
            <>
              <motion.span
                className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#468BE6]"
                animate={{ scale: [1, 1.85, 1], opacity: [0.55, 0, 0.55] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#468BE6]" />
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-2">
            <h3 className="font-bold text-[#092F64]">{author}</h3>
            <span className="text-sm text-[#1F1F1F]/45">{meta}</span>
            <span className="rounded-full bg-[#E9F5FF]/80 px-2 py-0.5 text-xs font-bold text-[#1A5799]">
              {tag}
            </span>
          </div>
          <p className="mt-3 text-[16px] leading-7 text-[#1F1F1F]/80">{text}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <motion.span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E9F5FF]/85 text-base shadow-[0_8px_20px_rgba(9,47,100,0.07)]"
                whileHover={{ y: -3, rotate: -6, scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
              >
                {mood}
              </motion.span>
              <div className="flex -space-x-2">
                {reactions.map((reaction) => (
                  <motion.button
                    key={reaction}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/70 text-sm shadow-[0_8px_20px_rgba(9,47,100,0.08)] transition hover:-translate-y-1"
                    whileHover={{ y: -4, scale: 1.12, rotate: 5 }}
                    whileTap={{ scale: 0.88 }}
                  >
                    {reaction}
                  </motion.button>
                ))}
              </div>
              <span className="text-xs font-semibold text-[#1F1F1F]/45">{replies} kişi gördü</span>
            </div>
            <div className="flex gap-2 text-sm font-bold text-[#092F64]/65">
              <motion.button
                className="rounded-full bg-white/50 px-3 py-1.5 transition hover:bg-[#E9F5FF]"
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                Katılırım
              </motion.button>
              <motion.button
                className="rounded-full bg-[#092F64] px-3 py-1.5 text-[#E9F5FF] shadow-[0_10px_26px_rgba(9,47,100,0.14)]"
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                Spot'a git
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
