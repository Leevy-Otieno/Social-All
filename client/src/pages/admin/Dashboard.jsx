import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import { 
  AiOutlineUser, 
  AiOutlineFileText, 
  AiOutlineAppstore, 
  AiOutlineAlert,
  AiOutlineLineChart,
  AiOutlineArrowUp,
  AiOutlineArrowDown
} from 'react-icons/ai'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [])

  const load = async () => {
    try {
      const r = await adminAPI.dashboard()
      setStats(r.data)
    } catch (e) {} finally { setLoading(false) }
  }

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-3xl shadow-sm"></div>)}
      <div className="lg:col-span-3 h-80 bg-white rounded-3xl shadow-sm"></div>
      <div className="h-80 bg-white rounded-3xl shadow-sm"></div>
    </div>
  )

  const cards = [
    { label: 'Total Users', value: stats?.stats.totalUsers, icon: AiOutlineUser, color: 'text-blue-500', bg: 'bg-blue-50', trend: '+12%', up: true },
    { label: 'Total Posts', value: stats?.stats.totalPosts, icon: AiOutlineFileText, color: 'text-indigo-500', bg: 'bg-indigo-50', trend: '+5%', up: true },
    { label: 'Active Ads', value: stats?.stats.activeAds, icon: AiOutlineAppstore, color: 'text-amber-500', bg: 'bg-amber-50', trend: 'Stable', up: true },
    { label: 'Reports', value: stats?.stats.pendingReports, icon: AiOutlineAlert, color: 'text-rose-500', bg: 'bg-rose-50', trend: '-2%', up: false },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${c.bg} ${c.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <c.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-full ${c.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {c.up ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />}
                {c.trend}
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
            <h3 className="text-3xl font-black text-slate-900">{c.value?.toLocaleString() || 0}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Growth Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 -mr-32 -mt-32 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">User Growth</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Acquisition last 30 days</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 shadow-inner">
              <AiOutlineLineChart size={28} />
            </div>
          </div>
          
          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.userGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 900 }}
                  tickFormatter={(str) => {
                    const d = new Date(str);
                    return d.getDate();
                  }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '12px 20px' }}
                  labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: '#94a3b8', letterSpacing: '0.1em' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#0f172a" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Report Status Pie */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-900 mb-1">Reports</h3>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-8">Resolution status</p>
          
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.reportPie || []}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={500}
                >
                  {stats?.reportPie?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#ef4444'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900">{stats?.stats.pendingReports || 0}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
             {stats?.reportPie?.map((s, i) => (
               <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${['bg-blue-500', 'bg-amber-500', 'bg-rose-500'][i % 3]}`} />
                    <span className="font-bold text-slate-600 capitalize">{s.name}</span>
                  </div>
                  <span className="font-black text-slate-900">{s.value}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
