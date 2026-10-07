import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMediaQuery } from '@/hooks'
import { useAuthStore } from '@/store'
import { clearToken } from '@/lib/auth'
import { 
  AiOutlineDashboard, 
  AiOutlineUser, 
  AiOutlineFileText, 
  AiOutlineNotification, 
  AiOutlineLogout,
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineAppstore,
  AiOutlineTrophy
} from 'react-icons/ai'
import { useState } from 'react'

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', Icon: AiOutlineDashboard },
  { path: '/admin/users', label: 'Users', Icon: AiOutlineUser },
  { path: '/admin/content', label: 'Content', Icon: AiOutlineFileText },
  { path: '/admin/ads', label: 'Ads Management', Icon: AiOutlineAppstore },
  { path: '/admin/xp', label: 'XP Management', Icon: AiOutlineTrophy },
  { path: '/admin/settings', label: 'Settings', Icon: AiOutlineNotification },
]

export default function AdminLayout() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    clearToken()
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-400">
      <div className="p-8 border-b border-white/5">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <span className="tracking-tighter">YouBGram <span className="text-slate-500 font-medium">Admin</span></span>
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {adminNavItems.map(({ path, label, Icon }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => {
                navigate(path)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group/nav ${active ? 'bg-white text-slate-900 font-black shadow-2xl shadow-black/40' : 'hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={20} className={active ? 'text-rose-500' : 'opacity-50 group-hover/nav:opacity-100 transition-opacity'} />
              <span className="text-[14px] uppercase tracking-[0.1em]">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-danger hover:bg-danger/10 transition-all font-bold"
        >
          <AiOutlineLogout size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      {isDesktop && (
        <aside className="w-[280px] fixed inset-y-0 left-0 z-50">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Drawer */}
      {!isDesktop && sidebarOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-[280px] h-full animate-in slide-in-from-left duration-300">
            <SidebarContent />
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 -right-12 p-2 text-white bg-slate-900 rounded-lg lg:hidden"
            >
              <AiOutlineClose size={24} />
            </button>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isDesktop ? 'ml-[280px]' : ''}`}>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
          {!isDesktop && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <AiOutlineMenu size={24} />
            </button>
          )}
          <div className="flex-1 px-4 lg:px-0">
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                {adminNavItems.find(item => item.path === pathname)?.label || 'Administration'}
             </h2>
          </div>
          <div className="flex items-center gap-4">
             {/* Admin Status/Avatar */}
             <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-black text-slate-700">Administrator</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-tight">Super User</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300" />
             </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
