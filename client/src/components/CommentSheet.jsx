import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { commentAPI } from '@/lib/api'
import { useXpStore } from '@/store'
import Avatar from './Avatar'
import VerifiedBadge from './VerifiedBadge'
import { formatDate } from '@/lib/utils'
import { AiFillHeart, AiOutlineHeart, AiOutlineClose, AiOutlineSend, AiOutlineMessage } from 'react-icons/ai'
import FormattedText from './FormattedText'

export default function CommentSheet({ postId, open, onOpenChange }) {
  const navigate = useNavigate()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    load()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open, postId])

  useEffect(() => {
    if (open && replyTo) inputRef.current?.focus()
  }, [replyTo, open])

  const load = async () => {
    try {
      const r = await commentAPI.get(postId)
      setComments(r.data.comments || [])
    } catch {}
  }

  const handleSubmit = async () => {
    if (!text.trim() || text.length > 200) return
    setLoading(true)
    try {
      let res
      if (replyTo) {
        res = await commentAPI.reply(replyTo.id, text)
      } else {
        res = await commentAPI.create(postId, text)
      }
      // XP notification
      if (res.data?.xp_earned > 0) {
        useXpStore.getState().showXp(res.data.xp_earned, replyTo ? 'reply' : 'comment')
      }
      setText('')
      setReplyTo(null)
      await load()
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } finally { setLoading(false) }
  }

  const toggleLike = async (id) => {
    const c = comments.find(x => x.id === id)
    if (!c) return
    const liked = !c.liked
    setComments(prev => prev.map(x => x.id === id ? { ...x, liked, likes_count: liked ? x.likes_count + 1 : x.likes_count - 1 } : x))
    try { liked ? await commentAPI.like(id) : await commentAPI.unlike(id) } catch {}
  }

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => onOpenChange(false)}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(4px)',
          animation: 'portalFadeIn 0.25s ease both',
        }}
      />

      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: '560px',
          height: '88dvh',
          background: 'var(--background)',
          borderRadius: '20px 20px 0 0',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -12px 40px -8px rgba(0,0,0,0.2)',
          animation: 'portalSlideUp 0.35s cubic-bezier(0.32,0.72,0,1) both',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          borderBottom: 'none',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border)', margin: '12px auto 0' }} />

        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px 12px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Comments</h2>
            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{comments.length} comment{comments.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              padding: '8px', borderRadius: '50%', border: '1px solid var(--border)',
              background: 'var(--surface)', cursor: 'pointer', display: 'flex',
              color: 'var(--text-2)',
            }}
          >
            <AiOutlineClose size={16} />
          </button>
        </div>

        {/* Scrollable comment list */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 80px' }}
        >
          {comments.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-3)' }}>
              <AiOutlineMessage size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No comments yet</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Be the first to comment!</p>
            </div>
          )}

          {comments.map(c => (
            <div key={c.id} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { onOpenChange(false); navigate(`/profile/${c.username}`) }}>
                  <Avatar src={c.avatar} name={c.name} size={36} />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <button
                      onClick={() => { onOpenChange(false); navigate(`/profile/${c.username}`) }}
                      style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text-1)', textDecoration: 'none' }}
                    >
                      <span>{c.name}</span>
                      {c.is_verified ? <VerifiedBadge size={13} className="mx-1" /> : <span className="mx-0.5" />}
                      <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>@{c.username}</span>
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{formatDate(c.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-1)', marginTop: 4, lineHeight: 1.5 }}>
                    <FormattedText text={c.text} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <button
                      onClick={() => setReplyTo(c)}
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >Reply</button>
                    <button
                      onClick={() => toggleLike(c.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: c.liked ? 'var(--danger)' : 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {c.liked ? <AiFillHeart size={15} /> : <AiOutlineHeart size={15} />}
                      {c.likes_count || 0}
                    </button>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {c.replies?.length > 0 && (
                <div style={{ marginLeft: 48, marginTop: 12, paddingLeft: 16, borderLeft: '2px solid var(--border)' }}>
                  {c.replies.map(r => (
                    <div key={r.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <Avatar src={r.avatar} name={r.name} size={28} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{r.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>{formatDate(r.created_at)}</span>
                        <div style={{ fontSize: 13, color: 'var(--text-1)', marginTop: 2 }}><FormattedText text={r.text} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input bar — absolute at bottom so it doesn't push content */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--border)',
          }}
        >
          {replyTo && (
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--primary-light)', borderRadius: 10, padding: '6px 12px', marginBottom: 8,
              }}
            >
              <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                Replying to @{replyTo.username}
              </p>
              <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 2 }}>
                <AiOutlineClose size={13} />
              </button>
            </div>
          )}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--surface)', borderRadius: 24,
              padding: '8px 8px 8px 16px',
              border: '1.5px solid var(--border)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={200}
              placeholder={replyTo ? `Reply to @${replyTo.username}…` : 'Add a comment…'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 14, color: 'var(--text-1)', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !text.trim()}
              style={{
                padding: '8px 14px', borderRadius: 18, border: 'none', cursor: 'pointer',
                background: text.trim() ? 'var(--primary)' : 'var(--border)',
                color: text.trim() ? 'white' : 'var(--text-3)',
                transition: 'all 0.15s', fontSize: 13, fontWeight: 600,
              }}
            >
              <AiOutlineSend size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
