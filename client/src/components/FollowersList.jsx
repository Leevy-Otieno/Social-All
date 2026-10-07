import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileAPI } from '@/lib/api'
import Avatar from './Avatar'
import VerifiedBadge from './VerifiedBadge'
import { AiOutlineClose } from 'react-icons/ai'
import { UserSkeleton } from './Skeleton'

export default function FollowersList({ userId, type, open, onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    const apiCall = type === 'followers' 
      ? profileAPI.getFollowers(userId)
      : profileAPI.getFollowing(userId)
    
    apiCall
      .then(r => {
        setUsers(r.data.users || [])
        setLoading(false)
      })
      .catch(() => {
        setUsers([])
        setLoading(false)
      })
  }, [open, userId, type])

  if (!open) return null

  const title = type === 'followers' ? 'Followers' : 'Following'

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full h-[70vh] md:w-[400px] md:h-[500px] bg-white rounded-t-[2.5rem] md:rounded-[2rem] flex flex-col shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-500 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-border bg-white sticky top-0 z-10">
          <h3 className="font-black text-lg tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-surface rounded-full transition-colors">
            <AiOutlineClose size={20} className="text-text-primary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-1">
              <UserSkeleton />
              <UserSkeleton />
              <UserSkeleton />
              <UserSkeleton />
            </div>
          ) : (
            <>
              {users.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="text-4xl mb-4 opacity-20">👥</div>
                  <p className="text-sm font-bold text-text-muted">No {title.toLowerCase()} yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {users.map((u, i) => (
                    <button
                      key={u.id}
                      onClick={() => { onClose(); navigate(`/profile/${u.username}`) }}
                      className="flex items-center gap-4 w-full p-3 hover:bg-surface rounded-2xl transition-all animate-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <Avatar src={u.avatar} name={u.name} size={44} />
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="font-bold text-sm text-text-primary truncate">{u.name}</p>
                          {u.is_verified ? <VerifiedBadge size={14} /> : null}
                        </div>
                        <p className="text-xs text-text-muted">@{u.username}</p>
                      </div>
                      <div className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest">View</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
