import { useNavigate } from 'react-router-dom'
import { profileAPI } from '@/lib/api'
import { useXpStore } from '@/store'
import Avatar from './Avatar'
import VerifiedBadge from './VerifiedBadge'
import { useState } from 'react'
import { AiOutlineRight, AiOutlineUsergroupAdd } from 'react-icons/ai'

export default function SuggestionCard({ users = [] }) {
  const navigate = useNavigate()
  const [followedMap, setFollowedMap] = useState({})

  const handleFollow = async (id) => {
    // Optimistic update
    setFollowedMap(prev => ({ ...prev, [id]: true }))
    try {
      const r = await profileAPI.follow(id)
      if (r.data?.xp_earned > 0) useXpStore.getState().showXp(r.data.xp_earned, 'follow')
    } catch {
      setFollowedMap(prev => ({ ...prev, [id]: false }))
    }
  }

  if (!users.length) return null

  return (
    <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2">
          <AiOutlineUsergroupAdd size={16} style={{ color: 'var(--primary)' }} />
          <div>
            <h3 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-1)' }}>
              People you may know
            </h3>
          </div>
        </div>
        <button
          onClick={() => navigate('/explore?tab=users')}
          className="flex items-center gap-0.5 text-xs font-semibold shrink-0"
          style={{ color: 'var(--primary)' }}
        >
          See all <AiOutlineRight size={12} />
        </button>
      </div>

      {/* Horizontal scroll */}
      <div
        className="flex gap-2.5 overflow-x-auto pb-4 px-4"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {users.map(u => (
          <div
            key={u.id}
            className="flex-shrink-0 flex flex-col items-center text-center rounded-2xl border p-3"
            style={{
              width: 108,
              background: 'var(--background)',
              borderColor: 'var(--border)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            }}
          >
            {/* Avatar */}
            <button
              onClick={() => navigate(`/profile/${u.username}`)}
              className="mb-1.5 transition-transform active:scale-90"
            >
              <Avatar src={u.avatar} name={u.name} size={50} />
            </button>

            {/* Name */}
            <button
              onClick={() => navigate(`/profile/${u.username}`)}
              className="text-xs font-bold w-full leading-tight flex items-center justify-center"
              style={{ color: 'var(--text-1)' }}
            >
              <span className="truncate">{u.name}</span>
              {u.is_verified ? <VerifiedBadge size={12} /> : null}
            </button>

            {/* Username */}
            <p
              className="text-[10px] truncate w-full mt-0.5 mb-2.5"
              style={{ color: 'var(--text-3)' }}
            >
              @{u.username}
            </p>

            {/* Follow button */}
            <button
              onClick={() => handleFollow(u.id)}
              disabled={followedMap[u.id]}
              className="w-full py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 disabled:opacity-70"
              style={{
                background: followedMap[u.id] ? 'var(--surface)' : 'var(--primary)',
                color: followedMap[u.id] ? 'var(--text-2)' : 'white',
                border: followedMap[u.id] ? '1px solid var(--border)' : 'none',
              }}
            >
              {followedMap[u.id] ? '✓ Following' : 'Follow'}
            </button>
          </div>
        ))}

        {/* "Explore more" tile */}
        <button
          className="flex-shrink-0 flex flex-col items-center justify-center text-center rounded-2xl border p-3 transition-all active:scale-95"
          style={{
            width: 108,
            background: 'var(--primary-light)',
            borderColor: 'rgba(37,99,235,0.2)',
          }}
          onClick={() => navigate('/explore?tab=users')}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
            style={{ background: 'var(--primary)' }}
          >
            <AiOutlineRight size={20} color="white" />
          </div>
          <p className="text-xs font-bold leading-tight" style={{ color: 'var(--primary)' }}>
            Explore more
          </p>
        </button>
      </div>
    </div>
  )
}
