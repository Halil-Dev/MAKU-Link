import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import { auth } from '../FireBase/firebaseConfig.js'
import { difficultyOptions, getTodayKey, loadQuizSets, recordQuizResult } from '../services/gameService.js'

// --- 2. QUIZ OYNATICI BİLEŞENİ ---
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
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#468BE6]">Mod seç</p>
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
                {item.secondsPerQuestion} sn / soru
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

function hashSeed(value) {
  return Array.from(value).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
}

function seededShuffle(items, seedValue) {
  const shuffled = [...items]
  let seed = Math.abs(hashSeed(seedValue)) || 1

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (seed * 9301 + 49297) % 233280
    const swapIndex = Math.floor((seed / 233280) * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

function rotateOptions(question, seedValue) {
  const correctAnswer = question.options[question.correct]
  const options = seededShuffle(question.options, seedValue)

  return {
    ...question,
    options,
    correct: options.findIndex((option) => option === correctAnswer),
  }
}

function selectQuestionsForDifficulty(questions, difficulty, quizId, dailyKey) {
  const taggedQuestions = questions.filter((question) => question.difficulty === difficulty)
  const pool = taggedQuestions.length >= 4 ? taggedQuestions : questions

  if (difficulty === 'easy') {
    return seededShuffle(pool, `${dailyKey}-${quizId}-${difficulty}`)
      .slice(0, Math.min(5, pool.length))
      .map((question, index) => rotateOptions(question, `${dailyKey}-${quizId}-${difficulty}-${index}`))
  }

  if (difficulty === 'hard') {
    return seededShuffle(pool, `${dailyKey}-${quizId}-${difficulty}`)
      .slice(0, Math.min(7, pool.length))
      .map((question, index) => rotateOptions(question, `${dailyKey}-${quizId}-${difficulty}-${index}`))
  }

  return seededShuffle(pool, `${dailyKey}-${quizId}-${difficulty}`)
    .slice(0, Math.min(6, pool.length))
    .map((question, index) => rotateOptions(question, `${dailyKey}-${quizId}-${difficulty}-${index}`))
}

function QuizPlayer({ quiz, difficulty, onExit }) {
  const dailyKey = getTodayKey()
  const quizQuestions = useMemo(() => selectQuestionsForDifficulty(quiz.questions, difficulty, quiz.id, dailyKey), [quiz.questions, difficulty, quiz.id, dailyKey])
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [earned, setEarned] = useState(null)
  const [isSavingScore, setIsSavingScore] = useState(false)
  const [scoreMessage, setScoreMessage] = useState('')
  const difficultyMeta = difficultyOptions.find((item) => item.id === difficulty) || difficultyOptions[1]
  const [timeLeft, setTimeLeft] = useState(difficultyMeta.secondsPerQuestion)
  const savedRef = useRef(false)

  const finishQuiz = async (finalScore) => {
    if (savedRef.current) return
    savedRef.current = true
    setShowResult(true)
    setIsSavingScore(true)

    try {
      if (auth.currentUser) {
        const result = await recordQuizResult(auth.currentUser.uid, {
          quizId: quiz.id,
          score: finalScore,
          total: quizQuestions.length,
          difficulty,
          dailyKey,
        })
        setEarned(result)
      }
    } catch {
      setScoreMessage('Skor kaydedilemedi, internetini kontrol et.')
    } finally {
      setIsSavingScore(false)
    }
  }

  const goToNextQuestion = (nextScore) => {
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < quizQuestions.length) {
      setCurrentQuestion(nextQuestion);
      setTimeLeft(difficultyMeta.secondsPerQuestion)
    } else {
      finishQuiz(nextScore)
    }
  }

  useEffect(() => {
    if (showResult) return undefined

    setTimeLeft(difficultyMeta.secondsPerQuestion)
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          goToNextQuestion(score)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [currentQuestion, difficulty, showResult, score])

  const handleAnswer = async (index) => {
    const nextScore = index === quizQuestions[currentQuestion].correct ? score + 1 : score

    if (index === quizQuestions[currentQuestion].correct) {
      setScore(nextScore);
    }

    goToNextQuestion(nextScore)
  };

  if (showResult) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="theme-card rounded-[40px] border border-white/55 bg-white/44 p-12 text-center shadow-2xl backdrop-blur-2xl">
        <div className="text-6xl mb-6">🏆</div>
        <h2 className="theme-title text-3xl font-black text-[#092F64]">Test Tamamlandı!</h2>
        <p className="mt-4 text-xl font-bold text-[#468BE6]">Skorun: {score} / {quizQuestions.length}</p>
        <p className="theme-muted mt-2 text-sm font-black text-[#092F64]/55">
          {isSavingScore ? 'Puanın kaydediliyor...' : earned?.alreadyCompleted ? 'Bugünkü puanı aldın. Yarın yeni sorularla tekrar kasarsın.' : earned ? `+${earned.points} puan · +${earned.xp} XP` : scoreMessage}
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <button onClick={() => { setCurrentQuestion(0); setScore(0); setShowResult(false); setEarned(null); setScoreMessage(''); savedRef.current = false; setTimeLeft(difficultyMeta.secondsPerQuestion) }} className="theme-pill rounded-2xl bg-[#E9F5FF] px-8 py-3 font-bold text-[#092F64]">Tekrar Çöz</button>
          <button onClick={onExit} className="px-8 py-3 bg-[#092F64] text-white rounded-2xl font-bold">Kapat</button>
        </div>
      </motion.div>
    );
  }

  const q = quizQuestions[currentQuestion];

  return (
    <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="max-w-2xl mx-auto p-8 bg-white/40 backdrop-blur-xl rounded-[48px] border border-white shadow-2xl">
      <div className="flex justify-between items-center mb-10">
        <span className="px-4 py-1.5 rounded-full bg-[#468BE6] text-white text-xs font-black uppercase tracking-widest">
          Soru {currentQuestion + 1} / {quizQuestions.length}
        </span>
        <span className="px-4 py-1.5 rounded-full bg-[#092F64] text-white text-xs font-black uppercase tracking-widest">
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </span>
        <button onClick={onExit} className="text-[#092F64]/40 hover:text-red-500 font-bold transition">Vazgeç</button>
      </div>
      
      <h2 className="text-2xl font-black text-[#092F64] mb-10 leading-tight">{q.question}</h2>
      
      <div className="grid gap-4">
        {q.options.map((option, index) => (
          <button 
            key={index} 
            onClick={() => handleAnswer(index)}
            className="w-full p-6 text-left rounded-[24px] bg-white border-2 border-transparent hover:border-[#468BE6] hover:bg-[#E9F5FF] text-[#092F64] font-bold transition-all shadow-sm group relative overflow-hidden"
          >
            <span className="inline-block w-10 h-10 rounded-xl bg-[#E9F5FF] group-hover:bg-[#468BE6] group-hover:text-white text-center leading-10 mr-4 transition-colors font-black">
              {String.fromCharCode(65 + index)}
            </span>
            {option}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// --- 3. ANA QUIZ SAYFASI ---
export default function QuizPage() {
  const navigate = useNavigate()
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([])
  const [difficulty, setDifficulty] = useState('normal')
  const [pendingQuiz, setPendingQuiz] = useState(null)
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadQuizzes() {
      setIsLoadingQuizzes(true)
      const nextQuizzes = await loadQuizSets()

      if (!ignore) {
        setQuizzes(nextQuizzes)
        setIsLoadingQuizzes(false)
      }
    }

    loadQuizzes()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#E9F5FF]">
      {/* Navbar bağlantılarını aktif ettik */}
      <Navbar />
      
      <main className="mx-auto max-w-[1200px] p-6 pt-24">
        <AnimatePresence mode="wait">
          {!selectedQuiz ? (
            <motion.div 
              key="list" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
            >
              <header className="mb-12 flex items-end justify-between">
                <div>
                  <p className="text-xs font-black text-[#468BE6] uppercase tracking-widest">Zeka Meydanı</p>
                  <h1 className="mt-2 text-4xl font-black text-[#092F64]">MAKÜ Quizler</h1>
                  <p className="mt-2 text-sm font-bold text-[#092F64]/50">Günlük sorular her 24 saatte yenilenir. Aynı quizden günde bir kez puan alınır.</p>
                </div>
                
                {/* Sağ üst köşeye hızlı dönüş butonu ekledik */}
                <button 
                  onClick={() => navigate('/')}
                  className="rounded-full bg-white/50 px-6 py-2.5 text-sm font-bold text-[#092F64] shadow-sm transition hover:bg-white hover:shadow-md"
                >
                  ← Kampüse Dön
                </button>
              </header>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoadingQuizzes ? (
                  <div className="rounded-[32px] bg-white/40 p-8 text-sm font-black text-[#092F64]">Quizler yükleniyor...</div>
                ) : quizzes.map((quiz) => (
                  <motion.div 
                    key={quiz.id} 
                    whileHover={{ y: -10 }} 
                    className="rounded-[40px] border border-white/50 bg-white/40 p-8 shadow-xl backdrop-blur-xl flex flex-col items-center text-center"
                  >
                    <div 
                      className="h-20 w-20 flex items-center justify-center rounded-[28px] text-4xl shadow-lg mb-6" 
                      style={{ backgroundColor: quiz.color + '20', color: quiz.color }}
                    >
                      {quiz.icon}
                    </div>
                    <h2 className="text-2xl font-black text-[#092F64]">{quiz.title}</h2>
                    <p className="mt-2 text-sm font-bold text-[#092F64]/40">{quiz.questions.length} Soru</p>
                    <button 
                      onClick={() => setPendingQuiz(quiz)}
                      className="mt-8 w-full rounded-2xl bg-[#092F64] py-4 font-black text-white transition-all hover:shadow-[0_10px_20px_rgba(9,47,100,0.3)] active:scale-95"
                    >
                      Teste Başla
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="pt-10">
              {/* QuizPlayer'dan çıkınca listeye dönmesi için onExit ekli */}
              <QuizPlayer quiz={selectedQuiz} difficulty={difficulty} onExit={() => setSelectedQuiz(null)} />
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {pendingQuiz && (
            <DifficultyPicker
              title={pendingQuiz.title}
              subtitle="Süre ve puan çarpanı seçtiğin moda göre değişir."
              onCancel={() => setPendingQuiz(null)}
              onSelect={(nextDifficulty) => {
                setDifficulty(nextDifficulty)
                setSelectedQuiz(pendingQuiz)
                setPendingQuiz(null)
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
