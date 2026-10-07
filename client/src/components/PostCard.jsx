import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { formatDate, getImageUrl } from '@/lib/utils'
import { postAPI, profileAPI } from '@/lib/api'
import { useAuthStore, useXpStore } from '@/store'
import Avatar from './Avatar'
import VerifiedBadge from './VerifiedBadge'
import CommentSheet from './CommentSheet'
import ReportSheet from './ReportSheet'
import FormattedText from './FormattedText'
import {
  AiFillHeart, AiOutlineHeart, AiOutlineMessage, AiOutlineShareAlt,
  AiOutlineMore, AiOutlineClose, AiOutlineCopy, AiOutlineWhatsApp,
} from 'react-icons/ai'
import {
  FaFacebook, FaTwitter, FaInstagram, FaTelegram, FaWhatsapp,
} from 'react-icons/fa'

// ── Share panel ────────────────────────────────────────────────────
function SharePanel({ postId, onClose }) {
  const url = `${window.location.origin}/p/${postId}`
  const encodedUrl = encodeURIComponent(url)
  const [copied, setCopied] = useState(false)
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url) }
    catch { const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const shareOptions = [
    { label: 'WhatsApp',  icon: <FaWhatsapp size={20} color="#25D366" />,  href: `https://wa.me/?text=${encodedUrl}` },
    { label: 'Facebook',  icon: <FaFacebook size={20} color="#1877F2" />,  href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: 'Twitter/X', icon: <FaTwitter size={20} color="#1DA1F2" />,   href: `https://twitter.com/intent/tweet?url=${encodedUrl}` },
    { label: 'Telegram',  icon: <FaTelegram size={20} color="#2AABEE" />,  href: `https://t.me/share/url?url=${encodedUrl}` },
    {
      label: 'Instagram',
      icon: <FaInstagram size={20} style={{ color: '#E1306C' }} />,
      // Instagram doesn't support web share URL — copy link and guide
      action: () => { copyLink(); alert('Link copied! Open Instagram and paste it.') },
    },
  ]

  // Mobile: bottom sheet | Desktop: popup via Web Share API if available
  useEffect(() => {
    if (isMobile && navigator.share) {
      navigator.share({ url }).catch(() => {})
      onClose()
    }
  }, [isMobile, url, onClose])

  if (isMobile && navigator.share) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div
        className="relative w-full sm:w-auto sm:min-w-[360px] sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: 'var(--background)', border: '1px solid var(--border)', maxWidth: '100vw' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        <div className="px-5 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Share Post</p>
            <button onClick={onClose} className="p-1.5 rounded-full transition-colors" style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <AiOutlineClose size={18} />
            </button>
          </div>

          {/* Social share icons */}
          <div className="flex gap-4 justify-around mb-5">
            {shareOptions.map(opt => (
              <button
                key={opt.label}
                onClick={() => {
                  if (opt.action) { opt.action(); return }
                  window.open(opt.href, '_blank', 'width=600,height=400,noopener')
                }}
                className="flex flex-col items-center gap-1.5 transition-transform active:scale-90"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                >
                  {opt.icon}
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Copy link row */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="flex-1 text-xs truncate" style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>{url}</p>
            <button
              onClick={copyLink}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
              style={{ background: copied ? 'var(--success)' : 'var(--primary)', color: 'white' }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Full image preview ─────────────────────────────────────────────
function FullPreview({ src, onClose }) {
  // Lock body scroll when preview is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Use Portal to render at document.body root — avoids parent transform/overflow breaking fixed positioning
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        zIndex: 99999, background: 'rgba(0,0,0,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, touchAction: 'none', overscrollBehavior: 'contain',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 100000,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', border: 'none',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        <AiOutlineClose size={22} />
      </button>
      {/* Image — always centered, never exceeds viewport */}
      <img
        src={src}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '92vw', maxHeight: '85vh',
          objectFit: 'contain', borderRadius: 8,
          userSelect: 'none', WebkitUserSelect: 'none',
        }}
      />
    </div>,
    document.body
  )
}

// ── Main PostCard ──────────────────────────────────────────────────
export default function PostCard({ item, onDelete }) {
  const post = item.data || item
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [liked, setLiked] = useState(post.liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [fullPreview, setFullPreview] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const tapTimer = useRef(null)
  const tapCount = useRef(0)
  const isOwn = user?.id === post.user_id
  const isTextOnly = !post.image && post.text
  const [isFollowingUser, setIsFollowingUser] = useState(post.following || false)
  const [followBusy, setFollowBusy] = useState(false)

  // Debounced like to prevent glitch on rapid clicks
  const handleLike = useCallback(async () => {
    if (isLiking) return
    setIsLiking(true)
    const newLiked = !liked
    setLiked(newLiked)
    setLikesCount(c => newLiked ? c + 1 : Math.max(0, c - 1))
    try {
      const res = newLiked ? await postAPI.like(post.id) : await postAPI.unlike(post.id)
      if (res.data?.likes_count != null) setLikesCount(res.data.likes_count)
      // Show XP snackbar
      if (newLiked && res.data?.xp_earned > 0) {
        useXpStore.getState().showXp(res.data.xp_earned, 'like')
      }
    } catch {
      setLiked(!newLiked)
      setLikesCount(c => newLiked ? Math.max(0, c - 1) : c + 1)
    } finally {
      // Small delay prevents rapid-click glitch
      setTimeout(() => setIsLiking(false), 300)
    }
  }, [isLiking, liked, post.id])

  // Double-tap detection (touch events)
  const handleDoubleTap = useCallback((e) => {
    tapCount.current += 1
    if (tapCount.current === 1) {
      tapTimer.current = setTimeout(() => { tapCount.current = 0 }, 300)
    } else if (tapCount.current === 2) {
      clearTimeout(tapTimer.current)
      tapCount.current = 0
      if (!liked) handleLike()
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 900)
    }
  }, [liked, handleLike])

  // Desktop dbl click
  const handleDblClick = useCallback(() => {
    if (!liked) handleLike()
    setShowHeart(true)
    setTimeout(() => setShowHeart(false), 900)
  }, [liked, handleLike])

  const handleDelete = async () => {
    setMenuOpen(false)
    if (!confirm('Delete this post?')) return
    await postAPI.remove(post.id)
    onDelete?.(post.id)
  }

  const handleFollow = async () => {
    if (followBusy || isOwn) return
    setFollowBusy(true)
    try {
      if (isFollowingUser) {
        await profileAPI.unfollow(post.user_id)
        setIsFollowingUser(false)
      } else {
        const res = await profileAPI.follow(post.user_id)
        setIsFollowingUser(true)
        if (res.data?.xp_earned > 0) {
          useXpStore.getState().showXp(res.data.xp_earned, 'follow')
        }
      }
    } catch {}
    finally { setFollowBusy(false) }
  }

  return (
    <>
      <article className="border-b transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
        <div className="flex gap-3 px-4 py-3.5">

          {/* Avatar */}
          <div className="shrink-0">
            <button onClick={() => navigate(`/profile/${post.username}`)} className="transition-opacity active:opacity-70">
              <Avatar src={post.avatar} name={post.name} size={42} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex flex-wrap items-center gap-x-1.5 min-w-0">
                <button
                  onClick={() => navigate(`/profile/${post.username}`)}
                  className="text-sm font-bold hover:underline truncate max-w-[160px] flex items-center"
                  style={{ color: 'var(--text-1)' }}
                >
                  <span className="truncate">{post.name}</span>
                  {post.is_verified ? <VerifiedBadge size={14} /> : null}
                </button>
                <span className="text-xs truncate" style={{ color: 'var(--text-3)' }}>@{post.username}</span>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>· {formatDate(post.created_at)}</span>
                {!isOwn && (
                  <button
                    onClick={handleFollow}
                    disabled={followBusy}
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-all active:scale-95 disabled:opacity-50 shrink-0 ml-1"
                    style={isFollowingUser
                      ? { color: 'var(--text-3)', border: '1px solid var(--border)', background: 'transparent' }
                      : { color: 'var(--primary)', border: '1px solid var(--primary)', background: 'transparent' }
                    }
                  >
                    {followBusy ? '…' : isFollowingUser ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Menu */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 rounded-full transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <AiOutlineMore size={18} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div
                      className="absolute right-0 top-9 rounded-xl shadow-card-lg z-20 min-w-[170px] overflow-hidden border"
                      style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
                    >
                      {isOwn ? (
                        <button
                          onClick={handleDelete}
                          className="w-full px-4 py-3 text-left text-sm font-medium transition-colors"
                          style={{ color: 'var(--danger)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >Delete post</button>
                      ) : (
                        <button
                          onClick={() => { setMenuOpen(false); setReportOpen(true) }}
                          className="w-full px-4 py-3 text-left text-sm font-medium transition-colors"
                          style={{ color: 'var(--danger)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >Report post</button>
                      )}
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="w-full px-4 py-3 text-left text-sm font-medium border-t transition-colors"
                        style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >Cancel</button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Text */}
            {post.text && (
              <div
                className={`text-sm leading-relaxed break-words mb-2 ${isTextOnly ? 'py-3 px-4 rounded-2xl' : ''}`}
                style={isTextOnly ? {
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, #EFF6FF 100%)',
                  border: '1px solid rgba(37,99,235,0.1)',
                  color: 'var(--text-1)',
                  minHeight: 80,
                  display: 'flex',
                  alignItems: 'center',
                } : { color: 'var(--text-1)' }}
              >
                <FormattedText text={post.text} />
              </div>
            )}

            {/* Image with double-tap */}
            {post.image && (
              <div
                className="relative rounded-2xl overflow-hidden border select-none cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
                onTouchEnd={handleDoubleTap}
                onDoubleClick={handleDblClick}
              >
                <img
                  src={getImageUrl(post.image)}
                  alt=""
                  className="w-full object-cover"
                  style={{ maxHeight: 480 }}
                  onClick={() => setFullPreview(true)}
                />
                {/* Double-tap heart burst */}
                {showHeart && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="rounded-full p-5 animate-heart-pop" style={{ background: 'rgba(239,68,68,0.18)' }}>
                      <AiFillHeart size={72} style={{ color: 'var(--danger)' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Text post double-tap area */}
            {isTextOnly && showHeart && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="rounded-full p-5 animate-heart-pop" style={{ background: 'rgba(239,68,68,0.18)' }}>
                  <AiFillHeart size={60} style={{ color: 'var(--danger)' }} />
                </div>
              </div>
            )}

            {/* Action bar — Like first, then Comment, then Share */}
            <div className="mt-2.5 flex items-center gap-0.5 -ml-1.5">
              {/* ❤️ Like — first */}
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all disabled:cursor-default"
                style={{
                  color: liked ? 'var(--danger)' : 'var(--text-3)',
                  background: liked ? 'rgba(239,68,68,0.08)' : 'transparent',
                  transform: isLiking ? 'scale(0.92)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (!liked && !isLiking) { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = 'var(--danger)' } }}
                onMouseLeave={e => { if (!liked) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' } }}
              >
                {liked
                  ? <AiFillHeart size={18} style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.5))' }} />
                  : <AiOutlineHeart size={18} />
                }
                <span>{likesCount}</span>
              </button>

              {/* 💬 Comment — second */}
              <button
                onClick={() => setCommentsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
              >
                <AiOutlineMessage size={18} />
                <span>{post.comments_count || 0}</span>
              </button>

              {/* 🔗 Share — right side */}
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors ml-auto"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
              >
                <AiOutlineShareAlt size={18} />
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Portals */}
      {fullPreview && post.image && <FullPreview src={getImageUrl(post.image)} onClose={() => setFullPreview(false)} />}
      {shareOpen && <SharePanel postId={post.id} onClose={() => setShareOpen(false)} />}
      {commentsOpen && <CommentSheet postId={post.id} open={commentsOpen} onOpenChange={setCommentsOpen} />}
      {reportOpen && <ReportSheet targetId={post.id} targetType="post" open={reportOpen} onOpenChange={setReportOpen} />}
    </>
  )
}
