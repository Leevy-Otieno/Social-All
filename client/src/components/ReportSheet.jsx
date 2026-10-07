import { useState } from 'react'
import { postAPI } from '@/lib/api'
import { getConfig } from '@/config'
import { AiOutlineClose, AiOutlineAlert } from 'react-icons/ai'

export default function ReportSheet({ targetId, targetType, open, onOpenChange }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const config = getConfig()

  if (!open) return null

  const handleSubmit = async () => {
    if (!reason) return
    setLoading(true)
    try {
      await postAPI.report(targetId, reason)
      alert('Report sent. Thank you for keeping our community safe.')
      onOpenChange(false)
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={() => onOpenChange(false)} />
      
      <div 
        className="w-full max-w-lg bg-white rounded-t-[2.5rem] flex flex-col relative z-10 shadow-2xl animate-in slide-in-from-bottom duration-500 h-[85dvh] lg:h-[70vh] lg:rounded-3xl lg:mb-8 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 mb-2 shrink-0" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 shadow-sm">
              <AiOutlineAlert size={26} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Report {targetType}</h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Community Safety</p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-2.5 hover:bg-slate-50 rounded-full transition-all text-slate-400 active:scale-75">
            <AiOutlineClose size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
          {(config.reportReasons || []).map(r => (
            <label 
              key={r.key} 
              className={`flex items-center gap-5 p-5 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${reason === r.key ? 'border-slate-900 bg-slate-50 shadow-inner' : 'border-slate-50 hover:border-slate-100 hover:bg-slate-50/50'}`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${reason === r.key ? 'border-slate-900 bg-slate-900' : 'border-slate-200'}`}>
                {reason === r.key && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-300" />}
              </div>
              <input type="radio" name="reason" value={r.key} checked={reason === r.key} onChange={() => setReason(r.key)} className="hidden" />
              <span className={`text-[15px] font-black tracking-tight transition-colors ${reason === r.key ? 'text-slate-900' : 'text-slate-400'}`}>{r.label}</span>
            </label>
          ))}
        </div>

        <div className="p-6 border-t border-slate-50 bg-white rounded-b-3xl shrink-0 flex gap-4 pb-safe">
          <button 
            onClick={() => onOpenChange(false)} 
            className="flex-1 py-4 rounded-2xl border border-slate-100 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !reason} 
            className="flex-1 py-4 rounded-2xl bg-rose-500 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-500/20 disabled:opacity-30 disabled:shadow-none hover:bg-rose-600 transition-all active:scale-95"
          >
            {loading ? 'Sending...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
