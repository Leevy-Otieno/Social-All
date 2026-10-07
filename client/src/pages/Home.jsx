import { useEffect, useState, useRef, useCallback } from 'react'
import { AiOutlinePlus, AiOutlineReload, AiOutlineBell } from 'react-icons/ai'
import { useFeedStore, useUIStore, useNotifStore } from '@/store'
import { useNavigate } from 'react-router-dom'
import { feedAPI, exploreAPI } from '@/lib/api'
import PostCard from '@/components/PostCard'
import AdCard from '@/components/AdCard'
import SuggestionCard from '@/components/SuggestionCard'
import { PostSkeleton } from '@/components/Skeleton'

// Insert a suggestion block every N real posts
const SUGGEST_EVERY = 6

function injectSuggestions(feedItems, suggestionUsers) {
  if (!suggestionUsers?.length) return feedItems
  const result = []
  let postCount = 0
  for (const item of feedItems) {
    result.push(item)
    if (item.type === 'post') {
      postCount++
      if (postCount % SUGGEST_EVERY === 0) {
        result.push({ type: 'suggestion', data: { users: suggestionUsers } })
      }
    }
  }
  return result
}

export default function Home() {
  const { posts, page, hasMore, loading, setPosts, appendPosts, setPage, setHasMore, setLoading, removePost } = useFeedStore()
  const { setCreatePostOpen } = useUIStore()
  const { unreadCount } = useNotifStore()
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)
  const [suggestUsers, setSuggestUsers] = useState([])
  const [recycleMode, setRecycleMode] = useState(false)
  const [seenPostIds, setSeenPostIds] = useState(new Set())
  const [recycleRound, setRecycleRound] = useState(0)
  const sentinelRef = useRef(null)
  const loadingRef = useRef(false)

  // Fetch suggestion users once on mount
  useEffect(() => {
    exploreAPI.users(1)
      .then(r => {
        const users = (r.data.users || []).filter(u => !u.isSelf && !u.following)
        setSuggestUsers(users.slice(0, 10))
      })
      .catch(() => {})
  }, [])

  const load = useCallback(async (p = 1, reset = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      let params = {}

      if (recycleMode && !reset) {
        const recentSeen = [...seenPostIds].slice(-60)
        params = { recycle: '1', seenIds: recentSeen.join(',') }
      }

      const r = await feedAPI.getFeed(reset ? 1 : p, params)
      const rawFeed = r.data.feed || []
      const onlyPostsAndAds = rawFeed.filter(i => i.type !== 'suggestion')

      const newPostIds = onlyPostsAndAds
        .filter(i => i.type === 'post' && i.data?.id)
        .map(i => i.data.id)

      if (reset) {
        setPosts(onlyPostsAndAds)
        setRecycleMode(false)
        setSeenPostIds(new Set(newPostIds))
        setRecycleRound(0)
      } else {
        appendPosts(onlyPostsAndAds)
        setSeenPostIds(prev => {
          const updated = new Set(prev)
          newPostIds.forEach(id => updated.add(id))
          return updated
        })
      }

      if (!r.data.hasMore && !recycleMode && !reset && r.data.totalPosts > 0) {
        setRecycleMode(true)
        setHasMore(true)
      } else if (recycleMode) {
        setHasMore(true)
        setRecycleRound(prev => prev + 1)
      } else {
        setHasMore(r.data.hasMore)
      }

      setPage(reset ? 1 : p)
    } catch (e) { console.error(e) }
    finally {
      setLoading(false)
      setTimeout(() => { loadingRef.current = false }, 800)
    }
  }, [appendPosts, setPosts, setHasMore, setPage, setLoading, recycleMode, seenPostIds])

  // Initial load
  useEffect(() => {
    if (posts.length === 0) load(1, true)
  }, [])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingRef.current) {
          if (recycleMode) {
            load(1)
          } else {
            load(page + 1)
          }
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [page, hasMore, load, recycleMode])

  const handleRefresh = async () => {
    setRefreshing(true)
    setRecycleMode(false)
    setSeenPostIds(new Set())
    await load(1, true)
    setRefreshing(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const displayFeed = injectSuggestions(posts, suggestUsers)

  return (
    <div className="min-h-screen pb-20 fade-in">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 px-4 h-14 flex items-center justify-between border-b"
        style={{
          background: 'rgba(255,255,255,0.93)',
          borderColor: 'var(--border)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Home</h1>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCreatePostOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-white transition-all active:scale-95"
            style={{ background: 'var(--primary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
          >
            <AiOutlinePlus size={16} />
            <span className="hidden sm:inline">New post</span>
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2.5 rounded-full transition-all active:scale-90"
            style={{ color: 'var(--text-2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <AiOutlineBell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white" style={{ background: 'var(--danger)' }} />
            )}
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2.5 rounded-full transition-all active:scale-90 ${refreshing ? 'animate-spin' : ''}`}
            style={{ color: refreshing ? 'var(--primary)' : 'var(--text-3)' }}
            onMouseEnter={e => { if (!refreshing) e.currentTarget.style.background = 'var(--surface)' }}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <AiOutlineReload size={18} />
          </button>
        </div>
      </div>

      {/* Feed */}
      <div>
        {displayFeed.map((item, idx) => {
          if (item.type === 'ad') {
            return <AdCard key={`ad-${item.data?.id ?? idx}`} ad={item.data} />
          }
          if (item.type === 'suggestion') {
            const bucket = Math.floor(idx / (SUGGEST_EVERY + 1))
            return <SuggestionCard key={`suggest-${bucket}`} users={item.data?.users || []} />
          }
          return <PostCard key={`post-${item.data?.id ?? idx}-${idx}`} item={item} onDelete={removePost} />
        })}

        {loading && (
          <div>
            <PostSkeleton />
            <PostSkeleton />
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />

        {recycleMode && !loading && posts.length > 0 && recycleRound > 0 && recycleRound % 3 === 0 && (
          <div style={{
            padding: '12px 16px', margin: '0 16px 8px', borderRadius: 12,
            background: 'linear-gradient(135deg, #DBEAFE, #EDE9FE)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#4338CA', margin: 0 }}>
              ✨ You've seen all posts — showing more you might enjoy!
            </p>
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="py-24 text-center" style={{ color: 'var(--text-3)' }}>
            <p className="text-base font-semibold" style={{ color: 'var(--text-2)' }}>Your feed is empty</p>
            <p className="text-sm mt-1">Follow people to see their posts here.</p>
            {suggestUsers.length > 0 && (
              <div className="mt-6">
                <SuggestionCard users={suggestUsers} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
