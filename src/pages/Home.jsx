import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom' 
import { doc, onSnapshot } from 'firebase/firestore'
import Navbar from '../components/Navbar/Navbar.jsx'
import { auth, db } from '../FireBase/firebaseConfig.js'
import { getAvatarById } from '../data/avatarOptions.js';
import { SPOT_TYPES, SHORTCUT_ITEMS } from '../data/constants.js';
import HomeBackground from "../components/Home/HomeBackground.jsx";
import SpotBox from "../components/Home/SpotBox.jsx";
import SpotCard from "../components/Home/SpotCard.jsx";

import { subscribeCommunities } from '../services/communityService.js'
import { recordSpotResult } from '../services/gameService.js'
import {
  createCampusSpot,
  createCampusSpotComment,
  deleteCampusSpot,
  deleteCampusSpotComment,
  subscribeCampusSpotComments,
  subscribeCampusSpots,
  toggleCampusSpotReaction,
  updateCampusSpot,
  updateCampusSpotComment,
} from '../services/spotService.js'

const getAuthorName = () => auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'MAKÜLink üyesi'
const formatCount = (value = 0) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(Math.max(0, value))

function SectionTitle({ eyebrow, title }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#468BE6]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black tracking-normal text-[#092F64]">{title}</h2>
    </div>
  )
}

function ShortcutItem({ label, meta, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[20px] px-3 py-2.5 text-left text-[#092F64] transition hover:-translate-y-0.5 hover:bg-white/45"
    >
      <span className="flex items-center gap-2 text-sm font-black">
        <span>{icon}</span> {label}
      </span>
      <span className="text-xs font-bold text-[#1F1F1F]/45">{meta}</span>
    </button>
  )
}

export default function Home() {
  const navigate = useNavigate() 
  const [profile, setProfile] = useState({ name: getAuthorName(), avatarId: 'women' })
  const [spots, setSpots] = useState([])
  const [comments, setComments] = useState([])
  const [communities, setCommunities] = useState([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return undefined
    return onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {}
      setProfile({ name: data.name || getAuthorName(), avatarId: data.avatarId || 'women' })
    })
  }, [])

  useEffect(() => subscribeCampusSpots(setSpots), [])
  useEffect(() => subscribeCampusSpotComments(setComments), [])
  useEffect(() => subscribeCommunities(setCommunities), [])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const visibleSpots = useMemo(() => spots.filter((s) => !s.deleted), [spots])
  const commentsBySpot = useMemo(() => {
    return comments.filter((c) => !c.deleted).reduce((acc, c) => {
      acc[c.spotId] = [...(acc[c.spotId] || []), c]
      return acc
    }, {})
  }, [comments])

  const activeStudents = useMemo(() => {
    const map = new Map()
    visibleSpots.forEach((s) => { if (!map.has(s.uid)) map.set(s.uid, s) })
    return Array.from(map.values()).slice(0, 3)
  }, [visibleSpots])

  const stats = useMemo(() => ({
    spots: visibleSpots.length,
    active: activeStudents.length,
    comments: comments.filter(c => !c.deleted).length,
    reactions: visibleSpots.reduce((acc, s) => acc + Object.values(s.reactions || {}).flat().length, 0)
  }), [visibleSpots, activeStudents.length, comments])

  const handleCreateSpot = async (payload) => {
    try {
      await createCampusSpot(payload)
      if (auth.currentUser) recordSpotResult(auth.currentUser.uid).catch(() => {})
      setNotice('Spot yayında.')
    } catch { setNotice('Hata oluştu.') }
  }

  return (
    <section className="app-page relative min-h-screen overflow-x-hidden bg-[#E9F5FF] text-[#1F1F1F]">
      <HomeBackground />

      <Navbar/>

      {notice && (
        <motion.div className="fixed bottom-6 right-6 z-50 rounded-full border border-white/55 bg-[#E9F5FF]/92 px-5 py-3 text-sm font-black text-[#092F64] shadow-2xl backdrop-blur-2xl" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          {notice}
        </motion.div>
      )}

      <main className="relative z-10 mx-auto grid w-full max-w-[1560px] grid-cols-1 gap-6 px-4 py-7 pb-32 lg:grid-cols-[280px_minmax(0,1fr)_380px] lg:px-8 lg:pb-10">
        

        <aside className="hidden lg:block space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[28px] border border-white/40 bg-white/30 p-4 shadow-sm backdrop-blur-2xl">
            <SectionTitle eyebrow="Kısayollar" title="Kampüs" />
            <div className="space-y-1.5">
              {SHORTCUT_ITEMS.map(([label, meta, icon]) => (
                <ShortcutItem
                  key={label}
                  label={label}
                  meta={meta}
                  icon={icon}
                  onClick={() => {
                    if (label === 'Topluluklar') navigate('/communities')
                    else if (label === 'Oyunlar') navigate('/games')
                    else if (label === 'Quizler') navigate('/quiz')
                    else if (label === 'Pomodoro') navigate('/exam')
                    else navigate('/leaderboard')
                  }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/40 bg-white/30 p-4 backdrop-blur-2xl">
            <SectionTitle eyebrow="Topluluk" title="Canlı gruplar" />
            <div className="space-y-1">
              {communities.slice(0, 4).map((c) => (
                <button key={c.id} onClick={() => navigate('/communities', { state: { initialCommunityId: c.id } })} className="flex w-full items-center justify-between rounded-[20px] px-2 py-2.5 hover:bg-white/40 transition">
                  <div className="flex items-center gap-3 truncate">
                    <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-2xl bg-[#E9F5FF] text-lg">{c.emoji}</div>
                    <div className="truncate"><h3 className="text-sm font-black text-[#092F64] truncate">{c.name}</h3><p className="text-xs font-semibold text-[#1F1F1F]/50">{formatCount(c.memberCount)} üye</p></div>
                  </div>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#468BE6]" />
                </button>
              ))}
            </div>
          </div>
        </aside>


        <section className="space-y-5">
          <header>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Canlı akış</p>
            <h2 className="text-3xl font-black text-[#092F64]">Kampüs spotları</h2>
            
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['🔥', `${stats.spots} spot`, 'aktif'],
                ['🎯', `${stats.active} öğrenci`, 'canlı'],
                ['💬', `${stats.comments} yorum`, 'etkileşim'],
                ['💙', `${stats.reactions} tepki`, 'enerji']
              ].map(([emoji, val, lbl]) => (
                <div key={lbl} className="rounded-[22px] bg-white/40 p-4 border border-white/50">
                  <p className="text-xl">{emoji}</p>
                  <p className="mt-1 text-sm font-black text-[#092F64]">{val}</p>
                  <p className="text-[10px] font-bold text-[#1F1F1F]/40 uppercase">{lbl}</p>
                </div>
              ))}
            </div>
          </header>

          <SpotBox profile={profile} onCreate={handleCreateSpot} />

          <div className="space-y-4">
            {visibleSpots.length === 0 ? (
              <div className="p-10 text-center font-bold text-[#092F64]/40 bg-white/20 rounded-[30px]">Henüz spot yok.</div>
            ) : (
              visibleSpots.map((spot) => (
                
<SpotCard
  key={spot.id}
  spot={spot}
  comments={commentsBySpot[spot.id] || []}
onComment={(spotId, commentText) => createCampusSpotComment({ spotId, text: commentText })}
  onUpdate={updateCampusSpot}
  onDelete={deleteCampusSpot}
  onReaction={toggleCampusSpotReaction}
  onUpdateComment={updateCampusSpotComment}
  onDeleteComment={deleteCampusSpotComment}
  onViewProfile={(u) => navigate(`/user/${u.uid}`)}
/>
              ))
            )}
          </div>
        </section>

        <aside className="hidden lg:block space-y-5 lg:sticky lg:top-28 lg:self-start">
          <section className="rounded-[28px] border border-white/45 bg-white/48 p-4 shadow-sm backdrop-blur-xl">
            <SectionTitle eyebrow="Yakında" title="Spot bırakanlar" />
            <div className="grid grid-cols-3 gap-3">
              {activeStudents.map((s) => (
                <button key={s.uid} onClick={() => navigate(`/user/${s.uid}`)} className="flex flex-col items-center group">
                  <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-[#468BE6] to-[#93BFEF] transition-transform group-hover:scale-105">
                    <img src={getAvatarById(s.authorAvatarId).src} className="h-14 w-14 rounded-full border-2 border-white object-cover" alt="user" />
                  </div>
                  <span className="mt-2 text-[10px] font-black text-[#092F64] truncate w-full text-center">{(s.authorName || 'Kullanıcı').split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/15 bg-[#092F64] p-6 text-[#E9F5FF] shadow-xl">
             <p className="text-[10px] font-black uppercase tracking-widest text-[#93BFEF]">Trend</p>
             <h3 className="mt-2 text-xl font-black">Kampüs Liderleri</h3>
             <p className="mt-3 text-xs font-semibold leading-5 text-[#E9F5FF]/70">Haftalık en çok spot bırakan ve etkileşim alan öğrenciler sıralanıyor.</p>
             <button onClick={() => navigate('/leaderboard')} className="mt-5 w-full rounded-xl bg-white py-3 text-sm font-black text-[#092F64] hover:bg-[#E9F5FF] transition">Leaderboard'a Bak</button>
          </section>
        </aside>

      </main>
    </section>
  )
}