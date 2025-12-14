"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Target,
  Trophy,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Leaf,
  MapPin,
  Award,
  X,
  CheckCircle2,
  Circle,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { exportToCSV, exportToPDF, exportToHWP } from '../lib/exportUtils';
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardOverview {
  totalParticipants: number;
  completedMissions: number;
  missionCompletionRate: number;
  co2Reduction: number;
  monthlyGrowth: number;
  weeklyNewParticipants: number;
  topCampaign: {
    title: string;
    participants: number;
    completed: number;
    completionRate: number;
  } | null;
  weeklyTrend: Array<{
    date: string;
    participants: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    participants: number;
  }>;
  topCategory: string | null;
  topRegion: string | null;
  campaignCompletionRate: number;
}

const COLORS = ['#10b981', '#14b8a6', '#22c55e', '#059669', '#0d9488', '#0f766e'];

const KPICard = ({ title, value, icon: Icon, trend, trendUp, onClick, clickable, color = 'blue' }: any) => {
  const colorSchemes = {
    blue: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-50', icon: 'text-white' },
    teal: { bg: 'from-teal-500 to-cyan-600', text: 'text-teal-50', icon: 'text-white' },
    orange: { bg: 'from-orange-500 to-red-500', text: 'text-orange-50', icon: 'text-white' },
    purple: { bg: 'from-purple-500 to-pink-600', text: 'text-purple-50', icon: 'text-white' }
  };

  const scheme = colorSchemes[color as keyof typeof colorSchemes] || colorSchemes.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${scheme.bg} p-5 shadow-xl transition-all duration-300 ${
        clickable ? 'cursor-pointer hover:scale-105 hover:shadow-2xl group' : 'hover:scale-102'
      }`}
      onClick={onClick}
    >
      {clickable && (
        <div className="absolute top-2 right-2 bg-white/20 backdrop-blur text-white text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
          상세보기 →
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <Icon className={`w-7 h-7 ${scheme.icon} opacity-90`} />
        {trend !== undefined && trend !== null && (
          <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md bg-white/20 backdrop-blur text-white">
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>

      <div>
        <p className={`text-xs font-medium ${scheme.text} opacity-80 mb-1`}>{title}</p>
        <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionDetails, setMissionDetails] = useState<any>(null);
  const [showCampaignRankingModal, setShowCampaignRankingModal] = useState(false);
  const [campaignRankings, setCampaignRankings] = useState<any>(null);
  const [showCompletionRateModal, setShowCompletionRateModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch('/api/dashboard/overview');
        if (response.ok) {
          const result = await response.json();
          setOverview(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: 'csv' | 'pdf' | 'hwp') => {
    if (!overview) return;

    switch (format) {
      case 'csv':
        exportToCSV(overview);
        break;
      case 'pdf':
        exportToPDF(overview);
        break;
      case 'hwp':
        exportToHWP(overview);
        break;
    }
    setShowExportDropdown(false);
  };

  const handleMissionCardClick = async () => {
    setShowMissionModal(true);
    try {
      const response = await fetch('/api/dashboard/mission-details');
      if (response.ok) {
        const result = await response.json();
        setMissionDetails(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch mission details:', error);
    }
  };

  const handleCampaignRankingClick = async () => {
    setShowCampaignRankingModal(true);
    try {
      const response = await fetch('/api/dashboard/campaign-rankings');
      if (response.ok) {
        const result = await response.json();
        setCampaignRankings(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch campaign rankings:', error);
    }
  };

  const handleCompletionRateClick = () => {
    setShowCompletionRateModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  // 차트 데이터 포맷팅
  const weeklyTrendFormatted = overview.weeklyTrend.map(item => ({
    date: new Date(item.date).toLocaleDateString('ko-KR', { weekday: 'short' }),
    participants: item.participants
  }));
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Environmental Impact Dashboard
          </h1>
          <p className="text-slate-300 mt-1 text-sm">실시간 환경 캠페인 성과 분석 센터</p>
        </div>
        <div className="flex gap-3">
           <select className="h-10 rounded-lg border border-slate-600 bg-slate-700/50 backdrop-blur px-4 text-sm font-medium text-white hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all cursor-pointer">
             <option className="bg-slate-800">Last 7 Days</option>
             <option className="bg-slate-800">Last 30 Days</option>
             <option className="bg-slate-800">This Year</option>
           </select>

           {/* Export Dropdown */}
           <div className="relative" ref={exportDropdownRef}>
             <button
               onClick={() => setShowExportDropdown(!showExportDropdown)}
               className="h-10 px-5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-emerald-500/50 flex items-center gap-2"
             >
               <Download className="w-4 h-4" />
               Export
               <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showExportDropdown ? 'rotate-180' : ''}`} />
             </button>

             {/* Dropdown Menu */}
             {showExportDropdown && (
               <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                 <div className="py-1">
                   <button
                     onClick={() => handleExport('pdf')}
                     className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                   >
                     <FileText className="w-4 h-4 text-slate-600" />
                     <div className="text-left flex-1">
                       <p className="text-sm font-semibold text-slate-900">PDF 파일</p>
                       <p className="text-xs text-slate-500">전문적인 보고서 형식</p>
                     </div>
                   </button>

                   <button
                     onClick={() => handleExport('csv')}
                     className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                   >
                     <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                     <div className="text-left flex-1">
                       <p className="text-sm font-semibold text-slate-900">CSV 파일</p>
                       <p className="text-xs text-slate-500">엑셀에서 열기 가능</p>
                     </div>
                   </button>

                   <button
                     onClick={() => handleExport('hwp')}
                     className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                   >
                     <FileText className="w-4 h-4 text-slate-600" />
                     <div className="text-left flex-1">
                       <p className="text-sm font-semibold text-slate-900">HWP 파일</p>
                       <p className="text-xs text-slate-500">한글 문서 형식</p>
                     </div>
                   </button>
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Row 1: 주요 KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="총 참여자"
          value={overview.totalParticipants.toLocaleString()}
          icon={Users}
          trend={overview.monthlyGrowth !== 0 ? `${overview.monthlyGrowth > 0 ? '+' : ''}${overview.monthlyGrowth}%` : null}
          trendUp={overview.monthlyGrowth >= 0}
          color="blue"
        />
        <KPICard
          title="이번 주 신규"
          value={overview.weeklyNewParticipants}
          icon={Activity}
          trend={null}
          trendUp={true}
          color="teal"
        />
        <KPICard
          title="미션 완료율"
          value={`${overview.missionCompletionRate}%`}
          icon={TrendingUp}
          trend={null}
          trendUp={overview.missionCompletionRate >= 50}
          color="orange"
        />
        <KPICard
          title="CO2 절감량"
          value={`${overview.co2Reduction}kg`}
          icon={Leaf}
          trend={null}
          trendUp={true}
          color="purple"
        />
      </div>

      {/* Row 2: 완료된 미션 + 최고 성과 캠페인 + 캠페인 완료율 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="완료된 미션"
          value={overview.completedMissions.toLocaleString()}
          icon={Target}
          trend={null}
          trendUp={true}
          clickable={true}
          onClick={handleMissionCardClick}
          color="teal"
        />
        <div
          className="relative overflow-hidden rounded-lg bg-slate-700/50 backdrop-blur border border-slate-600 p-5 cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-orange-400"
          onClick={handleCampaignRankingClick}
        >
          <div className="absolute top-2 right-2 bg-orange-500/20 backdrop-blur text-orange-300 text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
            순위보기 →
          </div>
          <div className="flex items-start justify-between mb-3">
            <Award className="w-7 h-7 text-orange-400" />
          </div>
          <p className="text-xs font-medium text-slate-400 mb-1">최고 성과 캠페인</p>
          <h3 className="text-2xl font-bold text-white mb-2">
            {overview.topCampaign?.title || 'N/A'}
          </h3>
          {overview.topCampaign && (
            <p className="text-xs text-slate-300 bg-slate-600/50 px-2 py-1 rounded inline-block">
              {overview.topCampaign.participants}명 · {overview.topCampaign.completionRate}%
            </p>
          )}
        </div>

        <div
          className="relative overflow-hidden rounded-lg bg-slate-700/50 backdrop-blur border border-slate-600 p-5 cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-blue-400"
          onClick={handleCompletionRateClick}
        >
          <div className="absolute top-2 right-2 bg-blue-500/20 backdrop-blur text-blue-300 text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
            상세보기 →
          </div>
          <div className="flex items-start justify-between mb-3">
            <TrendingUp className="w-7 h-7 text-blue-400" />
          </div>
          <p className="text-xs font-medium text-slate-400 mb-1">캠페인 완료율</p>
          <h3 className="text-3xl font-bold text-white mb-2">
            {overview.campaignCompletionRate}%
          </h3>
          <p className="text-xs text-slate-300 bg-slate-600/50 px-2 py-1 rounded inline-block">
            참여 퍼널 전환율
          </p>
        </div>
      </div>

      {/* Row 3: 인기 카테고리 + 최다 활동 지역 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg bg-slate-700/50 backdrop-blur border border-slate-600 p-5 transition-all duration-300 hover:scale-102 hover:border-purple-400">
          <div className="flex items-start justify-between mb-3">
            <Trophy className="w-7 h-7 text-purple-400" />
          </div>
          <p className="text-xs font-medium text-slate-400 mb-1">인기 카테고리</p>
          <h3 className="text-3xl font-bold text-white">
            {overview.topCategory || 'N/A'}
          </h3>
        </div>

        <div className="rounded-lg bg-slate-700/50 backdrop-blur border border-slate-600 p-5 transition-all duration-300 hover:scale-102 hover:border-teal-400">
          <div className="flex items-start justify-between mb-3">
            <MapPin className="w-7 h-7 text-teal-400" />
          </div>
          <p className="text-xs font-medium text-slate-400 mb-1">최다 활동 지역</p>
          <h3 className="text-3xl font-bold text-white">
            {overview.topRegion || 'N/A'}
          </h3>
        </div>
      </div>

      {/* Row 4: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Main Chart - Weekly Trend */}
        <div className="rounded-lg bg-slate-700/50 backdrop-blur border border-slate-600 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold text-white">주간 참여자 추이</h3>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrendFormatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="participants" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorParticipants)" />
                  </AreaChart>
             </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Category Distribution - Pie Chart */}
        <div className="rounded-lg bg-slate-700/50 backdrop-blur border border-slate-600 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">카테고리별 참여자 분포</h3>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            {overview.categoryDistribution.length > 0 ? (
              <div className="flex flex-col items-center">
                {/* Pie Chart */}
                <div className="h-[280px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.categoryDistribution.map((item, index) => ({
                          name: item.category,
                          value: item.participants,
                          color: COLORS[index % COLORS.length]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {overview.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          padding: '12px'
                        }}
                        formatter={(value: any) => [`${value}명`, '참여자']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                  {overview.categoryDistribution.map((item, index) => {
                    const total = overview.categoryDistribution.reduce((sum, cat) => sum + cat.participants, 0);
                    const percentage = ((item.participants / total) * 100).toFixed(1);
                    return (
                      <div
                        key={item.category}
                        className="flex items-center gap-2 bg-slate-600/30 p-2 rounded-lg"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{item.category}</p>
                          <p className="text-xs text-slate-400">{item.participants}명 · {percentage}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                데이터가 없습니다
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mission Details Modal */}
      {showMissionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Target className="w-6 h-6" />
                완료된 미션 상세
              </h2>
              <button
                onClick={() => setShowMissionModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {missionDetails ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">완료된 미션</span>
                      </div>
                      <p className="text-3xl font-bold text-emerald-900">
                        {missionDetails.completedMissions.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Circle className="w-5 h-5 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">전체 미션</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">
                        {missionDetails.totalMissions.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">완료율</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">
                        {missionDetails.completionRate}%
                      </p>
                    </div>
                  </div>

                  {/* Campaign-wise breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-600" />
                      캠페인별 미션 현황
                    </h3>
                    {missionDetails.campaigns && missionDetails.campaigns.length > 0 ? (
                      <div className="space-y-3">
                        {missionDetails.campaigns.map((campaign: any, index: number) => (
                          <div
                            key={campaign.id}
                            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-md transition-all"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-semibold text-slate-900">{campaign.title}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                campaign.completionRate >= 70
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : campaign.completionRate >= 40
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {campaign.completionRate}% 완료
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-slate-500">완료</p>
                                <p className="font-bold text-emerald-600">{campaign.completed}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">진행중</p>
                                <p className="font-bold text-blue-600">{campaign.inProgress}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">대기중</p>
                                <p className="font-bold text-yellow-600">{campaign.pending}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">실패</p>
                                <p className="font-bold text-red-600">{campaign.failed}</p>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-3 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-500"
                                style={{ width: `${campaign.completionRate}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 py-8">
                        미션 데이터가 없습니다
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-slate-500">데이터를 불러오는 중...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campaign Rankings Modal */}
      {showCampaignRankingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Award className="w-6 h-6" />
                캠페인 참여도 순위
              </h2>
              <button
                onClick={() => setShowCampaignRankingModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {campaignRankings ? (
                <div className="space-y-3">
                  {campaignRankings.rankings.map((campaign: any, index: number) => (
                    <div
                      key={campaign.id}
                      className={`relative rounded-xl p-5 transition-all hover:scale-[1.02] ${
                        index === 0
                          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 shadow-lg'
                          : index === 1
                          ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-300'
                          : index === 2
                          ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300'
                          : 'bg-white border-2 border-slate-200'
                      }`}
                    >
                      {/* Rank Badge */}
                      <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                          : index === 1
                          ? 'bg-gradient-to-br from-slate-400 to-gray-500'
                          : index === 2
                          ? 'bg-gradient-to-br from-orange-400 to-amber-500'
                          : 'bg-gradient-to-br from-slate-300 to-slate-400'
                      }`}>
                        {index + 1}
                      </div>

                      <div className="ml-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              {campaign.title}
                              {index === 0 && <span className="text-2xl">🏆</span>}
                              {index === 1 && <span className="text-2xl">🥈</span>}
                              {index === 2 && <span className="text-2xl">🥉</span>}
                            </h3>
                            <div className="flex gap-2 mt-1">
                              {campaign.category && (
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                  {campaign.category}
                                </span>
                              )}
                              {campaign.region && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                  {campaign.region}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-emerald-600">{campaign.participants}</p>
                            <p className="text-xs text-slate-500">참여자</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div className="bg-white/70 rounded-lg p-2 text-center">
                            <p className="text-slate-500 text-xs">완료</p>
                            <p className="font-bold text-emerald-600">{campaign.completed}</p>
                          </div>
                          <div className="bg-white/70 rounded-lg p-2 text-center">
                            <p className="text-slate-500 text-xs">전체</p>
                            <p className="font-bold text-slate-700">{campaign.total}</p>
                          </div>
                          <div className="bg-white/70 rounded-lg p-2 text-center">
                            <p className="text-slate-500 text-xs">완료율</p>
                            <p className="font-bold text-blue-600">{campaign.completionRate}%</p>
                          </div>
                        </div>

                        <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-500"
                            style={{ width: `${campaign.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-slate-500">데이터를 불러오는 중...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Rate Modal */}
      {showCompletionRateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                캠페인 완료율 분석
              </h2>
              <button
                onClick={() => setShowCompletionRateModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                {/* Overall Rate */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">전체 캠페인 완료율</h3>
                  <div className="flex items-end gap-4">
                    <div className="text-6xl font-bold text-purple-600">{overview.campaignCompletionRate}%</div>
                    <div className="mb-3 text-slate-600">
                      <p className="text-sm">전체 미션 중</p>
                      <p className="text-sm font-semibold">{overview.completedMissions}개 완료</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-white rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-full transition-all duration-1000"
                      style={{ width: `${overview.campaignCompletionRate}%` }}
                    />
                  </div>
                </div>

                {/* Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-semibold text-emerald-900">우수한 성과</h4>
                    </div>
                    <p className="text-sm text-emerald-700">
                      평균 이상의 완료율로 참여자들의 적극적인 참여를 보여줍니다.
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">개선 기회</h4>
                    </div>
                    <p className="text-sm text-blue-700">
                      미완료 미션에 대한 리마인더를 통해 완료율을 더 높일 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
