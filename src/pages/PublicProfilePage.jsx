import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import Navbar from '../components/Navbar/Navbar.jsx'
import { db } from '../FireBase/firebaseConfig.js'
import { getAvatarById } from '../data/avatarOptions.js'
import { getPublicProfile } from '../services/publicProfileService.js'

function StatCard({ emoji, label, value }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-[28px] border border-white/55 bg-white/45 p-5 shadow-[0_18px_55px_rgba(9,47,100,0.10)] backdrop-blur-2xl"
    >
      <p className="text-2xl">{emoji}</p>
      <p className="mt-3 text-2xl font-black text-[#092F64]">{value}</p>
      <p className="text-sm font-black text-[#1F1F1F]/55">{label}</p>
    </motion.div>
  )
}

export default function PublicProfilePage() {
  const { uid } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [leaderboard, setLeaderboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return
    }

    let mounted = true

    getPublicProfile(uid)
      .then((data) => {
        if (mounted) setProfile(data || null)
      })
      .catch(() => {
        if (mounted) setProfile(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [uid])

  useEffect(() => {
    if (!uid) return undefined

    return onSnapshot(doc(db, 'publicLeaderboard', uid), (snapshot) => {
      setLeaderboard(snapshot.exists() ? snapshot.data() : null)
    })
  }, [uid])

  const avatar = useMemo(() => getAvatarById(profile?.avatarId), [profile?.avatarId])

  return (
    <div className="theme-shell min-h-screen overflow-hidden bg-[#E9F5FF] pb-28 text-[#092F64]">
      <Navbar />

      <main className="mx-auto mt-8 w-full max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[44px] border border-white/55 bg-white/42 p-7 shadow-[0_28px_90px_rgba(9,47,100,0.12)] backdrop-blur-2xl sm:p-10"
        >
          <div className="absolute right-8 top-8 rounded-full bg-[#468BE6]/10 px-5 py-2 text-sm font-black text-[#1A5799]">
            Public profil
          </div>

          {loading ? (
            <p className="text-lg font-black text-[#092F64]">Profil yükleniyor...</p>
          ) : !profile ? (
            <div>
              <p className="text-4xl font-black text-[#092F64]">Profil bulunamadı.</p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-6 rounded-full bg-[#092F64] px-6 py-3 font-black text-[#E9F5FF]"
              >
                Ana sayfaya dön
              </button>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
                <div className="h-36 w-36 overflow-hidden rounded-[42px] border border-white/70 bg-[#93BFEF] shadow-[0_24px_70px_rgba(9,47,100,0.18)]">
                  <img src={avatar.src} alt={profile.name} className="h-full w-full object-cover" draggable="false" />
                </div>

                <div>
                  <p className="tracking-[0.32em] text-sm font-black uppercase text-[#468BE6]">MAKÜLink profili</p>
                  <h1 className="mt-2 text-5xl font-black leading-none text-[#092F64] sm:text-7xl">{profile.name}</h1>
                  <p className="mt-4 text-xl font-black text-[#1F1F1F]/70">
                    {profile.department || 'Kampüste aktif'}
                  </p>
                  {profile.bio && <p className="mt-3 max-w-2xl text-lg font-semibold text-[#1F1F1F]/65">{profile.bio}</p>}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(profile.interests || []).slice(0, 6).map((interest) => (
                      <span key={interest} className="rounded-full border border-white/60 bg-[#E9F5FF]/80 px-4 py-2 text-sm font-black text-[#092F64]">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <StatCard emoji="🏆" label="Toplam puan" value={leaderboard?.totalScore || 0} />
                <StatCard emoji="🎮" label="Oyun puanı" value={leaderboard?.gameScore || 0} />
                <StatCard emoji="🔥" label="Sosyallik" value={leaderboard?.socialScore || leaderboard?.spotScore || 0} />
              </div>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  )
}
