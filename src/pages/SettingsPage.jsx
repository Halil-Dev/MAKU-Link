import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import Navbar from '../components/Navbar/Navbar.jsx'
import { auth, db } from '../FireBase/firebaseConfig.js'

const defaultSettings = {
  theme: 'light',
  profileVisibility: 'campus',
  spotVisibility: 'campus',
  discoverableProfile: true,
  showOnlineStatus: true,
  showDepartment: true,
  allowSpotMentions: true,
  allowDirectMessages: false,
  allowTagging: true,
  hideSensitiveContent: true,
  muteAllNotifications: false,
  notifySpotReplies: true,
  notifyQuiz: true,
  notifyLeaderboard: true,
  notifyEvents: true,
  emailDigest: false,
  autoplayMedia: false,
  dataSaver: false,
  reducedMotion: false,
  compactFeed: false,
}

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="theme-soft flex w-full items-center justify-between gap-4 rounded-[22px] bg-[#E9F5FF]/62 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_12px_32px_rgba(9,47,100,0.06)] transition hover:-translate-y-0.5 hover:bg-white/60"
    >
      <span>
        <span className="theme-title block text-sm font-black text-[#092F64]">{title}</span>
        <span className="theme-muted mt-1 block text-xs font-semibold leading-5 text-[#1F1F1F]/54">{description}</span>
      </span>
      <span className={`relative h-8 w-14 shrink-0 rounded-full p-1 transition ${checked ? 'bg-[#092F64]' : 'bg-white/75'}`}>
        <motion.span
          className={`block h-6 w-6 rounded-full ${checked ? 'bg-[#E9F5FF]' : 'bg-[#93BFEF]'}`}
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        />
      </span>
    </button>
  )
}

function SelectRow({ title, description, value, options, onChange }) {
  return (
    <div className="theme-soft block rounded-[22px] bg-[#E9F5FF]/62 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_12px_32px_rgba(9,47,100,0.06)]">
      <span className="theme-title block text-sm font-black text-[#092F64]">{title}</span>
      <span className="theme-muted mt-1 block text-xs font-semibold leading-5 text-[#1F1F1F]/54">{description}</span>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-[18px] border px-3 py-3 text-sm font-black transition ${
              value === option.value
                ? 'border-[#468BE6] bg-[#092F64] text-[#E9F5FF] shadow-[0_14px_34px_rgba(9,47,100,0.16)]'
                : 'theme-pill border-white/55 bg-white/52 text-[#092F64] hover:bg-white/72'
            }`}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.96 }}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function SettingsSection({ eyebrow, title, children }) {
  return (
    <motion.section
      className="theme-card rounded-[34px] border border-white/50 bg-white/44 p-5 shadow-[0_22px_72px_rgba(9,47,100,0.11)] backdrop-blur-2xl sm:p-6"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">{eyebrow}</p>
      <h2 className="theme-title mt-1 text-2xl font-black text-[#092F64]">{title}</h2>
      <div className="mt-5 grid gap-3">{children}</div>
    </motion.section>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const [settings, setSettings] = useState(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadSettings() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const snapshot = await getDoc(doc(db, 'users', user.uid))
        const savedSettings = snapshot.data()?.settings

        if (!ignore && savedSettings && typeof savedSettings === 'object') {
          setSettings((current) => ({ ...current, ...savedSettings }))
        }
      } catch (error) {
        console.warn('Settings could not be loaded:', error)
        if (!ignore) setMessage('Ayarlar şu an yüklenemedi.')
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadSettings()

    return () => {
      ignore = true
    }
  }, [user])

  const updateSetting = (key, value) => {
    setSettings((current) => {
      if (key === 'muteAllNotifications' && value) {
        return {
          ...current,
          muteAllNotifications: true,
          notifySpotReplies: false,
          notifyQuiz: false,
          notifyLeaderboard: false,
          notifyEvents: false,
          emailDigest: false,
        }
      }

      if (['notifySpotReplies', 'notifyQuiz', 'notifyLeaderboard', 'notifyEvents', 'emailDigest'].includes(key) && value) {
        return { ...current, muteAllNotifications: false, [key]: value }
      }

      return { ...current, [key]: value }
    })
  }

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
    document.documentElement.dataset.motion = settings.reducedMotion ? 'reduced' : 'full'
    document.documentElement.dataset.feedDensity = settings.compactFeed ? 'compact' : 'comfortable'
    document.documentElement.dataset.dataSaver = settings.dataSaver ? 'on' : 'off'
  }, [settings.theme, settings.reducedMotion, settings.compactFeed, settings.dataSaver])

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setMessage('')

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      setMessage('Ayarlar kaydedildi.')
    } catch (error) {
      console.warn('Settings could not be saved:', error)
      setMessage('Ayarlar kaydedilemedi. Firestore izinlerini kontrol edelim.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetSettings = async () => {
    if (!user) return

    setIsResetting(true)
    setMessage('')
    setSettings(defaultSettings)

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          settings: defaultSettings,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      setMessage('Ayarlar varsayılana döndü.')
    } catch (error) {
      console.warn('Settings could not be reset:', error)
      setMessage('Ayarlar sıfırlanamadı. Firestore izinlerini kontrol edelim.')
    } finally {
      setIsResetting(false)
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
      <div className="ambient-blob pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(70,139,230,0.34),transparent_27%),radial-gradient(circle_at_84%_16%,rgba(147,191,239,0.50),transparent_30%),radial-gradient(circle_at_52%_82%,rgba(26,87,153,0.17),transparent_34%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#092F64_1px,transparent_0)] [background-size:18px_18px]" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-5 pb-28 sm:px-5 lg:px-6 lg:pb-10">
        <motion.header
          className="theme-card rounded-[38px] border border-white/55 bg-white/38 p-6 shadow-[0_28px_90px_rgba(9,47,100,0.15)] backdrop-blur-2xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#468BE6]">MAKÜLink ayarları</p>
              <h1 className="theme-title mt-2 text-5xl font-black leading-none text-[#092F64] sm:text-6xl">Kontrol sende.</h1>
              <p className="theme-muted mt-3 max-w-2xl text-base font-semibold leading-7 text-[#1F1F1F]/62">
                Spot görünürlüğünü, bildirimlerini ve kampüs gizliliğini buradan yönet.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <motion.button
                type="button"
                onClick={() => navigate('/')}
                className="theme-card rounded-[20px] bg-white/62 px-5 py-3 text-sm font-black text-[#092F64] shadow-[0_12px_32px_rgba(9,47,100,0.10)]"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.96 }}
              >
                Ana sayfaya dön
              </motion.button>
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="rounded-[20px] bg-[#092F64] px-5 py-3 text-sm font-black text-[#E9F5FF] shadow-[0_16px_40px_rgba(9,47,100,0.20)] disabled:cursor-not-allowed disabled:opacity-70"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.96 }}
              >
                {isSaving ? 'Kaydediliyor...' : 'Ayarları kaydet'}
              </motion.button>
            </div>
          </div>
          {message && (
            <p className="mt-4 inline-flex rounded-full bg-[#E9F5FF]/80 px-4 py-2 text-xs font-black text-[#1A5799] shadow-[0_10px_28px_rgba(9,47,100,0.08)]">
              {message}
            </p>
          )}
        </motion.header>

        {isLoading ? (
          <div className="theme-card theme-title mt-5 rounded-[28px] bg-white/44 p-5 text-sm font-black text-[#092F64] shadow-[0_18px_58px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
            Ayarlar yükleniyor...
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <SettingsSection eyebrow="Gizlilik" title="Profil ve spot görünürlüğü">
              <SelectRow
                title="Tema"
                description="Uygulamanın açık/koyu görünümünü değiştir."
                value={settings.theme}
                onChange={(value) => updateSetting('theme', value)}
                options={[
                  { value: 'light', label: 'Açık mod' },
                  { value: 'dark', label: 'Dark mode' },
                ]}
              />
              <SelectRow
                title="Profil görünürlüğü"
                description="Profil bilgilerini kimlerin görebileceğini seç."
                value={settings.profileVisibility}
                onChange={(value) => updateSetting('profileVisibility', value)}
                options={[
                  { value: 'campus', label: 'Sadece kampüs' },
                  { value: 'followers', label: 'Takip ettiklerim' },
                  { value: 'private', label: 'Gizli' },
                ]}
              />
              <SelectRow
                title="Spot görünürlüğü"
                description="Bıraktığın spotların nerede görüneceğini belirle."
                value={settings.spotVisibility}
                onChange={(value) => updateSetting('spotVisibility', value)}
                options={[
                  { value: 'campus', label: 'Kampüs akışı' },
                  { value: 'department', label: 'Sadece bölüm' },
                  { value: 'private', label: 'Sadece ben' },
                ]}
              />
              <ToggleRow title="Keşfette görün" description="Profilin öneriler ve keşif alanlarında çıkabilir." checked={settings.discoverableProfile} onChange={(value) => updateSetting('discoverableProfile', value)} />
              <ToggleRow title="Aktif durumumu göster" description="Site içindeyken profilinde aktif görünürsün." checked={settings.showOnlineStatus} onChange={(value) => updateSetting('showOnlineStatus', value)} />
              <ToggleRow title="Bölüm rozetimi göster" description="Profilinde bölüm/okul rozeti görünür." checked={settings.showDepartment} onChange={(value) => updateSetting('showDepartment', value)} />
              <ToggleRow title="Hassas içerikleri gizle" description="Toplulukta işaretlenen hassas spotlar varsayılan olarak gizlenir." checked={settings.hideSensitiveContent} onChange={(value) => updateSetting('hideSensitiveContent', value)} />
            </SettingsSection>

            <SettingsSection eyebrow="Bildirimler" title="Kampüs sinyalleri">
              <ToggleRow title="Sessiz mod" description="Tüm bildirimleri tek tuşla kapatır." checked={settings.muteAllNotifications} onChange={(value) => updateSetting('muteAllNotifications', value)} />
              <ToggleRow title="Spot cevapları" description="Spotlarına cevap geldiğinde bildirim al." checked={settings.notifySpotReplies} onChange={(value) => updateSetting('notifySpotReplies', value)} />
              <ToggleRow title="Quiz bildirimleri" description="Yeni quizler ve quiz sonuçları için bildirim al." checked={settings.notifyQuiz} onChange={(value) => updateSetting('notifyQuiz', value)} />
              <ToggleRow title="Leaderboard" description="Puan sıralamasında değişiklik olduğunda haber ver." checked={settings.notifyLeaderboard} onChange={(value) => updateSetting('notifyLeaderboard', value)} />
              <ToggleRow title="Etkinlikler" description="Yakındaki kampüs etkinliklerini kaçırma." checked={settings.notifyEvents} onChange={(value) => updateSetting('notifyEvents', value)} />
              <ToggleRow title="Haftalık e-posta özeti" description="Haftanın spot/quiz özetini e-posta ile al." checked={settings.emailDigest} onChange={(value) => updateSetting('emailDigest', value)} />
            </SettingsSection>

            <SettingsSection eyebrow="Spotlar" title="Etkileşim tercihleri">
              <ToggleRow title="Spot mentionlarına izin ver" description="Diğer öğrenciler seni spotlarda etiketleyebilir." checked={settings.allowSpotMentions} onChange={(value) => updateSetting('allowSpotMentions', value)} />
              <ToggleRow title="Etiketlenmeye izin ver" description="Etkinlik, quiz ve topluluk spotlarında etiketlenebilirsin." checked={settings.allowTagging} onChange={(value) => updateSetting('allowTagging', value)} />
              <ToggleRow title="DM isteklerine izin ver" description="Şimdilik mesajlaşma kapalı; ileride DM geldiğinde bu tercih kullanılacak." checked={settings.allowDirectMessages} onChange={(value) => updateSetting('allowDirectMessages', value)} />
            </SettingsSection>

            <SettingsSection eyebrow="Deneyim" title="Akış ve performans">
              <ToggleRow title="Kompakt akış" description="Feed kartları daha sıkı ve hızlı okunabilir görünür." checked={settings.compactFeed} onChange={(value) => updateSetting('compactFeed', value)} />
              <ToggleRow title="Azaltılmış hareket" description="Animasyonları daha sakin hale getirir." checked={settings.reducedMotion} onChange={(value) => updateSetting('reducedMotion', value)} />
              <ToggleRow title="Medya otomatik oynat" description="İleride video/animasyonlu spotlar geldiğinde otomatik oynatılır." checked={settings.autoplayMedia} onChange={(value) => updateSetting('autoplayMedia', value)} />
              <ToggleRow title="Veri tasarrufu" description="Ağır görsel efektleri ve medya ön yüklemeyi azaltır." checked={settings.dataSaver} onChange={(value) => updateSetting('dataSaver', value)} />
            </SettingsSection>

            <SettingsSection eyebrow="Hesap" title="Oturum">
              <motion.button
                type="button"
                onClick={handleResetSettings}
                disabled={isResetting}
                className="theme-soft theme-title rounded-[22px] bg-[#E9F5FF]/72 px-5 py-4 text-left text-sm font-black text-[#092F64] shadow-[0_12px_32px_rgba(9,47,100,0.08)] disabled:cursor-not-allowed disabled:opacity-70"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.96 }}
              >
                {isResetting ? 'Sıfırlanıyor...' : 'Ayarları varsayılana döndür'}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => navigate('/profile')}
                className="theme-soft theme-title rounded-[22px] bg-[#E9F5FF]/72 px-5 py-4 text-left text-sm font-black text-[#092F64] shadow-[0_12px_32px_rgba(9,47,100,0.08)]"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.96 }}
              >
                Profili düzenle
              </motion.button>
              <motion.button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-[22px] bg-[#092F64] px-5 py-4 text-sm font-black text-[#E9F5FF] shadow-[0_18px_46px_rgba(9,47,100,0.20)] disabled:cursor-not-allowed disabled:opacity-70"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.96 }}
              >
                {isSigningOut ? 'Çıkış yapılıyor...' : 'Oturumu kapat'}
              </motion.button>
            </SettingsSection>
          </div>
        )}
      </main>
    </section>
  )
}
