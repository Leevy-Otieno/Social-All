import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { profileAPI } from '@/lib/api'
import { compressImage } from '@/lib/utils'
import Avatar from '@/components/Avatar'
import { getConfig } from '@/config'
import {
  AiOutlineArrowLeft, AiOutlineCamera, AiOutlineCode,
  AiOutlineEye, AiOutlineReload, AiOutlineDelete,
} from 'react-icons/ai'

// ── Default HTML template (serves as starter / reset) ──────────────
const DEFAULT_TEMPLATE = `<!-- Welcome to your About Page! Edit this HTML freely. -->
<style>
  .about-root { max-width: 600px; margin: 0 auto; font-family: inherit; }
  .hero { background: linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%); border-radius: 16px; padding: 28px 24px; text-align: center; color: white; margin-bottom: 20px; }
  .hero h1 { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
  .hero p { font-size: 14px; opacity: 0.85; }
  .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
  .section h2 { font-size: 14px; font-weight: 700; color: #2563EB; margin-bottom: 12px; }
  .skill { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin: 3px; }
  .link-btn { display: inline-flex; align-items: center; gap: 6px; background: #2563EB; color: white; padding: 10px 18px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; margin-top: 8px; }
  .stat { text-align: center; }
  .stat .num { font-size: 24px; font-weight: 800; color: #2563EB; }
  .stat .lbl { font-size: 11px; color: #64748b; }
  .stats-row { display: flex; gap: 12px; justify-content: space-around; }
</style>
<div class="about-root">
  <div class="hero">
    <h1>👋 Hi, I'm [Your Name]</h1>
    <p>[Your tagline — e.g. Full Stack Developer &amp; Designer]</p>
  </div>

  <div class="section">
    <h2>🎯 About Me</h2>
    <p>Write a short bio about yourself here. What do you do? What are you passionate about?</p>
  </div>

  <div class="section">
    <h2>🛠️ Skills</h2>
    <span class="skill">JavaScript</span>
    <span class="skill">React</span>
    <span class="skill">Node.js</span>
    <span class="skill">Design</span>
    <span class="skill">Figma</span>
  </div>

  <div class="section">
    <h2>📊 Stats</h2>
    <div class="stats-row">
      <div class="stat"><div class="num">50+</div><div class="lbl">Projects</div></div>
      <div class="stat"><div class="num">3y</div><div class="lbl">Experience</div></div>
      <div class="stat"><div class="num">100%</div><div class="lbl">Dedication</div></div>
    </div>
  </div>

  <div class="section">
    <h2>🔗 Links</h2>
    <a class="link-btn" href="https://github.com/" target="_blank">GitHub</a>
    <a class="link-btn" href="https://linkedin.com/" target="_blank" style="margin-left:8px;background:#0077b5">LinkedIn</a>
  </div>
</div>`

const MAX_LINES = 500

export default function EditProfile() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [type, setType] = useState(user?.account_type || '')
  const [showType, setShowType] = useState(user?.show_account_type === 1)
  const [aboutHtml, setAboutHtml] = useState(user?.about_html || '')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [aboutTab, setAboutTab] = useState('edit') // 'edit' | 'preview'
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [iframeHeight, setIframeHeight] = useState(350)
  const config = getConfig()

  const lineCount = aboutHtml.split('\n').length
  const lineError = lineCount > MAX_LINES
  const hasAbout = aboutHtml.trim().length > 0

  // Build srcdoc for preview
  const previewSrcdoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #0f172a; line-height: 1.6; padding: 16px; background: #fff; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    a { color: #2563EB; }
    h1,h2,h3,h4 { margin-top:12px; margin-bottom:6px; line-height:1.3; }
    p { margin-bottom: 8px; }
    ul, ol { padding-left: 20px; margin-bottom: 8px; }
  </style>
</head>
<body>
${aboutHtml}
<script>
  function sendH() {
    var h = document.documentElement.scrollHeight || document.body.scrollHeight;
    window.parent.postMessage({ type: 'ep-height', height: h }, '*');
  }
  window.addEventListener('load', sendH);
  new MutationObserver(sendH).observe(document.body, { childList:true, subtree:true, attributes:true });
<\/script>
</body></html>`
  }, [aboutHtml])

  // Listen for height from preview iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'ep-height' && typeof e.data.height === 'number') {
        setIframeHeight(Math.max(300, e.data.height + 24))
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const handleAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const c = await compressImage(file, 100)
    if (!c) return
    const r = new FileReader()
    r.onload = ev => setAvatar(ev.target.result)
    r.readAsDataURL(c)
  }

  const submit = async () => {
    if (lineError) return
    setLoading(true)
    setUploadProgress(0)
    try {
      const r = await profileAPI.update({
        name, bio, account_type: type, show_account_type: showType,
        avatar, about_html: aboutHtml,
      }, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
        setUploadProgress(pct)
      })
      setUploadProgress(100)
      setUser(r.data.user)
      setTimeout(() => navigate('/profile'), 200)
    } catch (e) { alert(e.response?.data?.message || 'Error saving profile') }
    finally { setLoading(false); setUploadProgress(0) }
  }

  return (
    <div className="min-h-screen pb-24 fade-in">
      {/* Upload Progress Bar */}
      {loading && uploadProgress > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 3, background: 'var(--border)' }}>
          <div style={{
            height: '100%',
            width: `${uploadProgress}%`,
            background: uploadProgress === 100 ? 'linear-gradient(90deg, #22C55E, #16A34A)' : 'linear-gradient(90deg, #2563EB, #0EA5E9)',
            borderRadius: '0 2px 2px 0',
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-4 h-12 border-b"
        style={{ background: 'rgba(255,255,255,0.97)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full transition-colors"
          style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <AiOutlineArrowLeft size={20} />
        </button>
        <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>
          {loading ? `Saving… ${uploadProgress}%` : 'Edit Profile'}
        </span>
        <button
          onClick={submit}
          disabled={loading || lineError}
          className="text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ color: 'var(--primary)' }}
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="relative">
          <Avatar src={avatar} name={name || 'U'} size={88} />
          <label
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow-card"
            style={{ background: 'var(--primary)' }}
          >
            <AiOutlineCamera size={15} color="white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </label>
        </div>
        <p className="text-sm font-semibold mt-3" style={{ color: 'var(--primary)' }}>Change Photo</p>
      </div>

      {/* Form */}
      <div className="px-5 py-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" maxLength={50} className="input" />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 200))} placeholder="Tell people about you…" rows={3} className="input resize-none" />
          <p className="text-xs text-right mt-1" style={{ color: bio.length > 180 ? 'var(--danger)' : 'var(--text-3)' }}>{bio.length}/200</p>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)' }}>Account Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="input">
            <option value="">Select a type…</option>
            {(config.accountTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <label className="flex items-center gap-3 py-3 border-t" style={{ borderColor: 'var(--border)', cursor: 'pointer' }}>
          <div
            className="relative w-10 h-6 rounded-full transition-colors duration-200"
            style={{ background: showType ? 'var(--primary)' : 'var(--border)' }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: showType ? '22px' : '4px' }}
            />
          </div>
          <input type="checkbox" checked={showType} onChange={e => setShowType(e.target.checked)} className="hidden" />
          <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Show account type on profile</span>
        </label>
      </div>

      {/* ── About HTML Section ── */}
      <div className="border-t px-5 pt-5 pb-6" style={{ borderColor: 'var(--border)' }}>
        {/* Section header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <AiOutlineCode size={16} style={{ color: 'var(--primary)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>About Page (HTML)</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Custom HTML portfolio shown on your profile. Max {MAX_LINES} lines.</p>
          </div>
          {/* Line counter badge */}
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-2"
            style={{
              background: lineError ? 'rgba(239,68,68,0.1)' : 'var(--primary-light)',
              color: lineError ? 'var(--danger)' : 'var(--primary)',
            }}
          >
            {lineCount}/{MAX_LINES}
          </span>
        </div>

        {lineError && (
          <div className="mb-3 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
            ⚠️ Exceeded {MAX_LINES} line limit — please remove {lineCount - MAX_LINES} line{lineCount - MAX_LINES !== 1 ? 's' : ''}
          </div>
        )}

        {/* Edit / Preview Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border mb-3" style={{ borderColor: 'var(--border)' }}>
          {[
            { key: 'edit',    icon: <AiOutlineCode size={14} />,    label: 'Code' },
            { key: 'preview', icon: <AiOutlineEye size={14} />,     label: 'Preview' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setAboutTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors"
              style={{
                background: aboutTab === t.key ? 'var(--primary)' : 'var(--surface)',
                color: aboutTab === t.key ? 'white' : 'var(--text-3)',
              }}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Code editor */}
        {aboutTab === 'edit' && (
          <textarea
            value={aboutHtml}
            onChange={e => setAboutHtml(e.target.value)}
            placeholder="<!-- Paste your HTML here… -->"
            rows={18}
            spellCheck={false}
            className="input resize-none font-mono"
            style={{
              fontSize: 12,
              lineHeight: 1.7,
              tabSize: 2,
              borderColor: lineError ? 'var(--danger)' : 'var(--border)',
              background: 'var(--surface)',
            }}
          />
        )}

        {/* Preview iframe */}
        {aboutTab === 'preview' && (
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
            {aboutHtml.trim() ? (
              <iframe
                key={aboutHtml.length}
                title="About Preview"
                srcDoc={previewSrcdoc}
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                style={{ width: '100%', height: iframeHeight, border: 'none', display: 'block', transition: 'height 0.25s ease' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ color: 'var(--text-3)' }}>
                <AiOutlineEye size={32} style={{ opacity: 0.3 }} />
                <p className="text-sm font-medium">Nothing to preview yet</p>
              </div>
            )}
          </div>
        )}

        {/* Action buttons: Reset template | Delete */}
        <div className="flex gap-2 mt-3">
          {/* Reset / Get Default Template */}
          {showResetConfirm ? (
            <div className="flex-1 flex gap-2">
              <p className="flex-1 text-xs" style={{ color: 'var(--text-3)' }}>Replace with default template?</p>
              <button onClick={() => setShowResetConfirm(false)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)' }}>No</button>
              <button
                onClick={() => { setAboutHtml(DEFAULT_TEMPLATE); setAboutTab('edit'); setShowResetConfirm(false) }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'var(--primary)', color: 'white' }}
              >Yes, Reset</button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all active:scale-95"
              style={{ color: 'var(--primary)', borderColor: 'var(--primary)', background: 'transparent' }}
            >
              <AiOutlineReload size={13} />
              {hasAbout ? 'Reset to Default' : 'Use Default Template'}
            </button>
          )}

          {/* Delete */}
          {hasAbout && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all active:scale-95 ml-auto"
              style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)', background: 'transparent' }}
            >
              <AiOutlineDelete size={13} />
              Delete
            </button>
          )}
          {showDeleteConfirm && (
            <div className="flex gap-2 ml-auto items-center">
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Delete about page?</p>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)' }}>No</button>
              <button
                onClick={() => { setAboutHtml(''); setShowDeleteConfirm(false) }}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--danger)', color: 'white' }}
              >Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
