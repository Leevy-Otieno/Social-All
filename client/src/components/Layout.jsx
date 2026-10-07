import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMediaQuery } from '@/hooks'
import { useAuthStore, useUIStore, useNotifStore } from '@/store'
import { getToken, clearToken } from '@/lib/auth'
import {
  AiFillHome, AiOutlineHome,
  AiFillCompass, AiOutlineCompass,
  AiFillMessage, AiOutlineMessage,
  AiFillBell, AiOutlineBell,
  AiOutlineUser,
  AiOutlinePlus,
} from 'react-icons/ai'
import { useEffect } from 'react'
import { notifAPI } from '@/lib/api'
import CreatePost from './CreatePost'
import Avatar from './Avatar'

const navItems = [
  { path: '/',              label: 'Home',           Icon: AiOutlineHome,    ActiveIcon: AiFillHome },
  { path: '/explore',       label: 'Explore',        Icon: AiOutlineCompass, ActiveIcon: AiFillCompass },
  { path: '/messages',      label: 'Messages',       Icon: AiOutlineMessage, ActiveIcon: AiFillMessage },
  { path: '/notifications', label: 'Notifications',  Icon: AiOutlineBell,    ActiveIcon: AiFillBell },
  { path: '/profile',       label: 'Profile',        Icon: AiOutlineUser,    ActiveIcon: AiOutlineUser },
]

export default function Layout() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { createPostOpen, setCreatePostOpen } = useUIStore()
  const { unreadCount, setNotifications } = useNotifStore()

  // Redirect if token is missing (Safety Guard)
  useEffect(() => {
    if (!getToken()) {
      logout()
      navigate('/login')
    }
  }, [navigate, logout])

  useEffect(() => {
    if (!getToken()) return
    const load = () => notifAPI.get().then(r => setNotifications(r.data.notifications)).catch(() => {})
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [setNotifications])

  const handleLogout = () => {
    if(window.confirm('Are you sure you want to logout?')) {
      clearToken()
      logout()
      navigate('/login')
    }
  }

  const isChat = pathname.startsWith('/chat/')
  const isActive = (path) => path === '/profile'
    ? pathname.startsWith('/profile') || pathname === '/edit-profile' || pathname === '/analytics'
    : pathname === path

  // Navigate helper — profile goes to /profile/<username>
  const goTo = (path) => {
    if (path === '/profile') {
      if (user?.username) navigate(`/profile/${user.username}`)
      else navigate('/profile') // Fallback
    }
    else navigate(path)
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'var(--background)', color: 'var(--text-1)', fontFamily: 'var(--font-family, Inter, system-ui)' }}
    >
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      {isDesktop && (
        <aside
          className="fixed left-0 top-0 h-screen flex flex-col z-40 border-r"
          style={{
            width: '240px',
            background: 'var(--background)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Brand */}
          <div className="flex items-center gap-3 px-5 h-16 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xl font-black tracking-tight" style={{ color: 'var(--primary)' }}>YouBGram</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map(({ path, label, Icon, ActiveIcon }) => {
              const active = isActive(path)
              const badge = path === '/notifications' ? unreadCount : 0
              return (
                <button
                  key={path}
                  onClick={() => goTo(path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-150"
                  style={{
                    background: active ? 'var(--primary-light)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--text-2)',
                    fontWeight: active ? 600 : 500,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  {active ? <ActiveIcon size={20} /> : <Icon size={20} />}
                  <span className="flex-1 text-left">{label}</span>
                  {badge > 0 && (
                    <span
                      className="text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0"
                      style={{ background: 'var(--danger)' }}
                    >
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Create Post button */}
            <button
              onClick={() => setCreatePostOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold mt-3 transition-all duration-150 text-white"
              style={{ background: 'var(--primary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
            >
              <AiOutlinePlus size={20} />
              <span>Create Post</span>
            </button>
          </nav>

          {/* User card */}
          <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--surface)' }}
            >
              <button onClick={() => goTo('/profile')} className="shrink-0">
                <Avatar src={user?.avatar} name={user?.name} size={36} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>@{user?.username}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg transition-colors shrink-0"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── Main column ─────────────────────────────────────────── */}
      <main
        className="flex-1 min-h-screen"
        style={{ marginLeft: isDesktop ? '240px' : 0 }}
      >
        {/* Content feed column — centred, max 600px, with side borders on desktop */}
        <div
          className="mx-auto min-h-screen"
          style={{
            maxWidth: isDesktop ? '600px' : '100%',
            borderLeft:  isDesktop ? '1px solid var(--border)' : 'none',
            borderRight: isDesktop ? '1px solid var(--border)' : 'none',
            paddingBottom: !isDesktop && !isChat ? '64px' : 0,
          }}
        >
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ───────────────────────────────────── */}
      {!isDesktop && !isChat && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around pb-safe"
          style={{
            height: '52px',
            background: 'rgba(255,255,255,0.92)',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {navItems.map(({ path, Icon, ActiveIcon }) => {
            const active = isActive(path)
            const badge = path === '/notifications' ? unreadCount : 0
            return (
              <button
                key={path}
                onClick={() => goTo(path)}
                className="relative flex flex-col items-center justify-center transition-all active:scale-90"
                style={{
                  width: 48, height: 44,
                  color: active ? 'var(--primary)' : '#94a3b8',
                }}
              >
                {active ? <ActiveIcon size={21} /> : <Icon size={21} />}
                {/* Active dot */}
                <div style={{
                  width: active ? 4 : 0, height: 4, borderRadius: '50%',
                  background: 'var(--primary)', marginTop: 3,
                  transition: 'width 0.2s ease',
                }} />
                {badge > 0 && (
                  <span
                    className="absolute"
                    style={{
                      top: 4, right: 8,
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--danger)',
                      border: '1.5px solid white',
                    }}
                  />
                )}
              </button>
            )
          })}
        </nav>
      )}

      {/* ── Global modals (outside main column so they cover full screen) ── */}
      <CreatePost
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        onPostCreated={(post) => navigate(`/p/${post.id}`)}
      />
    </div>
  )
}
