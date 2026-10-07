import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWebSocket } from '@/hooks'
import { chatAPI, profileAPI } from '@/lib/api'
import { useAuthStore } from '@/store'
import { getToken } from '@/lib/auth'
import Avatar from '@/components/Avatar'
import FormattedText from '@/components/FormattedText'
import { AiOutlineArrowLeft, AiOutlineSend } from 'react-icons/ai'
import { formatFullDate } from '@/lib/utils'
import VerifiedBadge from '@/components/VerifiedBadge'

export default function Chat() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [other, setOther] = useState(null)
  const [convId, setConvId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)       // other person typing
  const [seenAt, setSeenAt] = useState(null)             // when other person last saw
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimer = useRef(null)

  useEffect(() => {
    profileAPI.get(userId).then(r => setOther(r.data.profile)).catch(() => {})
  }, [userId])

  useEffect(() => {
    setLoading(true)
    chatAPI.getConvs().then(r => {
      const conv = r.data.conversations.find(c => String(c.other_user_id) === String(userId))
      if (conv) {
        setConvId(conv.id)
        chatAPI.getMessages(conv.id).then(m => {
          setMessages(m.data.messages || [])
        }).catch(() => {})
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [userId])

  // WebSocket: receive messages + typing + seen events
  const { send: wsSend } = useWebSocket(getToken(), (msg) => {
    if (msg.type === 'message' && String(msg.conversation_id) === String(convId)) {
      setMessages(prev => [...prev, msg.message])
      // Auto-mark as read — send seen signal back
      wsSend({ type: 'seen', conversation_id: convId, user_id: user?.id })
    }
    if (msg.type === 'typing' && String(msg.from_user_id) === String(userId)) {
      setIsTyping(true)
      clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => setIsTyping(false), 3000)
    }
    if (msg.type === 'seen' && String(msg.conversation_id) === String(convId)) {
      setSeenAt(new Date().toISOString())
    }
  })

  // Send typing signal (debounced)
  const handleTextChange = (e) => {
    setText(e.target.value)
    if (convId) {
      wsSend({ type: 'typing', conversation_id: convId, to_user_id: userId, from_user_id: user?.id })
    }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const send = async () => {
    if (!text.trim()) return
    const t = text.trim()
    const tempMsg = {
      id: `tmp-${Date.now()}`,
      text: t,
      sender_id: user?.id,
      created_at: new Date().toISOString(),
      is_read: 0,
    }
    setMessages(prev => [...prev, tempMsg])
    setText('')
    try {
      const r = await chatAPI.send(userId, t)
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? r.data.message : m))
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    }
  }

  const lastMsg = messages[messages.length - 1]
  const lastMsgIsMe = lastMsg?.sender_id === user?.id

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      background: 'var(--background)', overflow: 'hidden',
    }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
        height: 56, borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
        flexShrink: 0, WebkitBackdropFilter: 'blur(12px)',
      }}>
        <button
          onClick={() => navigate('/messages')}
          style={{
            padding: 8, borderRadius: 8, background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-2)', display: 'flex',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <AiOutlineArrowLeft size={20} />
        </button>

        <button
          onClick={() => other?.username && navigate(`/profile/${other.username}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Avatar src={other?.avatar} name={other?.name} size={36} />
            <div style={{
              position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
              borderRadius: '50%', background: 'var(--success)', border: '2px solid white',
            }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {other?.name}
              </p>
              {other?.is_verified ? <VerifiedBadge size={14} /> : null}
            </div>
            <p style={{ fontSize: 11, color: isTyping ? 'var(--primary)' : 'var(--success)', margin: 0, fontWeight: 600, transition: 'color 0.2s' }}>
              {isTyping ? 'Typing…' : 'Active now'}
            </p>
          </div>
        </button>
      </div>

      {/* ── Messages ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', background: 'var(--surface)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
            <Avatar src={other?.avatar} name={other?.name} size={56} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginTop: 8 }}>{other?.name}</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          <>
            {messages.map((m, i) => {
              const isMe = m.sender_id === user?.id
              const showTime = i === 0 || new Date(m.created_at) - new Date(messages[i - 1].created_at) > 300000
              const isLast = i === messages.length - 1
              return (
                <div key={m.id || i}>
                  {showTime && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 12px' }}>
                      <span style={{
                        fontSize: 11, color: 'var(--text-3)',
                        background: 'var(--background)', border: '1px solid var(--border)',
                        borderRadius: 99, padding: '3px 12px', fontWeight: 500,
                      }}>
                        {formatFullDate(m.created_at)}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: isLast ? 4 : 6 }}>
                    {!isMe && (
                      <div style={{ marginRight: 8, alignSelf: 'flex-end' }}>
                        <Avatar src={other?.avatar} name={other?.name} size={26} />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '72%', padding: '10px 14px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      fontSize: 14, lineHeight: 1.5, fontWeight: 500,
                      background: isMe ? 'var(--primary)' : 'var(--background)',
                      color: isMe ? 'white' : 'var(--text-1)',
                      border: isMe ? 'none' : '1px solid var(--border)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}>
                      <FormattedText text={m.text} />
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start',
                        gap: 4, marginTop: 4,
                        fontSize: 10,
                        color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-3)',
                      }}>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {/* Seen receipt for last sent message */}
                        {isMe && isLast && seenAt && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>✓✓ Seen</span>
                        )}
                        {isMe && isLast && !seenAt && m.is_read === 1 && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>✓✓ Seen</span>
                        )}
                        {isMe && isLast && !seenAt && m.is_read !== 1 && (
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>✓ Sent</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Avatar src={other?.avatar} name={other?.name} size={26} />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'var(--background)', border: '1px solid var(--border)',
                  borderRadius: '18px 18px 18px 4px', padding: '10px 14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  <span style={TYPING_DOT(0)} />
                  <span style={TYPING_DOT(0.15)} />
                  <span style={TYPING_DOT(0.3)} />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} style={{ height: 80 }} />
      </div>

      {/* ── Input bar ────────────────────────────────────────── */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
        flexShrink: 0, WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', border: '1.5px solid var(--border)',
          borderRadius: 24, padding: '6px 6px 6px 16px',
          transition: 'border-color 0.15s',
        }}
          onFocus={() => {}}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            maxLength={500}
            placeholder="Message…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 15, color: 'var(--text-1)', fontFamily: 'inherit', fontWeight: 500,
            }}
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            style={{
              width: 38, height: 38, borderRadius: 18, border: 'none', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.15s',
              background: text.trim() ? 'var(--primary)' : 'var(--border)',
              color: text.trim() ? 'white' : 'var(--text-3)',
            }}
          >
            <AiOutlineSend size={17} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

const TYPING_DOT = (delay) => ({
  display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
  background: 'var(--text-3)',
  animation: `typingBounce 1.2s ease-in-out ${delay}s infinite`,
})
