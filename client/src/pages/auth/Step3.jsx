import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { authAPI } from '@/lib/api'
import Avatar from '@/components/Avatar'

export default function Step3() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()

  const submit = async () => {
    const r = await authAPI.step3()
    setUser(r.data.user)
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-1.5 flex-1 rounded-full" style={{ background: 'var(--primary)' }} />
          <div className="h-1.5 flex-1 rounded-full" style={{ background: 'var(--primary)' }} />
          <div className="h-1.5 flex-1 rounded-full" style={{ background: 'var(--primary)' }} />
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Step 3 of 3</p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>You're all set!</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Review your profile before joining.</p>
        </div>

        <div className="card p-6 shadow-card mb-5">
          {/* Profile preview */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <Avatar src={user?.avatar} name={user?.name} size={64} />
            <div className="min-w-0">
              <p className="font-bold text-base truncate" style={{ color: 'var(--text-1)' }}>{user?.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>@{user?.username}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-xs font-semibold w-20 shrink-0 pt-0.5" style={{ color: 'var(--text-3)' }}>Bio</span>
              <p className="text-sm flex-1" style={{ color: 'var(--text-1)' }}>{user?.bio || <span style={{ color: 'var(--text-3)' }}>Not set</span>}</p>
            </div>
            <div className="flex gap-3">
              <span className="text-xs font-semibold w-20 shrink-0 pt-0.5" style={{ color: 'var(--text-3)' }}>Type</span>
              <p className="text-sm flex-1" style={{ color: 'var(--text-1)' }}>
                {user?.account_type
                  ? <span className="badge">{user.account_type}</span>
                  : <span style={{ color: 'var(--text-3)' }}>Not set</span>}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-5 pt-4 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
            <button onClick={() => navigate('/setup/step1')} className="underline">Edit info</button>
            <span>·</span>
            <button onClick={() => navigate('/setup/step2')} className="underline">Edit bio</button>
          </div>
        </div>

        <button onClick={submit} className="btn-primary w-full py-3 text-base scale-in">
          🎉 Let's Go!
        </button>
      </div>
    </div>
  )
}
