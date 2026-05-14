import { AnimatePresence, motion } from 'framer-motion'

const interests = ['🎮 Oyun', '☕ Kahve', '📚 Çalışma', '🎵 Müzik', '🎬 Film', '⚽ Spor']
const passwordRules = [
  ['8+ karakter', (value) => value.length >= 8],
  ['Büyük harf', (value) => /[A-ZÇĞİÖŞÜ]/.test(value)],
  ['Küçük harf', (value) => /[a-zçğıöşü]/.test(value)],
  ['Sayı', (value) => /\d/.test(value)],
  ['Özel karakter', (value) => /[^\w\sçğıöşüÇĞİÖŞÜ]/.test(value)],
]

export default function RegisterPage({ step, values, selectedInterests, onChange, onInterestToggle, onOpenLegal }) {
  return (
    <AnimatePresence mode="wait">
      {step === 0 && (
        <motion.div
          key="register-name"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          <label className="block">
            <span className="text-sm font-bold text-[#092F64]">Adın</span>
            <input
              value={values.name}
              onChange={(event) => onChange('name', event.target.value)}
              className="mt-2 h-13 w-full rounded-[20px] border border-white/55 bg-[#E9F5FF]/70 px-4 py-3 text-[#092F64] outline-none shadow-inner transition focus:shadow-[0_0_0_4px_rgba(70,139,230,0.16)]"
              placeholder="Selin Arda"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-[#092F64]">Doğum tarihi</span>
            <input
              type="date"
              value={values.birthDate}
              onChange={(event) => onChange('birthDate', event.target.value)}
              className="mt-2 h-13 w-full rounded-[20px] border border-white/55 bg-[#E9F5FF]/70 px-4 py-3 text-[#092F64] outline-none shadow-inner transition focus:shadow-[0_0_0_4px_rgba(70,139,230,0.16)]"
              autoComplete="bday"
            />
          </label>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div
          key="register-school"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          <label className="block">
            <span className="text-sm font-bold text-[#092F64]">Bölüm / okul</span>
            <input
              value={values.department}
              onChange={(event) => onChange('department', event.target.value)}
              className="mt-2 h-13 w-full rounded-[20px] border border-white/55 bg-[#E9F5FF]/70 px-4 py-3 text-[#092F64] outline-none shadow-inner transition focus:shadow-[0_0_0_4px_rgba(70,139,230,0.16)]"
              placeholder="Bilgisayar Mühendisliği"
            />
          </label>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          key="register-interests"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-sm font-bold text-[#092F64]">Nelerde spot bırakmayı seversin?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {interests.map((interest) => {
              const isSelected = selectedInterests.includes(interest)
              return (
                <motion.button
                  key={interest}
                  type="button"
                  onClick={() => onInterestToggle(interest)}
                  className={`rounded-[18px] px-3 py-3 text-sm font-black transition ${
                    isSelected ? 'bg-[#092F64] text-[#E9F5FF]' : 'bg-[#E9F5FF]/70 text-[#092F64]'
                  }`}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.94 }}
                >
                  {interest}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          key="register-auth"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          <label className="block">
            <span className="text-sm font-bold text-[#092F64]">E-posta</span>
            <input
              type="email"
              value={values.email}
              onChange={(event) => onChange('email', event.target.value)}
              className="mt-2 h-13 w-full rounded-[20px] border border-white/55 bg-[#E9F5FF]/70 px-4 py-3 text-[#092F64] outline-none shadow-inner transition focus:shadow-[0_0_0_4px_rgba(70,139,230,0.16)]"
              placeholder="ornek@mail.com"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-[#092F64]">Şifre</span>
            <input
              type="password"
              value={values.password}
              onChange={(event) => onChange('password', event.target.value)}
              className="mt-2 h-13 w-full rounded-[20px] border border-white/55 bg-[#E9F5FF]/70 px-4 py-3 text-[#092F64] outline-none shadow-inner transition focus:shadow-[0_0_0_4px_rgba(70,139,230,0.16)]"
              placeholder="En az 6 karakter"
              autoComplete="new-password"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            {passwordRules.map(([label, test]) => {
              const isValid = test(values.password || '')

              return (
                <span
                  key={label}
                  className={`rounded-full px-3 py-1.5 text-xs font-black ${
                    isValid ? 'bg-[#092F64] text-[#E9F5FF]' : 'bg-[#E9F5FF]/70 text-[#1A5799]'
                  }`}
                >
                  {isValid ? '✓ ' : '+ '}
                  {label}
                </span>
              )
            })}
          </div>

          <label className="block">
            <span className="text-sm font-bold text-[#092F64]">Şifre tekrar</span>
            <input
              type="password"
              value={values.confirmPassword}
              onChange={(event) => onChange('confirmPassword', event.target.value)}
              className="mt-2 h-13 w-full rounded-[20px] border border-white/55 bg-[#E9F5FF]/70 px-4 py-3 text-[#092F64] outline-none shadow-inner transition focus:shadow-[0_0_0_4px_rgba(70,139,230,0.16)]"
              placeholder="Şifreni tekrar yaz"
              autoComplete="new-password"
            />
          </label>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div
          key="register-final"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.35 }}
          className="rounded-[24px] bg-[#092F64] p-5 text-[#E9F5FF] shadow-[0_18px_50px_rgba(9,47,100,0.18)]"
        >
          <p className="text-sm font-semibold text-[#93BFEF]">Hazır gibisin</p>
          <h3 className="mt-2 text-2xl font-black">İlk spotunu bırakmaya birkaç saniye kaldı.</h3>
          <p className="mt-3 text-sm leading-6 text-[#E9F5FF]/75">
            Kampüste kahve, çalışma, oyun ve quiz spotları seni bekliyor.
          </p>
          <button
            type="button"
            onClick={onOpenLegal}
            className="mt-5 flex w-full items-start gap-3 rounded-[20px] bg-[#E9F5FF]/10 p-3 text-left transition hover:bg-[#E9F5FF]/15"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-black ${
                values.termsAccepted
                  ? 'border-[#93BFEF] bg-[#93BFEF] text-[#092F64]'
                  : 'border-[#E9F5FF]/45 text-[#E9F5FF]/55'
              }`}
            >
              {values.termsAccepted ? '✓' : ''}
            </span>
            <span className="text-xs font-semibold leading-5 text-[#E9F5FF]/80">
              {values.termsAccepted
                ? 'Kullanıcı Sözleşmesi ve KVKK metni kabul edildi.'
                : 'Kullanıcı Sözleşmesi ve KVKK metnini açıp okuyarak kabul et.'}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
