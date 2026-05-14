import {
  collection,
  doc,
  getDocs,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../FireBase/firebaseConfig.js'

export const difficultyOptions = [
  { id: 'easy', label: 'Kolay', multiplier: 1, meta: 'rahat mod', secondsPerQuestion: 45, gameSeconds: 150 },
  { id: 'normal', label: 'Normal', multiplier: 1.5, meta: 'standart', secondsPerQuestion: 30, gameSeconds: 110 },
  { id: 'hard', label: 'Zor', multiplier: 2, meta: 'puan kas', secondsPerQuestion: 20, gameSeconds: 75 },
]

export const defaultQuizSets = [
  {
    id: 'maku-genel',
    title: 'MAKÜ Genel Kültür',
    icon: '🏛️',
    color: '#468BE6',
    difficulty: 'normal',
    questions: [
      {
        question: "MAKÜ'nün temel sloganı nedir?",
        options: ['Geleceğin Üniversitesi', 'Bilginin Başkenti', 'İstiklalden İstikbale', 'Üreten Üniversite'],
        correct: 2,
      },
      {
        question: 'Bucak İşletme Fakültesi hangi ilçededir?',
        options: ['Burdur Merkez', 'Bucak', 'Yeşilova', 'Gölhisar'],
        correct: 1,
      },
      {
        question: 'Lavanta Tepesi Otel hangi yerleşkededir?',
        options: ['İstiklal Yerleşkesi', 'Bucak Yerleşkesi', 'Gölhisar', 'Ağlasun'],
        correct: 0,
      },
      {
        question: 'MAKÜLink içinde spot neyi temsil eder?',
        options: ['Ders notu', 'Anlık kampüs paylaşımı', 'Resmi duyuru', 'Sadece oyun odası'],
        correct: 1,
      },
      {
        question: 'Spot bırakırken en değerli bilgi hangisidir?',
        options: ['Telefon modeli', 'Konum ve ne yaptığın', 'Şifre', 'Tarayıcı adı'],
        correct: 1,
      },
      {
        question: 'Leaderboard puanı en çok neyi teşvik eder?',
        options: ['Pasif kalmayı', 'Kampüs etkileşimini', 'Hesap silmeyi', 'Ayar değiştirmeyi'],
        correct: 1,
      },
      {
        question: 'MAKÜLink’te “duo spot” genelde ne için kullanılır?',
        options: ['Birlikte oyun oynamak', 'E-posta doğrulamak', 'Ders kaydı yapmak', 'Şifre yenilemek'],
        correct: 0,
      },
      {
        question: 'Kampüs sosyal ağında bildirimlerin amacı nedir?',
        options: ['Spam atmak', 'Canlı etkileşimleri kaçırmamak', 'Profil gizlemek', 'Sayfayı yenilemek'],
        correct: 1,
      },
      {
        question: 'MAKÜLink’te leaderboard hangi davranışı ödüllendirir?',
        options: ['Etkileşim kurmayı', 'Sessiz kalmayı', 'Çıkış yapmayı', 'Tema değiştirmeyi'],
        correct: 0,
      },
      {
        question: 'Spot paylaşımı ne zaman daha faydalıdır?',
        options: ['Konum ve niyet netse', 'Hiç bilgi yoksa', 'Sadece emoji varsa', 'Yanlış bölüm seçilirse'],
        correct: 0,
      },
      {
        question: 'Topluluk kartları en çok neyi gösterir?',
        options: ['Canlı öğrenci ilgisini', 'Sistem dosyalarını', 'Şifreleri', 'Tarayıcı geçmişini'],
        correct: 0,
      },
      {
        question: 'MAKÜLink’te “aktif öğrenci” ne anlama gelir?',
        options: ['Şu an platformda olan kullanıcı', 'Silinmiş hesap', 'Admin paneli', 'Eski bildirim'],
        correct: 0,
      },
    ],
  },
  {
    id: 'yazilim-temelleri',
    title: 'Yazılım Dünyası',
    icon: '💻',
    color: '#092F64',
    difficulty: 'hard',
    questions: [
      {
        question: "React'te state güncellendiğinde ne olur?",
        options: ['Sayfa yenilenir', 'Bileşen re-render olur', 'Veri tabanı silinir', 'Browser çöker'],
        correct: 1,
      },
      {
        question: 'Hangisi bir JavaScript kütüphanesidir?',
        options: ['Java', 'React', 'Python', 'C++'],
        correct: 1,
      },
      {
        question: 'Firestore’da koleksiyon içindeki tekil kayda ne denir?',
        options: ['Document', 'Reducer', 'Hook', 'Component'],
        correct: 0,
      },
      {
        question: 'Vite hangi konuda öne çıkar?',
        options: ['Yavaş build', 'Hızlı geliştirme sunucusu', 'Veri tabanı yönetimi', 'E-posta gönderimi'],
        correct: 1,
      },
      {
        question: 'React’te component ne işe yarar?',
        options: ['UI parçalarını bölmeye', 'Veri tabanı silmeye', 'Sunucu kapatmaya', 'CSS yasaklamaya'],
        correct: 0,
      },
      {
        question: 'Firestore’da kullanıcı profilleri genelde nerede tutulur?',
        options: ['users collection', 'window object', 'package.json', 'node_modules'],
        correct: 0,
      },
      {
        question: 'Framer Motion hangi amaçla kullanılır?',
        options: ['Animasyon', 'E-posta gönderimi', 'Dosya sıkıştırma', 'Şifre kırma'],
        correct: 0,
      },
      {
        question: 'Tailwind CSS’in temel yaklaşımı nedir?',
        options: ['Utility class', 'Sadece inline style', 'Veri tabanı sorgusu', 'Backend framework'],
        correct: 0,
      },
      {
        question: 'Firebase Auth ne sağlar?',
        options: ['Kimlik doğrulama', 'Ekran kartı sürücüsü', 'CSS compiler', 'Video editörü'],
        correct: 0,
      },
      {
        question: 'React hook’ları ne için kullanılır?',
        options: ['State ve lifecycle yönetimi', 'Domain satın alma', 'Görsel sıkıştırma', 'DNS değiştirme'],
        correct: 0,
      },
      {
        question: 'Firestore’da güvenlik kuralları neyi kontrol eder?',
        options: ['Okuma/yazma izinlerini', 'CSS renklerini', 'Animasyon hızını', 'Font boyutunu'],
        correct: 0,
      },
      {
        question: 'Vite projesinde production çıktısı genelde hangi komutla alınır?',
        options: ['npm run build', 'npm run sleep', 'git ignore', 'firebase logout'],
        correct: 0,
      },
      {
        question: 'Framer Motion’da motion.div ne sağlar?',
        options: ['Animasyonlu div', 'Veri tabanı', 'Auth provider', 'Router ayarı'],
        correct: 0,
      },
      {
        question: 'Tailwind’de responsive sınıflar ne işe yarar?',
        options: ['Ekrana göre stil vermeye', 'Şifre üretmeye', 'Firestore okumaya', 'Mail doğrulamaya'],
        correct: 0,
      },
    ],
  },
  {
    id: 'kampus-vibe',
    title: 'Kampüs Vibe',
    icon: '☕',
    color: '#93BFEF',
    difficulty: 'easy',
    questions: [
      {
        question: '“Kafede fazladan kahvem var” en çok hangi spot tipine girer?',
        options: ['Coffee spot', 'Duo spot', 'Quiz spot', 'Leaderboard'],
        correct: 0,
      },
      {
        question: 'Beraber ders çalışmak isteyen biri hangi spotu açmalı?',
        options: ['Game', 'Study', 'Film', 'Ayarlar'],
        correct: 1,
      },
      {
        question: 'Duo arayan biri büyük ihtimalle ne yapmak istiyordur?',
        options: ['Fotoğraf çekmek', 'Oyun oynamak', 'E-posta değiştirmek', 'KVKK okumak'],
        correct: 1,
      },
      {
        question: '“Sessiz katta 8 kişi aktif” hangi vibe’a yakın?',
        options: ['Study', 'Duo', 'Film', 'Ayarlar'],
        correct: 0,
      },
      {
        question: 'Kampüste yeni insanlarla tanışmak için en iyi aksiyon hangisi?',
        options: ['Spot bırakmak', 'Sekmeyi kapatmak', 'Profil silmek', 'Şifre değiştirmek'],
        correct: 0,
      },
      {
        question: 'Quiz çözdükçe profilde ne artar?',
        options: ['Quiz puanı', 'Doğum tarihi', 'E-posta domaini', 'Avatar dosyası'],
        correct: 0,
      },
      {
        question: 'Kahve spotu en çok neye yarar?',
        options: ['Sosyalleşmeye', 'Build almaya', 'Rules silmeye', 'Deployment durdurmaya'],
        correct: 0,
      },
      {
        question: '“Ring yine dolu” paylaşımı hangi vibe’a girer?',
        options: ['Kampüs anı', 'Şifre işlemi', 'E-posta ayarı', 'Admin duyurusu'],
        correct: 0,
      },
      {
        question: 'Film gecesi duyurusu hangi spot tipine yakın?',
        options: ['Event spot', 'Password spot', 'Deploy spot', 'Rules spot'],
        correct: 0,
      },
      {
        question: 'Yeni arkadaş bulmak için en doğal aksiyon hangisi?',
        options: ['Kısa ve samimi spot bırakmak', 'Boş profil bırakmak', 'Bildirim kapatmak', 'Hesap silmek'],
        correct: 0,
      },
      {
        question: '“Duo aranıyor” genelde hangi emojiyle daha iyi anlaşılır?',
        options: ['🎮', '🔒', '🧾', '🧯'],
        correct: 0,
      },
    ],
  },
]

export const defaultGameConfigs = {
  wordle: {
    words: [
      'MAKUL',
      'BUCAK',
      'METEB',
      'SPOTL',
      'KAMPÜ',
      'TEKNO',
      'SIBER',
      'OYUNC',
      'QUIZZ',
      'KAHVE',
      'DERSL',
      'FINAL',
      'VİZES',
      'SOSYL',
      'LINKS',
      'YURTL',
      'RINGA',
      'NOTES',
      'KULUP',
      'AKTIF',
    ],
  },
  memory: {
    symbols: ['🎮', '☕', '📚', '🎯', '📍', '🎓', '🔥', '🏆', '🎧', '💻', '📸', '⚡'],
  },
  tictactoe: {
    boardSize: 3,
    winLength: 3,
    symbols: ['X', 'O'],
  },
  reaction: {
    rounds: 5,
  },
  mathrush: {
    rounds: 6,
  },
}

function getDifficultyMeta(difficultyId) {
  return difficultyOptions.find((item) => item.id === difficultyId) || difficultyOptions[1]
}

function getNextLevel(xp) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1)
}

function normalizeQuizSet(id, data) {
  const questions = Array.isArray(data.questions) ? data.questions : []

  return {
    id,
    title: data.title || 'MAKÜ Quiz',
    icon: data.icon || '🎯',
    color: data.color || '#468BE6',
    difficulty: data.difficulty || 'normal',
    questions: questions
      .filter((question) => question?.question && Array.isArray(question.options))
      .map((question) => ({
        question: question.question,
        options: question.options,
        correct: Number.isInteger(question.correct) ? question.correct : question.correctIndex || 0,
        difficulty: question.difficulty || null,
      })),
  }
}

export async function loadQuizSets() {
  try {
    const snapshot = await getDocs(collection(db, 'quizSets'))

    if (!snapshot.empty) {
      return snapshot.docs
        .map((item) => {
          const remoteQuiz = normalizeQuizSet(item.id, item.data())
          const defaultQuiz = defaultQuizSets.find((quiz) => quiz.id === item.id)

          if (!defaultQuiz || remoteQuiz.questions.length >= defaultQuiz.questions.length) {
            return remoteQuiz
          }

          return {
            ...remoteQuiz,
            questions: defaultQuiz.questions,
          }
        })
        .filter((quiz) => quiz.questions.length > 0)
    }

    await Promise.all(
      defaultQuizSets.map((quiz) => setDoc(doc(db, 'quizSets', quiz.id), quiz, { merge: true })),
    )

    return defaultQuizSets
  } catch {
    return defaultQuizSets
  }
}

export async function loadGameConfigs() {
  try {
    const snapshot = await getDocs(collection(db, 'gameConfigs'))

    if (!snapshot.empty) {
      return snapshot.docs.reduce((configs, item) => ({
        ...configs,
        [item.id]: {
          ...defaultGameConfigs[item.id],
          ...item.data(),
        },
      }), defaultGameConfigs)
    }

    await Promise.all(
      Object.entries(defaultGameConfigs).map(([id, config]) => setDoc(doc(db, 'gameConfigs', id), config, { merge: true })),
    )

    return defaultGameConfigs
  } catch {
    return defaultGameConfigs
  }
}

export function getTodayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export async function recordQuizResult(userId, { quizId, score, total, difficulty = 'normal', dailyKey = getTodayKey() }) {
  const difficultyMeta = getDifficultyMeta(difficulty)
  const perfectBonus = score === total ? 25 : 0
  const points = Math.round(score * 10 * difficultyMeta.multiplier + perfectBonus)
  const xp = Math.round(points * 1.2)
  const dailyQuizKey = `${dailyKey}_${quizId}_${difficulty}`

  const result = await updateUserGameStats(userId, {
    points,
    xp,
    gameKey: 'quiz',
    won: score === total,
    extra: {
      quizScore: increment(points),
      quizPoints: increment(points),
      quizzesSolved: increment(1),
      quizCorrectAnswers: increment(score),
      quizTotalQuestions: increment(total),
      dailyQuizKey,
      dailyQuizResult: {
        quizId,
        score,
        total,
        difficulty,
        points,
        dailyKey,
        completedAt: serverTimestamp(),
      },
      lastQuizResult: {
        quizId,
        score,
        total,
        difficulty,
        points,
        completedAt: serverTimestamp(),
      },
    },
  })

  return result
}

export async function recordGameResult(userId, { gameId, won = false, difficulty = 'normal', bonus = 0 }) {
  const difficultyMeta = getDifficultyMeta(difficulty)
  const basePoints = won ? 30 : 10
  const points = Math.round((basePoints + bonus) * difficultyMeta.multiplier)
  const xp = Math.round(points * 1.15)

  await updateUserGameStats(userId, {
    points,
    xp,
    gameKey: gameId,
    won,
    extra: {
      gameScore: increment(points),
      gamesPlayed: increment(1),
      gamesWon: increment(won ? 1 : 0),
      lastGameResult: {
        gameId,
        won,
        difficulty,
        points,
        completedAt: serverTimestamp(),
      },
    },
  })

  return { points, xp }
}

export async function recordSpotResult(userId) {
  const points = 18
  const xp = 16

  await updateUserGameStats(userId, {
    points,
    xp,
    gameKey: 'spot',
    won: true,
    extra: {
      activeSpotCount: increment(1),
      spotScore: increment(points),
      lastSpotResult: {
        points,
        completedAt: serverTimestamp(),
      },
    },
  })

  return { points, xp }
}

async function updateUserGameStats(userId, { points, xp, gameKey, won, extra }) {
  const userRef = doc(db, 'users', userId)
  const leaderboardRef = doc(db, 'publicLeaderboard', userId)

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef)
    const data = snapshot.data() || {}
    const currentStats = data.gameStats || {}
    const nextXp = Number(currentStats.xp || 0) + xp
    const nextTotalScore = Number(currentStats.totalScore || 0) + points
    const displayName = data.name || data.displayName || data.email || 'MAKÜLinkli'
    const dailyQuizKey = extra.dailyQuizKey

    if (dailyQuizKey && data.dailyQuizCompletions?.[dailyQuizKey]) {
      return { points: 0, xp: 0, alreadyCompleted: true }
    }

    transaction.set(userRef, {
      ...extra,
      ...(dailyQuizKey ? {
        dailyQuizCompletions: {
          ...(data.dailyQuizCompletions || {}),
          [dailyQuizKey]: extra.dailyQuizResult,
        },
      } : {}),
      gameStats: {
        xp: nextXp,
        level: getNextLevel(nextXp),
        totalScore: nextTotalScore,
        gamesPlayed: Number(currentStats.gamesPlayed || 0) + 1,
        wins: Number(currentStats.wins || 0) + (won ? 1 : 0),
        lastGame: gameKey,
        updatedAt: serverTimestamp(),
      },
      stats: {
        ...(data.stats || {}),
        quizScore: Number(data.stats?.quizScore || data.quizScore || 0) + (extra.quizScore ? points : 0),
        gameScore: Number(data.stats?.gameScore || data.gameScore || 0) + (extra.gameScore ? points : 0),
        socialScore: Number(data.stats?.socialScore || data.stats?.spotScore || data.spotScore || 0) + (extra.spotScore ? points : 0),
        spotScore: Number(data.stats?.spotScore || data.spotScore || 0) + (extra.spotScore ? points : 0),
      },
    }, { merge: true })

    transaction.set(leaderboardRef, {
      uid: userId,
      name: displayName,
      department: data.department || '',
      avatarId: data.avatarId || 'women',
      totalScore: nextTotalScore,
      level: getNextLevel(nextXp),
      xp: nextXp,
      quizScore: Number(data.quizScore || data.stats?.quizScore || 0) + (extra.quizScore ? points : 0),
      gameScore: Number(data.gameScore || data.stats?.gameScore || 0) + (extra.gameScore ? points : 0),
      socialScore: Number(data.socialScore || data.stats?.socialScore || data.stats?.spotScore || data.spotScore || 0) + (extra.spotScore ? points : 0),
      spotScore: Number(data.spotScore || data.stats?.spotScore || 0) + (extra.spotScore ? points : 0),
      lastAction: gameKey,
      updatedAt: serverTimestamp(),
    }, { merge: true })

    return { points, xp, alreadyCompleted: false }
  })
}
