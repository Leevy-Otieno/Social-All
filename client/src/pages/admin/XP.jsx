import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import { XpCoin, getLevel } from '@/components/XpSnackbar'
import Avatar from '@/components/Avatar'
import { AiOutlineTrophy, AiOutlineEdit, AiOutlineDelete, AiOutlineSearch } from 'react-icons/ai'

export default function AdminXP() {
  const [transactions, setTransactions] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(null)
  const [editXp, setEditXp] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('leaderboard') // leaderboard | transactions

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const r = await adminAPI.getXp()
      setTransactions(r.data.transactions || [])
      setLeaderboard(r.data.leaderboard || [])
    } catch {}
    finally { setLoading(false) }
  }

  const handleEditXp = async () => {
    if (!editModal || editXp === '') return
    setSaving(true)
    try {
      await adminAPI.editUserXp(editModal.id, parseInt(editXp))
      setEditModal(null)
      setEditXp('')
      await load()
    } catch (e) { alert(e.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  const handleDeleteTx = async (id) => {
    if (!window.confirm('Delete this XP transaction? The XP will be subtracted from the user.')) return
    try {
      await adminAPI.deleteXpTx(id)
      await load()
    } catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  const actionColors = { like: '#EF4444', comment: '#F59E0B', reply: '#3B82F6', follow: '#8B5CF6' }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <AiOutlineTrophy size={24} style={{ color: '#16a34a' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>XP Management</h1>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['leaderboard', 'transactions'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: '1px solid', cursor: 'pointer', textTransform: 'capitalize',
              background: tab === t ? '#16a34a' : '#fff',
              color: tab === t ? '#fff' : '#475569',
              borderColor: tab === t ? '#16a34a' : '#e2e8f0',
              transition: 'all 0.2s',
            }}
          >{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading…</div>
      ) : (
        <>
          {tab === 'leaderboard' && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Top Users by XP</p>
              </div>
              {leaderboard.map((u, i) => {
                const { level, progress } = getLevel(u.xp)
                const medals = ['🥇', '🥈', '🥉', '💎']
                return (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <span style={{ fontSize: 16, width: 30, textAlign: 'center' }}>
                      {i < 4 ? medals[i] : `#${i + 1}`}
                    </span>
                    <Avatar src={u.avatar} name={u.name} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{u.name}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>@{u.username} · Level {level}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                      <XpCoin size={14} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{(u.xp || 0).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => { setEditModal(u); setEditXp(String(u.xp || 0)) }}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <AiOutlineEdit size={12} /> Edit XP
                    </button>
                  </div>
                )
              })}
              {leaderboard.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No users yet</div>
              )}
            </div>
          )}

          {tab === 'transactions' && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent XP Transactions</p>
              </div>
              {transactions.map(tx => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                  borderBottom: '1px solid #f1f5f9',
                }}>
                  <Avatar src={tx.avatar} name={tx.name} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>{tx.name}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>@{tx.username}</p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: `${actionColors[tx.action] || '#64748B'}15`,
                    color: actionColors[tx.action] || '#64748B', textTransform: 'capitalize',
                  }}>{tx.action}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>+{tx.xp_amount}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>
                    {new Date(tx.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                  <button
                    onClick={() => handleDeleteTx(tx.id)}
                    style={{
                      padding: 4, borderRadius: 6, border: '1px solid #fecaca',
                      background: '#fef2f2', color: '#ef4444', cursor: 'pointer',
                    }}
                  >
                    <AiOutlineDelete size={14} />
                  </button>
                </div>
              ))}
              {transactions.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No transactions yet</div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit XP Modal */}
      {editModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }} onClick={() => setEditModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, padding: 28, width: 360,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
              Edit XP — {editModal.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Avatar src={editModal.avatar} name={editModal.name} size={40} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>@{editModal.username}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                  Current: {(editModal.xp || 0).toLocaleString()} XP
                </p>
              </div>
            </div>
            <input
              type="number"
              value={editXp}
              onChange={e => setEditXp(e.target.value)}
              min="0"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid #e2e8f0', fontSize: 14, marginTop: 12, marginBottom: 16,
                outline: 'none',
              }}
              placeholder="New XP value"
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditModal(null)}
                style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={handleEditXp}
                disabled={saving}
                style={{
                  padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >{saving ? 'Saving…' : 'Update XP'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
