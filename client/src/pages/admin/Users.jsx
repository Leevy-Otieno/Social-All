import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import Avatar from '@/components/Avatar'
import VerifiedBadge from '@/components/VerifiedBadge'
import { AiOutlineSearch, AiOutlineFilter, AiOutlineMore, AiOutlineStop, AiOutlineCheckCircle, AiOutlineDelete } from 'react-icons/ai'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await adminAPI.users({ search, status, page })
      setUsers(r.data.users)
      setTotal(r.data.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { 
    const t = setTimeout(load, 500)
    return () => clearTimeout(t)
  }, [search, status, page])

  const ban = async (id) => {
    const reason = prompt('Ban reason?')
    if (!reason) return
    await adminAPI.ban(id, reason)
    load()
    if (selectedUser === id) loadUserDetails(id)
  }
  const unban = async (id) => { await adminAPI.unban(id); load(); if (selectedUser === id) loadUserDetails(id) }
  const verify = async (id) => { await adminAPI.verify(id); load(); if (selectedUser === id) loadUserDetails(id) }
  const del = async (id) => { if (!confirm('Delete this user? This is irreversible.')) return; await adminAPI.deleteUser(id); load(); if (selectedUser === id) setSelectedUser(null) }

  const loadUserDetails = async (id) => {
    try {
      const res = await adminAPI.user(id);
      setUserDetails(res.data);
    } catch(e) { alert('Failed to load user details'); }
  }

  const openUser = (id) => {
    setSelectedUser(id);
    setUserDetails(null);
    loadUserDetails(id);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Users Management</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Manage platform members and permissions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-64">
            <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by name, @username or email..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
            />
          </div>
          <div className="relative">
            <AiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)} 
              className="pl-10 pr-8 py-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold text-slate-600 appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active Only</option>
              <option value="banned">Banned Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">User Details</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Stats</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Joined</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group cursor-pointer" onClick={() => openUser(u.id)}>
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar src={u.avatar} name={u.name} size={44} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="font-black text-slate-900 truncate">{u.name}</div>
                          {u.is_verified ? <VerifiedBadge size={14} /> : null}
                        </div>
                        <div className="text-xs font-bold text-primary truncate">@{u.username}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-tighter">
                      <span className="text-slate-400"><b className="text-slate-900">{u.posts_count || 0}</b> Posts</span>
                      <span className="text-slate-400"><b className="text-slate-900">{u.followers_count || 0}</b> Followers</span>
                    </div>
                  </td>
                  <td className="p-5">
                    {u.is_banned ? (
                      <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit">
                        <AiOutlineStop size={12} /> Banned
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit">
                        <AiOutlineCheckCircle size={12} /> Active
                      </div>
                    )}
                  </td>
                  <td className="p-5 text-xs font-bold text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-5 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {u.is_banned ? (
                        <button 
                          onClick={() => unban(u.id)} 
                          className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Unban User"
                        >
                          <AiOutlineCheckCircle size={18} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => ban(u.id)} 
                          className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Ban User"
                        >
                          <AiOutlineStop size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => del(u.id)} 
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete User"
                      >
                        <AiOutlineDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <p className="text-slate-400 font-bold">No users found matching your criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-5 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing Page {page} of {Math.ceil(total / 25)}
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)} 
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest disabled:opacity-30 hover:bg-white transition-all"
            >
              Prev
            </button>
            <button 
              disabled={page >= Math.ceil(total / 25)} 
              onClick={() => setPage(p => p + 1)} 
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest disabled:opacity-30 hover:bg-slate-800 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90dvh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">User Profile</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-50 rounded-full transition-all">
                <span className="text-slate-400 font-black">X</span>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6 flex-1">
              {!userDetails ? (
                <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-sm animate-pulse">Loading User...</div>
              ) : (
                <>
                  <div className="flex items-start gap-6">
                    <Avatar src={userDetails.user.avatar} name={userDetails.user.name} size={100} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-black text-slate-900">{userDetails.user.name}</h3>
                            {userDetails.user.is_verified ? <VerifiedBadge size={20} /> : null}
                          </div>
                          <p className="text-sm font-bold text-primary">@{userDetails.user.username}</p>
                          <p className="text-xs text-slate-400 mt-1">{userDetails.user.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified</span>
                            <label className="switch">
                              <input 
                                type="checkbox" 
                                checked={!!userDetails.user.is_verified} 
                                onChange={() => verify(userDetails.user.id)} 
                              />
                              <span className="slider"></span>
                            </label>
                          </div>
                          {userDetails.user.is_banned ? (
                            <button onClick={() => unban(userDetails.user.id)} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-all">Unban</button>
                          ) : (
                            <button onClick={() => ban(userDetails.user.id)} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-200 transition-all">Ban</button>
                          )}
                          <button onClick={() => del(userDetails.user.id)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Delete</button>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 bg-slate-50 rounded-2xl grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posts</div>
                          <div className="text-lg font-black text-slate-900">{userDetails.user.posts_count || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Followers</div>
                          <div className="text-lg font-black text-slate-900">{userDetails.user.followers_count || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</div>
                          <div className="text-sm font-bold text-slate-900 mt-1">{new Date(userDetails.user.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      {userDetails.user.bio && (
                        <div className="mt-4">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bio</div>
                          <p className="text-sm text-slate-700">{userDetails.user.bio}</p>
                        </div>
                      )}
                      
                      {userDetails.user.about_html && (
                        <div className="mt-4">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">About HTML Length</div>
                          <p className="text-sm text-slate-700">{userDetails.user.about_html.length} characters</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Recent Posts</h4>
                    {(!userDetails.posts || userDetails.posts.length === 0) ? (
                      <p className="text-slate-400 text-sm font-bold">No posts found.</p>
                    ) : (
                      <div className="space-y-4">
                        {userDetails.posts.map(post => (
                          <div key={post.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-start gap-4">
                            {post.image && <img src={`/storage/${post.image}`} className="w-16 h-16 object-cover rounded-xl" />}
                            <div className="flex-1">
                              <p className="text-sm text-slate-800">{post.text || 'No text'}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.likes_count || 0} Likes</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.comments_count || 0} Comments</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <button onClick={() => { if(confirm('Delete post?')) { adminAPI.deletePost(post.id).then(()=>loadUserDetails(selectedUser)) } }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                              <AiOutlineDelete size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
