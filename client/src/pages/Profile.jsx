import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '@/lib/utils'
import { useAuthStore } from '@/store'
import { profileAPI, xpAPI, authAPI } from '@/lib/api'
import Avatar from '@/components/Avatar'
import VerifiedBadge from '@/components/VerifiedBadge'
import { XpCoin, getLevel } from '@/components/XpSnackbar'
import FollowersList from '@/components/FollowersList'
import { GridSkeleton } from '@/components/Skeleton'
import { AiOutlineHeart, AiOutlineMessage, AiOutlineCamera, AiOutlineLogout, AiOutlineInfoCircle } from 'react-icons/ai'
import { clearToken } from '@/lib/auth'
import { useUIStore } from '@/store'
import FormattedText from '@/components/FormattedText'

// Build the full HTML document string to inject into iframe srcdoc
function buildAboutDoc(html) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px; color: #0f172a; line-height: 1.6;
      padding: 16px; background: #fff;
    }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    a { color: #2563EB; text-decoration: none; }
    a:hover { text-decoration: underline; }
    h1, h2, h3, h4 { margin-top: 12px; margin-bottom: 6px; line-height: 1.3; }
    p { margin-bottom: 8px; }
    ul, ol { padding-left: 20px; margin-bottom: 8px; }
    /* Auto-resize helper */
  </style>
</head>
<body>
${html}
<script>
  // Post height to parent so iframe can auto-size
  function sendHeight() {
    var h = document.documentElement.scrollHeight || document.body.scrollHeight;
    window.parent.postMessage({ type: 'about-height', height: h }, '*');
  }
  window.addEventListener('load', sendHeight);
  new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true, attributes: true });
<\/script>
</body>
</html>`
}

export default function Profile() {
  const { user, setUser, logout } = useAuthStore()
  const { setCreatePostOpen } = useUIStore()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('posts')
  const [followersOpen, setFollowersOpen] = useState(false)
  const [followingOpen, setFollowingOpen] = useState(false)
  const [iframeHeight, setIframeHeight] = useState(300)

  // Re-fetch user data from server to pick up admin changes (e.g. blue tick verification)
  useEffect(() => {
    authAPI.me()
      .then(r => { if (r.data?.user) setUser(r.data.user) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!user?.username) return
    setLoading(true)
    profileAPI.getPosts(user.username)
      .then(r => setPosts(r.data.posts))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.username])

  // Listen for height messages from the iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'about-height' && typeof e.data.height === 'number') {
        setIframeHeight(Math.max(200, e.data.height + 24))
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const aboutSrcdoc = useMemo(
    () => buildAboutDoc(user?.about_html || ''),
    [user?.about_html]
  )

  const hasAbout = !!(user?.about_html?.trim())

  return (
    <div className="min-h-screen pb-24 fade-in">
      {/* ── Profile header ── */}
      <div className="px-5 pt-6 pb-5 border-b relative" style={{ borderColor: 'var(--border)' }}>
        {/* Top-right Actions Toolbar */}
        <div className="absolute top-6 right-5 flex items-center gap-2.5">
          <button 
            onClick={() => navigate('/privacy-limits')}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-white hover:shadow-sm"
            title="Privacy & Limits"
          >
            <AiOutlineInfoCircle size={20} />
          </button>

          <button 
            onClick={() => {
              if(window.confirm('Are you sure you want to logout?')) {
                clearToken();
                logout();
                navigate('/login');
              }
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20 hover:bg-red-100/50"
            title="Logout"
          >
            <AiOutlineLogout size={19} />
          </button>
        </div>

        {/* Top row: avatar + stats */}
        <div className="flex items-start gap-5 mb-4">
          <div className="relative shrink-0">
            <Avatar src={user?.avatar} name={user?.name} size={80} />
          </div>
          <div className="flex flex-1 items-center justify-around text-center pt-2">
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{user?.posts_count || 0}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Posts</p>
            </div>
            <button onClick={() => setFollowersOpen(true)} className="transition-opacity hover:opacity-70">
              <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{user?.followers_count || 0}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Followers</p>
            </button>
            <button onClick={() => setFollowingOpen(true)} className="transition-opacity hover:opacity-70">
              <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{user?.following_count || 0}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Following</p>
            </button>
          </div>
        </div>

        {/* Name + bio + XP */}
        <div className="mb-3">
          <div className="flex items-center">
            <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{user?.name}</p>
            {user?.is_verified ? <VerifiedBadge size={16} /> : null}
          </div>
          {user?.account_type && (
            <span className="badge-surface text-xs mt-0.5">{user.account_type}</span>
          )}
          {/* XP Level Badge */}
          {(() => {
            const { level, progress, xpInLevel, xpNeeded } = getLevel(user?.xp)
            return (
              <div className="flex items-center gap-2 mt-2" style={{ padding: '6px 12px', borderRadius: 12, background: 'linear-gradient(135deg, #065f4620, #16a34a15)' }}>
                <XpCoin size={20} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Level {level}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{(user?.xp || 0).toLocaleString()} XP</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 4, background: 'linear-gradient(90deg, #4ade80, #16a34a)', transition: 'width 0.5s ease' }} />
                  </div>
                  <p style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2 }}>{xpInLevel}/{xpNeeded} XP to next level</p>
                </div>
              </div>
            )
          })()}
          {user?.bio && (
            <div className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
              <FormattedText text={user.bio} />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/edit-profile')}
            className="flex-1 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95"
            style={{ background: 'var(--surface)', color: 'var(--text-1)', borderColor: 'var(--border)' }}
          >
            Edit Profile
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="flex-1 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95"
            style={{ background: 'var(--surface)', color: 'var(--text-1)', borderColor: 'var(--border)' }}
          >
            Insights
          </button>
          <button
            onClick={() => setCreatePostOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-95 shrink-0"
            style={{ background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' }}
          >
            <AiOutlineCamera size={18} />
          </button>
        </div>
      </div>

      {/* ── Tabs: Posts | About ── */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {[{ key: 'posts', label: 'Posts' }, { key: 'about', label: 'About' }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-3 text-sm font-semibold relative transition-colors"
            style={{ color: tab === t.key ? 'var(--primary)' : 'var(--text-3)' }}
          >
            {t.label}
            {tab === t.key && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full" style={{ background: 'var(--primary)' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Posts Tab ── */}
      {tab === 'posts' && (
        loading ? <GridSkeleton /> :
        posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <AiOutlineCamera size={28} style={{ color: 'var(--text-3)' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-2)' }}>No posts yet</p>
            <button onClick={() => setCreatePostOpen(true)} className="btn-primary text-sm">
              Share your first post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
            {posts.map(p => (
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
                <div className="absolute inset-0 flex items-center justify-center gap-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(15,23,42,0.45)' }}>
                  <span className="flex items-center gap-1 text-xs font-bold"><AiOutlineHeart size={16} />{p.likes_count || 0}</span>
                  <span className="flex items-center gap-1 text-xs font-bold"><AiOutlineMessage size={16} />{p.comments_count || 0}</span>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {/* ── About Tab ── */}
      {tab === 'about' && (
        <div className="p-4">
          {hasAbout ? (
            <>
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                <iframe
                  key={user?.about_html}
                  title="About"
                  srcDoc={aboutSrcdoc}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                  style={{
                    width: '100%',
                    height: iframeHeight,
                    border: 'none',
                    display: 'block',
                    transition: 'height 0.25s ease',
                  }}
                />
              </div>
              <button
                onClick={() => navigate('/edit-profile')}
                className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95"
                style={{ color: 'var(--primary)', borderColor: 'var(--primary)', background: 'transparent' }}
              >
                Edit About Page
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                🎨
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>No about page yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Create a custom HTML portfolio in Edit Profile</p>
              </div>
              <button onClick={() => navigate('/edit-profile')} className="btn-primary text-sm">
                Create About Page
              </button>
            </div>
          )}
        </div>
      )}

      <FollowersList userId={user?.id} type="followers" open={followersOpen} onClose={() => setFollowersOpen(false)} />
      <FollowersList userId={user?.id} type="following" open={followingOpen} onClose={() => setFollowingOpen(false)} />
    </div>
  )
}
