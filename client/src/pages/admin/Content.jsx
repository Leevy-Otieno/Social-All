import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import { 
  AiOutlineFileText, 
  AiOutlineAlert, 
  AiOutlineCheckCircle, 
  AiOutlineCloseCircle, 
  AiOutlineEye, 
  AiOutlineDelete,
  AiOutlinePoweroff
} from 'react-icons/ai'

export default function AdminContent() {
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [reports, setReports] = useState([])
  const [reportStatus, setReportStatus] = useState('pending')
  const [loading, setLoading] = useState(false)

  const loadPosts = async () => {
    setLoading(true)
    try {
      const r = await adminAPI.posts({ page: 1 })
      setPosts(r.data.posts)
    } finally { setLoading(false) }
  }

  const loadReports = async () => {
    setLoading(true)
    try {
      const r = await adminAPI.reports({ status: reportStatus, page: 1 })
      setReports(r.data.reports)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (tab === 'posts') loadPosts()
    else loadReports()
  }, [tab, reportStatus])

  const togglePost = async (id) => { 
    await adminAPI.togglePost(id)
    loadPosts()
  }

  const delPost = async (id) => { 
    if (!confirm('Delete this post permanently?')) return
    await adminAPI.deletePost(id)
    loadPosts()
  }

  const actionReport = async (id) => { 
    const note = prompt('Admin note for this action:')
    if (note === null) return
    await adminAPI.actionReport(id, note || 'Violated community standards')
    loadReports()
  }

  const dismissReport = async (id) => { 
    const note = prompt('Admin note for dismissal:')
    if (note === null) return
    await adminAPI.dismissReport(id, note || 'No violation found')
    loadReports()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Content Moderation</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Monitor posts and handle user reports</p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
          <button 
            onClick={() => setTab('posts')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${tab === 'posts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <AiOutlineFileText /> Posts
          </button>
          <button 
            onClick={() => setTab('reports')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${tab === 'reports' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <AiOutlineAlert /> Reports
          </button>
        </div>
      </div>

      {tab === 'posts' ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Author</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Content Preview</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Media</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {posts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="font-black text-slate-900">@{p.username}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(p.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-5">
                      <p className="text-sm text-slate-600 line-clamp-2 max-w-xs">{p.text || <i className="text-slate-300">No text content</i>}</p>
                    </td>
                    <td className="p-5">
                       {p.image ? (
                         <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                           <img src={`/storage/${p.image}`} className="w-full h-full object-cover" />
                         </div>
                       ) : <span className="text-[10px] font-black text-slate-300 uppercase">None</span>}
                    </td>
                    <td className="p-5">
                      {p.is_active ? (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">Visible</span>
                      ) : (
                        <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">Hidden</span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => togglePost(p.id)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-all" title="Toggle Visibility">
                          <AiOutlinePoweroff size={18} />
                        </button>
                        <button onClick={() => delPost(p.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete Post">
                          <AiOutlineDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {['pending', 'actioned', 'dismissed'].map(s => (
              <button 
                key={s} 
                onClick={() => setReportStatus(s)}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportStatus === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-200'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Reporter</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Target</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Reason</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                    {reportStatus === 'pending' && <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reports.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-5 font-bold text-slate-900">@{r.reporter_username}</td>
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-primary">{r.target_type}</span>
                          <span className="text-xs text-slate-400 font-bold">ID: #{r.target_id}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1 rounded-lg">{r.reason}</span>
                      </td>
                      <td className="p-5 text-xs font-bold text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      {reportStatus === 'pending' && (
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => actionReport(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                              <AiOutlineCheckCircle size={14} /> Action
                            </button>
                            <button onClick={() => dismissReport(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                              <AiOutlineCloseCircle size={14} /> Dismiss
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-20 text-center">
                        <p className="text-slate-400 font-bold">No reports found in this category</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
