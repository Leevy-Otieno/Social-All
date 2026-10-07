import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifStore } from '@/store'
import { notifAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import Avatar from '@/components/Avatar'
import AdCard from '@/components/AdCard'
import VerifiedBadge from '@/components/VerifiedBadge'

const NOTIF_ICONS = {
  like:    { bg: 'rgba(239,68,68,0.1)',   color: 'var(--danger)',  emoji: '❤️' },
  comment: { bg: 'rgba(37,99,235,0.1)',   color: 'var(--primary)', emoji: '💬' },
  follow:  { bg: 'rgba(34,197,94,0.1)',   color: 'var(--success)', emoji: '👤' },
  reply:   { bg: 'rgba(14,165,233,0.1)',  color: 'var(--accent)',  emoji: '↩️' },
  system:  { bg: 'rgba(139,92,246,0.1)',  color: '#8B5CF6',        emoji: '🎉' },
  default: { bg: 'rgba(100,116,139,0.1)', color: 'var(--text-3)',  emoji: '🔔' },
}

export default function Notifications() {
  const { notifications, setNotifications, markAllRead } = useNotifStore()
  const navigate = useNavigate()

  useEffect(() => {
    notifAPI.get().then(r => setNotifications(r.data.notifications)).catch(() => {})
  }, [setNotifications])

  const handleReadAll = async () => {
    await notifAPI.readAll()
    markAllRead()
  }

  return (
    <div className="min-h-screen fade-in">
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-4 h-12 border-b"
        style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}
      >
        <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Notifications</span>
        {notifications.some(n => !n.is_read) && (
          <button onClick={handleReadAll} className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-2" style={{ color: 'var(--text-3)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>🔔</div>
          <p className="font-semibold" style={{ color: 'var(--text-2)' }}>No notifications yet</p>
        </div>
      )}

      {notifications.map((n, i) => {
        const style = NOTIF_ICONS[n.type] || NOTIF_ICONS.default
        return (
          <div key={n.id}>
            <div
              className="flex items-start gap-3 px-4 py-3 border-b transition-colors cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                background: n.is_read ? 'transparent' : 'var(--primary-light)',
                borderLeft: n.is_read ? 'none' : '3px solid var(--primary)',
              }}
              onClick={() => {
                if (n.target_type === 'post' || n.target_type === 'comment') navigate(`/p/${n.target_id}`)
                else navigate(`/profile/${n.actor_username}`)
              }}
            >
              {/* Actor avatar with type icon */}
              <div className="relative shrink-0">
                <button onClick={e => { e.stopPropagation(); navigate(`/profile/${n.actor_username}`) }}>
                  <Avatar src={n.actor_avatar} name={n.actor_name} size={40} />
                </button>
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-white"
                  style={{ background: style.bg }}
                >
                  {style.emoji}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'var(--text-1)' }}>
                  <span className="inline-flex items-center gap-1 align-bottom">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/profile/${n.actor_username}`) }}
                      className="font-semibold hover:underline"
                    >
                      {n.actor_name || 'System'}
                    </button>
                    {n.actor_is_verified ? <VerifiedBadge size={14} /> : null}
                  </span>{' '}
                  <span style={{ color: 'var(--text-2)' }}>{n.message}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{formatDate(n.created_at)}</p>
              </div>

              {!n.is_read && (
                <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: 'var(--primary)' }} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
