import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getImageUrl } from '@/lib/utils'
import { useAuthStore, useXpStore } from '@/store'
import { profileAPI } from '@/lib/api'
import Avatar from '@/components/Avatar'
import VerifiedBadge from '@/components/VerifiedBadge'
import { XpCoin, getLevel } from '@/components/XpSnackbar'
import FollowersList from '@/components/FollowersList'
import { GridSkeleton } from '@/components/Skeleton'
import { AiOutlineHeart, AiOutlineMessage, AiOutlineArrowLeft } from 'react-icons/ai'
import FormattedText from '@/components/FormattedText'

// Same srcdoc builder used in Profile.jsx
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
  </style>
</head>
<body>
${html}
<script>
  function sendHeight() {
    var h = document.documentElement.scrollHeight || document.body.scrollHeight;
    window.parent.postMessage({ type: 'op-about-height', height: h }, '*');
  }
  window.addEventListener('load', sendHeight);
  new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true, attributes: true });
<\/script>
</body>
</html>`
}

export default function OtherProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [following, setFollowing] = useState(false)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [followersOpen, setFollowersOpen] = useState(false)
  const [followingOpen, setFollowingOpen] = useState(false)
  const [tab, setTab] = useState('posts')
  const [iframeHeight, setIframeHeight] = useState(300)

  useEffect(() => {
    if (user && user.username === username) { navigate('/profile', { replace: true }); return }
    setLoading(true)
    profileAPI.get(username).then(r => {
      setProfile(r.data.profile)
      setFollowing(r.data.profile.following)
      setPosts(r.data.profile.posts || [])
    }).catch(() => navigate('/')).finally(() => setLoading(false))
  }, [username, user, navigate])

  // Listen for height messages from the about iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'op-about-height' && typeof e.data.height === 'number') {
        setIframeHeight(Math.max(200, e.data.height + 24))
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const aboutSrcdoc = useMemo(
    () => buildAboutDoc(profile?.about_html || ''),
    [profile?.about_html]
  )

  const toggleFollow = async () => {
    if (!profile) return
    const prev = following
    setFollowing(!prev)
    try {
      if (prev) await profileAPI.unfollow(profile.id)
      else {
        const r = await profileAPI.follow(profile.id)
        if (r.data?.xp_earned > 0) useXpStore.getState().showXp(r.data.xp_earned, 'follow')
      }
    } catch { setFollowing(prev) }
  }

  if (loading && !profile) return (
    <div className="animate-pulse p-5">
      <div className="flex items-start gap-5 mb-4">
        <div className="w-20 h-20 rounded-full" style={{ background: 'var(--border)' }} />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-3 rounded" style={{ background: 'var(--border)', width: '60%' }} />
          <div className="h-3 rounded" style={{ background: 'var(--border)', width: '40%' }} />
        </div>
      </div>
      <GridSkeleton />
    </div>
  )
  if (!profile) return null

  const hasAbout = !!(profile?.about_html?.trim())

  return (
    <div className="min-h-screen pb-20 fade-in">
      {/* Header bar with back btn */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-4 h-12 border-b"
        style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}
      >
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full transition-colors" style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <AiOutlineArrowLeft size={20} />
        </button>
        <span className="font-bold text-sm flex items-center gap-1" style={{ color: 'var(--text-1)' }}>
          @{profile.username}
        </span>
      </div>

      {/* Profile section */}
      <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-5 mb-4">
          <Avatar src={profile.avatar} name={profile.name} size={80} />
          <div className="flex flex-1 items-center justify-around text-center pt-2">
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{profile.posts_count || 0}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Posts</p>
            </div>
            <button onClick={() => setFollowersOpen(true)} className="transition-opacity hover:opacity-70">
              <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{profile.followers_count || 0}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Followers</p>
            </button>
            <button onClick={() => setFollowingOpen(true)} className="transition-opacity hover:opacity-70">
              <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{profile.following_count || 0}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Following</p>
            </button>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center">
            <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{profile.name}</p>
            {profile.is_verified ? <VerifiedBadge size={16} /> : null}
          </div>
          {profile.account_type && profile.show_account_type !== 0 && (
            <span className="badge-surface">{profile.account_type}</span>
          )}
          {/* XP Level Badge */}
          {(() => {
            const { level, progress, xpInLevel, xpNeeded } = getLevel(profile?.xp)
            return (
              <div className="flex items-center gap-2 mt-2" style={{ padding: '6px 12px', borderRadius: 12, background: 'linear-gradient(135deg, #065f4620, #16a34a15)' }}>
                <XpCoin size={20} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Level {level}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{(profile?.xp || 0).toLocaleString()} XP</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 4, background: 'linear-gradient(90deg, #4ade80, #16a34a)', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              </div>
            )
          })()}
          {profile.bio && (
            <div className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
              <FormattedText text={profile.bio} />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleFollow}
            className="flex-1 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95"
            style={{
              background: following ? 'var(--surface)' : 'var(--primary)',
              color: following ? 'var(--text-1)' : 'white',
              borderColor: following ? 'var(--border)' : 'var(--primary)',
            }}
          >
            {following ? 'Following' : 'Follow'}
          </button>
          <button
            onClick={() => navigate(`/chat/${profile.id}`)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95"
            style={{ background: 'var(--surface)', color: 'var(--text-1)', borderColor: 'var(--border)' }}
          >
            Message
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
        loading ? <GridSkeleton /> : (
          posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2">
              <p className="font-semibold" style={{ color: 'var(--text-2)' }}>No posts yet</p>
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
        )
      )}

      {/* ── About Tab ── */}
      {tab === 'about' && (
        <div className="p-4">
          {hasAbout ? (
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
              <iframe
                key={profile?.about_html}
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
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                🎨
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{profile.name} hasn't set up an About page yet</p>
            </div>
          )}
        </div>
      )}

      <FollowersList userId={profile?.id} type="followers" open={followersOpen} onClose={() => setFollowersOpen(false)} />
      <FollowersList userId={profile?.id} type="following" open={followingOpen} onClose={() => setFollowingOpen(false)} />
    </div>
  )
}
