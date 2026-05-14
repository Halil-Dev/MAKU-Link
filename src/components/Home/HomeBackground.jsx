import { motion } from 'framer-motion';

const particles = [
  ['8%', '18%', '#93BFEF', 0],
  ['18%', '72%', '#468BE6', 0.4],
  ['38%', '16%', '#E9F5FF', 0.9],
  ['58%', '82%', '#93BFEF', 0.2],
  ['78%', '28%', '#468BE6', 0.7],
  ['90%', '68%', '#E9F5FF', 1.1],
];

const HomeBackground = () => (
  <>
    <div className="ambient-blob pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(70,139,230,0.42),transparent_27%),radial-gradient(circle_at_86%_14%,rgba(147,191,239,0.54),transparent_28%)]" />
    {particles.map(([left, top, color, delay]) => (
      <motion.span
        key={`${left}-${top}`}
        className="pointer-events-none fixed h-2 w-2 rounded-full"
        style={{ left, top, backgroundColor: color, willChange: 'transform' }} 
        animate={{ y: [0, -18, 0], opacity: [0.18, 0.48, 0.18] }}
        transition={{ delay, duration: 5.5, repeat: Infinity }}
      />
    ))}
  </>
);

export default HomeBackground;