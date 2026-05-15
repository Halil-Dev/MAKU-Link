import { useState } from 'react'
import { motion } from 'framer-motion'
import { getAvatarById } from '../../data/avatarOptions'

const spotTypes = [
  { id: 'study', emoji: '📚', label: 'Study' },
  { id: 'coffee', emoji: '☕', label: 'Coffee' },
  { id: 'duo', emoji: '🎮', label: 'Duo' },
  { id: 'quiz', emoji: '🎯', label: 'Quiz' },
  { id: 'event', emoji: '🌿', label: 'Event' },
  { id: 'game', emoji: '⚡', label: 'Game' },
]

const locationOptions = ['Söylemek istemiyorum', 'Kampüs', 'Kafeterya', 'Kütüphane', 'BM Fakültesi', 'Amfi', 'Bahçe']

export default function SpotBox({ profile, onCreate }) {
  const [text, setText] = useState('')
  const [location, setLocation] = useState('Söylemek istemiyorum')
  const [type, setType] = useState('coffee')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (text.trim().length < 2) return
    setBusy(true)
    try {
      await onCreate({ text, location, type })
      setText('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.form
      onSubmit={submit}
      className="rounded-[30px] border border-white/45 bg-white/36 p-4 shadow-[0_22px_65px_rgba(9,47,100,0.12)] backdrop-blur-2xl"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex gap-3">
        <img
          src={getAvatarById(profile.avatarId).src}
          alt={profile.name}
          className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
        />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={280}
          placeholder="Nerdesin, ne yapıyorsun? Spot bırak..."
          className="theme-title min-h-24 flex-1 resize-none rounded-[22px] border border-white/55 bg-[#E9F5FF]/72 px-4 py-4 text-base font-semibold text-[#092F64] outline-none placeholder:text-[#1F1F1F]/38 focus:border-[#468BE6]/45 focus:shadow-[0_0_0_4px_rgba(70,139,230,0.12)]"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            aria-label="Konum Seçimi"
            className="rounded-full border border-white/55 bg-[#E9F5FF]/75 px-3 py-2 text-xs font-black text-[#1A5799] outline-none"
          >
            {locationOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1.5 pb-1 sm:pb-0">
            {spotTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-black transition ${type === item.id ? 'bg-[#092F64] text-[#E9F5FF]' : 'bg-[#E9F5FF]/75 text-[#1A5799]'
                  }`}
              >
                {item.emoji} {item.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={busy || text.trim().length < 2}
          className="ml-auto rounded-full bg-[#092F64] px-5 py-2.5 text-sm font-black text-[#E9F5FF] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? 'Ekleniyor...' : 'Spot ekle'}
        </button>
      </div>
    </motion.form>
  )
}
