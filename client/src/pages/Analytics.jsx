import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileAPI } from '@/lib/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getImageUrl } from '@/lib/utils'
import { XpCoin, getLevel } from '@/components/XpSnackbar'
import { AiOutlineArrowLeft, AiOutlineHeart, AiOutlineMessage, AiOutlineEye, AiOutlineCalendar } from 'react-icons/ai'

const FILTERS = [
  { label: '12h', days: 1 },
  { label: '24h', days: 1 },
  { label: '7d',  days: 7 },
  { label: '28d', days: 28 },
  { label: '3m',  days: 90 },
  { label: '6m',  days: 180 },
  { label: 'Custom', custom: true },
]

const STAT_CARDS = [
  { key: 'totalReach',    label: 'Reach',    color: '#2563EB',  icon: <AiOutlineEye size={14} /> },
  { key: 'totalLikes',    label: 'Likes',    color: '#EF4444',  icon: <AiOutlineHeart size={14} /> },
  { key: 'totalComments', label: 'Comments', color: '#F59E0B',  icon: <AiOutlineMessage size={14} /> },
  { key: 'postsCount',    label: 'Posts',    color: '#22C55E',  icon: null },
  { key: 'xp',            label: 'Total XP', color: '#16a34a',  icon: null, isXp: true },
]

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0',
      borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    }}>
      <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB' }}>Reach: {payload[0].value}</p>
    </div>
  )
}

// Build chart data — fill gaps with 0 for the selected period
function buildChartData(reachData, days, fromDate, toDate) {
  const isCustom = !!(fromDate && toDate)
  let startDate, endDate

  if (isCustom) {
    startDate = new Date(fromDate)
    endDate = new Date(toDate)
  } else {
    endDate = new Date()
    startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))
  }

  const dates = []
  const cur = new Date(startDate)
  while (cur <= endDate) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }

  // Decide label density based on count
  const step = dates.length > 14 ? Math.ceil(dates.length / 7) : 1

  return dates.map((dateStr, i) => {
    const ex = reachData.find(r => r.date === dateStr)
    const d = new Date(dateStr)
    const label = dates.length <= 7
      ? d.toLocaleDateString('en', { weekday: 'short', day: 'numeric' })
      : d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    return {
      date: i % step === 0 ? label : '',
      fullDate: label,
      reach: ex ? Number(ex.reach) : 0,
    }
  })
}

export default function Analytics() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [posts, setPosts] = useState([])
  const [reachData, setReachData] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('28d')
  const [showCustom, setShowCustom] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0])
  const [xpHistory, setXpHistory] = useState([])
  const [xpPerLevel, setXpPerLevel] = useState(1000)
  const abortRef = useRef(null)

  const load = useCallback(async (filterKey, customFrom, customTo) => {
    // Cancel previous request
    if (abortRef.current) abortRef.current = false
    abortRef.current = true
    const token = abortRef.current

    setLoading(true)
    try {
      const f = FILTERS.find(x => x.label === filterKey)
      let params = {}

      if (f?.custom && customFrom && customTo) {
        params = { from: customFrom, to: customTo }
      } else if (f?.days) {
        params = { days: f.days }
      }

      const r = await profileAPI.analytics(params)
      if (!token) return // stale response
      setStats(r.data.stats)
      setPosts(r.data.posts || [])
      setReachData(r.data.reachData || [])
      setXpHistory(r.data.xpHistory || [])
      setXpPerLevel(r.data.xpPerLevel || 1000)
    } catch (e) {
      console.error('Analytics error:', e)
    } finally {
      if (token) setLoading(false)
    }
  }, [])

  // Load on mount with default filter
  useEffect(() => { load('28d') }, [])

  const applyFilter = (filterKey) => {
    if (filterKey === 'Custom') { setShowCustom(true); return }
    setActiveFilter(filterKey)
    setShowCustom(false)
    load(filterKey)
  }

  const applyCustom = () => {
    if (!fromDate || !toDate) return
    setActiveFilter('Custom')
    setShowCustom(false)
    load('Custom', fromDate, toDate)
  }

  const f = FILTERS.find(x => x.label === activeFilter)
  const chartData = buildChartData(
    reachData,
    f?.days || 28,
    activeFilter === 'Custom' ? fromDate : null,
    activeFilter === 'Custom' ? toDate : null,
  )

  const maxReach = Math.max(...chartData.map(d => d.reach), 1)

  return (
    <div className="min-h-screen pb-24 fade-in" style={{ background: 'var(--surface)', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 h-12 border-b"
        style={{ background: 'rgba(255,255,255,0.97)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)', padding: '0 12px' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full transition-colors shrink-0"
          style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <AiOutlineArrowLeft size={20} />
        </button>
        <span className="font-bold text-sm flex-1 truncate" style={{ color: 'var(--text-1)' }}>Insights</span>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 whitespace-nowrap" style={{ background: '#DBEAFE', color: '#2563EB' }}>
          {activeFilter === 'Custom' ? `${fromDate} → ${toDate}` : activeFilter}
        </span>
      </div>

      {/* ── Time Filter Bar ── */}
      <div style={{ padding: '10px 12px 4px' }}>
        <div
          className="flex gap-1.5 pb-1"
          style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {FILTERS.map(f => (
            <button
              key={f.label}
              onClick={() => applyFilter(f.label)}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                ...(activeFilter === f.label
                  ? { background: '#2563EB', color: 'white', border: '1.5px solid #2563EB' }
                  : { background: 'var(--background)', color: 'var(--text-2)', border: '1.5px solid var(--border)' }
                ),
              }}
            >
              {f.label === 'Custom' && <AiOutlineCalendar size={12} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Custom Date Picker ── */}
      {showCustom && (
        <div style={{ margin: '8px 12px 0', padding: 16, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--background)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, marginBottom: 10, color: 'var(--text-3)', letterSpacing: '0.05em' }}>CUSTOM DATE RANGE</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 110 }}>
              <label style={{ display: 'block', fontSize: 11, marginBottom: 4, fontWeight: 500, color: 'var(--text-3)' }}>From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} max={toDate}
                style={{ width: '100%', padding: '7px 8px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface)', outline: 'none' }} />
            </div>
            <div style={{ flex: 1, minWidth: 110 }}>
              <label style={{ display: 'block', fontSize: 11, marginBottom: 4, fontWeight: 500, color: 'var(--text-3)' }}>To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
                style={{ width: '100%', padding: '7px 8px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface)', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => setShowCustom(false)} style={{ flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 12, fontWeight: 600, border: '1px solid var(--border)', color: 'var(--text-2)', background: 'var(--surface)' }}>Cancel</button>
            <button onClick={applyCustom} disabled={!fromDate || !toDate} style={{ flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 12, fontWeight: 600, color: 'white', background: '#2563EB', border: 'none', opacity: (!fromDate || !toDate) ? 0.4 : 1 }}>Apply</button>
          </div>
        </div>
      )}

      <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {STAT_CARDS.map(({ key, label, color, icon }) => (
            <div
              key={key}
              style={{
                borderRadius: 16,
                padding: '14px 12px',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                minWidth: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                {icon && <span style={{ color, display: 'flex' }}>{icon}</span>}
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', margin: 0 }}>{label}</p>
              </div>
              <p style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color, margin: 0, lineHeight: 1 }}>
                {loading ? <span style={{ fontSize: 16 }} className="animate-pulse">—</span> : (stats?.[key] ?? 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* ── Reach Chart ── */}
        <div style={{
          borderRadius: 16,
          border: '1px solid var(--border)',
          padding: '14px 10px 8px',
          background: 'var(--background)',
          overflow: 'hidden',
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Content Reach</h3>
            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: '#DBEAFE', color: '#2563EB' }}>
              {activeFilter === 'Custom' ? 'Custom' : activeFilter}
            </span>
          </div>
          <div style={{ width: '100%', height: 180, minWidth: 0 }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: '#2563EB', borderRadius: '50%' }} />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: 'var(--text-3)' }}
                    interval={0}
                  />
                  <YAxis hide domain={[0, maxReach * 1.2 || 10]} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area
                    type="monotone"
                    dataKey="reach"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fill="url(#rg)"
                    dot={chartData.length <= 14 ? { r: 3, fill: '#2563EB', strokeWidth: 0 } : false}
                    activeDot={{ r: 5, fill: '#2563EB' }}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: '1px dashed var(--border)', color: 'var(--text-3)' }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>No reach data for this period</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Try a wider date range</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Post Performance ── */}
        {!loading && posts.length > 0 && (
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-1)' }}>Post Performance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {posts.slice(0, 20).map(p => {
                const er = Math.round(((p.likes_count + p.comments_count) / Math.max(1, p.reach_count)) * 100)
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/p/${p.id}`)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 16,
                      border: '1px solid var(--border)',
                      background: 'var(--background)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                      minWidth: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#2563EB'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, overflow: 'hidden',
                      flexShrink: 0, border: '1px solid var(--border)', background: 'var(--surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {p.image
                        ? <img src={getImageUrl(p.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-3)' }}>TXT</span>
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <p style={{
                        fontSize: 12, fontWeight: 600, color: 'var(--text-1)', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}>
                        {p.text || 'Photo post'}
                      </p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 500, color: '#2563EB' }}>
                          <AiOutlineEye size={10} />{(p.reach_count || 0).toLocaleString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 500, color: '#EF4444' }}>
                          <AiOutlineHeart size={10} />{(p.likes_count || 0).toLocaleString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 500, color: '#F59E0B' }}>
                          <AiOutlineMessage size={10} />{(p.comments_count || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* ER badge */}
                    <div style={{ flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap',
                          background: er >= 5 ? 'rgba(34,197,94,0.12)' : er >= 2 ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.1)',
                          color: er >= 5 ? '#16A34A' : er >= 2 ? '#D97706' : 'var(--text-3)',
                        }}
                      >
                        {er}% ER
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {/* XP Analytics Section */}
        {stats && (
          <div style={{ marginTop: 8, padding: '0 16px 20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <XpCoin size={18} /> XP Analytics
            </h3>

            {/* Level progress */}
            {(() => {
              const { level, progress, xpInLevel, xpNeeded } = getLevel(stats.xp, xpPerLevel)
              return (
                <div style={{
                  padding: '14px 16px', borderRadius: 14, marginBottom: 14,
                  background: 'linear-gradient(135deg, #065f46 0%, #16a34a 100%)',
                  color: '#fff',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 800 }}>Level {level}</span>
                    <span style={{ fontSize: 12, opacity: 0.85 }}>{(stats.xp || 0).toLocaleString()} Total XP</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 6, background: '#fff', transition: 'width 0.5s ease' }} />
                  </div>
                  <p style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>{xpInLevel}/{xpNeeded} XP to Level {level + 1}</p>
                </div>
              )
            })()}

            {/* Recent XP History */}
            {xpHistory.length > 0 && (
              <div style={{
                border: '1px solid var(--border)', borderRadius: 14,
                overflow: 'hidden', background: 'var(--surface)',
              }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Recent XP Activity</p>
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {xpHistory.slice(0, 20).map((tx, i) => {
                    const actionColors = { like: '#EF4444', comment: '#F59E0B', reply: '#3B82F6', follow: '#8B5CF6' }
                    return (
                      <div key={tx.id || i} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                        borderBottom: i < 19 ? '1px solid var(--border)' : 'none',
                      }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: `${actionColors[tx.action] || '#64748B'}15`,
                          color: actionColors[tx.action] || '#64748B', textTransform: 'capitalize',
                        }}>{tx.action}</span>
                        <span style={{ flex: 1, fontSize: 11, color: 'var(--text-3)' }}>
                          {new Date(tx.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>+{tx.xp_amount} XP</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
