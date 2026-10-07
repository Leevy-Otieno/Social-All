import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { exploreAPI, profileAPI, leaderboardAPI } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import Avatar from '@/components/Avatar'
import VerifiedBadge from '@/components/VerifiedBadge'
import { XpCoin, getLevel } from '@/components/XpSnackbar'
import { GridSkeleton, UserSkeleton } from '@/components/Skeleton'
import { useAuthStore, useXpStore } from '@/store'
import { AiOutlineSearch, AiOutlineHeart, AiOutlineMessage, AiOutlineClose, AiOutlineTrophy } from 'react-icons/ai'

export default function Explore() {
  const location = useLocation()
  const initialTab = new URLSearchParams(location.search).get('tab') || 'posts'
  const [tab, setTab] = useState(initialTab)
  const [q, setQ] = useState('')
  const [results, setResults] = useState({ posts: [], users: [] })
  const [loading, setLoading] = useState(false)
  const [followState, setFollowState] = useState({}) // { [userId]: true/false }
  const [followLoading, setFollowLoading] = useState({})
  const [rankData, setRankData] = useState({ users: [], xpPerLevel: 1000, maxLevel: 100 })
  const [rankLoading, setRankLoading] = useState(false)
  const navigate = useNavigate()
  const { user: me } = useAuthStore()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const queryTab = params.get('tab')
    const queryQ = params.get('q')
    if (queryTab && ['posts', 'users', 'rank'].includes(queryTab)) setTab(queryTab)
    if (queryQ) { setQ(queryQ); performSearch(queryQ) }
    else loadDefaults()
  }, [location.search])

  useEffect(() => {
    if (tab === 'rank' && rankData.users.length === 0) loadRank()
  }, [tab])

  const loadRank = async () => {
    setRankLoading(true)
    try {
      const r = await leaderboardAPI.get()
      setRankData({ users: r.data.users || [], xpPerLevel: r.data.xpPerLevel || 1000, maxLevel: r.data.maxLevel || 100 })
    } catch {}
    finally { setRankLoading(false) }
  }

  const loadDefaults = async () => {
    setLoading(true)
    try {
      const [p, u] = await Promise.all([exploreAPI.posts(), exploreAPI.users()])
      const users = u.data.users || []
      setResults({ posts: p.data.posts || [], users })
      // Seed follow state from backend `following` field
      const fs = {}
      users.forEach(usr => { fs[usr.id] = !!usr.following })
      setFollowState(fs)
    } catch {}
    finally { setLoading(false) }
  }

  const performSearch = async (query) => {
    if (query.length < 2) return
    setLoading(true)
    try {
      const r = await exploreAPI.search(query)
      const users = r.data.users || []
      setResults({ posts: r.data.posts || [], users })
      const fs = {}
      users.forEach(usr => { fs[usr.id] = !!usr.following })
      setFollowState(prev => ({ ...prev, ...fs }))
    } catch {}
    finally { setLoading(false) }
  }

  const handleSearch = () => {
    if (!q.trim()) return
    navigate(`/explore?q=${encodeURIComponent(q)}&tab=${tab}`)
  }

  const clearSearch = () => {
    setQ('')
    navigate('/explore')
  }

  const toggleFollow = async (u) => {
    if (u.id === me?.id) return
    const isFollowing = followState[u.id]
    setFollowLoading(prev => ({ ...prev, [u.id]: true }))
    try {
      if (isFollowing) {
        await profileAPI.unfollow(u.id)
        setFollowState(prev => ({ ...prev, [u.id]: false }))
      } else {
        const r = await profileAPI.follow(u.id)
        setFollowState(prev => ({ ...prev, [u.id]: true }))
        if (r.data?.xp_earned > 0) useXpStore.getState().showXp(r.data.xp_earned, 'follow')
      }
    } catch {}
    finally { setFollowLoading(prev => ({ ...prev, [u.id]: false })) }
  }

  return (
    <div className="min-h-screen fade-in">
      {/* Search bar */}
      <div
        className="sticky top-0 z-20 px-4 py-3 border-b"
        style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}
        >
          <AiOutlineSearch size={17} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search people or posts…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-1)', fontFamily: 'inherit' }}
          />
          {q && (
            <button onClick={clearSearch} style={{ color: 'var(--text-3)', display: 'flex' }}>
              <AiOutlineClose size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {['posts', 'users', 'rank'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-semibold capitalize relative transition-colors"
            style={{ color: tab === t ? 'var(--primary)' : 'var(--text-3)' }}
          >
            {t === 'rank' ? '🏆 Rank' : t}
            {tab === t && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full" style={{ background: 'var(--primary)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        tab === 'posts' ? <GridSkeleton /> : (
          <div className="p-3 space-y-2">
            <UserSkeleton /><UserSkeleton /><UserSkeleton />
          </div>
        )
      ) : (
        <>
          {tab === 'posts' && (
            results.posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2" style={{ color: 'var(--text-3)' }}>
                <AiOutlineSearch size={40} style={{ opacity: 0.3 }} />
                <p className="font-semibold" style={{ color: 'var(--text-2)' }}>No posts found</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
                {results.posts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/p/${p.id}`)}
                    className="aspect-square relative group overflow-hidden"
                    style={{ background: 'var(--surface)' }}
                  >
                    {p.image ? (
                      <img src={getImageUrl(p.image)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2" style={{ background: 'var(--surface)' }}>
                        <p className="text-[10px] font-medium text-center line-clamp-4" style={{ color: 'var(--text-2)' }}>{p.text}</p>
                      </div>
                    )}
                    <div
                      className="absolute inset-0 flex items-center justify-center gap-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: 'rgba(15,23,42,0.45)' }}
                    >
                      <span className="flex items-center gap-1 text-xs font-bold"><AiOutlineHeart size={15} />{p.likes_count || 0}</span>
                      <span className="flex items-center gap-1 text-xs font-bold"><AiOutlineMessage size={15} />{p.comments_count || 0}</span>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {tab === 'users' && (
            results.users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2" style={{ color: 'var(--text-3)' }}>
                <p className="font-semibold" style={{ color: 'var(--text-2)' }}>No users found</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {results.users.map(u => {
                  const isMe = u.id === me?.id
                  const isFollowing = followState[u.id]
                  const busy = followLoading[u.id]
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors"
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <button onClick={() => navigate(`/profile/${u.username}`)} className="shrink-0">
                        <Avatar src={u.avatar} name={u.name} size={44} />
                      </button>
                      <button className="flex-1 min-w-0 text-left" onClick={() => navigate(`/profile/${u.username}`)}>
                        <div className="flex items-center">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>{u.name}</p>
                          {u.is_verified ? <VerifiedBadge size={14} /> : null}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>@{u.username}</p>
                      </button>
                      {!isMe && (
                        <button
                          onClick={() => toggleFollow(u)}
                          disabled={busy}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95 disabled:opacity-50 shrink-0"
                          style={isFollowing
                            ? { color: 'var(--text-2)', borderColor: 'var(--border)', background: 'var(--surface)' }
                            : { color: 'white', borderColor: 'var(--primary)', background: 'var(--primary)' }
                          }
                        >
                          {busy ? '…' : isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          )}
          {tab === 'rank' && (
            rankLoading ? (
              <div className="p-3 space-y-2"><UserSkeleton /><UserSkeleton /><UserSkeleton /><UserSkeleton /></div>
            ) : (
              <div className="pb-20">
                {/* Top 4 highlighted cards */}
                {rankData.users.slice(0, 4).length > 0 && (
                  <div style={{ padding: '12px 12px 4px' }}>
                    {rankData.users.slice(0, 4).map((u, idx) => {
                      const { level, progress } = getLevel(u.xp, rankData.xpPerLevel, rankData.maxLevel)
                      const rankMeta = [
                        { medal: '🥇', accent: '#F59E0B', bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', label: '1st' },
                        { medal: '🥈', accent: '#94A3B8', bg: 'linear-gradient(135deg, #F8FAFC, #E2E8F0)', label: '2nd' },
                        { medal: '🥉', accent: '#D97706', bg: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', label: '3rd' },
                        { medal: '💎', accent: '#8B5CF6', bg: 'linear-gradient(135deg, #FAF5FF, #EDE9FE)', label: '4th' },
                      ]
                      const meta = rankMeta[idx]
                      return (
                        <button
                          key={u.id}
                          onClick={() => navigate(`/profile/${u.username}`)}
                          className="w-full text-left transition-all active:scale-[0.98]"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', marginBottom: 8, borderRadius: 14,
                            background: meta.bg, border: '1px solid transparent',
                            borderLeftWidth: 4, borderLeftColor: meta.accent,
                            borderLeftStyle: 'solid',
                          }}
                        >
                          {/* Medal + Rank */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                            <span style={{ fontSize: 22, lineHeight: 1 }}>{meta.medal}</span>
                            <span style={{ fontSize: 9, fontWeight: 800, color: meta.accent, marginTop: 2 }}>{meta.label}</span>
                          </div>

                          {/* Avatar */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar src={u.avatar} name={u.name} size={idx === 0 ? 48 : 44} />
                            <div style={{
                              position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
                              background: meta.accent, color: '#fff',
                              fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 8, whiteSpace: 'nowrap',
                              lineHeight: '14px',
                            }}>Lv.{level}</div>
                          </div>

                          {/* Name + username */}
                          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <div className="flex items-center">
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                              {u.is_verified ? <VerifiedBadge size={14} /> : null}
                            </div>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>@{u.username}</p>
                            {/* Mini progress bar */}
                            <div style={{ marginTop: 4, height: 3, borderRadius: 3, background: `${meta.accent}20`, overflow: 'hidden', maxWidth: 100 }}>
                              <div style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 3, background: meta.accent, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>

                          {/* XP */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <XpCoin size={14} />
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>{(u.xp || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Separator */}
                {rankData.users.length > 4 && (
                  <div style={{ padding: '6px 16px 2px' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Other Rankings</p>
                  </div>
                )}

                {/* Remaining users — simple minimal list */}
                {rankData.users.slice(4).map((u, i) => {
                  const rank = i + 5
                  const { level } = getLevel(u.xp, rankData.xpPerLevel, rankData.maxLevel)
                  return (
                    <button
                      key={u.id}
                      onClick={() => navigate(`/profile/${u.username}`)}
                      className="w-full flex items-center gap-3 text-left transition-colors"
                      style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', width: 28, textAlign: 'center', flexShrink: 0 }}>{rank}</span>
                      <Avatar src={u.avatar} name={u.name} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center">
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                          {u.is_verified ? <VerifiedBadge size={14} /> : null}
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--text-3)', margin: 0 }}>Lv.{level}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                        <XpCoin size={12} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{(u.xp || 0).toLocaleString()}</span>
                      </div>
                    </button>
                  )
                })}

                {rankData.users.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 gap-2" style={{ color: 'var(--text-3)' }}>
                    <AiOutlineTrophy size={40} style={{ opacity: 0.3 }} />
                    <p className="font-semibold" style={{ color: 'var(--text-2)' }}>No rankings yet</p>
                  </div>
                )}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
