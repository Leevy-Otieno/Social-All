import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { authAPI } from '@/lib/api'
import { getConfig } from '@/config'

export default function Step2() {
  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const [bio, setBio] = useState('')
  const [type, setType] = useState('')
  const [loading, setLoading] = useState(false)
  const config = getConfig()

  const submit = async () => {
    setLoading(true)
    try {
      const r = await authAPI.step2({ bio, account_type: type })
      setUser(r.data.user)
      navigate('/setup/step3')
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
          <div className="h-1.5 flex-1 rounded-full" style={{ background: 'var(--primary)' }} />
          <div className="h-1.5 flex-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Step 2 of 3</p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>About you</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Help others understand who you are.</p>
        </div>

        <div className="card p-6 shadow-card space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Bio <span className="font-normal">(optional)</span></label>
            <textarea
              placeholder="Tell the world about yourself…"
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 200))}
              rows={4}
              className="input resize-none"
            />
            <p className="text-xs mt-1 text-right" style={{ color: bio.length > 180 ? 'var(--danger)' : 'var(--text-3)' }}>
              {bio.length} / 200
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>Account Type <span className="font-normal">(optional)</span></label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="input"
            >
              <option value="">Select a category…</option>
              {(config.accountTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Saving…' : 'Continue →'}
          </button>

          <button
            onClick={() => navigate('/setup/step3')}
            className="w-full text-center text-sm py-2"
            style={{ color: 'var(--text-3)' }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
