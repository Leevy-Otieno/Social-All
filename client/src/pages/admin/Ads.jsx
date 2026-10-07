import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import { 
  AiOutlinePlus, 
  AiOutlineAppstore, 
  AiOutlineEye, 
  AiOutlineLink, 
  AiOutlineDelete, 
  AiOutlinePoweroff,
  AiOutlineYoutube,
  AiOutlinePicture,
  AiOutlineClose
} from 'react-icons/ai'

export default function AdminAds() {
  const [ads, setAds] = useState([])
  const [form, setForm] = useState({ type: 'custom', title: '', caption: '', youtube_url: '', cta_text: 'Learn More', cta_url: '', placement: ['feed'], starts_at: '', ends_at: '' })
  const [image, setImage] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await adminAPI.ads()
      setAds(r.data.ads)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const submit = async () => {
    if (!form.title || !form.cta_url) return alert('Please fill required fields')
    const fd = new FormData()
    Object.keys(form).forEach(k => fd.append(k, Array.isArray(form[k]) ? JSON.stringify(form[k]) : form[k]))
    if (image) fd.append('image', image)
    
    try {
      await adminAPI.createAd(fd)
      setShowForm(false)
      setForm({ type: 'custom', title: '', caption: '', youtube_url: '', cta_text: 'Learn More', cta_url: '', placement: ['feed'], starts_at: '', ends_at: '' })
      setImage(null)
      load()
    } catch (e) { alert('Failed to create ad') }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Advertisements</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Create and monitor platform campaigns</p>
        </div>
        
        <button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          <AiOutlinePlus size={20} /> Create Campaign
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">New Campaign</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all">
                <AiOutlineClose size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70dvh] overflow-y-auto custom-scrollbar">
              <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                <button 
                  onClick={() => setForm({ ...form, type: 'custom' })}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${form.type === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  <AiOutlinePicture /> Custom Image
                </button>
                <button 
                  onClick={() => setForm({ ...form, type: 'youtube' })}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${form.type === 'youtube' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  <AiOutlineYoutube /> YouTube Video
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Campaign Title *</label>
                  <input 
                    placeholder="Enter catchy title" 
                    value={form.title} 
                    onChange={e => setForm({ ...form, title: e.target.value })} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CTA URL *</label>
                  <input 
                    placeholder="https://example.com" 
                    value={form.cta_url} 
                    onChange={e => setForm({ ...form, cta_url: e.target.value })} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              {form.type === 'youtube' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">YouTube Video URL *</label>
                  <input 
                    placeholder="https://youtube.com/watch?v=..." 
                    value={form.youtube_url} 
                    onChange={e => setForm({ ...form, youtube_url: e.target.value })} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-slate-900"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Campaign Image *</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setImage(e.target.files[0])} 
                    className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Placements</label>
                <div className="flex flex-wrap gap-2">
                  {['feed', 'explore', 'notifications'].map(p => (
                    <label key={p} className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all border-2 ${form.placement.includes(p) ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-slate-100 text-slate-400'}`}>
                      <input 
                        type="checkbox" 
                        hidden
                        checked={form.placement.includes(p)} 
                        onChange={e => setForm({ ...form, placement: e.target.checked ? [...form.placement, p] : form.placement.filter(x => x !== p) })} 
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest">{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Start Date</label>
                    <input type="date" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">End Date</label>
                    <input type="date" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none" />
                 </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex items-center justify-end gap-3">
               <button onClick={() => setShowForm(false)} className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
               <button onClick={submit} className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Launch Campaign</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map(a => (
          <div key={a.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
            <div className="relative h-48 bg-slate-100">
               {a.type === 'youtube' ? (
                 <div className="w-full h-full flex items-center justify-center bg-slate-900 text-rose-500">
                   <AiOutlineYoutube size={64} />
                 </div>
               ) : (
                 <img src={`/storage/${a.image}`} className="w-full h-full object-cover" />
               )}
               <div className="absolute top-4 right-4 flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${a.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                    {a.is_active ? 'Active' : 'Paused'}
                  </div>
               </div>
            </div>

            <div className="p-6 space-y-4 flex-1">
               <div>
                 <h3 className="font-black text-slate-900 truncate">{a.title}</h3>
                 <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">{a.type} campaign • {(() => { try { const p = typeof a.placement === 'string' ? JSON.parse(a.placement) : a.placement; return Array.isArray(p) ? p.join(', ') : p; } catch(e) { return a.placement || 'feed' } })()}</p>
               </div>

               <div className="grid grid-cols-2 gap-2">
                 <div className="bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                       <AiOutlineEye size={12} />
                       <span className="text-[8px] font-black uppercase tracking-widest">Views</span>
                    </div>
                    <div className="text-xl font-black text-slate-900">{a.impressions?.toLocaleString() || 0}</div>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                       <AiOutlineLink size={12} />
                       <span className="text-[8px] font-black uppercase tracking-widest">Clicks</span>
                    </div>
                    <div className="text-xl font-black text-slate-900">{a.clicks?.toLocaleString() || 0}</div>
                 </div>
               </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-1">
                  <button onClick={() => { adminAPI.toggleAd(a.id).then(load) }} className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all" title="Toggle Active">
                    <AiOutlinePoweroff size={18} />
                  </button>
                  <button onClick={() => { if (confirm('Delete campaign?')) adminAPI.deleteAd(a.id).then(load) }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all" title="Delete Campaign">
                    <AiOutlineDelete size={18} />
                  </button>
               </div>
               <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">ID: #{a.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
