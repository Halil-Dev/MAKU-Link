import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import RegisterPage from '../../pages/RegisterPage.jsx'
import { auth, db } from '../../FireBase/firebaseConfig.js'

const ease = [0.22, 1, 0.36, 1]
const registerStepCount = 5
const finalRegisterStep = registerStepCount - 1
const fieldLimits = {
  email: 120,
  password: 72,
  confirmPassword: 72,
  name: 60,
  department: 80,
  birthDate: 10,
}
const rateLimitRules = {
  login: { limit: 5, windowMs: 10 * 60 * 1000 },
  register: { limit: 3, windowMs: 15 * 60 * 1000 },
  passwordReset: { limit: 3, windowMs: 15 * 60 * 1000 },
  verification: { limit: 4, windowMs: 5 * 60 * 1000 },
}

const trustedEmailDomains = new Set([
  'gmail.com',
  'googlemail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.com.tr',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'aol.com',
])

const blockedNamePatterns = [
  'amk',
  'aq',
  'orospu',
  'siktir',
  'sik',
  'yarrak',
  'yarak',
  'göt',
  'got',
  'piç',
  'pic',
  'pezevenk',
  'ibne',
  'kahpe',
  'puşt',
  'pust',
  'mal',
  'salak',
  'gerizekali',
  'gerizekalı',
]

function normalizeForModeration(value) {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[4@]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-zçğıöşü]/g, '')
}

function hasBlockedName(value) {
  const normalized = normalizeForModeration(value)
  return blockedNamePatterns.some((pattern) => normalized.includes(normalizeForModeration(pattern)))
}

function getEmailDomain(email) {
  return email.trim().toLocaleLowerCase('tr-TR').split('@').pop() || ''
}

function isTrustedEmail(email) {
  const domain = getEmailDomain(email)
  return trustedEmailDomains.has(domain) || domain.endsWith('.edu') || domain.endsWith('.edu.tr')
}

function isValidBirthDate(birthDate) {
  if (!birthDate) {
    return false
  }

  const date = new Date(`${birthDate}T00:00:00`)
  const now = new Date()
  const minDate = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate())
  const maxDate = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate())

  return !Number.isNaN(date.getTime()) && date >= minDate && date <= maxDate
}

function getPasswordIssues(password) {
  const issues = []

  if (password.length < 8) {
    issues.push('en az 8 karakter')
  }

  if (!/[a-zçğıöşü]/.test(password)) {
    issues.push('küçük harf')
  }

  if (!/[A-ZÇĞİÖŞÜ]/.test(password)) {
    issues.push('büyük harf')
  }

  if (!/\d/.test(password)) {
    issues.push('sayı')
  }

  if (!/[^\w\sçğıöşüÇĞİÖŞÜ]/.test(password)) {
    issues.push('özel karakter')
  }

  return issues
}

function isStrongPassword(password) {
  return getPasswordIssues(password).length === 0
}

function sanitizeFieldValue(key, value) {
  if (typeof value !== 'string') {
    return value
  }

  const maxLength = fieldLimits[key] || 120
  return value.slice(0, maxLength)
}

function getRateLimitKey(action, email = 'anonymous') {
  return `makulink:${action}:${email.trim().toLocaleLowerCase('tr-TR') || 'anonymous'}`
}

function getRateLimitState(action, email) {
  const rule = rateLimitRules[action]
  const key = getRateLimitKey(action, email)
  const fallback = { key, count: 0, resetAt: Date.now() + rule.windowMs }

  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || 'null')

    if (!saved || Date.now() > saved.resetAt) {
      return fallback
    }

    return { key, ...saved }
  } catch {
    return fallback
  }
}

function checkRateLimit(action, email) {
  const rule = rateLimitRules[action]
  const state = getRateLimitState(action, email)

  if (state.count >= rule.limit) {
    const remainingMinutes = Math.max(1, Math.ceil((state.resetAt - Date.now()) / 60000))
    return {
      allowed: false,
      message: `Çok fazla deneme yaptın. ${remainingMinutes} dakika sonra tekrar dene.`,
    }
  }

  return { allowed: true }
}

function recordRateLimitAttempt(action, email) {
  const rule = rateLimitRules[action]
  const state = getRateLimitState(action, email)

  try {
    window.localStorage.setItem(
      state.key,
      JSON.stringify({
        count: state.count + 1,
        resetAt: state.resetAt || Date.now() + rule.windowMs,
      }),
    )
  } catch { }
}

function clearRateLimit(action, email) {
  try {
    window.localStorage.removeItem(getRateLimitKey(action, email))
  } catch { }
}

function Field({ label, type = 'text', value, placeholder, onChange, onFocus, onBlur }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[#092F64]">{label}</span>
      <motion.input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="mt-2 h-13 w-full rounded-[20px] border border-white/55 bg-[#E9F5FF]/70 px-4 py-3 text-[#092F64] outline-none shadow-inner placeholder:text-[#1F1F1F]/35"
        whileFocus={{ scale: 1.01, boxShadow: '0 0 0 4px rgba(70,139,230,0.16)' }}
        transition={{ duration: 0.2 }}
      />
    </label>
  )
}

function AuthToast({ status, message }) {
  if (!message || status === 'verification') {
    return null
  }

  const isSuccess = status === 'success'

  return (
    <motion.div
      className={`fixed left-1/2 top-4 z-[70] w-[calc(100vw-32px)] max-w-[360px] -translate-x-1/2 rounded-[18px] border px-4 py-3 text-xs font-black leading-5 shadow-[0_22px_70px_rgba(9,47,100,0.18)] backdrop-blur-2xl sm:right-4 sm:left-auto sm:w-auto sm:translate-x-0 ${isSuccess
          ? 'border-white/65 bg-[#E9F5FF]/90 text-[#092F64]'
          : 'border-white/65 bg-white/85 text-[#1A5799]'
        }`}
      initial={{ opacity: 0, y: -12, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease }}
    >
      <span className="mr-2">{isSuccess ? '✓' : '!'}</span>
      {message}
    </motion.div>
  )
}

function LegalModal({ isOpen, canAccept, onScroll, onClose, onAccept }) {
  if (!isOpen) {
    return null
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#092F64]/22 px-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease }}
    >
      <motion.div
        className="w-full max-w-[560px] overflow-hidden rounded-[28px] border border-white/65 bg-[#E9F5FF]/95 shadow-[0_28px_90px_rgba(9,47,100,0.22)]"
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease }}
      >
        <div className="border-b border-[#092F64]/10 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">MAKÜLink</p>
          <h3 className="mt-1 text-2xl font-black tracking-normal text-[#092F64]">
            Kullanıcı Sözleşmesi ve KVKK
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#1F1F1F]/60">
            Kabul butonu metnin sonuna kadar okuduktan sonra aktif olur.
          </p>
        </div>

        <div
          onScroll={onScroll}
          className="max-h-[360px] space-y-4 overflow-y-auto px-5 py-4 text-sm leading-6 text-[#1F1F1F]/72"
        >
          <section>
            <h4 className="font-black text-[#092F64]">1. Platformun amacı</h4>
            <p>
              MAKÜLink; öğrencilerin kampüs içinde spot bırakması, etkinlikleri keşfetmesi, oyunlara/quizlere
              katılması ve sosyal bağlantı kurması için geliştirilen bir öğrenci sosyal platformudur.
            </p>
          </section>
          <section>
            <h4 className="font-black text-[#092F64]">2. Hesap ve güvenlik</h4>
            <p>
              Kayıt olurken gerçek ve sana ait e-posta adresi kullanmalısın. Hesabınla yapılan işlemlerden sen
              sorumlusun. Şifreni kimseyle paylaşmamalı, şüpheli bir durumda şifreni yenilemelisin.
            </p>
          </section>
          <section>
            <h4 className="font-black text-[#092F64]">3. Topluluk kuralları</h4>
            <p>
              Hakaret, tehdit, taciz, nefret söylemi, spam, sahte kimlik kullanımı, başkasının hesabına erişim
              denemesi ve platformu kötüye kullanacak davranışlar yasaktır. Gerekli durumlarda hesap erişimi
              sınırlandırılabilir.
            </p>
          </section>
          <section>
            <h4 className="font-black text-[#092F64]">4. İşlenen veriler</h4>
            <p>
              Kayıt sırasında ad, bölüm/okul, doğum tarihi, e-posta, ilgi alanları, e-posta doğrulama durumu ve
              hesap oluşturma/güncelleme zamanları işlenebilir. Bu bilgiler hesap oluşturma, güvenlik,
              kişiselleştirme ve platform deneyimini sağlamak için kullanılır.
            </p>
          </section>
          <section>
            <h4 className="font-black text-[#092F64]">5. KVKK aydınlatması</h4>
            <p>
              Kişisel verilerin 6698 sayılı KVKK kapsamında; platform üyeliğinin oluşturulması, kullanıcı
              güvenliğinin sağlanması, kötüye kullanımın önlenmesi ve hizmetin geliştirilmesi amaçlarıyla
              işlenebilir. Verilerin yalnızca gerekli süre boyunca saklanır.
            </p>
          </section>
          <section>
            <h4 className="font-black text-[#092F64]">6. Hakların</h4>
            <p>
              KVKK kapsamındaki hakların doğrultusunda verilerine ilişkin bilgi talep etme, düzeltme, silme veya
              işleme faaliyetlerine itiraz etme hakkın bulunur. Bu proje geliştirme aşamasındadır; gerçek yayın
              öncesinde resmi metinlerin hukuk danışmanıyla netleştirilmesi gerekir.
            </p>
          </section>
          <section>
            <h4 className="font-black text-[#092F64]">7. Kabul</h4>
            <p>
              Devam ederek Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni'ni okuduğunu, anladığını ve kabul ettiğini
              beyan edersin.
            </p>
          </section>
        </div>

        <div className="grid gap-2 border-t border-[#092F64]/10 p-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[18px] bg-white/65 px-4 py-3 text-sm font-black text-[#1A5799]"
          >
            Kapat
          </button>
          <button
            type="button"
            disabled={!canAccept}
            onClick={onAccept}
            className="rounded-[18px] bg-[#092F64] px-4 py-3 text-sm font-black text-[#E9F5FF] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Okudum ve kabul ediyorum
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function getAuthErrorMessage(error) {
  const messages = {
    'auth/email-already-in-use': 'Bu e-posta ile zaten hesap var.',
    'auth/invalid-email': 'Geçerli bir e-posta girelim.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı görünüyor.',
    'auth/missing-password': 'Şifre alanını dolduralım.',
    'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
    'auth/user-not-found': 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.',
    'auth/wrong-password': 'Şifre hatalı görünüyor.',
  }

  return messages[error?.code] || 'Bir şey ters gitti. Bilgileri kontrol edip tekrar deneyelim.'
}

export default function AuthCard({ onMascotState, onSuccess }) {
  const [mode, setMode] = useState('login')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [isLegalOpen, setIsLegalOpen] = useState(false)
  const [hasReadLegal, setHasReadLegal] = useState(false)
  const [registerStep, setRegisterStep] = useState(0)
  const [selectedInterests, setSelectedInterests] = useState(['☕ Kahve', '📚 Çalışma'])
  const [values, setValues] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    department: '',
    birthDate: '',
    termsAccepted: false,
  })

  const progress = useMemo(() => ((registerStep + 1) / registerStepCount) * 100, [registerStep])

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: sanitizeFieldValue(key, value) }))
    const isPasswordField = key.includes('password')
    onMascotState(isPasswordField ? 'password' : 'typing')
    window.clearTimeout(window.__makulinkTypingTimer)
    window.__makulinkTypingTimer = window.setTimeout(() => onMascotState(isPasswordField ? 'password' : 'email'), 420)
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setStatus('idle')
    setMessage('')
    setVerificationEmail('')
    setRegisterStep(0)
    onMascotState('idle')
  }

  const toggleInterest = (interest) => {
    setSelectedInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    )
    onMascotState('typing')
  }

  const handleLegalScroll = (event) => {
    const element = event.currentTarget
    const isNearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 18

    if (isNearBottom) {
      setHasReadLegal(true)
    }
  }

  const acceptLegalTerms = () => {
    if (!hasReadLegal) {
      return
    }

    setValues((current) => ({ ...current, termsAccepted: true }))
    setIsLegalOpen(false)
    showMessage('success', 'Kullanıcı Sözleşmesi ve KVKK kabul edildi.', 1800)
  }

  const showMessage = (nextStatus, nextMessage, timeout = 2200) => {
    setStatus(nextStatus)
    setMessage(nextMessage)
    onMascotState(nextStatus === 'error' ? 'error' : 'typing')
    window.setTimeout(() => {
      setStatus('idle')
      setMessage('')
      onMascotState('idle')
    }, timeout)
  }

  const finishAuth = async (delay = 900) => {
    try {
      await auth.currentUser?.reload()
    } catch { }

    const verifiedUser = auth.currentUser

    if (!verifiedUser?.emailVerified) {
      setStatus('verification')
      setVerificationEmail(verifiedUser?.email || values.email)
      setMessage('Doğrulama henüz Firebase tarafında görünmüyor. Maildeki linke tıkladıysan birkaç saniye sonra tekrar kontrol et.')
      onMascotState('typing')
      return
    }

    setStatus('success')
    onMascotState('success')
    window.setTimeout(() => onSuccess?.(verifiedUser), delay)
  }

  const saveUserProfile = async (user, overrides = {}) => {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        name: values.name.trim() || user.displayName || '',
        department: values.department.trim(),
        birthDate: values.birthDate,
        email: user.email || values.email.trim(),
        interests: selectedInterests,
        emailVerified: user.emailVerified,
        termsAccepted: Boolean(values.termsAccepted),
        updatedAt: serverTimestamp(),
        ...overrides,
      },
      { merge: true },
    )
  }

  const showVerificationSent = (email) => {
    setVerificationEmail(email)
    setStatus('verification')
    setMessage(`${email} adresine doğrulama bağlantısı gönderdik. Maildeki linke tıklayıp buradan kontrol et.`)
    onMascotState('typing')
  }

  const sendVerification = async (user = auth.currentUser) => {
    if (!user) {
      showMessage('error', 'Doğrulama maili için önce giriş yapman gerekiyor.')
      return
    }

    const rateLimit = checkRateLimit('verification', user.email || values.email)
    if (!rateLimit.allowed) {
      showMessage('error', rateLimit.message)
      return
    }

    await sendEmailVerification(user)
    recordRateLimitAttempt('verification', user.email || values.email)
    showVerificationSent(user.email)
  }

  const checkEmailVerification = async () => {
    if (!auth.currentUser) {
      showMessage('error', 'Oturum bulunamadı. Tekrar giriş yapalım.')
      return
    }

    try {
      setStatus('verification')
      setMessage('Doğrulama kontrol ediliyor...')
      await auth.currentUser.reload()

      if (!auth.currentUser.emailVerified && values.email && values.password) {
        await signInWithEmailAndPassword(auth, values.email.trim(), values.password)
        await auth.currentUser.reload()
      }

      if (!auth.currentUser.emailVerified) {
        setStatus('verification')
        setVerificationEmail(auth.currentUser.email)
        setMessage('Henüz doğrulanmış görünmüyor. Maildeki linke tıkladıysan birkaç saniye bekleyip tekrar dene.')
        return
      }

      try {
        await saveUserProfile(auth.currentUser, {
          emailVerified: true,
          verifiedAt: serverTimestamp(),
        })
      } catch (profileError) {
        console.warn('User verification status could not be saved yet:', profileError)
      }

      await finishAuth(2800)
    } catch (error) {
      showMessage('error', getAuthErrorMessage(error), 2400)
    }
  }

  const submitLogin = async () => {
    if (!values.email || !values.password) {
      showMessage('error', 'E-posta ve şifre alanlarını dolduralım.')
      return
    }

    const rateLimit = checkRateLimit('login', values.email)
    if (!rateLimit.allowed) {
      showMessage('error', rateLimit.message)
      return
    }

    try {
      setStatus('loading')
      const credential = await signInWithEmailAndPassword(auth, values.email.trim(), values.password)
      clearRateLimit('login', values.email)
      await credential.user.reload()
      const signedInUser = auth.currentUser || credential.user

      if (!signedInUser.emailVerified) {
        await sendVerification(signedInUser)
        return
      }

      await finishAuth()
    } catch (error) {
      recordRateLimitAttempt('login', values.email)
      showMessage('error', error?.code === 'auth/invalid-email' ? getAuthErrorMessage(error) : 'E-posta veya şifre hatalı görünüyor.', 2600)
    }
  }

  const sendResetEmail = async () => {
    if (!values.email) {
      showMessage('error', 'Şifre sıfırlama için önce e-postanı yaz.')
      return
    }

    const rateLimit = checkRateLimit('passwordReset', values.email)
    if (!rateLimit.allowed) {
      showMessage('error', rateLimit.message)
      return
    }

    try {
      setStatus('loading')
      await sendPasswordResetEmail(auth, values.email.trim())
      recordRateLimitAttempt('passwordReset', values.email)
      showMessage('success', 'Şifre sıfırlama bağlantısı e-postana gönderildi.', 3200)
    } catch (error) {
      recordRateLimitAttempt('passwordReset', values.email)
      showMessage('success', 'Eğer bu e-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi.', 3200)
    }
  }

  const submitRegister = async () => {
    if (
      !values.name ||
      !values.department ||
      !values.birthDate ||
      !values.email ||
      !values.password ||
      !values.confirmPassword ||
      !values.termsAccepted
    ) {
      showMessage('error', 'Tüm kayıt alanlarını dolduralım.')
      return
    }

    if (!values.termsAccepted) {
      showMessage('error', 'Devam etmek için Kullanıcı Sözleşmesi ve KVKK metnini kabul etmelisin.')
      return
    }

    if (hasBlockedName(values.name)) {
      showMessage('error', 'Lütfen gerçek ve saygılı bir ad kullan.')
      return
    }

    if (!isValidBirthDate(values.birthDate)) {
      showMessage('error', 'Geçerli bir doğum tarihi gir. MAKÜLink için en az 13 yaşında olmalısın.')
      return
    }

    if (!isTrustedEmail(values.email)) {
      showMessage('error', 'Bu e-posta domaini desteklenmiyor. Gmail, iCloud, Outlook, Yahoo, Proton veya okul e-postanı kullan.')
      return
    }

    if (values.password !== values.confirmPassword) {
      showMessage('error', 'Şifreler aynı olmalı.')
      return
    }

    if (!isStrongPassword(values.password)) {
      showMessage('error', `Şifre şunları içermeli: ${getPasswordIssues(values.password).join(', ')}.`)
      return
    }

    const rateLimit = checkRateLimit('register', values.email)
    if (!rateLimit.allowed) {
      showMessage('error', rateLimit.message)
      return
    }

    try {
      setStatus('loading')
      const credential = await createUserWithEmailAndPassword(auth, values.email.trim(), values.password)
      clearRateLimit('register', values.email)

      await updateProfile(credential.user, {
        displayName: values.name.trim(),
      })

      await sendVerification(credential.user)

      try {
        await saveUserProfile(credential.user, {
          createdAt: serverTimestamp(),
          termsAcceptedAt: serverTimestamp(),
          legalVersion: '2026-05-08',
        })
      } catch (profileError) {
        console.warn('User profile could not be saved yet:', profileError)
        setMessage('Hesap oluştu ama profil bilgileri Firestore’a yazılamadı. Firestore rules kontrol edilmeli.')
      }

      showVerificationSent(credential.user.email)
    } catch (error) {
      recordRateLimitAttempt('register', values.email)
      showMessage('error', getAuthErrorMessage(error), 2800)
    }
  }

  const nextRegisterStep = () => {
    if (registerStep === 0) {
      if (!values.name || !values.birthDate) {
        showMessage('error', 'Adını ve doğum tarihini dolduralım.')
        return
      }

      if (hasBlockedName(values.name)) {
        showMessage('error', 'Lütfen gerçek ve saygılı bir ad kullan.')
        return
      }

      if (!isValidBirthDate(values.birthDate)) {
        showMessage('error', 'Geçerli bir doğum tarihi gir. MAKÜLink için en az 13 yaşında olmalısın.')
        return
      }
    }

    if (registerStep === 1 && !values.department) {
      showMessage('error', 'Bölüm / okul alanını dolduralım.')
      return
    }

    if (
      registerStep === 3 &&
      (!values.email || !values.password || !values.confirmPassword || values.password !== values.confirmPassword)
    ) {
      showMessage('error', 'E-posta ve iki şifre alanını kontrol edelim. Şifreler aynı olmalı.')
      return
    }

    if (registerStep === 3 && !isStrongPassword(values.password)) {
      showMessage('error', `Şifre şunları içermeli: ${getPasswordIssues(values.password).join(', ')}.`)
      return
    }

    if (registerStep === 3 && !isTrustedEmail(values.email)) {
      showMessage('error', 'Bu e-posta domaini desteklenmiyor. Gmail, iCloud, Outlook, Yahoo, Proton veya okul e-postanı kullan.')
      return
    }

    if (registerStep === 4 && !values.termsAccepted) {
      showMessage('error', 'Devam etmek için Kullanıcı Sözleşmesi ve KVKK metnini kabul etmelisin.')
      return
    }

    if (registerStep < finalRegisterStep) {
      setRegisterStep((current) => current + 1)
      onMascotState('typing')
      return
    }

    submitRegister()
  }

  return (
    <motion.div
      className="relative w-full max-w-[460px] overflow-hidden rounded-[34px] border border-white/50 bg-white/38 p-5 shadow-[0_28px_90px_rgba(9,47,100,0.18)] backdrop-blur-2xl sm:p-6"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease }}
    >
      <AuthToast status={status} message={message} />
      <LegalModal
        isOpen={isLegalOpen}
        canAccept={hasReadLegal}
        onScroll={handleLegalScroll}
        onClose={() => setIsLegalOpen(false)}
        onAccept={acceptLegalTerms}
      />
      <div className="ambient-blob pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#93BFEF]/35 blur-3xl" />
      <div className="ambient-blob pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#468BE6]/20 blur-3xl" />

      <div className="relative">
        <div className="mb-5 inline-flex rounded-full border border-white/55 bg-[#E9F5FF]/70 p-1 shadow-[0_12px_34px_rgba(9,47,100,0.08)]">
          {[
            ['login', 'Giriş'],
            ['register', 'Kayıt ol'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`relative rounded-full px-5 py-2 text-sm font-black transition ${mode === key ? 'text-[#E9F5FF]' : 'text-[#092F64]/65 hover:text-[#092F64]'
                }`}
            >
              {mode === key && (
                <motion.span
                  layoutId="auth-active-tab"
                  className="absolute inset-0 rounded-full bg-[#092F64]"
                  transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#468BE6]">
            {mode === 'login' ? 'Tekrar hoş geldin' : 'Kampüse katıl'}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-normal text-[#092F64]">
            {mode === 'login' ? 'Spotların seni bekliyor.' : 'İlk spotunu beraber açalım.'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#1F1F1F]/65">
            {mode === 'login'
              ? 'Kampüste kim nerede, ne yapıyor, hangi spot canlı; hepsi burada.'
              : 'İlgi alanlarını seç, kampüste sana benzeyen insanları ve spotları bul.'}
          </p>
        </div>

        <div className="min-h-[190px]">
          {mode === 'login' ? (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease }}
              className="space-y-4"
            >
              <Field
                label="Okul e-postası"
                value={values.email}
                placeholder="berke@makulink.edu"
                onChange={(value) => updateValue('email', value)}
                onFocus={() => onMascotState('email')}
                onBlur={() => onMascotState('idle')}
              />
              <Field
                label="Şifre"
                type="password"
                value={values.password}
                placeholder="spot şifren"
                onChange={(value) => updateValue('password', value)}
                onFocus={() => onMascotState('password')}
                onBlur={() => onMascotState('idle')}
              />
              <button
                type="button"
                onClick={sendResetEmail}
                className="-mt-1 ml-auto block text-sm font-black text-[#468BE6] transition hover:text-[#092F64]"
              >
                Şifremi unuttum
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="register-form"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease }}
            >
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#E9F5FF]/75">
                <motion.div
                  className="h-full rounded-full bg-[#468BE6]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.45, ease }}
                />
              </div>
              <RegisterPage
                step={registerStep}
                values={values}
                selectedInterests={selectedInterests}
                onChange={updateValue}
                onInterestToggle={toggleInterest}
                onOpenLegal={() => {
                  setHasReadLegal(false)
                  setIsLegalOpen(true)
                }}
              />
            </motion.div>
          )}
        </div>

        {status === 'verification' && (
          <motion.div
            className="mt-4 rounded-[24px] border border-white/55 bg-[#E9F5FF]/85 p-4 text-[#092F64] shadow-[0_12px_34px_rgba(9,47,100,0.08)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm font-black">E-postanı doğrula</p>
            <p className="mt-2 text-sm leading-6 text-[#1F1F1F]/65">{message}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={checkEmailVerification}
                className="rounded-2xl bg-[#092F64] px-4 py-3 text-sm font-black text-[#E9F5FF]"
              >
                Doğruladım
              </button>
              <button
                type="button"
                onClick={() => sendVerification()}
                className="rounded-2xl bg-white/65 px-4 py-3 text-sm font-black text-[#1A5799]"
              >
                Tekrar gönder
              </button>
            </div>
            {verificationEmail && (
              <p className="mt-3 text-xs font-bold text-[#1F1F1F]/45">Gönderilen adres: {verificationEmail}</p>
            )}
          </motion.div>
        )}

        <motion.button
          onClick={mode === 'login' ? submitLogin : nextRegisterStep}
          disabled={status === 'loading' || status === 'verification'}
          className="mt-5 w-full rounded-[22px] bg-[#092F64] px-5 py-4 text-base font-black text-[#E9F5FF] shadow-[0_18px_46px_rgba(9,47,100,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
          whileHover={{ y: -3, scale: 1.01, boxShadow: '0 24px 62px rgba(70,139,230,0.26)' }}
          whileTap={{ scale: 0.96 }}
        >
          {status === 'success' && !message
            ? 'Spotlara geçiliyor...'
            : status === 'loading'
              ? 'Kontrol ediliyor...'
              : mode === 'login'
                ? 'Kampüse gir'
                : registerStep < finalRegisterStep
                  ? 'Devam et'
                  : 'Hesabı oluştur'}
        </motion.button>
      </div>
    </motion.div>
  )
}
