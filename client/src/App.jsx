import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from './store'
import { getToken, getAdminToken, clearToken } from './lib/auth'
import { authAPI, configAPI } from './lib/api'
import { setConfig } from './config'
import { initPushNotifications } from './lib/notifications'

import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Step1 from './pages/auth/Step1'
import Step2 from './pages/auth/Step2'
import Step3 from './pages/auth/Step3'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Notifications from './pages/Notifications'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import OtherProfile from './pages/OtherProfile'
import EditProfile from './pages/EditProfile'
import Analytics from './pages/Analytics'
import PostPage from './pages/PostPage'
import PrivacyLimits from './pages/PrivacyLimits'

import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminContent from './pages/admin/Content'
import AdminAds from './pages/admin/Ads'
import AdminSettings from './pages/admin/Settings'
import AdminXP from './pages/admin/XP'
import AdminLayout from './components/admin/AdminLayout'
import XpSnackbar from './components/XpSnackbar'
import PWAHandler from './components/PWAHandler'

function AuthGuard({ children, requireProfile = true }) {
  const { user, setUser } = useAuthStore()
  const location = useLocation()
  const [checking, setChecking] = useState(!user && !!getToken())

  useEffect(() => {
    if (!user && getToken()) {
      setChecking(true)
      authAPI.me()
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.removeItem('auth_token'))
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [user, setUser])

  if (!getToken()) return <Navigate to="/login" replace state={{ from: location }} />

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'var(--background)' }}>
        <div style={{ width: 28, height: 28, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    )
  }

  if (requireProfile && user && !user.is_profile_complete) {
    const step = user.profile_step || 1
    return <Navigate to={`/setup/step${step}`} replace />
  }
  return children
}

function SetupGuard({ children }) {
  const { user, setUser } = useAuthStore()
  const [checking, setChecking] = useState(!user && !!getToken())

  useEffect(() => {
    if (!user && getToken()) {
      setChecking(true)
      authAPI.me()
        .then(r => setUser(r.data.user))
        .catch(() => {})
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [user, setUser])

  if (!getToken()) return <Navigate to="/login" replace />
  if (checking) return null

  if (user && user.is_profile_complete) {
    return <Navigate to="/" replace />
  }

  return children
}

function AdminGuard({ children }) {
  const location = useLocation()
  if (!getAdminToken()) return <Navigate to="/admin" replace state={{ from: location }} />
  return children
}

function AppInit() {
  const { setUser, setToken, setAdminToken, logout } = useAuthStore()
  useEffect(() => {
    const t = getToken()
    const a = getAdminToken()
    if (t) {
        setToken(t)
        initPushNotifications()
    }
    if (a) setAdminToken(a)
    
    if (t) {
      authAPI.me()
        .then(r => setUser(r.data.user))
        .catch(() => {
          // If profile fetch fails (e.g. invalid/expired token), force logout
          clearToken()
          logout()
        })
    }
    
    configAPI.get().then(r => setConfig(r.data.data)).catch(() => {})
  }, [setUser, setToken, setAdminToken, logout])
  return null
}

export default function App() {
  return (
    <>
      <AppInit />
      <XpSnackbar />
      <PWAHandler />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/setup/step1" element={<SetupGuard><Step1 /></SetupGuard>} />
        <Route path="/setup/step2" element={<SetupGuard><Step2 /></SetupGuard>} />
        <Route path="/setup/step3" element={<SetupGuard><Step3 /></SetupGuard>} />
        <Route path="/admin" element={<Login admin />} />

        {/* Protected */}
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/chat/:userId" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:username" element={<OtherProfile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/privacy-limits" element={<PrivacyLimits />} />
        </Route>

        <Route path="/p/:postId" element={<AuthGuard><PostPage /></AuthGuard>} />

        {/* Admin */}
        <Route element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/content" element={<AdminContent />} />
          <Route path="/admin/ads" element={<AdminAds />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/xp" element={<AdminXP />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
