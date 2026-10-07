import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { systemAPI } from '@/lib/api'
import { AiOutlineArrowLeft, AiOutlineSafetyCertificate, AiOutlineRocket, AiOutlineStop, AiOutlineCheckCircle, AiOutlineInfoCircle, AiOutlineMessage } from 'react-icons/ai'
import { BsShieldLock, BsLightningCharge, BsCoin } from 'react-icons/bs'
import { RiUserForbidLine } from 'react-icons/ri'

export default function PrivacyLimits() {
  const navigate = useNavigate()
  const [limits, setLimits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    systemAPI.getLimits()
      .then(r => setLimits(r.data.limits || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getIcon = (key) => {
    if (key.includes('xp')) return <BsCoin className="text-yellow-500" />
    if (key.includes('post')) return <BsLightningCharge className="text-blue-500" />
    if (key.includes('message')) return <AiOutlineMessage className="text-purple-500" />
    if (key.includes('profile')) return <AiOutlineSafetyCertificate className="text-green-500" />
    return <AiOutlineInfoCircle className="text-slate-400" />
  }

  const sections = [
    {
      title: 'Community Safety',
      icon: <BsShieldLock size={24} />,
      color: '#3b82f6',
      items: [
        { label: 'Auto-Cleanup', detail: 'Accounts inactive for 5 consecutive days are automatically deleted to maintain a fresh community.' },
        { label: 'Direct Ban', detail: 'Promotion of adult content, controversies, or hate speech leads to instant, unrecoverable account deletion without warning.' },
        { label: 'Privacy First', detail: 'Your data is encrypted and used only to enhance your experience. We never sell your personal information.' }
      ]
    },
    {
      title: 'Monetization & Perks',
      icon: <AiOutlineRocket size={24} />,
      color: '#ec4899',
      items: [
        { label: 'Blue Tick Verification', detail: 'Awarded to authentic creators and YBT Tech Team members. Requires high activity and trust score.' },
        { label: 'XP Monetization', detail: 'Coming Soon! Users with high XP levels will be eligible to enable monetization on their content.' },
        { label: 'Exclusive Badges', detail: 'Unlock special badges and themes as you climb the XP leaderboard.' }
      ]
    }
  ]

  return (
    <div className="min-h-screen pb-20 fade-in" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-6 py-5 flex items-center gap-4 border-b backdrop-blur-xl bg-white/80 dark:bg-slate-900/80" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <AiOutlineArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-1)' }}>Transparency</h1>
          <p className="text-[9px] uppercase tracking-[0.2em] font-extrabold opacity-40">Privacy & Limits</p>
        </div>
      </div>

      <div className="p-6 space-y-10">
        {/* Infographic Stats/Limits Grid */}
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-1 h-5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></div>
            <h2 className="text-[11px] font-black uppercase tracking-widest opacity-50">Live Platform Metrics</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-28 rounded-3xl animate-pulse bg-slate-100 dark:bg-white/5" />)
            ) : (
              limits.map(s => (
                <div key={s.key} className="p-5 rounded-[2rem] border bg-white dark:bg-white/[0.02] shadow-sm flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-md" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      {getIcon(s.key)}
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">{s.label}</p>
                    <p className="text-2xl font-black tracking-tighter" style={{ color: 'var(--text-1)' }}>{s.value}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Policy Sections */}
        {sections.map((section, idx) => (
          <section key={idx} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl text-white shadow-lg" style={{ background: section.color }}>
                {section.icon}
              </div>
              <h2 className="text-lg font-bold">{section.title}</h2>
            </div>

            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div key={i} className="p-4 rounded-2xl border transition-all hover:bg-white/50" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <AiOutlineCheckCircle className="shrink-0" style={{ color: section.color }} />
                    <h3 className="text-sm font-bold">{item.label}</h3>
                  </div>
                  <p className="text-xs leading-relaxed opacity-70 ml-6">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Red Zone: Ban Policy */}
        <section className="p-5 rounded-3xl border-2 border-dashed border-red-500/30 bg-red-500/5 mt-10">
          <div className="flex items-center gap-3 mb-3 text-red-500">
            <RiUserForbidLine size={28} />
            <h2 className="text-lg font-black italic uppercase tracking-tighter">Instant Ban Policy</h2>
          </div>
          <p className="text-xs font-medium text-red-600/80 leading-relaxed">
            YouBGram enforces a strict <strong>Zero Tolerance</strong> policy. Posting adult content, deepfakes, or engaging in severe communal controversy will result in an <strong>immediate, permanent deletion</strong> of your account and all associated data. No warnings. No recovery.
          </p>
        </section>

        {/* Footer Info */}
        <div className="text-center pt-5 pb-10">
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Version 2.4.0 • Build Protected by YBT</p>
        </div>
      </div>
    </div>
  )
}
