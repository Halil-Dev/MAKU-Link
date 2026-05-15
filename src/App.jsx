import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import LoadingScreen from './components/LoadingScreen/LoadingScreen.jsx'
import Home from './pages/Home.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import GamesPage from './pages/GamesPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import ExamPage from './pages/ExamPage.jsx'
import CommunitiesPage from './pages/CommunitiesPage.jsx'
import PublicProfilePage from './pages/PublicProfilePage.jsx'
import { auth, db } from './FireBase/firebaseConfig.js'
import { syncDailyCampusNotifications } from './services/notificationService.js'
import { syncPublicProfile } from './services/publicProfileService.js'

function AnimatedRoutes({ isAuthenticated, onAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.015 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen"
      >
        <Routes location={location}>
          {/* Giriş Yapmamış Kullanıcı */}
          <Route
            path="/login"
            element={<LoginPage onAuthenticated={onAuthenticated} />}
          />

          {/* Giriş Yapmış Kullanıcı Rotaları */}
          <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/settings" element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" />} />
          <Route path="/games" element={isAuthenticated ? <GamesPage /> : <Navigate to="/login" />} />
          <Route path="/quiz" element={isAuthenticated ? <QuizPage /> : <Navigate to="/login" />} />
          <Route path="/exam" element={isAuthenticated ? <ExamPage /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={isAuthenticated ? <LeaderboardPage /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={isAuthenticated ? <NotificationsPage /> : <Navigate to="/login" />} />
          <Route path="/communities" element={isAuthenticated ? <CommunitiesPage /> : <Navigate to="/login" />} />

          {/* Parametreli Rotalar (User ID URL'den gelecek) */}
          <Route path="/user/:uid" element={isAuthenticated ? <PublicProfilePage /> : <Navigate to="/login" />} />

          {/* Hatalı URL'leri yakala */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const setAuthStateFromUser = (user) => {
    setIsAuthenticated(Boolean(user?.emailVerified))
  }

  useEffect(() => {
    if (!isAuthenticated || !auth.currentUser) {
      document.documentElement.dataset.theme = 'light'
      return undefined
    }

    return onSnapshot(
      doc(db, 'users', auth.currentUser.uid),
      (snapshot) => {
        const settings = snapshot.data()?.settings || {}
        const userData = snapshot.data()
        document.documentElement.dataset.theme = settings.theme === 'dark' ? 'dark' : 'light'
        document.documentElement.dataset.motion = settings.reducedMotion ? 'reduced' : 'full'
        document.documentElement.dataset.feedDensity = settings.compactFeed ? 'compact' : 'comfortable'
        document.documentElement.dataset.dataSaver = settings.dataSaver ? 'on' : 'off'

        if (userData) {
          syncPublicProfile(auth.currentUser.uid, userData).catch(() => { })
        }
      },
      (error) => console.warn('Sync error:', error)
    )
  }, [isAuthenticated])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(Boolean(user?.emailVerified))
      setIsAuthReady(true)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !auth.currentUser) return undefined

    const syncNotifications = () => {
      syncDailyCampusNotifications(auth.currentUser.uid).catch(() => { })
    }

    syncNotifications()
    const interval = window.setInterval(syncNotifications, 15 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [isAuthenticated])

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#E9F5FF]">
        <LoadingScreen />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#E9F5FF]">
        <AnimatedRoutes isAuthenticated={isAuthenticated} onAuthenticated={setAuthStateFromUser} />
      </div>
    </Router>
  )
}
