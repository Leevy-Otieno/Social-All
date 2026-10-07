import { useXpStore } from '@/store'
import { useEffect, useState } from 'react'

const XP_COIN = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="url(#xpGrad)" stroke="#15803d" strokeWidth="1.5"/>
    <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Inter,sans-serif">XP</text>
    <defs>
      <linearGradient id="xpGrad" x1="0" y1="0" x2="24" y2="24">
        <stop offset="0%" stopColor="#4ade80"/>
        <stop offset="100%" stopColor="#16a34a"/>
      </linearGradient>
    </defs>
  </svg>
)

export function XpCoin({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="url(#xpG2)" stroke="#15803d" strokeWidth="1.5"/>
      <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Inter,sans-serif">XP</text>
      <defs>
        <linearGradient id="xpG2" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#4ade80"/>
          <stop offset="100%" stopColor="#16a34a"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export function getLevel(xp, xpPerLevel = 1000, maxLevel = 0) {
  // Level 1 = 1000xp, Level 2 = 2000xp, ... infinite (no cap)
  const totalXp = xp || 0
  const level = Math.floor(totalXp / xpPerLevel)
  const xpInLevel = totalXp % xpPerLevel
  const xpNeeded = xpPerLevel
  const progress = xpInLevel / xpNeeded
  return { level, progress, xpInLevel, xpNeeded }
}

const ACTION_LABELS = {
  like: 'Like',
  comment: 'Comment',
  reply: 'Reply',
  follow: 'Follow',
}

export default function XpSnackbar() {
  const { xpNotification } = useXpStore()
  const [visible, setVisible] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    if (xpNotification) {
      setData(xpNotification)
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 2600)
      return () => clearTimeout(timer)
    }
  }, [xpNotification?.id])

  if (!data) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '80px'})`,
        zIndex: 9999,
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px 8px 14px',
          borderRadius: 50,
          background: '#0f172a',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <XpCoin size={18} />
        <span style={{ fontSize: 15, letterSpacing: 0.3, color: '#4ade80' }}>+{data.amount} XP</span>
        <button
          onClick={() => setVisible(false)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1, padding: 0,
          }}
        >×</button>
      </div>
    </div>
  )
}
