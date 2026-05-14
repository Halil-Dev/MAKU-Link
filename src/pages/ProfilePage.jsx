import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import Navbar from '../components/Navbar/Navbar.jsx'
import { auth, db } from '../FireBase/firebaseConfig.js'
import { avatarOptions, getAvatarById } from '../data/avatarOptions.js'

const interestOptions = ['🎮 Oyun', '☕ Kahve', '📚 Çalışma', '🎵 Müzik', '🎬 Film', '⚽ Spor']
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

function TickIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M6 12.4 10.2 16.5 18.4 7.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AvatarIcon({ avatar, size = 'large' }) {
  const dimensionClass = size === 'small' ? 'h-24 w-24 rounded-[26px]' : 'h-32 w-32 rounded-[38px]'
  const selectedAvatar = avatar || avatarOptions[0]

  return (
    <div className={`relative overflow-hidden bg-[#E9F5FF] ${dimensionClass} shadow-[0_24px_70px_rgba(9,47,100,0.18)]`}>
      <img
        src={selectedAvatar.src}
        alt={selectedAvatar.label}
        className="h-full w-full object-cover object-center"
        draggable="false"
      />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-white/55" />
      {size === 'small' && <span className="sr-only">{selectedAvatar.label}</span>}
    </div>
  )
}

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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidBirthDate(birthDate) {
  if (!birthDate) return false

  const date = new Date(`${birthDate}T00:00:00`)
  const now = new Date()
  const minDate = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate())
  const maxDate = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate())

  return !Number.isNaN(date.getTime()) && date >= minDate && date <= maxDate
}

function getPasswordIssues(password) {
  const issues = []

  if (password.length < 8) issues.push('en az 8 karakter')
  if (!/[a-zçğıöşü]/.test(password)) issues.push('küçük harf')
  if (!/[A-ZÇĞİÖŞÜ]/.test(password)) issues.push('büyük harf')
  if (!/\d/.test(password)) issues.push('sayı')
  if (!/[^\w\sçğıöşüÇĞİÖŞÜ]/.test(password)) issues.push('özel karakter')

  return issues
}

function getRateLimitState(action) {
  const key = `makulink:profile:${action}`
  const fallback = { key, count: 0, resetAt: Date.now() + 10 * 60 * 1000 }

  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || 'null')
    return saved && Date.now() <= saved.resetAt ? { key, ...saved } : fallback
  } catch {
    return fallback
  }
}

function checkProfileRateLimit(action) {
  const state = getRateLimitState(action)

  if (state.count >= 4) {
    const minutes = Math.max(1, Math.ceil((state.resetAt - Date.now()) / 60000))
    return { allowed: false, message: `Çok fazla deneme oldu. ${minutes} dk sonra tekrar dene.` }
  }

  return { allowed: true, state }
}

function recordProfileAttempt(action) {
  const state = getRateLimitState(action)
  window.localStorage.setItem(state.key, JSON.stringify({ count: state.count + 1, resetAt: state.resetAt }))
}

function getAuthErrorMessage(error) {
  const messages = {
    'auth/wrong-password': 'Mevcut şifre hatalı görünüyor.',
    'auth/invalid-credential': 'Mevcut şifre hatalı görünüyor.',
    'auth/requires-recent-login': 'Güvenlik için tekrar giriş yapman gerekiyor.',
    'auth/email-already-in-use': 'Bu e-posta başka bir hesapta kullanılıyor.',
    'auth/invalid-email': 'Geçerli bir e-posta yazalım.',
    'auth/weak-password': 'Yeni şifre yeterince güçlü değil.',
    'auth/too-many-requests': 'Çok fazla deneme oldu. Biraz bekleyip tekrar dene.',
  }

  return messages[error?.code] || 'İşlem tamamlanamadı. Bilgileri kontrol edip tekrar deneyelim.'
}

function getNumericMetric(data, keys) {
  for (const key of keys) {
    const value = key.split('.').reduce((current, part) => current?.[part], data)

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }

  return 0
}

function LinkMascot() {
  return (
    <motion.div
      className="pointer-events-none absolute right-5 top-5 hidden h-44 w-64 sm:block"
      initial={{ opacity: 0, x: 30, rotate: 8 }}
      animate={{ opacity: 1, x: 0, rotate: [4, -3, 4], y: [0, -8, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute right-2 top-0 z-10 rounded-[22px] border border-white/65 bg-white/75 px-4 py-2 text-sm font-black text-[#092F64] shadow-[0_18px_50px_rgba(9,47,100,0.14)] backdrop-blur-xl"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        Selam, profilini parlat ✨
      </motion.div>
      <svg className="absolute right-0 top-12 h-28 w-48 overflow-visible" viewBox="0 0 260 140" fill="none">
        <filter id="profileMascotGlow" x="-30%" y="-50%" width="160%" height="210%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#468BE6" floodOpacity="0.28" />
        </filter>
        <motion.path
          d="M34 88 C62 54 102 44 133 63 C141 68 148 70 156 70 L134 52 L156 70 L139 94"
          stroke="#93BFEF"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#profileMascotGlow)"
          animate={{ rotate: [0, -8, 0], x: [0, -4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
          style={{ transformOrigin: '130px 70px' }}
        />
        <motion.path
          d="M226 52 C198 86 158 96 127 77 C119 72 112 70 104 70 L126 88 L104 70 L121 46"
          stroke="#468BE6"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#profileMascotGlow)"
          animate={{ rotate: [0, 8, 0], x: [0, 4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
          style={{ transformOrigin: '130px 70px' }}
        />
        <circle cx="118" cy="69" r="3.2" fill="#092F64" />
        <circle cx="142" cy="69" r="3.2" fill="#092F64" />
        <path d="M116 83 C124 89 136 89 144 83" stroke="#092F64" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </motion.div>
  )
}

function Field({ label, value, type = 'text', placeholder, onChange, icon = '✦', multiline = false }) {
  const baseClass =
    'theme-input mt-2 w-full rounded-[20px] border border-white/60 bg-[#E9F5FF]/68 pl-12 pr-4 text-sm font-bold text-[#092F64] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_12px_34px_rgba(9,47,100,0.06)] transition placeholder:text-[#1F1F1F]/35 hover:border-[#93BFEF]/90 hover:bg-white/54 focus:border-[#468BE6]/70 focus:bg-white/68 focus:shadow-[0_0_0_4px_rgba(70,139,230,0.16),0_16px_42px_rgba(9,47,100,0.10)]'

  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-[#468BE6]">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-base">{icon}</span>
        {multiline ? (
          <textarea
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            className={`${baseClass} min-h-28 py-3 resize-none`}
          />
        ) : (
          <input
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            className={`${baseClass} h-12`}
          />
        )}
      </div>
    </label>
  )
}

function PasswordField({ label, value, placeholder, onChange }) {
  return <Field label={label} type="password" value={value} placeholder={placeholder} onChange={onChange} />
}

function MiniStat({ emoji, label, value }) {
  return (
    <motion.div
      className="rounded-[24px] border border-white/45 bg-white/42 p-4 shadow-[0_16px_46px_rgba(9,47,100,0.09)] backdrop-blur-xl"
      whileHover={{ y: -4, scale: 1.01 }}
    >
      <span className="text-2xl">{emoji}</span>
      <p className="mt-2 text-2xl font-black text-[#092F64]">{value}</p>
      <p className="text-xs font-bold text-[#1F1F1F]/55">{label}</p>
    </motion.div>
  )
}

function InfoChip({ icon, label, value, dark = false }) {
  return (
    <motion.div
      className={`rounded-[24px] border p-4 shadow-[0_16px_46px_rgba(9,47,100,0.09)] backdrop-blur-xl ${
        dark ? 'border-[#092F64]/10 bg-[#092F64] text-[#E9F5FF]' : 'border-white/50 bg-white/46 text-[#092F64]'
      }`}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-[17px] ${dark ? 'bg-[#E9F5FF]/12' : 'bg-[#E9F5FF]/85'} text-xl`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${dark ? 'text-[#93BFEF]' : 'text-[#468BE6]'}`}>{label}</p>
          <p className="mt-1 truncate text-sm font-black">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingBio, setIsSavingBio] = useState(false)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: user?.displayName || '',
    department: '',
    birthDate: '',
    interests: [],
    bio: '',
    avatarId: 'women',
  })
  const [metrics, setMetrics] = useState({
    activeSpotCount: 0,
    quizScore: 0,
    quizzesSolved: 0,
    gameLevel: 1,
    gameXp: 0,
    gamesPlayed: 0,
  })
  const [securityForm, setSecurityForm] = useState({
    newEmail: '',
    currentPasswordForEmail: '',
    currentPasswordForPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    deletePassword: '',
    deleteConfirm: '',
  })

  const selectedAvatar = useMemo(() => getAvatarById(form.avatarId), [form.avatarId])
  const firstName = form.name?.trim()?.split(/\s+/)?.[0] || 'Linkli'
  const email = user?.email || 'E-posta yok'
  const verified = Boolean(user?.emailVerified)
  const isOnline = Boolean(user)
  const departmentBadge = form.department ? `📍 ${form.department.split(/\s+/).slice(0, 2).join(' ')}` : '📍 Kampüs keşifçisi'
  const achievements = useMemo(() => {
    const items = []

    if (form.interests.includes('☕ Kahve')) items.push('☕ Kahve avcısı')
    if (form.interests.includes('🎮 Oyun')) items.push('🎮 Gece gamerı')
    if (form.interests.includes('📚 Çalışma')) items.push('📚 Sessiz kat müdavimi')
    if (form.interests.length >= 4) items.push('✨ Sosyal kelebek')

    return items.slice(0, 4)
  }, [form.interests])

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const snapshot = await getDoc(doc(db, 'users', user.uid))

        if (!ignore && snapshot.exists()) {
          const data = snapshot.data()
          setForm({
            name: data.name || user.displayName || '',
            department: data.department || '',
            birthDate: data.birthDate || '',
            interests: Array.isArray(data.interests) ? data.interests : [],
            bio: data.bio || '',
            avatarId: avatarOptions.some((avatar) => avatar.id === data.avatarId) ? data.avatarId : 'women',
          })
          setMetrics({
            activeSpotCount: getNumericMetric(data, ['activeSpotCount', 'activeSpots', 'stats.activeSpotCount', 'stats.activeSpots']),
            quizScore: getNumericMetric(data, ['quizScore', 'quizPoints', 'stats.quizScore', 'stats.quizPoints']),
            quizzesSolved: getNumericMetric(data, ['quizzesSolved', 'stats.quizzesSolved']),
            gameLevel: getNumericMetric(data, ['gameStats.level']) || 1,
            gameXp: getNumericMetric(data, ['gameStats.xp']),
            gamesPlayed: getNumericMetric(data, ['gamesPlayed', 'gameStats.gamesPlayed']),
          })
        }
      } catch (error) {
        console.warn('Profile could not be loaded:', error)
        if (!ignore) {
          setMessage('Profil bilgileri şu an yüklenemedi.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      ignore = true
    }
  }, [user])

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const updateSecurityForm = (key, value) => {
    setSecurityForm((current) => ({ ...current, [key]: value.slice(0, key.toLocaleLowerCase('tr-TR').includes('password') ? 72 : 120) }))
  }

  const toggleInterest = (interest) => {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }))
  }

  const handleSave = async () => {
    if (!user) return

    if (!form.name.trim() || !form.department.trim() || !form.birthDate) {
      setMessage('Ad, bölüm ve doğum tarihi alanlarını dolduralım.')
      return
    }

    if (hasBlockedName(form.name) || hasBlockedName(form.department) || hasBlockedName(form.bio)) {
      setMessage('Profil alanlarında uygun olmayan kelimeler var.')
      return
    }

    if (!isValidBirthDate(form.birthDate)) {
      setMessage('Doğum tarihi 13-100 yaş aralığında olmalı.')
      return
    }

    setIsSaving(true)
    setMessage('')

    try {
      await updateProfile(user, { displayName: form.name.trim() })
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          name: form.name.trim(),
          department: form.department.trim(),
          birthDate: form.birthDate,
          interests: form.interests,
          bio: form.bio.trim(),
          avatarId: form.avatarId,
          email,
          emailVerified: verified,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      setMessage('Profilin parladı. Kaydedildi!')
    } catch (error) {
      console.warn('Profile could not be saved:', error)
      setMessage('Profil kaydedilemedi. Firestore izinlerini kontrol edelim.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarSave = async () => {
    if (!user) return

    if (!avatarOptions.some((avatar) => avatar.id === form.avatarId)) {
      setMessage('Geçerli bir avatar seçelim.')
      return
    }

    setIsSavingAvatar(true)
    setMessage('')

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          avatarId: form.avatarId,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      setMessage('Avatar kaydedildi.')
      setIsAvatarPickerOpen(false)
    } catch (error) {
      console.warn('Avatar could not be saved:', error)
      setMessage('Avatar kaydedilemedi. Firestore izinlerini kontrol edelim.')
    } finally {
      setIsSavingAvatar(false)
    }
  }

  const handleBioSave = async () => {
    if (!user) return

    if (hasBlockedName(form.bio)) {
      setMessage('Bio alanında uygun olmayan kelimeler var.')
      return
    }

    setIsSavingBio(true)
    setMessage('')

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          bio: form.bio.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      setMessage('Bio kaydedildi.')
    } catch (error) {
      console.warn('Bio could not be saved:', error)
      setMessage('Bio kaydedilemedi. Firestore izinlerini kontrol edelim.')
    } finally {
      setIsSavingBio(false)
    }
  }

  const reauthenticate = async (password) => {
    if (!user?.email) {
      throw new Error('auth/missing-email')
    }

    const credential = EmailAuthProvider.credential(user.email, password)
    await reauthenticateWithCredential(user, credential)
  }

  const handleEmailUpdate = async () => {
    if (!user) return

    const nextEmail = securityForm.newEmail.trim().toLocaleLowerCase('tr-TR')
    const rateLimit = checkProfileRateLimit('email')

    if (!rateLimit.allowed) {
      setMessage(rateLimit.message)
      return
    }

    if (!nextEmail || !securityForm.currentPasswordForEmail) {
      setMessage('Yeni e-posta ve mevcut şifre gerekli.')
      return
    }

    if (!isValidEmail(nextEmail)) {
      setMessage('Geçerli bir e-posta yazalım.')
      return
    }

    if (!isTrustedEmail(nextEmail)) {
      setMessage('Geçici e-postalar kapalı. Gmail, iCloud, Outlook veya okul e-postası kullan.')
      return
    }

    if (nextEmail === email.toLocaleLowerCase('tr-TR')) {
      setMessage('Yeni e-posta mevcut e-postanla aynı.')
      return
    }

    setIsUpdatingEmail(true)
    setMessage('')

    try {
      recordProfileAttempt('email')
      await reauthenticate(securityForm.currentPasswordForEmail)
      await verifyBeforeUpdateEmail(user, nextEmail)
      await setDoc(
        doc(db, 'users', user.uid),
        {
          pendingEmail: nextEmail,
          emailChangeRequestedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      setSecurityForm((current) => ({ ...current, newEmail: '', currentPasswordForEmail: '' }))
      setMessage('Yeni e-postana doğrulama linki gönderdik. Linke tıklayınca e-posta değişecek.')
    } catch (error) {
      console.warn('Email could not be updated:', error)
      setMessage(getAuthErrorMessage(error))
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (!user) return

    const rateLimit = checkProfileRateLimit('password')

    if (!rateLimit.allowed) {
      setMessage(rateLimit.message)
      return
    }

    if (!securityForm.currentPasswordForPassword || !securityForm.newPassword || !securityForm.confirmNewPassword) {
      setMessage('Mevcut şifre, yeni şifre ve tekrar şifre gerekli.')
      return
    }

    if (securityForm.newPassword !== securityForm.confirmNewPassword) {
      setMessage('Yeni şifreler eşleşmiyor.')
      return
    }

    const passwordIssues = getPasswordIssues(securityForm.newPassword)

    if (passwordIssues.length > 0) {
      setMessage(`Yeni şifre şunları içermeli: ${passwordIssues.join(', ')}.`)
      return
    }

    if (securityForm.currentPasswordForPassword === securityForm.newPassword) {
      setMessage('Yeni şifre mevcut şifreden farklı olmalı.')
      return
    }

    setIsUpdatingPassword(true)
    setMessage('')

    try {
      recordProfileAttempt('password')
      await reauthenticate(securityForm.currentPasswordForPassword)
      await updatePassword(user, securityForm.newPassword)
      await setDoc(
        doc(db, 'users', user.uid),
        {
          passwordUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      setSecurityForm((current) => ({
        ...current,
        currentPasswordForPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }))
      setMessage('Şifren güncellendi.')
    } catch (error) {
      console.warn('Password could not be updated:', error)
      setMessage(getAuthErrorMessage(error))
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    const rateLimit = checkProfileRateLimit('delete')

    if (!rateLimit.allowed) {
      setMessage(rateLimit.message)
      return
    }

    if (!securityForm.deletePassword) {
      setMessage('Hesabı silmek için mevcut şifreni yazmalısın.')
      return
    }

    if (securityForm.deleteConfirm.trim().toLocaleUpperCase('tr-TR') !== 'SİL') {
      setMessage('Devam etmek için onay alanına SİL yazmalısın.')
      return
    }

    setIsDeletingAccount(true)
    setMessage('')

    try {
      recordProfileAttempt('delete')
      await reauthenticate(securityForm.deletePassword)
      await deleteDoc(doc(db, 'publicProfiles', user.uid))
      await deleteDoc(doc(db, 'users', user.uid))
      await deleteUser(user)
    } catch (error) {
      console.warn('Account could not be deleted:', error)
      setMessage(getAuthErrorMessage(error))
      setIsDeletingAccount(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut(auth)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <section className="app-page relative min-h-screen overflow-hidden bg-[#E9F5FF] text-[#1F1F1F]">
      <div className="ambient-blob pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(70,139,230,0.38),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(147,191,239,0.52),transparent_30%),radial-gradient(circle_at_50%_86%,rgba(26,87,153,0.18),transparent_34%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#092F64_1px,transparent_0)] [background-size:18px_18px]" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-5 pb-28 sm:px-5 lg:px-6 lg:pb-10">
        {isAvatarPickerOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#092F64]/24 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsAvatarPickerOpen(false)
              }
            }}
          >
            <motion.div
              className="max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-[34px] border border-white/60 bg-[#E9F5FF]/90 p-5 shadow-[0_30px_100px_rgba(9,47,100,0.24)] backdrop-blur-2xl sm:p-6"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Avatar seç</p>
                  <h2 className="mt-1 text-3xl font-black text-[#092F64]">Kampüs karakterin</h2>
                  <p className="mt-2 text-sm font-semibold text-[#1F1F1F]/55">
                    Fotoğraf yükleme yok. Hazır karakterini seç, profilinde anında görünsün.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/65 text-xl font-black text-[#092F64] shadow-[0_12px_32px_rgba(9,47,100,0.12)]"
                  aria-label="Avatar seçimini kapat"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {avatarOptions.map((avatar) => {
                  const active = form.avatarId === avatar.id

                  return (
                    <motion.button
                      key={avatar.id}
                      type="button"
                      onClick={() => updateForm('avatarId', avatar.id)}
                      className={`rounded-[28px] border p-3 transition ${
                        active
                          ? 'border-[#468BE6] bg-white/78 shadow-[0_20px_52px_rgba(70,139,230,0.26)]'
                          : 'border-white/58 bg-white/42 hover:bg-white/62'
                      }`}
                      whileHover={{ y: -5, scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <AvatarIcon avatar={avatar} size="small" />
                      <p className="mt-2 text-center text-xs font-black text-[#092F64]">{avatar.label}</p>
                      {active && <p className="mt-1 text-center text-[10px] font-black uppercase tracking-[0.12em] text-[#468BE6]">Seçildi</p>}
                    </motion.button>
                  )
                })}
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <motion.button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(false)}
                  className="rounded-[18px] bg-white/62 px-5 py-3 text-sm font-black text-[#092F64] shadow-[0_12px_32px_rgba(9,47,100,0.10)]"
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Vazgeç
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleAvatarSave}
                  disabled={isSavingAvatar}
                  className="rounded-[18px] bg-[#092F64] px-5 py-3 text-sm font-black text-[#E9F5FF] shadow-[0_16px_40px_rgba(9,47,100,0.20)] disabled:cursor-not-allowed disabled:opacity-70"
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {isSavingAvatar ? 'Kaydediliyor...' : 'Avatar kaydet'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        <motion.section
          className="relative overflow-hidden rounded-[38px] border border-white/55 bg-white/38 p-5 shadow-[0_28px_90px_rgba(9,47,100,0.15)] backdrop-blur-2xl sm:p-7"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="ambient-blob pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#93BFEF]/38 blur-3xl" />
          <div className="ambient-blob pointer-events-none absolute -bottom-28 right-24 h-80 w-80 rounded-full bg-[#468BE6]/18 blur-3xl" />
          <LinkMascot />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_330px]">
            <div className="flex flex-col justify-between gap-8">
              <div className="flex flex-wrap items-center gap-5">
                <motion.button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(true)}
                  className="relative cursor-pointer text-left outline-none focus-visible:ring-4 focus-visible:ring-[#468BE6]/25"
                  whileHover={{ rotate: -2, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  aria-label="Avatar seç"
                >
                  <AvatarIcon avatar={selectedAvatar} />
                  <span className="absolute -top-2 -left-2 rounded-full border-4 border-white bg-[#E9F5FF] px-3 py-1 text-[11px] font-black text-[#092F64] shadow-[0_12px_30px_rgba(9,47,100,0.16)]">
                    Değiştir
                  </span>
                  <span
                    className={`absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white shadow-[0_12px_30px_rgba(9,47,100,0.20)] ${
                      verified ? 'bg-[#092F64] text-[#E9F5FF]' : 'bg-[#E9F5FF] text-[#1A5799]'
                    }`}
                    aria-label={verified ? 'Doğrulanmış hesap' : 'Doğrulama bekliyor'}
                    title={verified ? 'Doğrulanmış hesap' : 'Doğrulama bekliyor'}
                  >
                    {verified ? <TickIcon /> : <span className="text-sm font-black">!</span>}
                  </span>
                </motion.button>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#468BE6]">Kampüs profili</p>
                  <h1 className="mt-2 text-5xl font-black leading-none tracking-normal text-[#092F64] sm:text-6xl">
                    {firstName}
                  </h1>
                  <p className="mt-3 max-w-xl text-base font-semibold leading-7 text-[#1F1F1F]/62">
                    {form.bio || (form.department ? `${form.department} içinde spotlara açık.` : 'Kampüste yeni bağlantılar için hazır.')}
                  </p>
                </div>
              </div>

              <label className="block max-w-2xl">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-[#468BE6]">Mini bio</span>
                  <span className="text-xs font-black text-[#1F1F1F]/42">{form.bio.length}/160</span>
                </div>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-4 top-4 z-10 text-base">💬</span>
                  <textarea
                    value={form.bio}
                    placeholder="Kafede fazladan kahvem var, çalışmaya gelen yazsın."
                    onChange={(event) => updateForm('bio', event.target.value.slice(0, 160))}
                    rows={3}
                    className="min-h-24 w-full resize-none rounded-[24px] border border-white/60 bg-[#E9F5FF]/54 py-3 pl-12 pr-4 text-sm font-bold leading-6 text-[#092F64] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_16px_42px_rgba(9,47,100,0.07)] backdrop-blur-xl transition placeholder:text-[#1F1F1F]/35 hover:border-[#93BFEF]/90 hover:bg-white/48 focus:border-[#468BE6]/70 focus:bg-white/62 focus:shadow-[0_0_0_4px_rgba(70,139,230,0.16),0_18px_48px_rgba(9,47,100,0.10)]"
                  />
                </div>
                <motion.button
                  type="button"
                  onClick={handleBioSave}
                  disabled={isSavingBio}
                  className="mt-3 rounded-[18px] bg-[#092F64] px-5 py-3 text-sm font-black text-[#E9F5FF] shadow-[0_16px_40px_rgba(9,47,100,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {isSavingBio ? 'Kaydediliyor...' : 'Bio kaydet'}
                </motion.button>
              </label>

              <div className="flex flex-wrap gap-2">
                {[isOnline ? '🟢 Şu an aktif' : '⚪ Offline', departmentBadge, ...(form.interests.length ? form.interests.slice(0, 3) : ['✨ Yeni profil'])].map((item) => (
                  <motion.span
                    key={item}
                    className="rounded-full border border-white/60 bg-[#E9F5FF]/70 px-4 py-2 text-sm font-black text-[#1A5799] shadow-[0_10px_28px_rgba(9,47,100,0.07)]"
                    whileHover={{ y: -2, scale: 1.04 }}
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              <MiniStat emoji="🔥" label="Aktif spot" value={metrics.activeSpotCount} />
              <MiniStat emoji="🏆" label="Quiz puanı" value={metrics.quizScore} />
              <MiniStat emoji="🎮" label="Oyun level" value={metrics.gameLevel} />
            </div>
          </div>
        </motion.section>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InfoChip icon="🟢" label="Aktif status" value={isOnline ? 'Şu an aktif' : 'Offline'} dark />
          <InfoChip icon="🪪" label="Bölüm rozeti" value={departmentBadge.replace('📍 ', '')} />
          <InfoChip icon="🎯" label="Çözülen quiz" value={`${metrics.quizzesSolved} quiz`} />
          <InfoChip icon="⚡" label="Oyun XP" value={`${metrics.gameXp} XP`} />
          <InfoChip icon="🏅" label="Spot rozeti" value={achievements[0] || 'Henüz rozet yok'} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <motion.section
            className="rounded-[34px] border border-white/50 bg-white/44 p-5 shadow-[0_22px_72px_rgba(9,47,100,0.11)] backdrop-blur-2xl sm:p-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Kimliğin</p>
                <h2 className="mt-1 text-3xl font-black tracking-normal text-[#092F64]">Profil kartını düzenle</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#1F1F1F]/58">
                  Resmi değil, kampüs vibe'ını anlatan küçük bilgiler. Spot eşleşmeleri burada güzelleşecek.
                </p>
              </div>
              {message && (
                <span className="rounded-full bg-[#E9F5FF]/85 px-4 py-2 text-xs font-black text-[#1A5799] shadow-[0_10px_28px_rgba(9,47,100,0.08)]">
                  {message}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="mt-6 rounded-[24px] bg-[#E9F5FF]/70 p-5 text-sm font-black text-[#092F64]">
                Profil yükleniyor...
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="Ad soyad" icon="👤" value={form.name} placeholder="Selin Arda" onChange={(value) => updateForm('name', value.slice(0, 60))} />
                  <Field label="Bölüm / okul" icon="🎓" value={form.department} placeholder="Bilgisayar Mühendisliği" onChange={(value) => updateForm('department', value.slice(0, 80))} />
                  <Field label="Doğum tarihi" icon="🎂" type="date" value={form.birthDate} onChange={(value) => updateForm('birthDate', value)} />
                  <div className="rounded-[20px] bg-[#E9F5FF]/72 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#468BE6]">E-posta</p>
                    <p className="mt-2 truncate text-sm font-black text-[#092F64]">{email}</p>
                    <p className="mt-1 text-xs font-bold text-[#1F1F1F]/48">{verified ? 'Doğrulanmış hesap' : 'Doğrulama bekliyor'}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#468BE6]">Spot tarzın</p>
                      <h3 className="mt-1 text-2xl font-black text-[#092F64]">Kampüste nasıl görünüyorsun?</h3>
                    </div>
                    <span className="rounded-full bg-[#E9F5FF]/80 px-3 py-1.5 text-xs font-black text-[#1A5799]">
                      {form.interests.length} seçili
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {interestOptions.map((interest) => {
                      const active = form.interests.includes(interest)
                      return (
                        <motion.button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`relative overflow-hidden rounded-[20px] px-4 py-4 text-sm font-black transition ${
                            active
                              ? 'bg-[linear-gradient(135deg,#092F64_0%,#1A5799_55%,#468BE6_100%)] text-[#E9F5FF] shadow-[0_18px_44px_rgba(70,139,230,0.28)]'
                              : 'bg-[#E9F5FF]/75 text-[#092F64] shadow-[0_10px_26px_rgba(9,47,100,0.06)] hover:bg-white/58'
                          }`}
                          whileHover={{ y: -5, scale: 1.035, rotate: active ? -1 : 0 }}
                          whileTap={{ scale: 0.94 }}
                          animate={active ? { y: [0, -2, 0] } : { y: 0 }}
                          transition={{ duration: active ? 1.8 : 0.2, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
                        >
                          {active && <span className="absolute inset-x-5 -bottom-8 h-14 rounded-full bg-[#E9F5FF]/22 blur-2xl" />}
                          <span className="relative z-10">{interest}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {achievements.length > 0 && (
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {achievements.map((achievement) => (
                    <motion.div
                      key={achievement}
                      className="rounded-[22px] border border-white/50 bg-white/46 px-4 py-3 text-sm font-black text-[#092F64] shadow-[0_14px_36px_rgba(9,47,100,0.08)] backdrop-blur-xl"
                      whileHover={{ y: -3, scale: 1.015 }}
                    >
                      {achievement}
                    </motion.div>
                    ))}
                  </div>
                )}

                <motion.button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="mt-6 w-full rounded-[22px] bg-[#092F64] px-5 py-4 text-sm font-black text-[#E9F5FF] shadow-[0_18px_46px_rgba(9,47,100,0.20)] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-48"
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {isSaving ? 'Kaydediliyor...' : 'Profili kaydet'}
                </motion.button>

                <div className="mt-8 border-t border-white/55 pt-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Güvenlik</p>
                    <h2 className="theme-title mt-1 text-3xl font-black tracking-normal text-[#092F64]">Hesap kilidini güçlendir</h2>
                    <p className="theme-muted mt-2 max-w-2xl text-sm leading-6 text-[#1F1F1F]/58">
                      E-posta ve şifre değişimi için mevcut şifreni isteriz. Bu, hesabı ele geçirme denemelerine karşı ekstra güvenlik katmanı sağlar.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    <div className="theme-soft rounded-[26px] border border-white/50 bg-[#E9F5FF]/48 p-4 shadow-[0_16px_42px_rgba(9,47,100,0.08)]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-[17px] bg-[#93BFEF] text-lg">✉️</span>
                        <div>
                          <h3 className="theme-title text-lg font-black text-[#092F64]">E-posta değiştir</h3>
                          <p className="theme-muted text-xs font-bold text-[#1F1F1F]/52">Yeni adrese doğrulama linki gider.</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <Field
                          label="Yeni e-posta"
                          value={securityForm.newEmail}
                          placeholder="yeni@mail.com"
                          onChange={(value) => updateSecurityForm('newEmail', value)}
                        />
                        <PasswordField
                          label="Mevcut şifre"
                          value={securityForm.currentPasswordForEmail}
                          placeholder="güvenlik için gerekli"
                          onChange={(value) => updateSecurityForm('currentPasswordForEmail', value)}
                        />
                        <motion.button
                          type="button"
                          onClick={handleEmailUpdate}
                          disabled={isUpdatingEmail}
                          className="rounded-[20px] bg-[#092F64] px-5 py-3.5 text-sm font-black text-[#E9F5FF] shadow-[0_16px_40px_rgba(9,47,100,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
                          whileHover={{ y: -3, scale: 1.01 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          {isUpdatingEmail ? 'Gönderiliyor...' : 'Doğrulama gönder'}
                        </motion.button>
                      </div>
                    </div>

                    <div className="theme-soft rounded-[26px] border border-white/50 bg-[#E9F5FF]/48 p-4 shadow-[0_16px_42px_rgba(9,47,100,0.08)]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-[17px] bg-[#93BFEF] text-lg">🔐</span>
                        <div>
                          <h3 className="theme-title text-lg font-black text-[#092F64]">Şifre değiştir</h3>
                          <p className="theme-muted text-xs font-bold text-[#1F1F1F]/52">Büyük/küçük harf, sayı ve özel karakter ister.</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <PasswordField
                          label="Mevcut şifre"
                          value={securityForm.currentPasswordForPassword}
                          placeholder="eski şifren"
                          onChange={(value) => updateSecurityForm('currentPasswordForPassword', value)}
                        />
                        <PasswordField
                          label="Yeni şifre"
                          value={securityForm.newPassword}
                          placeholder="güçlü yeni şifre"
                          onChange={(value) => updateSecurityForm('newPassword', value)}
                        />
                        <PasswordField
                          label="Yeni şifre tekrar"
                          value={securityForm.confirmNewPassword}
                          placeholder="bir kez daha"
                          onChange={(value) => updateSecurityForm('confirmNewPassword', value)}
                        />
                        <motion.button
                          type="button"
                          onClick={handlePasswordUpdate}
                          disabled={isUpdatingPassword}
                          className="rounded-[20px] bg-[#092F64] px-5 py-3.5 text-sm font-black text-[#E9F5FF] shadow-[0_16px_40px_rgba(9,47,100,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
                          whileHover={{ y: -3, scale: 1.01 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          {isUpdatingPassword ? 'Güncelleniyor...' : 'Şifreyi güncelle'}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.section>

          <motion.aside
            className="space-y-4"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-[30px] border border-white/50 bg-[#092F64] p-5 text-[#E9F5FF] shadow-[0_22px_72px_rgba(9,47,100,0.18)]">
              <p className="text-sm font-black text-[#93BFEF]">Profil enerjisi</p>
              <h3 className="mt-2 text-2xl font-black">Spotlarını kişiselleştir</h3>
              <p className="mt-3 text-sm leading-6 text-[#E9F5FF]/72">
                İlgi alanların arttıkça kampüs akışında sana daha yakın spotlar öne çıkacak.
              </p>
            </div>

            <div className="rounded-[30px] border border-white/50 bg-white/48 p-5 shadow-[0_18px_58px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#468BE6]">Hesap</p>
              <div className="mt-4 grid gap-3">
                <motion.button
                  type="button"
                  onClick={() => navigate('/')}
                  className="rounded-[20px] bg-[#E9F5FF]/80 px-5 py-4 text-sm font-black text-[#092F64] shadow-[0_12px_30px_rgba(9,47,100,0.08)]"
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Ana sayfaya dön
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="rounded-[20px] bg-[#092F64] px-5 py-4 text-sm font-black text-[#E9F5FF] shadow-[0_18px_46px_rgba(9,47,100,0.20)] disabled:cursor-not-allowed disabled:opacity-70"
                  whileHover={{ y: -3, scale: 1.01, boxShadow: '0 24px 62px rgba(9,47,100,0.26)' }}
                  whileTap={{ scale: 0.96 }}
                >
                  {isSigningOut ? 'Çıkış yapılıyor...' : 'Oturumu kapat'}
                </motion.button>
              </div>
            </div>

            <div className="theme-card rounded-[30px] border border-white/50 bg-white/48 p-5 shadow-[0_18px_58px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#468BE6]">Tehlikeli alan</p>
              <h3 className="theme-title mt-2 text-2xl font-black text-[#092F64]">Hesabı sil</h3>
              <p className="theme-muted mt-2 text-sm leading-6 text-[#1F1F1F]/58">
                Hesabın, profil bilgilerin ve MAKÜLink'teki kayıtlı tercihlerin kalıcı olarak silinir. Bu işlemi geri alamayız.
              </p>
              <div className="mt-4 grid gap-3">
                <PasswordField
                  label="Mevcut şifre"
                  value={securityForm.deletePassword}
                  placeholder="hesabını doğrula"
                  onChange={(value) => updateSecurityForm('deletePassword', value)}
                />
                <Field
                  label="Onay"
                  value={securityForm.deleteConfirm}
                  placeholder="SİL yaz"
                  onChange={(value) => updateSecurityForm('deleteConfirm', value.slice(0, 8))}
                />
                <motion.button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="rounded-[20px] bg-[#1F1F1F] px-5 py-4 text-sm font-black text-[#E9F5FF] shadow-[0_18px_46px_rgba(31,31,31,0.20)] disabled:cursor-not-allowed disabled:opacity-70"
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {isDeletingAccount ? 'Hesap siliniyor...' : 'Hesabımı sil'}
                </motion.button>
              </div>
            </div>
          </motion.aside>
        </div>
      </main>
    </section>
  )
}
