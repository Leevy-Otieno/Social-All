import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { authAPI } from '@/lib/api'
import { compressImage } from '@/lib/utils'
import Avatar from '@/components/Avatar'

export default function Step1() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [dob, setDob] = useState('')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [loading, setLoading] = useState(false)

  const handleAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const compressed = await compressImage(file, 100)
    if (!compressed) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatar(ev.target.result)
    reader.readAsDataURL(compressed)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !username.trim() || !dob) return alert('Please fill in all required fields')
    setLoading(true)
    try {
      const r = await authAPI.step1({ name: name.trim(), username: username.trim(), date_of_birth: dob, avatar })
      setUser(r.data.user)
      navigate('/setup/step2')
    } catch (e) {
      alert(e.response?.data?.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-1.5 flex-1 rounded-full" style={{ background: 'var(--primary)' }} />
          <div className="h-1.5 flex-1 rounded-full" style={{ background: 'var(--border)' }} />
          <div className="h-1.5 flex-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Step 1 of 3</p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Set up your profile</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Tell us a bit about yourself to get started.</p>
        </div>

        <div className="card p-6 shadow-card space-y-5">
          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar src={avatar} name={name || 'U'} size={80} />
              <label
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-card border-2 border-white"
                style={{ background: 'var(--primary)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              </label>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Upload a profile photo (optional)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={50}
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Username *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--text-3)' }}>@</span>
              <input
                type="text"
                placeholder="yourhandle"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={30}
                className="input pl-8"
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Letters, numbers and underscores only</p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Date of Birth * <span className="font-normal">(must be 13+)</span></label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="input"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !username.trim() || !dob}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Saving…' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
