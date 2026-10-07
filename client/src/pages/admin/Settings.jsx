import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import { 
  AiOutlineGlobal, 
  AiOutlineRocket,
  AiOutlineSave,
  AiOutlineEdit,
  AiOutlineClose,
  AiOutlineCheck,
  AiOutlineControl,
} from 'react-icons/ai'

const TABS = [
  { key: 'general', label: 'General', icon: <AiOutlineGlobal size={18} /> },
  { key: 'limits', label: 'Limits', icon: <AiOutlineControl size={18} /> },
]

const CATEGORY_META = {
  profile:       { label: 'Profile & Users', color: '#7C3AED', bg: '#F5F3FF' },
  posts:         { label: 'Posts & Content', color: '#2563EB', bg: '#EFF6FF' },
  comments:      { label: 'Comments',        color: '#6366F1', bg: '#EEF2FF' },
  ads:           { label: 'Ads Engine',      color: '#16A34A', bg: '#F0FDF4' },
  notifications: { label: 'Notifications',   color: '#EA580C', bg: '#FFF7ED' },
  messages:      { label: 'Messages & DMs',  color: '#0891B2', bg: '#ECFEFF' },
  explore:       { label: 'Explore',         color: '#0284C7', bg: '#F0F9FF' },
  suggestions:   { label: 'Feed Suggestions',color: '#D97706', bg: '#FFFBEB' },
  rate_limits:   { label: 'Rate Limits',     color: '#DC2626', bg: '#FEF2F2' },
  admin:         { label: 'Admin Panel',     color: '#475569', bg: '#F8FAFC' },
  xp:            { label: 'XP System',       color: '#16A34A', bg: '#F0FDF4' },
  general:       { label: 'General',         color: '#64748B', bg: '#F8FAFC' },
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('limits')
  const [configData, setConfigData] = useState(null)
  const [limits, setLimits] = useState([])
  const [grouped, setGrouped] = useState({})
  const [saving, setSaving] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const r = await adminAPI.settings()
      setConfigData(r.data.config)
      setLimits(r.data.settings || [])
      setGrouped(r.data.grouped || {})
    } catch (e) { console.error(e) }
  }

  // ── General Tab Save ──
  const saveGeneral = async () => {
    setSaving(true)
    try {
      await adminAPI.updateSettings(configData)
      setSaveMsg('Settings updated!')
      setTimeout(() => setSaveMsg(''), 2000)
    } finally { setSaving(false) }
  }

  // ── Limits: Inline Edit ──
  const startEdit = (item) => {
    setEditingKey(item.key)
    setEditValue(item.value)
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditValue('')
  }

  const saveEdit = async () => {
    if (!editingKey) return
    setSaving(true)
    try {
      await adminAPI.updateLimit({ key: editingKey, value: editValue })
      await loadSettings()
      cancelEdit()
      setSaveMsg('Limit updated!')
      setTimeout(() => setSaveMsg(''), 2000)
    } finally { setSaving(false) }
  }

  if (!configData && limits.length === 0) {
    return <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Initializing Platform Settings...</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Platform Settings</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Configuration & Limits Control</p>
        </div>
        {saveMsg && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold animate-in fade-in">
            <AiOutlineCheck size={16} /> {saveMsg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-0">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all relative"
            style={{
              color: activeTab === t.key ? '#0F172A' : '#94A3B8',
              borderBottom: activeTab === t.key ? '3px solid #0F172A' : '3px solid transparent',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════ GENERAL TAB ════════════════ */}
      {activeTab === 'general' && configData && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={saveGeneral}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : <><AiOutlineSave size={20} /> Save Changes</>}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* App Info */}
            <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <AiOutlineGlobal size={24} />
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">General Branding</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Application Name</label>
                  <input 
                    value={configData.app?.name || ''} 
                    onChange={e => setConfigData({ ...configData, app: { ...configData.app, name: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Domain</label>
                  <input 
                    value={configData.app?.domain || ''} 
                    onChange={e => setConfigData({ ...configData, app: { ...configData.app, domain: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none font-bold text-slate-900"
                  />
                </div>
                <label className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded-lg text-rose-600 focus:ring-rose-500"
                    checked={!!configData.app?.maintenance} 
                    onChange={e => setConfigData({ ...configData, app: { ...configData.app, maintenance: e.target.checked } })} 
                  />
                  <div>
                    <div className="text-xs font-black text-rose-900 uppercase tracking-widest">Maintenance Mode</div>
                    <div className="text-[10px] text-rose-600 font-bold uppercase">Locks the app for everyone except admins</div>
                  </div>
                </label>
              </div>
            </section>

            {/* Ad Engine */}
            <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-5">
              <div className="flex items-center gap-3 text-indigo-500">
                <AiOutlineRocket size={24} />
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Monetization</h3>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer">
                  <input type="checkbox" checked={configData.ads?.enabled} onChange={e => setConfigData({...configData, ads: {...configData.ads, enabled: e.target.checked}})} className="w-5 h-5 rounded-lg" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Enable Ad Engine</span>
                </label>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ════════════════ LIMITS TAB ════════════════ */}
      {activeTab === 'limits' && (
        <div className="space-y-5">
          <p className="text-xs text-slate-400 font-bold">
            {limits.length} limits · Click edit to change any value · Changes apply instantly
          </p>

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 text-slate-300">
              <AiOutlineControl size={48} className="mx-auto mb-4" />
              <p className="text-lg font-black">No limits found</p>
              <p className="text-sm mt-1">Restart the server to seed default limits</p>
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => {
              const meta = CATEGORY_META[cat] || CATEGORY_META.general
              return (
                <div key={cat} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  {/* Category Header */}
                  <div className="px-6 py-3.5 flex items-center gap-3 border-b border-slate-50" style={{ background: meta.bg }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
                    <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: meta.color }}>
                      {meta.label}
                    </h3>
                    <span className="ml-auto text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      {items.length} {items.length === 1 ? 'limit' : 'limits'}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-slate-50">
                    {items.map(item => {
                      const isEditing = editingKey === item.key
                      return (
                        <div key={item.key} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                          {/* Label */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{item.label}</p>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{item.key}</p>
                          </div>

                          {isEditing ? (
                            /* Edit Mode */
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                                className="w-24 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-300 outline-none text-sm font-black text-blue-700 text-center focus:border-blue-500"
                                type={item.type === 'number' ? 'number' : 'text'}
                              />
                              <button onClick={saveEdit} disabled={saving} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-all" title="Save">
                                <AiOutlineCheck size={15} />
                              </button>
                              <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all" title="Cancel">
                                <AiOutlineClose size={15} />
                              </button>
                            </div>
                          ) : (
                            /* View Mode */
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span
                                className="text-base font-black tabular-nums px-3.5 py-1 rounded-xl min-w-[52px] text-center"
                                style={{ background: meta.bg, color: meta.color }}
                              >
                                {item.value}
                              </span>
                              <button
                                onClick={() => startEdit(item)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-all"
                                title="Edit"
                              >
                                <AiOutlineEdit size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
