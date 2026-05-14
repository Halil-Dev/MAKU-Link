import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { doc, onSnapshot } from 'firebase/firestore'
import Navbar from '../components/Navbar/Navbar.jsx'
import Footer from '../components/Footer/Footer.jsx'
import { auth, db } from '../FireBase/firebaseConfig.js'
import { getAvatarById } from '../data/avatarOptions.js'
import {
  approveCommunityRequest,
  banCommunityMember,
  createCommunityPostComment,
  deleteCommunityMessage,
  deleteCommunityPost,
  deleteCommunityPostComment,
  createCommunityPost,
  createCommunity,
  ensureDefaultCommunities,
  joinCommunity,
  leaveCommunity,
  rejectCommunityRequest,
  sendCommunityMessage,
  subscribeCommunities,
  subscribeCommunityMembers,
  subscribeCommunityMessages,
  subscribeCommunityPostComments,
  subscribeCommunityPosts,
  subscribeCommunityRequests,
  subscribeJoinedCommunities,
  toggleCommunityMessageReaction,
  toggleCommunityPostReaction,
  updateCommunityDetails,
  updateCommunityMessage,
  updateCommunityPost,
  updateCommunityPostComment,
  updateCommunityRole,
} from '../services/communityService.js'

const baseRoomTabs = ['Akış', 'Sohbet', 'Üyeler', 'Hakkında']
const communityFilters = ['Hepsi', 'Katıldıklarım', 'Public', 'Private']
const reactionOptions = [
  { key: 'heart', emoji: '💙', label: 'Kalp' },
  { key: 'fire', emoji: '🔥', label: 'Ateş' },
  { key: 'coffee', emoji: '☕', label: 'Kahve' },
  { key: 'laugh', emoji: '😂', label: 'Güldüm' },
]

function BackgroundEffects() {
  return (
    <>
      <div className="ambient-blob pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(70,139,230,0.36),transparent_27%),radial-gradient(circle_at_82%_18%,rgba(147,191,239,0.54),transparent_30%),radial-gradient(circle_at_48%_88%,rgba(26,87,153,0.18),transparent_34%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#092F64_1px,transparent_0)] [background-size:18px_18px]" />
    </>
  )
}

function formatCount(value = 0) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(Math.max(0, value))
}

function getAuthorName() {
  return auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'MAKÜLink üyesi'
}

function getProfileTarget(item = {}) {
  return {
    uid: item.uid,
    name: item.authorName || item.displayName || 'MAKÜLink üyesi',
    avatarId: item.authorAvatarId || item.avatarId || 'women',
    department: item.department || '',
    bio: '',
    interests: [],
  }
}

function getRoleLabel(member, currentUid) {
  if (member?.role === 'owner') return member.uid === currentUid ? 'Kurucuyum' : 'Kurucu'
  if (member?.role === 'admin') return member.uid === currentUid ? 'Yöneticiyim' : 'Yönetici'
  return member?.uid === currentUid ? 'Topluluk üyesiyim' : 'Topluluk üyesi'
}

function isManagerRole(member) {
  return member?.role === 'owner' || member?.role === 'admin'
}

function AvatarBadge({ avatarId, name, className = 'h-11 w-11', textClassName = 'text-sm' }) {
  const avatar = getAvatarById(avatarId)

  if (avatar?.src) {
    return (
      <img
        src={avatar.src}
        alt={name || 'Profil'}
        className={`${className} shrink-0 rounded-full border-2 border-white object-cover shadow-[0_10px_28px_rgba(9,47,100,0.12)]`}
      />
    )
  }

  return (
    <div className={`${className} ${textClassName} flex shrink-0 items-center justify-center rounded-full bg-[#93BFEF] font-black text-[#092F64]`}>
      {(name || 'ML').slice(0, 2).toUpperCase()}
    </div>
  )
}

function ActionMenu({ items = [], align = 'right' }) {
  const [open, setOpen] = useState(false)
  const activeItems = items.filter(Boolean)

  if (!activeItems.length) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((current) => !current)
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E9F5FF]/75 text-lg font-black text-[#092F64] transition hover:-translate-y-0.5 hover:bg-white"
        aria-label="Aksiyonlar"
      >
        ...
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={`absolute top-11 z-30 min-w-44 rounded-[18px] border border-white/60 bg-[#E9F5FF]/95 p-2 shadow-[0_18px_55px_rgba(9,47,100,0.18)] backdrop-blur-2xl ${
              align === 'left' ? 'left-0' : 'right-0'
            }`}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            onClick={(event) => event.stopPropagation()}
          >
            {activeItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                className={`block w-full rounded-[14px] px-3 py-2.5 text-left text-sm font-black transition hover:bg-white/75 ${
                  item.danger ? 'text-[#092F64]' : 'text-[#092F64]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ReactionBar({ reactions = {}, onToggle, compact = false }) {
  const currentUid = auth.currentUser?.uid

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : ''}`}>
      {reactionOptions.map((reaction) => {
        const users = Array.isArray(reactions?.[reaction.key]) ? reactions[reaction.key] : []
        const active = users.includes(currentUid)
        const count = users.length

        return (
          <motion.button
            key={reaction.key}
            type="button"
            onClick={() => onToggle(reaction.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
              active
                ? 'bg-[#092F64] text-[#E9F5FF] shadow-[0_12px_28px_rgba(9,47,100,0.16)]'
                : 'bg-[#E9F5FF]/75 text-[#1A5799] hover:bg-white/75'
            }`}
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.94 }}
            title={reaction.label}
          >
            {reaction.emoji} {count > 0 ? count : ''}
          </motion.button>
        )
      })}
    </div>
  )
}

function CommentComposer({ joined, onSubmit }) {
  const [text, setText] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (text.trim().length < 1) return
    await onSubmit(text)
    setText('')
  }

  return (
    <form onSubmit={submit} className="mt-3 flex gap-2">
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={!joined}
        maxLength={180}
        placeholder={joined ? 'Yorum yaz...' : 'Yorum için önce katıl'}
        className="theme-title min-w-0 flex-1 rounded-full border border-white/55 bg-[#E9F5FF]/70 px-4 py-2.5 text-sm font-bold text-[#092F64] outline-none placeholder:text-[#1F1F1F]/35 focus:border-[#468BE6]/45 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!joined || text.trim().length < 1}
        className="rounded-full bg-[#092F64] px-4 py-2.5 text-xs font-black text-[#E9F5FF] disabled:opacity-45"
      >
        Yolla
      </button>
    </form>
  )
}

function getMembershipStatus(membership) {
  if (!membership) return 'none'
  return membership.status || 'active'
}

function getJoinLabel(community, membership) {
  const status = getMembershipStatus(membership)
  if (status === 'active') return 'Katıldın'
  if (status === 'pending') return 'Bekliyor'
  if (status === 'banned') return 'Engellisin'
  return community.visibility === 'private' || community.joinPolicy === 'approval' ? 'Başvur' : 'Katıl'
}

function CommunityCard({ community, index, membership, busy, onOpen, onJoinToggle }) {
  const status = getMembershipStatus(membership)
  const joined = status === 'active'
  const locked = status === 'banned'

  return (
    <motion.article
      className="theme-card group overflow-hidden rounded-[30px] border border-white/50 bg-white/42 shadow-[0_20px_70px_rgba(9,47,100,0.10)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(9,47,100,0.16)]"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.04 + index * 0.05, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div
          className="relative h-24 overflow-hidden"
          style={{ background: `radial-gradient(circle at 72% 22%, ${community.color}, transparent 30%), linear-gradient(135deg, ${community.cover || '#092F64'}, #93BFEF 58%, #E9F5FF)` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,47,100,0.20),transparent_72%)]" />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-20 blur-[0.2px]">
            {community.emoji}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="-mt-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border-4 border-[#E9F5FF] bg-[#E9F5FF]/92 text-3xl shadow-[0_18px_40px_rgba(9,47,100,0.16)] backdrop-blur-xl">
                {community.emoji}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="theme-title truncate text-xl font-black text-[#092F64]">{community.name}</h2>
                  <span className="rounded-full bg-[#E9F5FF]/80 px-3 py-1 text-[11px] font-black text-[#092F64]/70">
                    {community.visibility === 'private' ? 'Private' : 'Public'}
                  </span>
                </div>
              <p className="theme-muted mt-1 text-sm font-semibold text-[#1F1F1F]/55">
                {formatCount(community.memberCount)} üye · {formatCount(community.postCount)} gönderi · {formatCount(community.messageCount)} mesaj
              </p>
              </div>
            </div>

            <div className="hidden -space-x-2 sm:flex">
              {['AD', 'CA', 'BD'].map((initial) => (
                <span
                  key={initial}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#E9F5FF] text-[11px] font-black text-[#092F64]"
                >
                  {initial}
                </span>
              ))}
            </div>
          </div>

          <p className="theme-title mt-4 line-clamp-2 text-[15px] font-semibold leading-7 text-[#092F64]">{community.about}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(community.tags || []).slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-[#E9F5FF]/75 px-3 py-1.5 text-xs font-black text-[#1A5799]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between gap-3 border-t border-white/45 px-5 py-4">
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 rounded-full bg-[#E9F5FF]/78 px-3 py-2 text-xs font-black text-[#092F64] transition hover:-translate-y-0.5"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#468BE6] shadow-[0_0_0_5px_rgba(70,139,230,0.14)]" />
          gruba gir
        </button>

        <motion.button
          type="button"
          onClick={onJoinToggle}
          disabled={busy}
          title={locked ? 'Bu topluluğa erişimin engellenmiş.' : undefined}
          className={`rounded-full px-5 py-2.5 text-sm font-black transition disabled:cursor-wait disabled:opacity-60 ${
            joined ? 'bg-[#E9F5FF] text-[#092F64]' : 'bg-[#092F64] text-[#E9F5FF]'
          }`}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          {getJoinLabel(community, membership)}
        </motion.button>
      </div>
    </motion.article>
  )
}

function CreateCommunityModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    about: '',
    emoji: '✨',
    visibility: 'public',
  })
  const [isSaving, setIsSaving] = useState(false)
  const canCreate = form.name.trim().length >= 3 && form.about.trim().length >= 3

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      await onCreate(form)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#092F64]/22 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.form
        onSubmit={submit}
        className="theme-card w-full max-w-2xl rounded-[34px] border border-white/60 bg-[#E9F5FF]/92 p-6 shadow-[0_32px_100px_rgba(9,47,100,0.24)] backdrop-blur-2xl"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#468BE6]">Yeni topluluk</p>
            <h2 className="theme-title mt-2 text-3xl font-black text-[#092F64]">Kendi grubunu kur.</h2>
            <p className="theme-muted mt-2 text-sm font-semibold text-[#1F1F1F]/58">
              Public kurarsan herkes direkt katılır. Private kurarsan başvuruları sen onaylarsın.
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/65 text-xl font-black text-[#092F64]">
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[90px_1fr]">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#468BE6]">Emoji</span>
            <input
              value={form.emoji}
              onChange={(event) => updateField('emoji', event.target.value.slice(0, 2))}
              className="mt-2 h-14 w-full rounded-[20px] border border-white/55 bg-white/55 text-center text-2xl outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#468BE6]">Topluluk adı</span>
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Örn. Final Savaşçıları"
              className="theme-title mt-2 h-14 w-full rounded-[20px] border border-white/55 bg-white/55 px-4 text-base font-bold text-[#092F64] outline-none placeholder:text-[#1F1F1F]/35"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[#468BE6]">Açıklama</span>
          <textarea
            value={form.about}
            onChange={(event) => updateField('about', event.target.value)}
            placeholder="Bu grup ne için var?"
            className="theme-title mt-2 min-h-28 w-full resize-none rounded-[22px] border border-white/55 bg-white/55 px-4 py-3 text-base font-semibold text-[#092F64] outline-none placeholder:text-[#1F1F1F]/35"
          />
          <span className="mt-2 block text-xs font-bold text-[#092F64]/55">
            En az 3 karakter yeterli.
          </span>
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label>
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#468BE6]">Görünürlük</span>
            <select value={form.visibility} onChange={(event) => updateField('visibility', event.target.value)} className="mt-2 h-12 w-full rounded-[18px] border border-white/55 bg-white/60 px-3 font-bold text-[#092F64] outline-none">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <div className="rounded-[18px] border border-white/55 bg-white/50 px-4 py-3 text-sm font-bold leading-6 text-[#092F64]/65">
            {form.visibility === 'private' ? 'Başvurular yönetim paneline düşer.' : 'Katıl butonu herkesi direkt içeri alır.'}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving || !canCreate}
          className="mt-6 w-full rounded-full bg-[#092F64] px-6 py-4 text-base font-black text-[#E9F5FF] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#092F64]/45 disabled:text-[#E9F5FF]/70"
        >
          {isSaving ? 'Kuruluyor...' : canCreate ? 'Topluluğu oluştur' : 'Ad ve açıklamayı doldur'}
        </button>
      </motion.form>
    </motion.div>
  )
}

function Composer({ community, joined, onSubmit, currentProfile }) {
  const [text, setText] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    await onSubmit(text)
    setText('')
  }

  return (
    <form onSubmit={submit} className="theme-card rounded-[30px] border border-white/50 bg-white/38 p-5 shadow-[0_22px_70px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
      <div className="flex gap-3">
        <AvatarBadge avatarId={currentProfile?.avatarId} name={currentProfile?.name || getAuthorName()} className="h-12 w-12" />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={!joined}
          maxLength={280}
          placeholder={joined ? community.prompt : 'Gönderi paylaşmak için önce topluluğa katıl.'}
          className="theme-title min-h-24 w-full resize-none rounded-[24px] border border-white/55 bg-[#E9F5FF]/72 px-4 py-4 text-base font-semibold text-[#092F64] outline-none transition placeholder:text-[#1F1F1F]/38 focus:border-[#468BE6]/45 focus:shadow-[0_0_0_4px_rgba(70,139,230,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {['📍 Spot', '📷 Fotoğraf', '☕ Plan'].map((item) => (
            <span key={item} className="rounded-full bg-[#E9F5FF]/70 px-3 py-1.5 text-xs font-black text-[#1A5799]">
              {item}
            </span>
          ))}
        </div>
        <button
          type="submit"
          disabled={!joined || text.trim().length < 2}
          className="rounded-full bg-[#092F64] px-5 py-2.5 text-sm font-black text-[#E9F5FF] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Paylaş
        </button>
      </div>
    </form>
  )
}

function PostComment({ comment, isManager, onDeleteComment, onUpdateComment, onBan, onRoleChange, members, onViewProfile }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text || '')
  const currentUid = auth.currentUser?.uid
  const isMine = comment.uid === currentUid

  const save = async () => {
    await onUpdateComment(comment.id, draft)
    setIsEditing(false)
  }

  return (
    <div className="flex items-start gap-2 rounded-[20px] bg-[#E9F5FF]/58 p-3">
      <button type="button" onClick={() => onViewProfile?.(getProfileTarget(comment))} className="shrink-0 transition hover:scale-105">
        <AvatarBadge avatarId={comment.authorAvatarId} name={comment.authorName} className="h-8 w-8" textClassName="text-[10px]" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <button type="button" onClick={() => onViewProfile?.(getProfileTarget(comment))} className="theme-title text-left text-xs font-black text-[#092F64] hover:underline">{comment.authorName}</button>
            {comment.editedAt && <p className="text-[10px] font-bold text-[#1F1F1F]/35">düzenlendi</p>}
          </div>
          <ActionMenu
            items={[
              isMine && { label: 'Yorumu düzenle', onClick: () => setIsEditing(true) },
              (isManager || isMine) && { label: 'Yorumu sil', onClick: () => onDeleteComment(comment.id, comment.postId) },
              isManager
                && comment.uid !== currentUid
                && members.some((member) => member.uid === comment.uid && member.role !== 'owner')
                && { label: 'Üyeyi banla', onClick: () => onBan(comment.uid), danger: true },
              isManager
                && comment.uid !== currentUid
                && members.some((member) => member.uid === comment.uid && member.role !== 'admin' && member.role !== 'owner')
                && { label: 'Admin yap', onClick: () => onRoleChange(comment.uid, 'admin') },
            ]}
          />
        </div>

        {isEditing ? (
          <div className="mt-2 flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-w-0 flex-1 rounded-full border border-white/60 bg-white/70 px-3 py-2 text-xs font-bold text-[#092F64] outline-none"
            />
            <button onClick={save} type="button" className="rounded-full bg-[#092F64] px-3 py-2 text-xs font-black text-[#E9F5FF]">
              Kaydet
            </button>
            <button onClick={() => setIsEditing(false)} type="button" className="rounded-full bg-white/65 px-3 py-2 text-xs font-black text-[#092F64]">
              İptal
            </button>
          </div>
        ) : (
          <p className="theme-title mt-1 text-sm font-semibold leading-6 text-[#092F64]">{comment.text}</p>
        )}
      </div>
    </div>
  )
}

function PostCard({
  post,
  joined,
  comments,
  isManager,
  onDeletePost,
  onUpdatePost,
  onPostReaction,
  onCommentSubmit,
  onDeleteComment,
  onUpdateComment,
  onBan,
  onRoleChange,
  members,
  onViewProfile,
}) {
  const currentUid = auth.currentUser?.uid
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(post.text || '')
  const [showComments, setShowComments] = useState(comments.length > 0)
  const isMine = post.uid === currentUid

  const save = async () => {
    await onUpdatePost(post.id, draft)
    setIsEditing(false)
  }

  return (
    <motion.article
      className="theme-card rounded-[28px] border border-white/50 bg-white/38 p-5 shadow-[0_18px_58px_rgba(9,47,100,0.10)] backdrop-blur-2xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onViewProfile?.(getProfileTarget(post))} className="shrink-0 transition hover:scale-105">
            <AvatarBadge avatarId={post.authorAvatarId} name={post.authorName} />
          </button>
          <div>
            <button type="button" onClick={() => onViewProfile?.(getProfileTarget(post))} className="theme-title text-left text-sm font-black text-[#092F64] hover:underline">{post.authorName}</button>
            <p className="theme-muted text-xs font-bold text-[#1F1F1F]/45">
              topluluk gönderisi {post.editedAt ? '· düzenlendi' : ''}
            </p>
          </div>
        </div>
        <ActionMenu
          items={[
            isMine && { label: 'Gönderiyi düzenle', onClick: () => setIsEditing(true) },
            (isManager || isMine) && { label: 'Gönderiyi sil', onClick: () => onDeletePost(post.id) },
            isManager
              && post.uid !== currentUid
              && members.some((member) => member.uid === post.uid && member.role !== 'owner')
              && { label: 'Üyeyi banla', onClick: () => onBan(post.uid), danger: true },
            isManager
              && post.uid !== currentUid
              && members.some((member) => member.uid === post.uid && member.role !== 'admin' && member.role !== 'owner')
              && { label: 'Admin yap', onClick: () => onRoleChange(post.uid, 'admin') },
          ]}
        />
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="theme-title min-h-24 w-full resize-none rounded-[22px] border border-white/55 bg-[#E9F5FF]/72 px-4 py-3 text-base font-semibold text-[#092F64] outline-none"
          />
          <div className="flex gap-2">
            <button onClick={save} type="button" className="rounded-full bg-[#092F64] px-5 py-2.5 text-sm font-black text-[#E9F5FF]">
              Kaydet
            </button>
            <button onClick={() => setIsEditing(false)} type="button" className="rounded-full bg-[#E9F5FF]/80 px-5 py-2.5 text-sm font-black text-[#092F64]">
              İptal
            </button>
          </div>
        </div>
      ) : (
        <p className="theme-title mt-4 text-base font-semibold leading-7 text-[#092F64]">{post.text}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ReactionBar reactions={post.reactions} onToggle={(reactionKey) => onPostReaction(post.id, reactionKey)} />
        <button
          type="button"
          onClick={() => setShowComments((current) => !current)}
          className="rounded-full bg-[#E9F5FF]/75 px-3 py-1.5 text-xs font-black text-[#092F64] transition hover:-translate-y-0.5"
        >
          💬 {comments.length} yorum
        </button>
      </div>

      {showComments && (
        <div className="mt-4 space-y-3 rounded-[24px] border border-white/45 bg-white/25 p-3">
          {comments.map((comment) => (
            <PostComment
              key={comment.id}
              comment={comment}
              isManager={isManager}
              onDeleteComment={onDeleteComment}
              onUpdateComment={onUpdateComment}
              onBan={onBan}
              onRoleChange={onRoleChange}
              members={members}
              onViewProfile={onViewProfile}
            />
          ))}
          {comments.length === 0 && (
            <p className="px-2 py-1 text-sm font-bold text-[#092F64]/50">İlk yorumu sen bırak.</p>
          )}
          <CommentComposer joined={joined} onSubmit={(text) => onCommentSubmit(post.id, text)} />
        </div>
      )}
    </motion.article>
  )
}

function FeedTab({
  community,
  joined,
  posts,
  comments,
  onPostSubmit,
  currentProfile,
  isManager,
  onDeletePost,
  onUpdatePost,
  onPostReaction,
  onCommentSubmit,
  onDeleteComment,
  onUpdateComment,
  onBan,
  onRoleChange,
  members,
  onViewProfile,
}) {
  const commentsByPost = useMemo(() => {
    return comments.reduce((acc, comment) => {
      acc[comment.postId] = [...(acc[comment.postId] || []), comment]
      return acc
    }, {})
  }, [comments])

  return (
    <section className="space-y-4">
      <Composer community={community} joined={joined} onSubmit={onPostSubmit} currentProfile={currentProfile} />

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          joined={joined}
          comments={commentsByPost[post.id] || []}
          isManager={isManager}
          onDeletePost={onDeletePost}
          onUpdatePost={onUpdatePost}
          onPostReaction={onPostReaction}
          onCommentSubmit={onCommentSubmit}
          onDeleteComment={onDeleteComment}
          onUpdateComment={onUpdateComment}
          onBan={onBan}
          onRoleChange={onRoleChange}
          members={members}
          onViewProfile={onViewProfile}
        />
      ))}

      {posts.length === 0 && (
        <div className="rounded-[28px] border border-white/45 bg-white/28 p-6 text-center text-sm font-bold text-[#092F64]/55 backdrop-blur-xl">
          Bu grupta henüz gönderi yok. İlk kampüs çağrısını sen bırak.
        </div>
      )}
    </section>
  )
}

function ChatMessage({ message, isManager, onDeleteMessage, onUpdateMessage, onMessageReaction, onBan, onRoleChange, members, onViewProfile }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(message.text || '')
  const currentUid = auth.currentUser?.uid
  const isMine = message.uid === currentUid

  const save = async () => {
    await onUpdateMessage(message.id, draft)
    setIsEditing(false)
  }

  return (
    <div className={`flex items-start gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <button type="button" onClick={() => onViewProfile?.(getProfileTarget(message))} className="shrink-0 transition hover:scale-105">
          <AvatarBadge avatarId={message.authorAvatarId} name={message.authorName} className="h-9 w-9" textClassName="text-xs" />
        </button>
      )}
      <div className={`group relative max-w-[82%] rounded-[22px] px-4 py-3 ${isMine ? 'bg-[#092F64] text-[#E9F5FF]' : 'bg-[#E9F5FF]/80 text-[#092F64]'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <button type="button" onClick={() => onViewProfile?.(getProfileTarget(message))} className={`text-left text-[11px] font-black hover:underline ${isMine ? 'text-[#93BFEF]' : 'text-[#1A5799]'}`}>{message.authorName}</button>
            {message.editedAt && <p className={`text-[10px] font-bold ${isMine ? 'text-[#E9F5FF]/45' : 'text-[#1F1F1F]/35'}`}>düzenlendi</p>}
          </div>
          <ActionMenu
            align={isMine ? 'right' : 'left'}
            items={[
              isMine && { label: 'Mesajı düzenle', onClick: () => setIsEditing(true) },
              (isManager || isMine) && { label: 'Mesajı sil', onClick: () => onDeleteMessage(message.id) },
              isManager
                && message.uid !== currentUid
                && members.some((member) => member.uid === message.uid && member.role !== 'owner')
                && { label: 'Üyeyi banla', onClick: () => onBan(message.uid), danger: true },
              isManager
                && message.uid !== currentUid
                && members.some((member) => member.uid === message.uid && member.role !== 'admin' && member.role !== 'owner')
                && { label: 'Admin yap', onClick: () => onRoleChange(message.uid, 'admin') },
            ]}
          />
        </div>

        {isEditing ? (
          <div className="mt-2 flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className={`min-w-0 flex-1 rounded-full border border-white/40 px-3 py-2 text-xs font-bold outline-none ${
                isMine ? 'bg-[#E9F5FF]/15 text-[#E9F5FF]' : 'bg-white/70 text-[#092F64]'
              }`}
            />
            <button type="button" onClick={save} className="rounded-full bg-[#E9F5FF] px-3 py-2 text-xs font-black text-[#092F64]">
              Kaydet
            </button>
          </div>
        ) : (
          <p className="mt-1 text-sm font-semibold leading-6">{message.text}</p>
        )}

        <ReactionBar reactions={message.reactions} onToggle={(reactionKey) => onMessageReaction(message.id, reactionKey)} compact />
      </div>
      {isMine && (
        <button type="button" onClick={() => onViewProfile?.(getProfileTarget(message))} className="shrink-0 transition hover:scale-105">
          <AvatarBadge avatarId={message.authorAvatarId} name={message.authorName} className="h-9 w-9" textClassName="text-xs" />
        </button>
      )}
    </div>
  )
}

function ChatTab({ joined, messages, onMessageSubmit, isManager, onDeleteMessage, onUpdateMessage, onMessageReaction, onBan, onRoleChange, members, onViewProfile }) {
  const [messageText, setMessageText] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    await onMessageSubmit(messageText)
    setMessageText('')
  }

  return (
    <section className="theme-card flex min-h-[620px] flex-col rounded-[34px] border border-white/50 bg-white/40 p-5 shadow-[0_24px_80px_rgba(9,47,100,0.12)] backdrop-blur-2xl">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Canlı sohbet</p>
        <h2 className="theme-title mt-1 text-2xl font-black text-[#092F64]">Grup konuşması</h2>
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isManager={isManager}
            onDeleteMessage={onDeleteMessage}
            onUpdateMessage={onUpdateMessage}
            onMessageReaction={onMessageReaction}
            onBan={onBan}
            onRoleChange={onRoleChange}
            members={members}
            onViewProfile={onViewProfile}
          />
        ))}

        {messages.length === 0 && (
          <div className="rounded-[24px] bg-[#E9F5FF]/65 p-4 text-sm font-bold leading-6 text-[#092F64]/60">
            Sohbet yeni açıldı. İlk selamı sen atabilirsin.
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          disabled={!joined}
          maxLength={180}
          placeholder={joined ? 'Mesaj yaz...' : 'Sohbet için önce katıl'}
          className="theme-title min-w-0 flex-1 rounded-full border border-white/55 bg-[#E9F5FF]/75 px-4 py-3 text-sm font-bold text-[#092F64] outline-none placeholder:text-[#1F1F1F]/36 focus:border-[#468BE6]/45 focus:shadow-[0_0_0_4px_rgba(70,139,230,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!joined || messageText.trim().length < 1}
          className="rounded-full bg-[#092F64] px-5 py-3 text-sm font-black text-[#E9F5FF] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Gönder
        </button>
      </form>
    </section>
  )
}

function MembersTab({ members, isManager, onBan, onRoleChange }) {
  const currentUid = auth.currentUser?.uid

  return (
    <section className="theme-card rounded-[34px] border border-white/50 bg-white/38 p-5 shadow-[0_20px_70px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Üyeler</p>
          <h2 className="theme-title mt-1 text-2xl font-black text-[#092F64]">Topluluktaki insanlar</h2>
        </div>
        <span className="rounded-full bg-[#E9F5FF]/80 px-4 py-2 text-sm font-black text-[#092F64]">
          {members.length} kişi
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 rounded-[26px] bg-[#E9F5FF]/65 p-4 transition hover:-translate-y-0.5 hover:bg-[#E9F5FF]/90">
            <div className="flex min-w-0 items-center gap-3">
              <AvatarBadge avatarId={member.avatarId} name={member.displayName} className="h-12 w-12" />
              <div className="min-w-0">
                <p className="theme-title truncate text-sm font-black text-[#092F64]">{member.displayName || 'MAKÜLink üyesi'}</p>
                <p className="theme-muted text-xs font-bold text-[#1F1F1F]/45">{getRoleLabel(member, currentUid)}</p>
              </div>
            </div>
            <ActionMenu
              items={[
                isManager && member.uid !== currentUid && !isManagerRole(member) && { label: 'Admin yap', onClick: () => onRoleChange(member.uid, 'admin') },
                isManager && member.uid !== currentUid && member.role === 'admin' && { label: 'Adminliği al', onClick: () => onRoleChange(member.uid, 'member') },
                isManager && member.uid !== currentUid && member.role !== 'owner' && { label: 'Banla', onClick: () => onBan(member.uid), danger: true },
              ]}
            />
          </div>
        ))}

        {members.length === 0 && (
          <div className="rounded-[28px] border border-white/45 bg-white/28 p-6 text-center text-sm font-bold text-[#092F64]/55 backdrop-blur-xl md:col-span-2 xl:col-span-3">
            Bu topluluğun ilk üyesi sen olabilirsin.
          </div>
        )}
      </div>
    </section>
  )
}

function RoomSidePanel({ community, joined, onJoinToggle, busy }) {
  return (
    <aside className="space-y-4">
      <section className="theme-card rounded-[30px] border border-white/50 bg-white/38 p-5 shadow-[0_20px_70px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Grup özeti</p>
        <p className="theme-muted mt-3 text-sm font-semibold leading-6 text-[#1F1F1F]/62">{community.about}</p>
        <p className="mt-3 inline-flex rounded-full bg-[#E9F5FF]/75 px-3 py-1.5 text-xs font-black text-[#092F64]">
          {community.visibility === 'private' ? 'Private grup · başvuru gerekir' : 'Public grup · direkt katıl'}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ['Üye', community.memberCount],
            ['Post', community.postCount],
            ['Mesaj', community.messageCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[20px] bg-[#E9F5FF]/72 p-3 text-center">
              <p className="text-lg font-black text-[#092F64]">{formatCount(value)}</p>
              <p className="text-[11px] font-bold text-[#1F1F1F]/50">{label}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onJoinToggle}
          disabled={busy}
          className={`mt-4 w-full rounded-full px-5 py-3 text-sm font-black transition disabled:cursor-wait disabled:opacity-60 ${
            joined ? 'bg-[#E9F5FF] text-[#092F64]' : 'bg-[#092F64] text-[#E9F5FF]'
          }`}
        >
          {joined ? 'Topluluktan çık' : getJoinLabel(community, null)}
        </button>
      </section>

      <section className="rounded-[30px] border border-white/20 bg-[#092F64] p-5 text-[#E9F5FF] shadow-[0_24px_80px_rgba(9,47,100,0.18)]">
        <p className="text-sm font-black text-[#93BFEF]">İpucu</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#E9F5FF]/76">
          Akışa çağrı bırak, sohbette hızlı konuş, üyelerden kimlerin içeride olduğunu gör.
        </p>
      </section>
    </aside>
  )
}

function AboutTab({ community, isManager, onUpdateCommunity }) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    name: community.name,
    about: community.about,
    emoji: community.emoji,
    visibility: community.visibility || 'public',
  })
  const [saving, setSaving] = useState(false)
  const stats = [
    ['Üye', formatCount(community.memberCount)],
    ['Gönderi', formatCount(community.postCount)],
    ['Mesaj', formatCount(community.messageCount)],
  ]

  useEffect(() => {
    setForm({
      name: community.name,
      about: community.about,
      emoji: community.emoji,
      visibility: community.visibility || 'public',
    })
  }, [community])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await onUpdateCommunity(form)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="theme-card rounded-[30px] border border-white/50 bg-white/38 p-6 shadow-[0_20px_70px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Hakkında</p>
            <h2 className="theme-title mt-2 text-3xl font-black text-[#092F64]">{community.name}</h2>
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className="rounded-full bg-[#E9F5FF]/80 px-4 py-2 text-sm font-black text-[#092F64] transition hover:-translate-y-0.5"
            >
              {isEditing ? 'Vazgeç' : 'Düzenle'}
            </button>
          )}
        </div>

        {!isEditing ? (
          <>
            <p className="theme-muted mt-4 text-base font-semibold leading-8 text-[#1F1F1F]/64">{community.about}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#E9F5FF]/75 px-3 py-1.5 text-xs font-black text-[#1A5799]">
                {community.visibility === 'private' ? 'Private' : 'Public'}
              </span>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-[90px_1fr]">
              <input
                value={form.emoji}
                onChange={(event) => setForm((current) => ({ ...current, emoji: event.target.value.slice(0, 2) }))}
                className="h-14 rounded-[20px] border border-white/55 bg-white/60 text-center text-2xl outline-none"
              />
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="theme-title h-14 rounded-[20px] border border-white/55 bg-white/60 px-4 text-base font-black text-[#092F64] outline-none"
              />
            </div>
            <textarea
              value={form.about}
              onChange={(event) => setForm((current) => ({ ...current, about: event.target.value }))}
              className="theme-title min-h-32 w-full resize-none rounded-[24px] border border-white/55 bg-white/60 px-4 py-3 text-base font-semibold text-[#092F64] outline-none"
            />
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <select
                value={form.visibility}
                onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
                className="h-12 rounded-[18px] border border-white/55 bg-white/60 px-4 font-black text-[#092F64] outline-none"
              >
                <option value="public">Public · herkes katılır</option>
                <option value="private">Private · başvuru gerekir</option>
              </select>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#092F64] px-6 py-3 text-sm font-black text-[#E9F5FF] transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="theme-card grid gap-3 rounded-[30px] border border-white/50 bg-white/38 p-5 shadow-[0_20px_70px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-[22px] bg-[#E9F5FF]/70 p-4">
            <p className="text-3xl font-black text-[#092F64]">{value}</p>
            <p className="text-xs font-bold text-[#1F1F1F]/50">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ManagementTab({ requests, members, currentUid, onApprove, onReject, onBan, onRoleChange }) {
  const activeMembers = members.filter((member) => member.status === 'active')

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <div className="theme-card rounded-[34px] border border-white/50 bg-white/38 p-5 shadow-[0_20px_70px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Başvurular</p>
        <h2 className="theme-title mt-1 text-2xl font-black text-[#092F64]">Katılmak isteyenler</h2>

        <div className="mt-5 space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-[24px] bg-[#E9F5FF]/70 p-4">
                <div className="flex items-center gap-3">
                <AvatarBadge avatarId={request.avatarId} name={request.displayName} />
                <div>
                  <p className="theme-title text-sm font-black text-[#092F64]">{request.displayName || 'MAKÜLink üyesi'}</p>
                  <p className="theme-muted text-xs font-bold text-[#1F1F1F]/45">onay bekliyor</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => onApprove(request.uid)} className="rounded-full bg-[#092F64] px-4 py-2 text-xs font-black text-[#E9F5FF]">
                  Onayla
                </button>
                <button onClick={() => onReject(request.uid)} className="rounded-full bg-white/65 px-4 py-2 text-xs font-black text-[#092F64]">
                  Reddet
                </button>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="rounded-[24px] bg-[#E9F5FF]/60 p-4 text-sm font-bold text-[#092F64]/55">
              Bekleyen başvuru yok.
            </div>
          )}
        </div>
      </div>

      <div className="theme-card rounded-[34px] border border-white/50 bg-white/38 p-5 shadow-[0_20px_70px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Yönetim</p>
        <h2 className="theme-title mt-1 text-2xl font-black text-[#092F64]">Üye rolleri</h2>

        <div className="mt-5 space-y-3">
          {activeMembers.map((member) => {
            const isSelf = member.uid === currentUid
            const isOwner = member.role === 'owner'
            return (
              <div key={member.id} className="rounded-[24px] bg-[#E9F5FF]/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <AvatarBadge avatarId={member.avatarId} name={member.displayName} />
                    <div className="min-w-0">
                      <p className="theme-title truncate text-sm font-black text-[#092F64]">{member.displayName || 'MAKÜLink üyesi'}</p>
                      <p className="theme-muted text-xs font-bold text-[#1F1F1F]/45">{getRoleLabel(member, currentUid)}</p>
                    </div>
                  </div>
                </div>

                {!isOwner && !isSelf && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => onRoleChange(member.uid, member.role === 'admin' ? 'member' : 'admin')}
                      className="rounded-full bg-white/65 px-4 py-2 text-xs font-black text-[#092F64]"
                    >
                      {member.role === 'admin' ? 'Adminliği al' : 'Admin yap'}
                    </button>
                    <button onClick={() => onBan(member.uid)} className="rounded-full bg-[#092F64] px-4 py-2 text-xs font-black text-[#E9F5FF]">
                      Banla
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CommunityRoom({
  community,
  membership,
  currentProfile,
  busy,
  posts,
  comments,
  messages,
  members,
  requests,
  onBack,
  onJoinToggle,
  onPostSubmit,
  onMessageSubmit,
  onUpdateCommunity,
  onDeletePost,
  onUpdatePost,
  onPostReaction,
  onCommentSubmit,
  onDeleteComment,
  onUpdateComment,
  onDeleteMessage,
  onUpdateMessage,
  onMessageReaction,
  onApprove,
  onReject,
  onBan,
  onRoleChange,
  onViewProfile,
}) {
  const [activeTab, setActiveTab] = useState('Akış')
  const joined = membership?.status === 'active'
  const isManager = membership?.role === 'owner' || membership?.role === 'admin' || community.ownerUid === auth.currentUser?.uid
  const roomTabs = isManager ? [...baseRoomTabs, 'Yönetim'] : baseRoomTabs

  return (
    <motion.div
      key={community.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <header className="theme-card overflow-hidden rounded-[36px] border border-white/55 bg-white/38 shadow-[0_28px_90px_rgba(9,47,100,0.14)] backdrop-blur-2xl">
        <div
          className="relative h-36 p-5 sm:p-6"
          style={{ background: `radial-gradient(circle at 76% 18%, ${community.color}, transparent 28%), linear-gradient(135deg, ${community.cover || '#092F64'}, #93BFEF 58%, #E9F5FF)` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,47,100,0.18),transparent_70%)]" />
          <button
            type="button"
            onClick={onBack}
            className="relative rounded-full bg-[#E9F5FF]/78 px-4 py-2 text-sm font-black text-[#092F64] shadow-[0_12px_32px_rgba(9,47,100,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5"
          >
            ← Topluluklara dön
          </button>
        </div>

        <div className="-mt-8 flex flex-col gap-5 px-5 pb-5 sm:px-7 sm:pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-end gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] border-4 border-[#E9F5FF] bg-[#E9F5FF]/92 text-4xl shadow-[0_18px_45px_rgba(9,47,100,0.16)] backdrop-blur-xl sm:h-24 sm:w-24 sm:text-5xl">
              {community.emoji}
            </div>
            <div className="pb-2">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#468BE6]">Topluluk</p>
              <h1 className="theme-title mt-1 text-3xl font-black leading-tight text-[#092F64] sm:text-5xl">{community.name}</h1>
              <p className="theme-muted mt-2 text-sm font-bold text-[#1F1F1F]/55">
                {formatCount(community.memberCount)} üye · {formatCount(community.postCount)} gönderi · {formatCount(community.messageCount)} mesaj
              </p>
            </div>
          </div>

          <span className="rounded-full bg-[#E9F5FF]/72 px-4 py-2 text-sm font-black text-[#092F64]">
            {community.visibility === 'private' ? 'Private' : 'Public'}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto border-t border-white/45 px-6 py-4 sm:px-8">
          {roomTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-black transition ${
                activeTab === tab ? 'bg-[#092F64] text-[#E9F5FF]' : 'bg-[#E9F5FF]/64 text-[#092F64]/70 hover:bg-white/70'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'Akış' && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <FeedTab
                community={community}
                joined={joined}
                posts={posts}
                comments={comments}
                onPostSubmit={onPostSubmit}
                currentProfile={currentProfile}
                isManager={isManager}
                onDeletePost={onDeletePost}
                onUpdatePost={onUpdatePost}
                onPostReaction={onPostReaction}
                onCommentSubmit={onCommentSubmit}
                onDeleteComment={onDeleteComment}
                onUpdateComment={onUpdateComment}
                onBan={onBan}
                onRoleChange={onRoleChange}
                members={members}
                onViewProfile={onViewProfile}
              />
              <RoomSidePanel community={community} joined={joined} busy={busy} onJoinToggle={onJoinToggle} />
            </div>
          )}
          {activeTab === 'Sohbet' && (
            <ChatTab
              joined={joined}
              messages={messages}
              onMessageSubmit={onMessageSubmit}
              isManager={isManager}
              onDeleteMessage={onDeleteMessage}
              onUpdateMessage={onUpdateMessage}
              onMessageReaction={onMessageReaction}
              onBan={onBan}
              onRoleChange={onRoleChange}
              members={members}
              onViewProfile={onViewProfile}
            />
          )}
          {activeTab === 'Üyeler' && (
            <MembersTab
              members={members.filter((member) => member.status === 'active')}
              isManager={isManager}
              onBan={onBan}
              onRoleChange={onRoleChange}
            />
          )}
          {activeTab === 'Hakkında' && <AboutTab community={community} isManager={isManager} onUpdateCommunity={onUpdateCommunity} />}
          {activeTab === 'Yönetim' && (
            <ManagementTab
              requests={requests}
              members={members}
              currentUid={auth.currentUser?.uid}
              onApprove={onApprove}
              onReject={onReject}
              onBan={onBan}
              onRoleChange={onRoleChange}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default function CommunitiesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialCommunityId = location.state?.initialCommunityId ?? null
  const [communities, setCommunities] = useState([])
  const [selectedFilter, setSelectedFilter] = useState('Hepsi')
  const [selectedCommunityId, setSelectedCommunityId] = useState(null)
  const [memberships, setMemberships] = useState(new Map())
  const [currentProfile, setCurrentProfile] = useState({ name: '', avatarId: 'women' })
  const [busyCommunityId, setBusyCommunityId] = useState('')
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([])
  const [requests, setRequests] = useState([])
  const [notice, setNotice] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const selectedCommunity = communities.find((community) => community.id === selectedCommunityId) || null
  const selectedMembership = selectedCommunity ? memberships.get(selectedCommunity.id) : null

  const handleViewProfile = (profileTarget) => {
    if (profileTarget?.uid) {
      navigate(`/user/${profileTarget.uid}`)
    }
  }

  const visibleCommunities = useMemo(() => {
    if (selectedFilter === 'Katıldıklarım') {
      return communities.filter((community) => memberships.get(community.id)?.status === 'active')
    }
    if (selectedFilter === 'Public') return communities.filter((community) => community.visibility !== 'private')
    if (selectedFilter === 'Private') return communities.filter((community) => community.visibility === 'private')
    return communities
  }, [communities, memberships, selectedFilter])

  const totals = useMemo(
    () => ({
      members: communities.reduce((sum, community) => sum + (community.memberCount || 0), 0),
      posts: communities.reduce((sum, community) => sum + (community.postCount || 0), 0),
      messages: communities.reduce((sum, community) => sum + (community.messageCount || 0), 0),
    }),
    [communities],
  )

  useEffect(() => {
    ensureDefaultCommunities().catch((error) => {
      console.warn('Default communities could not be synced:', error)
    })

    return subscribeCommunities(setCommunities)
  }, [])

  useEffect(() => {
    if (initialCommunityId) {
      setSelectedCommunityId(initialCommunityId)
    }
  }, [initialCommunityId])

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return undefined

    return subscribeJoinedCommunities(user.uid, setMemberships)
  }, [])

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return undefined

    return onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      const profile = snapshot.exists() ? snapshot.data() : {}
      setCurrentProfile({
        name: profile.name || getAuthorName(),
        avatarId: profile.avatarId || 'women',
      })
    })
  }, [])

  useEffect(() => {
    if (!selectedCommunity) {
      setPosts([])
      setComments([])
      setMessages([])
      setMembers([])
      setRequests([])
      return undefined
    }

    const unsubscribePosts = subscribeCommunityPosts(selectedCommunity.id, setPosts)
    const unsubscribeComments = subscribeCommunityPostComments(selectedCommunity.id, setComments)
    const unsubscribeMessages = subscribeCommunityMessages(selectedCommunity.id, setMessages)
    const unsubscribeMembers = subscribeCommunityMembers(selectedCommunity.id, setMembers)
    const unsubscribeRequests = subscribeCommunityRequests(selectedCommunity.id, setRequests)

    return () => {
      unsubscribePosts()
      unsubscribeComments()
      unsubscribeMessages()
      unsubscribeMembers()
      unsubscribeRequests()
    }
  }, [selectedCommunity])

  useEffect(() => {
    if (!notice) return undefined

    const timer = window.setTimeout(() => {
      setNotice('')
    }, 3200)

    return () => window.clearTimeout(timer)
  }, [notice])

  const toggleJoined = async (community) => {
    setBusyCommunityId(community.id)
    setNotice('')

    try {
      const membership = memberships.get(community.id)

      const pendingCanBecomeActive = membership?.status === 'pending' && community.visibility !== 'private' && community.joinPolicy !== 'approval'

      if ((membership?.status === 'active' || membership?.status === 'pending') && !pendingCanBecomeActive) {
        await leaveCommunity(community.id, membership)
        setNotice(membership.status === 'pending' ? `${community.name} başvurun iptal edildi.` : `${community.name} topluluğundan çıktın.`)
      } else {
        await joinCommunity(community, membership)
        const needsApproval = community.visibility === 'private' || community.joinPolicy === 'approval'
        setNotice(needsApproval ? `${community.name} başvurun gönderildi.` : `${community.name} topluluğuna katıldın.`)
      }
    } catch (error) {
      console.warn('Community membership failed:', error)
      setNotice('Topluluk işlemi şu an tamamlanamadı.')
    } finally {
      setBusyCommunityId('')
    }
  }

  const handleCreateCommunity = async (form) => {
    try {
      const communityId = await createCommunity(form)
      setNotice(`${form.name} topluluğu kuruldu.`)
      setIsCreateOpen(false)
      setSelectedCommunityId(communityId)
    } catch (error) {
      console.warn('Community could not be created:', error)
      setNotice('Topluluk oluşturulamadı. Ad ve açıklamayı kontrol et.')
    }
  }

  const handleApprove = async (uid) => {
    if (!selectedCommunity) return
    try {
      await approveCommunityRequest(selectedCommunity.id, uid)
      setNotice('Başvuru onaylandı.')
    } catch (error) {
      console.warn('Community request could not be approved:', error)
      setNotice('Başvuru onaylanamadı.')
    }
  }

  const handleReject = async (uid) => {
    if (!selectedCommunity) return
    try {
      await rejectCommunityRequest(selectedCommunity.id, uid)
      setNotice('Başvuru reddedildi.')
    } catch (error) {
      console.warn('Community request could not be rejected:', error)
      setNotice('Başvuru reddedilemedi.')
    }
  }

  const handleBan = async (uid) => {
    if (!selectedCommunity) return
    try {
      await banCommunityMember(selectedCommunity.id, uid)
      setNotice('Üye topluluktan banlandı.')
    } catch (error) {
      console.warn('Community member could not be banned:', error)
      setNotice('Ban işlemi tamamlanamadı.')
    }
  }

  const handleRoleChange = async (uid, role) => {
    if (!selectedCommunity) return
    try {
      await updateCommunityRole(selectedCommunity.id, uid, role)
      setNotice(role === 'admin' ? 'Üye admin yapıldı.' : 'Adminlik geri alındı.')
    } catch (error) {
      console.warn('Community role could not be updated:', error)
      setNotice('Rol güncellenemedi.')
    }
  }

  const handleUpdateCommunity = async (form) => {
    if (!selectedCommunity) return
    try {
      await updateCommunityDetails(selectedCommunity.id, form)
      setNotice('Topluluk bilgileri güncellendi.')
    } catch (error) {
      console.warn('Community details could not be updated:', error)
      setNotice('Topluluk bilgileri kaydedilemedi.')
    }
  }

  const handleDeletePost = async (postId) => {
    if (!selectedCommunity) return
    try {
      await deleteCommunityPost(postId, selectedCommunity.id)
      setNotice('Gönderi silindi.')
    } catch (error) {
      console.warn('Community post could not be deleted:', error)
      setNotice('Gönderi silinemedi.')
    }
  }

  const handleUpdatePost = async (postId, text) => {
    try {
      await updateCommunityPost(postId, text)
      setNotice('Gönderi güncellendi.')
    } catch (error) {
      console.warn('Community post could not be updated:', error)
      setNotice('Gönderi güncellenemedi.')
    }
  }

  const handlePostReaction = async (postId, reactionKey) => {
    try {
      await toggleCommunityPostReaction(postId, reactionKey)
    } catch (error) {
      console.warn('Community post reaction failed:', error)
      setNotice('Tepki verilemedi.')
    }
  }

  const handleCommentSubmit = async (postId, text) => {
    if (!selectedCommunity) return
    try {
      await createCommunityPostComment({ communityId: selectedCommunity.id, postId, text });
    } catch (error) {
      console.warn('Community comment failed:', error)
      setNotice('Yorum gönderilemedi.')
    }
  }

  const handleUpdateComment = async (commentId, text) => {
    try {
      await updateCommunityPostComment(commentId, text)
      setNotice('Yorum güncellendi.')
    } catch (error) {
      console.warn('Community comment could not be updated:', error)
      setNotice('Yorum güncellenemedi.')
    }
  }

  const handleDeleteComment = async (commentId, postId) => {
    try {
      await deleteCommunityPostComment(commentId, postId)
      setNotice('Yorum silindi.')
    } catch (error) {
      console.warn('Community comment could not be deleted:', error)
      setNotice('Yorum silinemedi.')
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!selectedCommunity) return
    try {
      await deleteCommunityMessage(messageId, selectedCommunity.id)
      setNotice('Mesaj silindi.')
    } catch (error) {
      console.warn('Community message could not be deleted:', error)
      setNotice('Mesaj silinemedi.')
    }
  }

  const handleUpdateMessage = async (messageId, text) => {
    try {
      await updateCommunityMessage(messageId, text)
      setNotice('Mesaj güncellendi.')
    } catch (error) {
      console.warn('Community message could not be updated:', error)
      setNotice('Mesaj güncellenemedi.')
    }
  }

  const handleMessageReaction = async (messageId, reactionKey) => {
    try {
      await toggleCommunityMessageReaction(messageId, reactionKey)
    } catch (error) {
      console.warn('Community message reaction failed:', error)
      setNotice('Tepki verilemedi.')
    }
  }

  const handlePostSubmit = async (text) => {
    if (!selectedCommunity) return
    try {
      await createCommunityPost({
        communityId: selectedCommunity.id,
        text,
        authorName: getAuthorName(),
      })
    } catch (error) {
      console.warn('Community post failed:', error)
      setNotice('Gönderi paylaşılamadı. Topluluğa katıldığından emin ol.')
    }
  }

  const handleMessageSubmit = async (text) => {
    if (!selectedCommunity) return
    try {
      await sendCommunityMessage({
        communityId: selectedCommunity.id,
        text,
        authorName: getAuthorName(),
      })
    } catch (error) {
      console.warn('Community message failed:', error)
      setNotice('Mesaj gönderilemedi. Topluluğa katıldığından emin ol.')
    }
  }

  return (
    <section className="app-page relative min-h-screen overflow-x-hidden bg-[#E9F5FF] text-[#1F1F1F]">
      <BackgroundEffects />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-[1560px] px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-14">
        <AnimatePresence>
          {isCreateOpen && (
            <CreateCommunityModal
              onClose={() => setIsCreateOpen(false)}
              onCreate={handleCreateCommunity}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notice && (
            <motion.div
              className="fixed bottom-24 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-[24px] border border-white/55 bg-[#E9F5FF]/92 px-5 py-4 text-sm font-black text-[#092F64] shadow-[0_22px_70px_rgba(9,47,100,0.18)] backdrop-blur-2xl sm:bottom-6 sm:right-6"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#092F64] text-[#E9F5FF]">
                !
              </span>
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice('')}
                className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/65 text-lg leading-none text-[#092F64] transition hover:bg-white"
                aria-label="Bildirimi kapat"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {selectedCommunity ? (
            <CommunityRoom
              community={selectedCommunity}
              membership={selectedMembership}
              currentProfile={currentProfile}
              busy={busyCommunityId === selectedCommunity.id}
              posts={posts}
              comments={comments}
              messages={messages}
              members={members}
              requests={requests}
              onBack={() => setSelectedCommunityId(null)}
              onJoinToggle={() => toggleJoined(selectedCommunity)}
              onPostSubmit={handlePostSubmit}
              onMessageSubmit={handleMessageSubmit}
              onUpdateCommunity={handleUpdateCommunity}
              onDeletePost={handleDeletePost}
              onUpdatePost={handleUpdatePost}
              onPostReaction={handlePostReaction}
              onCommentSubmit={handleCommentSubmit}
              onDeleteComment={handleDeleteComment}
              onUpdateComment={handleUpdateComment}
              onDeleteMessage={handleDeleteMessage}
              onUpdateMessage={handleUpdateMessage}
              onMessageReaction={handleMessageReaction}
              onApprove={handleApprove}
              onReject={handleReject}
              onBan={handleBan}
              onRoleChange={handleRoleChange}
              onViewProfile={handleViewProfile}
            />
          ) : (
            <motion.div
              key="community-list"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className="theme-card rounded-[38px] border border-white/55 bg-white/38 p-6 shadow-[0_28px_90px_rgba(9,47,100,0.14)] backdrop-blur-2xl sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#468BE6]">Topluluklar</p>
                    <h1 className="theme-title mt-3 max-w-4xl text-4xl font-black leading-[0.95] text-[#092F64] sm:text-6xl">
                      Kampüs grupları.
                    </h1>
                    <p className="theme-muted mt-4 max-w-2xl text-base font-semibold leading-7 text-[#1F1F1F]/62">
                      Facebook grup hissi, MAKÜLink enerjisi: katıl, gönderi paylaş, sohbet et, üyeleri gör.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(true)}
                      className="rounded-full bg-[#092F64] px-6 py-3 text-sm font-black text-[#E9F5FF] shadow-[0_16px_40px_rgba(9,47,100,0.18)] transition hover:-translate-y-0.5"
                    >
                      Topluluk oluştur
                    </button>
                  <div className="grid grid-cols-3 gap-3 rounded-[28px] border border-white/45 bg-[#E9F5FF]/60 p-3 text-center shadow-[0_18px_50px_rgba(9,47,100,0.08)]">
                    <div className="rounded-[22px] bg-white/45 px-4 py-3">
                      <p className="text-2xl font-black text-[#092F64]">{communities.length}</p>
                      <p className="text-xs font-bold text-[#1F1F1F]/55">grup</p>
                    </div>
                    <div className="rounded-[22px] bg-white/45 px-4 py-3">
                      <p className="text-2xl font-black text-[#092F64]">{formatCount(totals.members)}</p>
                      <p className="text-xs font-bold text-[#1F1F1F]/55">üye</p>
                    </div>
                    <div className="rounded-[22px] bg-white/45 px-4 py-3">
                      <p className="text-2xl font-black text-[#092F64]">{Array.from(memberships.values()).filter((item) => item.status === 'active').length}</p>
                      <p className="text-xs font-bold text-[#1F1F1F]/55">katıldığın</p>
                    </div>
                  </div>
                  </div>
                </div>
              </header>

              <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
                {communityFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedFilter(filter)}
                    className={`shrink-0 rounded-full px-5 py-3 text-sm font-black transition ${
                      selectedFilter === filter
                        ? 'bg-[#092F64] text-[#E9F5FF] shadow-[0_16px_38px_rgba(9,47,100,0.18)]'
                        : 'bg-white/45 text-[#092F64]/70 hover:-translate-y-0.5 hover:bg-white/65'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <section className="grid gap-5 md:grid-cols-2">
                  {visibleCommunities.map((community, index) => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      index={index}
                      membership={memberships.get(community.id)}
                      busy={busyCommunityId === community.id}
                      onOpen={() => setSelectedCommunityId(community.id)}
                      onJoinToggle={() => toggleJoined(community)}
                    />
                  ))}
                </section>

                <aside className="hidden lg:block space-y-5 lg:sticky lg:top-28 lg:self-start">
                  <section className="theme-card rounded-[30px] border border-white/50 bg-white/38 p-5 shadow-[0_22px_70px_rgba(9,47,100,0.10)] backdrop-blur-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Gerçek zamanlı</p>
                    <h2 className="theme-title mt-2 text-2xl font-black text-[#092F64]">Grup hareketi</h2>

                    <div className="mt-4 space-y-3">
                      <div className="rounded-[20px] bg-[#E9F5FF]/70 px-4 py-3 text-sm font-bold text-[#092F64]">
                        👥 {formatCount(totals.members)} toplam üyelik
                      </div>
                      <div className="rounded-[20px] bg-[#E9F5FF]/70 px-4 py-3 text-sm font-bold text-[#092F64]">
                        📝 {formatCount(totals.posts)} grup gönderisi
                      </div>
                      <div className="rounded-[20px] bg-[#E9F5FF]/70 px-4 py-3 text-sm font-bold text-[#092F64]">
                        💬 {formatCount(totals.messages)} sohbet mesajı
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[30px] border border-white/20 bg-[#092F64] p-5 text-[#E9F5FF] shadow-[0_24px_80px_rgba(9,47,100,0.20)]">
                    <p className="text-sm font-black text-[#93BFEF]">Önerilen grup</p>
                    <h2 className="mt-2 text-2xl font-black">{communities[0]?.name || 'Topluluklar'}</h2>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[#E9F5FF]/72">
                      Bir gruba gir, kapak alanından akışa geç, sohbeti aç ve kampüsteki insanlarla aynı odada konuş.
                    </p>
                    <button
                      type="button"
                      onClick={() => communities[0] && setSelectedCommunityId(communities[0].id)}
                      className="mt-5 rounded-full bg-[#E9F5FF] px-5 py-2.5 text-sm font-black text-[#092F64] transition hover:-translate-y-0.5"
                    >
                      Gruba gir
                    </button>
                  </section>
                </aside>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </section>
  )
}
