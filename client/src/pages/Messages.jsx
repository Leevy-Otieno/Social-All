import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import Avatar from '@/components/Avatar'

import VerifiedBadge from '@/components/VerifiedBadge'

export default function Messages() {
  const [convs, setConvs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    chatAPI.getConvs()
      .then(r => setConvs(r.data.conversations))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen fade-in">
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center px-4 h-12 border-b"
        style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}
      >
        <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Messages</span>
      </div>

      {loading && (
        <div className="space-y-0">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b animate-pulse" style={{ borderColor: 'var(--border)' }}>
              <div className="w-11 h-11 rounded-full shrink-0" style={{ background: 'var(--border)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded" style={{ background: 'var(--border)', width: '40%' }} />
                <div className="h-2.5 rounded" style={{ background: 'var(--border)', width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && convs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>💬</div>
          <p className="font-semibold" style={{ color: 'var(--text-2)' }}>No messages yet</p>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Visit a profile and tap Message to start chatting.</p>
        </div>
      )}

      {convs.map(c => (
        <button
          key={c.id}
          onClick={() => navigate(`/chat/${c.other_user_id}`)}
          className="w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors"
          style={{ borderColor: 'var(--border)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className="relative shrink-0">
            <Avatar src={c.other_avatar} name={c.other_name} size={44} />
            {!c.is_read && c.last_message_text && (
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ background: 'var(--primary)' }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>{c.other_name}</p>
                {c.other_is_verified ? <VerifiedBadge size={14} /> : null}
              </div>
              <p className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>{formatDate(c.last_message_time || c.created_at)}</p>
            </div>
            <p
              className="text-sm truncate mt-0.5"
              style={{ color: !c.is_read && c.last_message_text ? 'var(--text-1)' : 'var(--text-3)', fontWeight: !c.is_read && c.last_message_text ? 600 : 400 }}
            >
              {c.last_message_text || 'No messages yet'}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
