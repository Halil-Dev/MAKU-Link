import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactionButtons from './ReactionButtons'
import { auth } from '../../FireBase/firebaseConfig'
import { getAvatarById } from '../../data/avatarOptions'

const timeAgo = (timestamp) => {
  const millis = timestamp?.toMillis?.()
  if (!millis) return 'şimdi'
  const minutes = Math.max(0, Math.floor((Date.now() - millis) / 60000))
  if (minutes < 1) return 'şimdi'
  if (minutes < 60) return `${minutes} dk`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} sa`
  return `${Math.floor(hours / 24)} gün`
}

const CommentItem = ({ comment, isMine, onUpdate, onDelete, onViewProfile }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)

  return (
    <div className="flex items-start gap-2 rounded-[20px] bg-[#E9F5FF]/58 p-3">
      <img 
        src={getAvatarById(comment.authorAvatarId).src} 
        className="h-8 w-8 rounded-full border border-white" 
        alt="avatar" 
      />
      <div className="flex-1">
        <p className="text-xs font-black text-[#092F64]">{comment.authorName}</p>
        {editing ? (
          <div className="mt-2 flex gap-2">
            <input 
              value={draft} 
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-full bg-white px-3 py-1 text-xs outline-none"
            />
            <button onClick={() => { onUpdate(comment.id, draft); setEditing(false) }} className="text-[#468BE6] font-black text-xs">Kaydet</button>
          </div>
        ) : (
          <p className="mt-1 text-sm font-semibold text-[#092F64]">{comment.text}</p>
        )}
      </div>
    </div>
  )
}

const SpotCard = memo(({ 
  spot, 
  comments, 
  onUpdate, 
  onDelete, 
  onReaction, 
  onComment, 
  onUpdateComment, 
  onDeleteComment, 
  onViewProfile 
}) => {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const isMine = spot.uid === auth.currentUser?.uid

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[30px] border border-white/45 bg-white/42 p-5 shadow-[0_20px_65px_rgba(9,47,100,0.11)] backdrop-blur-2xl"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={getAvatarById(spot.authorAvatarId).src} 
            className="h-11 w-11 rounded-full border-2 border-white shadow-sm" 
            alt="avatar" 
          />
          <div>
            <h4 className="text-sm font-black text-[#092F64]">{spot.authorName}</h4>
            <p className="text-[10px] font-bold text-[#1F1F1F]/48">
              {spot.location} · {timeAgo(spot.createdAt)}
            </p>
          </div>
        </div>
        {isMine && (
          <button onClick={() => onDelete(spot.id)} className="text-xs font-black text-red-400 opacity-50 hover:opacity-100">Sil</button>
        )}
      </div>

      <p className="mt-4 text-[17px] font-semibold leading-8 text-[#092F64]">
        {spot.text}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4">
        <ReactionButtons value={spot.reactions} onToggle={(key) => onReaction(spot.id, key)} />
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="text-xs font-black text-[#092F64]/60 hover:text-[#468BE6]"
        >
          💬 {comments.length} yorum
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 space-y-3 overflow-hidden"
          >
            {comments.map(c => (
              <CommentItem 
                key={c.id} 
                comment={c} 
                isMine={c.uid === auth.currentUser?.uid}
                onUpdate={onUpdateComment}
                onDelete={onDeleteComment}
              />
            ))}
<form 

onSubmit={(e) => {
  e.preventDefault();
  const cleanText = commentText ? commentText.trim() : "";
  

if (cleanText.length > 0) {
  onComment(spot.id, cleanText); 
  setCommentText('');
}
}}
  className="mt-2 flex gap-2"
>
  <input 
    type="text"
    value={commentText}
    onChange={(e) => setCommentText(e.target.value)}
    placeholder="Yorum yap..."
    className="flex-1 rounded-full bg-[#E9F5FF]/70 px-4 py-2 text-sm outline-none border border-white/50 text-[#092F64]"
  />
  <button 
    type="submit" 
    disabled={!commentText.trim()}
    className="rounded-full bg-[#092F64] px-4 py-2 text-xs font-black text-white disabled:opacity-40"
  >
    Gönder
  </button>
</form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
})

export default SpotCard