import { memo } from 'react';
import { motion } from 'framer-motion';
import { auth } from '../../FireBase/firebaseConfig';

const reactions = [
  { key: 'heart', emoji: '💙', label: 'Kalp' },
  { key: 'coffee', emoji: '☕', label: 'Kahve' },
  { key: 'wave', emoji: '👋', label: 'Gelirim' },
  { key: 'fire', emoji: '🔥', label: 'Alev' },
];

const ReactionButtons = memo(({ value = {}, onToggle }) => {
  const uid = auth.currentUser?.uid;

  return (
    <div className="flex flex-wrap gap-2">
      {reactions.map((reaction) => {
        const users = Array.isArray(value[reaction.key]) ? value[reaction.key] : [];
        const active = users.includes(uid);
        return (
          <motion.button
            key={reaction.key}
            type="button"
            onClick={() => onToggle(reaction.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
              active ? 'bg-[#092F64] text-[#E9F5FF]' : 'bg-[#E9F5FF]/75 text-[#1A5799] hover:bg-white/80'
            }`}
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.94 }}
          >
            {reaction.emoji} {users.length > 0 ? users.length : ''}
          </motion.button>
        );
      })}
    </div>
  );
});

export default ReactionButtons;