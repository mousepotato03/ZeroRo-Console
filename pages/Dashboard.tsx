import React from 'react';
import { 
  Users, 
  Target, 
  Trophy, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UiKit';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { AnalyticsSummary, DailyStat } from '../types';

const mockDailyStats: DailyStat[] = [
  { date: 'Mon', participants: 40, completions: 24 },
  { date: 'Tue', participants: 55, completions: 35 },
  { date: 'Wed', participants: 80, completions: 60 },
  { date: 'Thu', participants: 75, completions: 50 },
  { date: 'Fri', participants: 110, completions: 90 },
  { date: 'Sat', participants: 150, completions: 120 },
  { date: 'Sun', participants: 135, completions: 115 },
];

const summary: AnalyticsSummary = {
  totalCampaigns: 12,
  totalParticipants: 3420,
  totalMissionsCompleted: 15200,
  totalPointsDistributed: 450000
};

const KPICard = ({ title, value, icon: Icon, trend, trendUp }: any) => (
  <Card className="hover:border-emerald-200 transition-colors duration-200">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
           <Icon className="w-5 h-5 text-slate-700" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
        <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
      </div>
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your environmental impact and campaign performance.</p>
        </div>
        <div className="flex gap-2">
           <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
             <option>Last 7 Days</option>
             <option>Last 30 Days</option>
             <option>This Year</option>
           </select>
           <button className="h-10 px-4 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
             Export Report
           </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Participants" 
          value={summary.totalParticipants.toLocaleString()} 
          icon={Users}
          trend="12.5%"
          trendUp={true}
        />
        <KPICard 
          title="Missions Completed" 
          value={summary.totalMissionsCompleted.toLocaleString()} 
          icon={Target}
          trend="8.2%"
          trendUp={true}
        />
        <KPICard 
          title="Points Distributed" 
          value={`${(summary.totalPointsDistributed / 1000).toFixed(1)}k`} 
          icon={Trophy}
          trend="2.1%"
          trendUp={false}
        />
        <KPICard 
          title="Active Campaigns" 
          value={summary.totalCampaigns} 
          icon={Activity}
          trend="Stable"
          trendUp={true}
        />
      </div>

      {/* Charts & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Participation Trends</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockDailyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="participants" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorParticipants)" />
                  </AreaChart>
             </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>

        {/* Secondary Chart / List */}
        <div className="space-y-8">
           <Card>
            <CardHeader>
              <CardTitle>Daily Completions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockDailyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="completions" fill="#0f172a" radius={[4, 4, 4, 4]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
               <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                       <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">
                         JD
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">John Doe completed "Clean Up"</p>
                          <p className="text-xs text-slate-400">2 minutes ago • Seoul</p>
                       </div>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};