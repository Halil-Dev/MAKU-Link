import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import { auth } from '../FireBase/firebaseConfig.js'
import { defaultGameConfigs, difficultyOptions, loadGameConfigs, recordGameResult } from '../services/gameService.js'

const wordHints = {
  MAKUL: 'Uygulamanın ve kampüsün ana kimliği.',
  BUCAK: 'Fakülte ve kampüs hayatında sık duyduğun ilçe.',
  METEB: 'MAKÜ tarafında duyabileceğin kampüs/tesis adı.',
  SPOTL: 'Bu uygulamanın en sosyal özelliği.',
  KAMPÜ: 'Ders, kahve, ring ve arkadaşlık burada dönüyor.',
  TEKNO: 'Yazılım, donanım ve inovasyon vibeı.',
  SIBER: 'Güvenlik ve dijital savunma dünyası.',
  OYUNC: 'Oyun odalarında takılan kişi.',
  QUIZZ: 'Puan kasmak için çözdüğün mini test.',
  KAHVE: 'Kafede en iyi sosyalleşme bahanesi.',
  DERSL: 'Vize/final öncesi herkesin ortak derdi.',
  FINAL: 'Dönem sonu boss fight.',
  VİZES: 'Finalden önceki küçük panik.',
  SOSYL: 'MAKÜLink’in ana ruhu.',
  LINKS: 'Bağlantı kurma fikri.',
  YURTL: 'Kampüs hayatının gece tarafı.',
  RINGA: 'Kampüste beklenen araç.',
  NOTES: 'Ders çalışırken hayat kurtarır.',
  KULUP: 'Toplulukların diğer adı gibi düşün.',
  AKTIF: 'Şu an uygulamada olan öğrenci durumu.',
}

function LinkMascotIcon({ difficulty }) {
  return (
    <motion.svg
      className="h-12 w-20 shrink-0 overflow-visible"
      viewBox="0 0 112 64"
      fill="none"
      animate={{ y: [0, -4, 0], rotate: difficulty === 'easy' ? [0, -3, 3, 0] : 0 }}
      transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <motion.path
        d="M12 40C27 21 48 18 58 31"
        stroke="#93BFEF"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="drop-shadow(0 8px 18px rgba(70,139,230,0.22))"
      />
      <motion.path
        d="M100 24C84 43 62 46 52 33"
        stroke="#468BE6"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="drop-shadow(0 8px 18px rgba(70,139,230,0.22))"
      />
      <path d="M57 24L68 33L55 39" fill="none" stroke="#468BE6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M55 40L44 31L57 25" fill="none" stroke="#93BFEF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
}

function MascotAssist({ difficulty, gameId, hint }) {
  const text = difficulty === 'easy'
    ? hint || 'Link yardım ediyor: acele etme, ilk hamle en temiz hamle.'
    : difficulty === 'normal'
      ? 'Link izliyor: seri ama sakin oyna.'
      : 'Link geri çekildi: zor modda sahne sende.'

  return (
    <motion.div
      className="mx-auto mb-5 flex max-w-md items-center gap-3 rounded-[24px] border border-white/55 bg-white/34 px-4 py-3 shadow-[0_14px_42px_rgba(9,47,100,0.10)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      key={`${gameId}-${difficulty}-${hint}`}
    >
      <LinkMascotIcon difficulty={difficulty} />
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#468BE6]">Link yardım</p>
        <p className="text-sm font-black leading-5 text-[#092F64]">{text}</p>
      </div>
    </motion.div>
  )
}

function DifficultyPicker({ title, subtitle, onSelect, onCancel }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#092F64]/24 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-xl rounded-[36px] border border-white/55 bg-[#E9F5FF]/86 p-6 shadow-[0_30px_90px_rgba(9,47,100,0.22)] backdrop-blur-2xl"
        initial={{ opacity: 0, y: 26, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Oyun modu</p>
        <h2 className="mt-2 text-3xl font-black text-[#092F64]">{title}</h2>
        <p className="mt-2 text-sm font-bold text-[#1F1F1F]/55">{subtitle}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {difficultyOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="rounded-[26px] border border-white/60 bg-white/44 p-4 text-left shadow-[0_16px_42px_rgba(9,47,100,0.10)] transition hover:-translate-y-1 hover:bg-white/70"
            >
              <p className="text-xl font-black text-[#092F64]">{item.label}</p>
              <p className="mt-1 text-xs font-bold text-[#1F1F1F]/55">{item.meta}</p>
              <p className="mt-3 rounded-full bg-[#E9F5FF]/80 px-3 py-1 text-xs font-black text-[#1A5799]">
                {item.gameSeconds} sn
              </p>
            </button>
          ))}
        </div>
        <button type="button" onClick={onCancel} className="mt-5 rounded-full px-4 py-2 text-sm font-black text-[#092F64]/55">
          Vazgeç
        </button>
      </motion.div>
    </motion.div>
  )
}


function TicTacToe({ onExit, difficulty, onComplete }) {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState(true)
  const [awarded, setAwarded] = useState(false)

  const winner = calculateWinner(board)
  const isDraw = !winner && board.every(square => square !== null)

  function calculateWinner(squares) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i]
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a]
    }
    return null
  }

  const handleClick = (i) => {
    if (winner || board[i]) return
    const nextBoard = board.slice()
    nextBoard[i] = isXNext ? 'X' : 'O'
    setBoard(nextBoard)
    setIsXNext(!isXNext)
  }

  useEffect(() => {
    if (!awarded && (winner || isDraw)) {
      setAwarded(true)
      onComplete('tictactoe', Boolean(winner), winner ? 8 : 2)
    }
  }, [awarded, isDraw, onComplete, winner])

  const resetBoard = () => {
    setBoard(Array(9).fill(null))
    setIsXNext(true)
    setAwarded(false)
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
      <h2 className="text-2xl font-black text-[#092F64] mb-6">
        {winner ? `Kazanan: ${winner} 🏆` : isDraw ? "Berabere! 🤝" : `Sıra: ${isXNext ? 'X' : 'O'}`}
      </h2>
      <div className="grid grid-cols-3 gap-3 bg-white/40 p-4 rounded-[32px] backdrop-blur-xl border border-white/50 shadow-2xl">
        {board.map((val, i) => (
          <button key={i} onClick={() => handleClick(i)} className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-[#E9F5FF] text-3xl font-black text-[#092F64] shadow-inner hover:bg-white transition-all flex items-center justify-center">
            {val}
          </button>
        ))}
      </div>
      <div className="flex gap-4 mt-8">
        <button onClick={resetBoard} className="px-6 py-3 bg-[#092F64] text-white rounded-2xl font-bold">Tekrarla</button>
        <button onClick={onExit} className="px-6 py-3 bg-white text-[#092F64] rounded-2xl font-bold border border-[#092F64]/10">Çıkış</button>
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-widest text-[#468BE6]">Zorluk: {difficultyOptions.find((item) => item.id === difficulty)?.label}</p>
    </motion.div>
  )
}


function MemoryGame({ onExit, difficulty, onComplete, symbols }) {
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [solved, setSolved] = useState([])
  const [awarded, setAwarded] = useState(false)

  useEffect(() => {
    const selectedSymbols = (symbols?.length ? symbols : defaultGameConfigs.memory.symbols).slice(0, difficulty === 'hard' ? 10 : difficulty === 'normal' ? 8 : 6)
    const shuffled = [...selectedSymbols, ...selectedSymbols].sort(() => Math.random() - 0.5)
    setCards(shuffled)
  }, [difficulty, symbols])

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return
    const newFlipped = [...flipped, index]
    setFlipped(newFlipped)
    
    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setSolved([...solved, ...newFlipped])
        setFlipped([])
      } else {
        setTimeout(() => setFlipped([]), 800)
      }
    }
  }

  useEffect(() => {
    if (!awarded && cards.length > 0 && solved.length === cards.length) {
      setAwarded(true)
      onComplete('memory', true, Math.max(0, 18 - flipped.length))
    }
  }, [awarded, cards.length, flipped.length, onComplete, solved.length])

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-black text-[#092F64] mb-6">
        {solved.length === cards.length ? "Tebrikler! 🎉" : "Eşleri Bul"}
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((emoji, i) => (
          <button 
            key={i} 
            onClick={() => handleCardClick(i)}
            className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 shadow-lg ${
              flipped.includes(i) || solved.includes(i) ? 'bg-white rotate-0' : 'bg-[#092F64] rotate-180'
            }`}
          >
            {(flipped.includes(i) || solved.includes(i)) ? emoji : '❓'}
          </button>
        ))}
      </div>
      <button onClick={onExit} className="mt-8 px-6 py-3 bg-[#092F64] text-white rounded-2xl font-bold">Geri Dön</button>
      <p className="mt-4 text-xs font-black uppercase tracking-widest text-[#468BE6]">Zorluk: {difficultyOptions.find((item) => item.id === difficulty)?.label}</p>
    </div>
  )
}

function ReactionGame({ onExit, difficulty }) {
  const [phase, setPhase] = useState('ready')
  const [startedAt, setStartedAt] = useState(0)
  const [reaction, setReaction] = useState(null)
  const [tooEarly, setTooEarly] = useState(false)
  const timeoutRef = useRef(null)

  const startRound = () => {
    setPhase('waiting')
    setReaction(null)
    setTooEarly(false)
    const delay = difficulty === 'hard' ? 1800 : difficulty === 'normal' ? 2400 : 3200
    timeoutRef.current = window.setTimeout(() => {
      setStartedAt(Date.now())
      setPhase('go')
    }, delay + Math.random() * 1200)
  }

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  const handleTap = () => {
    if (phase === 'waiting') {
      window.clearTimeout(timeoutRef.current)
      setTooEarly(true)
      setPhase('ready')
      return
    }

    if (phase === 'go') {
      const ms = Date.now() - startedAt
      setReaction(ms)
      setPhase('done')
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-[40px] border border-white/55 bg-white/34 p-6 text-center shadow-[0_24px_80px_rgba(9,47,100,0.14)] backdrop-blur-xl">
      <h2 className="text-3xl font-black text-[#092F64]">Refleks Spotu</h2>
      <p className="mt-2 text-sm font-bold text-[#092F64]/55">Mavi sinyal yanınca dokun. Bu oyun pratik mod, puan kazandırmaz.</p>
      <button
        type="button"
        onClick={phase === 'ready' || phase === 'done' ? startRound : handleTap}
        className={`mt-8 flex h-44 w-full items-center justify-center rounded-[34px] text-3xl font-black transition ${
          phase === 'go' ? 'bg-[#468BE6] text-[#E9F5FF] shadow-[0_0_40px_rgba(70,139,230,0.45)]' : 'bg-[#E9F5FF]/80 text-[#092F64]'
        }`}
      >
        {phase === 'ready' && 'Başlat'}
        {phase === 'waiting' && 'Bekle...'}
        {phase === 'go' && 'Şimdi!'}
        {phase === 'done' && `${reaction} ms`}
      </button>
      {tooEarly && <p className="mt-4 text-sm font-black text-[#1A5799]">Erken bastın, bir daha dene.</p>}
      <button onClick={onExit} className="mt-6 rounded-2xl bg-[#092F64] px-6 py-3 font-bold text-white">Çıkış</button>
    </div>
  )
}

function makeMathQuestion(difficulty) {
  const max = difficulty === 'hard' ? 28 : difficulty === 'normal' ? 18 : 10
  const a = Math.floor(Math.random() * max) + 2
  const b = Math.floor(Math.random() * max) + 2
  const useMultiply = difficulty !== 'easy' && Math.random() > 0.45
  const answer = useMultiply ? a * b : a + b

  return {
    text: useMultiply ? `${a} x ${b}` : `${a} + ${b}`,
    answer,
  }
}

function MathRushGame({ onExit, difficulty, onComplete }) {
  const totalRounds = difficulty === 'hard' ? 7 : difficulty === 'normal' ? 6 : 5
  const [question, setQuestion] = useState(() => makeMathQuestion(difficulty))
  const [round, setRound] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [value, setValue] = useState('')
  const [done, setDone] = useState(false)
  const awardedRef = useRef(false)

  const submitAnswer = () => {
    if (done) return

    const nextCorrect = Number(value) === question.answer ? correct + 1 : correct
    setCorrect(nextCorrect)
    setValue('')

    if (round >= totalRounds) {
      setDone(true)
      if (!awardedRef.current) {
        awardedRef.current = true
        onComplete('mathrush', nextCorrect >= Math.ceil(totalRounds * 0.65), nextCorrect * 4)
      }
      return
    }

    setRound((current) => current + 1)
    setQuestion(makeMathQuestion(difficulty))
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-[40px] border border-white/55 bg-white/34 p-6 text-center shadow-[0_24px_80px_rgba(9,47,100,0.14)] backdrop-blur-xl">
      <h2 className="text-3xl font-black text-[#092F64]">Hızlı Matematik</h2>
      <p className="mt-2 text-sm font-bold text-[#092F64]/55">Tur {round} / {totalRounds}</p>
      <div className="mt-8 rounded-[32px] bg-[#E9F5FF]/85 px-12 py-8 text-5xl font-black text-[#092F64]">{done ? `${correct}/${totalRounds}` : question.text}</div>
      {!done ? (
        <div className="mt-6 flex w-full gap-3">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value.replace(/\D/g, ''))}
            onKeyDown={(event) => event.key === 'Enter' && submitAnswer()}
            className="min-w-0 flex-1 rounded-2xl border border-white/60 bg-white/70 px-5 py-3 text-lg font-black text-[#092F64] outline-none"
            placeholder="Cevap"
          />
          <button onClick={submitAnswer} className="rounded-2xl bg-[#092F64] px-5 py-3 font-black text-white">Gönder</button>
        </div>
      ) : (
        <p className="mt-6 text-sm font-black text-[#468BE6]">Skor kaydedildi.</p>
      )}
      <button onClick={onExit} className="mt-6 rounded-2xl bg-white px-6 py-3 font-bold text-[#092F64]">Çıkış</button>
    </div>
  )
}


function normalizeWordEntry(item) {
  if (typeof item === 'string') {
    return {
      word: item.toUpperCase(),
      hint: wordHints[item.toUpperCase()] || 'Kampüs hayatıyla alakalı 5 harfli bir kelime.',
    }
  }

  return {
    word: String(item.word || item.value || 'KAHVE').toUpperCase(),
    hint: item.hint || wordHints[String(item.word || item.value || 'KAHVE').toUpperCase()] || 'Kampüs hayatıyla alakalı 5 harfli bir kelime.',
  }
}

function getRandomWordEntry(words) {
  const safeWords = (words?.length ? words : defaultGameConfigs.wordle.words)
    .map(normalizeWordEntry)
    .filter((item) => item.word.length === 5)

  return safeWords[Math.floor(Math.random() * safeWords.length)] || { word: 'KAHVE', hint: wordHints.KAHVE }
}

function WordleGame({ onExit, difficulty, onComplete, words }) {
  const [solutionEntry, setSolutionEntry] = useState(() => getRandomWordEntry(words))
  const [guesses, setGuesses] = useState(Array(6).fill(''))
  const [currentGuess, setCurrentGuess] = useState('')
  const [isGameOver, setIsGameOver] = useState(false)
  const [shakeRow, setShakeRow] = useState(null)
  const awardedRef = useRef(false)
  const solution = solutionEntry.word

  const resetGame = () => {
    setGuesses(Array(6).fill(''))
    setCurrentGuess('')
    setIsGameOver(false)
    awardedRef.current = false
    setSolutionEntry(getRandomWordEntry(words))
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isGameOver) return
      if (e.key === 'Enter') {
        if (currentGuess.length !== 5) { triggerShake(); return; }
        const emptyIndex = guesses.findIndex(g => g === '')
        const newGuesses = [...guesses]
        newGuesses[emptyIndex] = currentGuess.toUpperCase()
        setGuesses(newGuesses)
        setCurrentGuess('')
        if (currentGuess.toUpperCase() === solution || emptyIndex === 5) {
          setIsGameOver(true)

          if (!awardedRef.current) {
            awardedRef.current = true
            onComplete('wordle', currentGuess.toUpperCase() === solution, currentGuess.toUpperCase() === solution ? 12 - emptyIndex : 0)
          }
        }
      } else if (e.key === 'Backspace') {
        setCurrentGuess(prev => prev.slice(0, -1))
      } else if (e.key.length === 1 && currentGuess.length < 5 && /[a-z|A-Z|ç|ğ|ı|ö|ş|ü|İ]/.test(e.key)) {
        setCurrentGuess(prev => prev + e.key.toUpperCase())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentGuess, guesses, isGameOver, onComplete, solution])

  const triggerShake = () => {
    const activeRow = guesses.findIndex(g => g === '')
    setShakeRow(activeRow)
    setTimeout(() => setShakeRow(null), 500)
  }

  const getLetterStyle = (guess, index, isSubmitted) => {
    if (!isSubmitted) return 'border-[#468BE6] bg-white text-[#092F64]'
    const char = guess[index]
    if (solution[index] === char) return 'bg-[#468BE6] text-white border-transparent shadow-[0_0_15px_rgba(70,139,230,0.5)]'
    if (solution.includes(char)) return 'bg-[#93BFEF] text-white border-transparent'
    return 'bg-[#092F64]/10 text-[#092F64]/30 border-[#092F64]/5'
  }

  return (
    <div className="relative mx-auto flex max-w-md flex-col items-center rounded-[40px] border border-white/55 bg-white/32 p-5 shadow-[0_24px_80px_rgba(9,47,100,0.14)] backdrop-blur-xl">
      <div className="mb-8 w-full">
        <div className="flex items-start justify-between gap-4">
          <div className="text-left">
            <h2 className="text-3xl font-black tracking-tight text-[#092F64]">Kampüs Kelime</h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#468BE6]">GÜNÜN TERİMİNİ YAKALA</p>
          </div>
          {!isGameOver && (
            <button
              onClick={onExit}
              className="shrink-0 rounded-full border border-white/45 bg-white/42 px-4 py-2 text-xs font-black text-[#092F64] shadow-[0_10px_26px_rgba(9,47,100,0.08)] transition hover:-translate-y-0.5 hover:bg-white/60"
            >
              Vazgeç
            </button>
          )}
        </div>
        <motion.p
          className="mt-4 rounded-2xl bg-[#E9F5FF]/80 px-4 py-3 text-sm font-black text-[#092F64]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          İpucu: {solutionEntry.hint}
          {difficulty === 'easy' ? ` İlk harf: ${solution.charAt(0)}` : ''}
        </motion.p>
      </div>

      <div className="grid grid-rows-6 gap-3 mb-8">
        {guesses.map((guess, i) => {
          const isCurrent = i === guesses.findIndex(g => g === '')
          const isSubmitted = !isCurrent && guess !== ''
          const displayWord = isCurrent ? currentGuess.padEnd(5, ' ') : guess

          return (
            <motion.div 
              key={i} 
              className="flex gap-2"
              animate={shakeRow === i ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {Array.from({ length: 5 }).map((_, j) => (
                <motion.div
                  key={j}
                  initial={false}
                  animate={isSubmitted ? { rotateY: 360 } : displayWord[j] !== ' ' ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ delay: j * 0.1, duration: 0.5 }}
                  className={`h-12 w-12 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-colors duration-500 shadow-sm sm:h-14 sm:w-14 ${getLetterStyle(isCurrent ? currentGuess : guess, j, isSubmitted)}`}
                >
                  {displayWord[j]}
                </motion.div>
              ))}
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full text-center p-6 rounded-[32px] bg-white shadow-2xl border border-[#468BE6]/20 mb-8"
          >
            <p className="text-sm font-bold text-[#092F64]/60 uppercase mb-1">Doğru Cevap</p>
            <h3 className="text-3xl font-black text-[#468BE6] mb-4 tracking-widest">{solution}</h3>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={resetGame} 
                className="px-6 py-3 bg-[#092F64] text-white rounded-2xl font-bold hover:scale-105 transition"
              >
                Tekrar Dene
              </button>
              <button 
                onClick={onExit} 
                className="px-6 py-3 bg-[#E9F5FF] text-[#092F64] rounded-2xl font-bold hover:bg-[#D4E9FF] transition"
              >
                Oyunlardan Çık
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isGameOver && (
        <p className="text-[10px] font-bold text-[#092F64]/40 uppercase tracking-widest animate-pulse">
          Klavyeni kullanarak tahmin et ve Enter'a bas · {difficultyOptions.find((item) => item.id === difficulty)?.label}
        </p>
      )}
    </div>
  )
}


export default function GamesPage() {
  const navigate = useNavigate()
  const [activeGame, setActiveGame] = useState(null)
  const [difficulty, setDifficulty] = useState('normal')
  const [pendingGame, setPendingGame] = useState(null)
  const [scoreMessage, setScoreMessage] = useState('')
  const [gameConfigs, setGameConfigs] = useState(defaultGameConfigs)
  const gameAwardedRef = useRef(false)
  const difficultyMeta = difficultyOptions.find((item) => item.id === difficulty) || difficultyOptions[1]
  const [timeLeft, setTimeLeft] = useState(difficultyMeta.gameSeconds)

  useEffect(() => {
    let ignore = false

    async function loadConfigs() {
      const configs = await loadGameConfigs()

      if (!ignore) {
        setGameConfigs(configs)
      }
    }

    loadConfigs()

    return () => {
      ignore = true
    }
  }, [])

  const games = [
    { id: 'wordle', name: 'Kampüs Kelime', icon: '📝', players: 12, color: '#468BE6', desc: 'MAKÜ terimlerini tahmin et!' },
    { id: 'tictactoe', name: 'MAKÜ-SOS', icon: '❌', players: 8, color: '#93BFEF', desc: 'Klasik SOS macerası.' },
    { id: 'memory', name: 'Hafıza Kartları', icon: '🧠', players: 5, color: '#E9F5FF', desc: 'Kartları eşleştir, zihnini tazele.' },
    { id: 'reaction', name: 'Refleks Spotu', icon: '⚡', players: 9, color: '#468BE6', desc: 'Sinyali yakala, refleks puanı kas.' },
    { id: 'mathrush', name: 'Hızlı Matematik', icon: '➕', players: 7, color: '#93BFEF', desc: 'Kısa tur, hızlı cevap, bol puan.' },
  ]

  const handleGameComplete = async (gameId, won, bonus = 0) => {
    try {
      if (gameAwardedRef.current) return
      gameAwardedRef.current = true
      if (!auth.currentUser) return
      const result = await recordGameResult(auth.currentUser.uid, { gameId, won, difficulty, bonus })
      setScoreMessage(`+${result.points} puan · +${result.xp} XP`)
    } catch {
      setScoreMessage('Skor kaydedilemedi.')
    }
  }

  useEffect(() => {
    if (!activeGame) return undefined

    gameAwardedRef.current = false
    setTimeLeft(difficultyMeta.gameSeconds)
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (gameAwardedRef.current) return current;
        if (current <= 1) {
          window.clearInterval(timer)
          if (!gameAwardedRef.current) {
            handleGameComplete(activeGame, false, 0)
          }
          setActiveGame(null)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [activeGame, difficulty])

  return (
    <div className="min-h-screen bg-[#E9F5FF]">
      <Navbar />
      
      <main className="mx-auto max-w-[1200px] p-6 pt-24">
        <AnimatePresence mode="wait">
          {!activeGame ? (
            <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <header className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#468BE6]">Eğlence Merkezi</p>
                  <h1 className="mt-2 text-4xl font-black text-[#092F64]">Oyun Odaları</h1>
                </div>
                <button onClick={() => navigate('/')} className="rounded-full bg-white/50 px-6 py-2.5 text-sm font-bold text-[#092F64] shadow-sm">← Kampüse Dön</button>
              </header>

              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/50 bg-white/35 p-4 shadow-xl backdrop-blur-xl">
                <p className="text-sm font-black text-[#092F64]">Odaya girerken mod seç, süre ve puan çarpanı ona göre başlasın.</p>
                {scoreMessage && <span className="rounded-full bg-[#E9F5FF]/80 px-4 py-2 text-xs font-black text-[#1A5799]">{scoreMessage}</span>}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {games.map((game) => (
                  <motion.div key={game.id} whileHover={{ y: -8 }} className="rounded-[32px] border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-lg" style={{ backgroundColor: game.color }}>{game.icon}</div>
                    <h2 className="mt-4 text-2xl font-bold text-[#092F64]">{game.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-[#092F64]/50">{game.desc}</p>
                    <button onClick={() => setPendingGame(game)} className="mt-6 w-full rounded-2xl bg-[#092F64] py-3 font-bold text-white transition hover:scale-[1.02]">Odaya Gir</button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
              <motion.div key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="pt-10">
                <div className="mx-auto mb-5 flex max-w-sm justify-center gap-2">
                  {scoreMessage && <p className="rounded-full bg-[#E9F5FF]/80 px-4 py-2 text-center text-xs font-black text-[#468BE6]">{scoreMessage}</p>}
                  <p className="rounded-full bg-[#092F64] px-4 py-2 text-xs font-black text-[#E9F5FF]">
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </p>
                </div>
                <MascotAssist
                  difficulty={difficulty}
                  gameId={activeGame}
                  hint={
                    activeGame === 'wordle'
                      ? 'Kelime kutusundaki ipucunu oku; kolay modda ilk harfi de verdim.'
                      : activeGame === 'memory'
                        ? 'Açtığın ilk kartı aklında tut, aynı emojiyi sakin yakala.'
                        : activeGame === 'reaction'
                          ? 'Mavi sinyal gelmeden basma; beklemek burada puan kazandırır.'
                          : activeGame === 'mathrush'
                            ? 'Kolay soruları seri geç, zor sorularda işlem sırasını kaçırma.'
                            : 'Köşeleri ve ortayı kontrol et, üçlü çizgiyi erken kapat.'
                  }
                />
                {activeGame === 'tictactoe' && <TicTacToe difficulty={difficulty} onComplete={handleGameComplete} onExit={() => setActiveGame(null)} />}
                {activeGame === 'memory' && <MemoryGame difficulty={difficulty} symbols={gameConfigs.memory?.symbols} onComplete={handleGameComplete} onExit={() => setActiveGame(null)} />}
                {activeGame === 'wordle' && <WordleGame difficulty={difficulty} words={gameConfigs.wordle?.words} onComplete={handleGameComplete} onExit={() => setActiveGame(null)} />}
                {activeGame === 'reaction' && <ReactionGame difficulty={difficulty} onExit={() => setActiveGame(null)} />}
                {activeGame === 'mathrush' && <MathRushGame difficulty={difficulty} onComplete={handleGameComplete} onExit={() => setActiveGame(null)} />}
              </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {pendingGame && (
            <DifficultyPicker
              title={pendingGame.name}
              subtitle="Süre ve puan çarpanı seçtiğin moda göre değişir."
              onCancel={() => setPendingGame(null)}
              onSelect={(nextDifficulty) => {
                setDifficulty(nextDifficulty)
                setScoreMessage('')
                gameAwardedRef.current = false
                setActiveGame(pendingGame.id)
                setPendingGame(null)
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
