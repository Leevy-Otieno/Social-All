import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { postAPI } from '@/lib/api'
import { compressImage } from '@/lib/utils'
import { AiOutlineClose, AiOutlinePicture } from 'react-icons/ai'
import Avatar from './Avatar'
import { useAuthStore } from '@/store'

export default function CreatePost({ open, onOpenChange, onPostCreated, onCancel }) {
  const { user } = useAuthStore()
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionQuery, setSuggestionQuery] = useState('')
  const [cursorPos, setCursorPos] = useState(0)
  const textareaRef = useRef(null)

  const handleClose = () => {
    onOpenChange?.(false)
    onCancel?.()
    setText(''); setImage(null); setPreview(null)
    setSuggestions([]); setShowSuggestions(false)
    setUploadProgress(0)
  }

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    setTimeout(() => textareaRef.current?.focus(), 300)
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (showSuggestions && suggestionQuery.length >= 0) {
      postAPI.getSuggestions().then(r => {
        const filtered = r.data.users.filter(u =>
          u.username.toLowerCase().includes(suggestionQuery.toLowerCase()) ||
          u.name.toLowerCase().includes(suggestionQuery.toLowerCase())
        )
        setSuggestions(filtered.slice(0, 5))
      }).catch(() => {})
    }
  }, [suggestionQuery, showSuggestions])

  const handleTextChange = (e) => {
    const val = e.target.value
    const pos = e.target.selectionStart
    setText(val); setCursorPos(pos)
    const lastAt = val.lastIndexOf('@', pos - 1)
    if (lastAt !== -1) {
      const query = val.slice(lastAt + 1, pos)
      if (!query.includes(' ') && !query.includes('\n')) {
        setSuggestionQuery(query); setShowSuggestions(true); return
      }
    }
    setShowSuggestions(false)
  }

  const selectUser = (u) => {
    const lastAt = text.lastIndexOf('@', cursorPos - 1)
    const newText = `${text.slice(0, lastAt)}@${u.username} ${text.slice(cursorPos)}`
    setText(newText); setShowSuggestions(false)
    textareaRef.current?.focus()
  }

  const handleImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const compressed = await compressImage(file, 400)
    if (!compressed) return
    setImage(compressed)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(compressed)
  }

  const handleSubmit = async () => {
    if (!text.trim() && !image) return
    if (text.length > 280) return alert('Text is too long (max 280 chars)')
    setLoading(true)
    setUploadProgress(0)
    const form = new FormData()
    if (text.trim()) form.append('text', text.trim())
    if (image) form.append('image', image)
    try {
      const res = await postAPI.create(form, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
        setUploadProgress(pct)
      })
      setUploadProgress(100)
      setTimeout(() => {
        handleClose()
        onPostCreated?.(res.data.post)
      }, 300)
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create post. Please try again.')
      setUploadProgress(0)
    } finally { setLoading(false) }
  }

  if (!open) return null

  const charPct = text.length / 280
  const charColor = charPct > 0.9 ? 'var(--danger)' : charPct > 0.75 ? 'var(--warning)' : 'var(--primary)'

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
        animation: 'portalFadeIn 0.2s ease both',
      }} />

      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: '540px',
          height: '90dvh',
          background: 'var(--background)',
          borderRadius: '20px 20px 0 0',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -16px 48px -8px rgba(0,0,0,0.25)',
          animation: 'portalSlideUp 0.35s cubic-bezier(0.32,0.72,0,1) both',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          borderBottom: 'none',
        }}
      >
        {/* Upload Progress Bar */}
        {loading && uploadProgress > 0 && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            height: 3, background: 'var(--border)',
          }}>
            <div style={{
              height: '100%',
              width: `${uploadProgress}%`,
              background: uploadProgress === 100
                ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                : 'linear-gradient(90deg, #2563EB, #0EA5E9)',
              borderRadius: '0 2px 2px 0',
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}

        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border)', margin: '12px auto 4px' }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px 12px',
          borderBottom: '1px solid var(--border)',
        }}>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{ padding: 8, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', opacity: loading ? 0.5 : 1 }}
          >
            <AiOutlineClose size={17} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Uploading</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{uploadProgress}%</span>
              </span>
            ) : 'Create Post'}
          </span>
          <button
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && !image) || text.length > 280}
            style={{
              padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: (!text.trim() && !image) || loading ? 'var(--border)' : 'var(--primary)',
              color: (!text.trim() && !image) || loading ? 'var(--text-3)' : 'white',
              border: 'none', transition: 'all 0.15s',
            }}
          >
            {loading ? 'Posting…' : 'Post'}
          </button>
        </div>

        {/* Composer */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '80px' }}>
          {/* Author row */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Avatar src={user?.avatar} name={user?.name} size={38} />
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                placeholder="What's on your mind?"
                rows={5}
                disabled={loading}
                style={{
                  width: '100%', resize: 'none', border: 'none', outline: 'none',
                  fontSize: 16, color: 'var(--text-1)', fontFamily: 'inherit',
                  background: 'transparent', lineHeight: 1.6, fontWeight: 500,
                  opacity: loading ? 0.5 : 1,
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', left: 0, bottom: '100%', width: 260,
                  background: 'var(--background)', border: '1px solid var(--border)',
                  borderRadius: 14, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
                  zIndex: 10, overflow: 'hidden',
                }}>
                  {suggestions.map(u => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', border: 'none', background: 'none',
                        cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Avatar src={u.avatar} name={u.name} size={30} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{u.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Image preview */}
          {preview && (
            <div style={{ position: 'relative', marginTop: 16, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={preview} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }} />
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 700, marginTop: 8 }}>{uploadProgress}%</span>
                </div>
              )}
              {!loading && (
                <button
                  onClick={() => { setImage(null); setPreview(null) }}
                  style={{
                    position: 'absolute', top: 10, right: 10, padding: '6px', borderRadius: 8,
                    background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex',
                  }}
                >
                  <AiOutlineClose size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <label style={{
            cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)',
            opacity: loading ? 0.5 : 1,
          }}>
            <AiOutlinePicture size={18} style={{ color: 'var(--text-2)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Photo</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} disabled={loading} />
          </label>
          <div style={{ flex: 1 }} />
          {/* Char counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {text.length > 0 && (
              <>
                <svg viewBox="0 0 36 36" width="28" height="28" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="14"
                    fill="none" stroke={charColor} strokeWidth="3"
                    strokeDasharray={`${Math.min(charPct, 1) * 87.96} 87.96`}
                    strokeLinecap="round"
                  />
                </svg>
                {text.length > 250 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: charColor }}>{280 - text.length}</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
