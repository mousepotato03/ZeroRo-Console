"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  Download,
  Info,
  LineChart,
  Filter
} from 'lucide-react';
import { exportToCSV, exportToPDF, exportToDOCX } from '../lib/exportUtils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface DashboardOverview {
  totalParticipants: number;
  completedMissions: number;
  missionCompletionRate: number;
  co2Reduction: number;
  monthlyGrowth: number;
  weeklyNewParticipants: number;
  topCampaign: {
    id: number;
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
  topCategoryCompleted: number;
  topRegion: string | null;
  topRegionParticipants: number;
  campaignCompletionRate: number;
}

const COLORS = ['#10b981', '#14b8a6', '#22c55e', '#059669', '#0d9488', '#0f766e'];

const KPICard = ({ title, value, icon: Icon, trend, trendUp, onClick, clickable, color = 'blue' }: any) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    teal: 'text-teal-600 bg-teal-50',
    slate: 'text-slate-600 bg-slate-50',
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 transition-all duration-200 ${clickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 group' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${theme}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
        {clickable && (
           <span className="text-xs text-slate-400 group-hover:text-emerald-600 transition-colors">상세보기 →</span>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCampaignRankingModal, setShowCampaignRankingModal] = useState(false);
  const [campaignRankings, setCampaignRankings] = useState<any>(null);
  const [showCompletionRateModal, setShowCompletionRateModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [participantsDrawerTab, setParticipantsDrawerTab] = useState<'daily' | 'campaign'>('daily');
  const [showNewUsersModal, setShowNewUsersModal] = useState(false);
  const [newUsersData, setNewUsersData] = useState<any>(null);
  const [showCompletionDrawer, setShowCompletionDrawer] = useState(false);
  const [completionDrawerTab, setCompletionDrawerTab] = useState<'daily' | 'campaign' | 'category'>('daily');
  const [completionData, setCompletionData] = useState<any>(null);
  const [showCO2Modal, setShowCO2Modal] = useState(false);
  const [co2Data, setCo2Data] = useState<any>(null);
  const [showTopCampaignDrawer, setShowTopCampaignDrawer] = useState(false);
  const [topCampaignDrawerSort, setTopCampaignDrawerSort] = useState<'participants' | 'completionRate' | 'completed' | 'co2'>('participants');
  const [topCampaignData, setTopCampaignData] = useState<any>(null);
  const [showSegmentDrawer, setShowSegmentDrawer] = useState(false);
  const [segmentDrawerTab, setSegmentDrawerTab] = useState<'category' | 'region'>('category');
  const [segmentData, setSegmentData] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<{ type: 'category' | 'region' | null; value: string | null }>({ type: null, value: null });
  const [chartTab, setChartTab] = useState<'weekly' | 'category' | 'region'>('weekly');
  const [showChartDetailDrawer, setShowChartDetailDrawer] = useState(false);
  const [chartDetailData, setChartDetailData] = useState<any>(null);
  const router = useRouter();
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

  // 차트 탭 변경 시 지역 분포 데이터 로드
  useEffect(() => {
    if (chartTab === 'region' && !segmentData) {
      fetch('/api/dashboard/segment-details')
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setSegmentData(data.data);
          }
        })
        .catch(err => console.error('Failed to load segment data:', err));
    }
  }, [chartTab]);

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

  const handleExport = async (format: 'csv' | 'pdf' | 'docx') => {
    if (!overview) return;

    switch (format) {
      case 'csv':
        exportToCSV(overview);
        break;
      case 'pdf':
        await exportToPDF(overview);
        break;
      case 'docx':
        await exportToDOCX(overview);
        break;
    }
    setShowExportDropdown(false);
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

  const handleParticipantsCardClick = async () => {
    setShowParticipantsDrawer(true);
    if (!campaignRankings) {
      try {
        const response = await fetch('/api/dashboard/campaign-rankings');
        if (response.ok) {
          const result = await response.json();
          setCampaignRankings(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch campaign rankings:', error);
      }
    }
  };

  const handleNewUsersCardClick = async () => {
    setShowNewUsersModal(true);
    if (!newUsersData) {
      try {
        const response = await fetch('/api/dashboard/new-users-details');
        if (response.ok) {
          const result = await response.json();
          setNewUsersData(result.data);
        } else {
          // API가 없으면 기본 데이터 구조 생성
          setNewUsersData({
            dailyTrend: [],
            topCampaigns: [],
            topCategories: []
          });
        }
      } catch (error) {
        console.error('Failed to fetch new users data:', error);
        setNewUsersData({
          dailyTrend: [],
          topCampaigns: [],
          topCategories: []
        });
      }
    }
  };

  const handleCompletionCardClick = async () => {
    setShowCompletionDrawer(true);
    if (!completionData) {
      try {
        const response = await fetch('/api/dashboard/completion-details');
        if (response.ok) {
          const result = await response.json();
          setCompletionData(result.data);
        } else {
          setCompletionData({
            dailyTrend: [],
            campaignStats: [],
            categoryStats: []
          });
        }
      } catch (error) {
        console.error('Failed to fetch completion data:', error);
        setCompletionData({
          dailyTrend: [],
          campaignStats: [],
          categoryStats: []
        });
      }
    }
  };

  const handleCO2CardClick = async () => {
    setShowCO2Modal(true);
    if (!co2Data) {
      try {
        const response = await fetch('/api/dashboard/co2-details');
        if (response.ok) {
          const result = await response.json();
          setCo2Data(result.data);
        } else {
          setCo2Data({
            categoryBreakdown: [],
            total: 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch CO2 data:', error);
        setCo2Data({
          categoryBreakdown: [],
          total: 0
        });
      }
    }
  };

  const handleTopCampaignCardClick = async () => {
    setShowTopCampaignDrawer(true);
    if (!topCampaignData) {
      try {
        const response = await fetch('/api/dashboard/campaign-rankings');
        if (response.ok) {
          const result = await response.json();
          setTopCampaignData(result.data);
        } else {
          setTopCampaignData({
            rankings: []
          });
        }
      } catch (error) {
        console.error('Failed to fetch campaign rankings:', error);
        setTopCampaignData({
          rankings: []
        });
      }
    }
  };

  const handleCampaignClick = (campaignId: number) => {
    router.push(`/dashboard/campaigns/${campaignId}`);
  };

  const handleSegmentCardClick = async () => {
    setShowSegmentDrawer(true);
    if (!segmentData) {
      try {
        const response = await fetch('/api/dashboard/segment-details');
        if (response.ok) {
          const result = await response.json();
          setSegmentData(result.data);
        } else {
          setSegmentData({
            categoryDistribution: [],
            regionDistribution: []
          });
        }
      } catch (error) {
        console.error('Failed to fetch segment data:', error);
        setSegmentData({
          categoryDistribution: [],
          regionDistribution: []
        });
      }
    }
  };

  const handleApplyFilter = () => {
    if (selectedFilter.type && selectedFilter.value) {
      // 필터 적용 로직 (향후 구현)
      console.log('Apply filter:', selectedFilter);
      // 예: URL 파라미터 추가 또는 상태 업데이트
      setShowSegmentDrawer(false);
    }
  };

  const handleChartElementClick = async (type: 'category' | 'region' | 'date', value: string) => {
    setShowChartDetailDrawer(true);
    try {
      const response = await fetch(`/api/dashboard/chart-detail?type=${type}&value=${encodeURIComponent(value)}`);
      if (response.ok) {
        const result = await response.json();
        setChartDetailData(result.data);
      } else {
        setChartDetailData({
          type,
          value,
          participants: 0,
          completed: 0,
          completionRate: 0,
          co2Reduction: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch chart detail:', error);
      setChartDetailData({
        type,
        value,
        participants: 0,
        completed: 0,
        completionRate: 0,
        co2Reduction: 0
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-slate-400 animate-pulse">데이터 로딩 중...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            환경 영향 보고서
          </h1>
          <p className="text-slate-500 mt-1 text-sm">실시간 환경 캠페인 성과 및 인사이트</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select className="h-10 rounded-lg border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer appearance-none shadow-sm">
              <option>최근 7일</option>
              <option>최근 30일</option>
              <option>올해</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="h-10 px-5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              내보내기
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-slate-900">PDF 파일</p>
                      <p className="text-xs text-slate-500">전문적인 보고서 형식</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                        <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-slate-900">CSV 파일</p>
                      <p className="text-xs text-slate-500">엑셀 데이터 분석용</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('docx')}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                         <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-slate-900">Word 파일</p>
                      <p className="text-xs text-slate-500">문서 편집 가능</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 1: 주요 KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 총 참여자 카드 (새 디자인) */}
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group relative"
          onClick={handleParticipantsCardClick}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">총 참여자</h3>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {overview.totalParticipants.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className={`text-sm font-medium ${overview.monthlyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              전월 대비 {overview.monthlyGrowth > 0 ? '+' : ''}{overview.monthlyGrowth}%
            </p>
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-slate-400 group-hover:text-emerald-600 transition-colors">
            자세히 →
          </div>
        </div>
        {/* 이번 주 신규 카드 (새 디자인) */}
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group relative"
          onClick={handleNewUsersCardClick}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">이번 주 신규</h3>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {overview.weeklyNewParticipants.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-600">
              신규 비중 {overview.totalParticipants > 0 ? ((overview.weeklyNewParticipants / overview.totalParticipants) * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-slate-400 group-hover:text-blue-600 transition-colors">
            자세히 →
          </div>
        </div>
        {/* 미션 성과 카드 (새 디자인) */}
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group relative"
          onClick={handleCompletionCardClick}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">미션 성과</h3>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {overview.missionCompletionRate}%
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-purple-600">
              완료 {overview.completedMissions.toLocaleString()} / 시작 {overview.missionCompletionRate > 0 ? Math.round(overview.completedMissions / (overview.missionCompletionRate / 100)).toLocaleString() : '0'}개
            </p>
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-slate-400 group-hover:text-purple-600 transition-colors">
            자세히 →
          </div>
        </div>
        {/* CO2 절감량 카드 (새 디자인) */}
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group relative"
          onClick={handleCO2CardClick}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">CO2 절감량</h3>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {overview.co2Reduction.toLocaleString()} kg
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-teal-600">
              Top 기여: {overview.topCategory || '없음'} {(() => {
                // CO2 데이터가 로드되면 사용, 아니면 기본 계산
                if (co2Data && co2Data.categoryBreakdown && co2Data.categoryBreakdown.length > 0 && overview.topCategory) {
                  const topCategoryData = co2Data.categoryBreakdown.find((c: any) => c.category === overview.topCategory);
                  const totalCO2 = co2Data.total || overview.co2Reduction;
                  if (topCategoryData && totalCO2 > 0) {
                    return Math.round((topCategoryData.co2 / totalCO2) * 100);
                  }
                }
                // 기본값: 카테고리 분포에서 계산
                if (overview.topCategory && overview.categoryDistribution.length > 0) {
                  const topCategoryDist = overview.categoryDistribution.find(c => c.category === overview.topCategory);
                  const totalParticipants = overview.categoryDistribution.reduce((sum, c) => sum + c.participants, 0);
                  if (topCategoryDist && totalParticipants > 0) {
                    return Math.round((topCategoryDist.participants / totalParticipants) * 100);
                  }
                }
                return '0';
              })()}%
            </p>
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-slate-400 group-hover:text-teal-600 transition-colors">
            자세히 →
          </div>
        </div>
      </div>

      {/* Row 2: 상세 카드 (클릭 가능) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 최고 성과 캠페인 카드 (새 디자인) */}
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group relative"
          onClick={handleTopCampaignCardClick}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">최고 성과 캠페인</h3>
              <p className="text-xl font-bold text-slate-900 tracking-tight truncate">
                {overview.topCampaign?.title || '데이터 없음'}
              </p>
            </div>
          </div>
          {overview.topCampaign && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-600">
                참여자 {overview.topCampaign.participants.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                완료율 {overview.topCampaign.completionRate}% · 완료 {overview.topCampaign.completed.toLocaleString()}
              </p>
            </div>
          )}
          <div className="absolute bottom-4 right-4 text-xs text-slate-400 group-hover:text-orange-600 transition-colors">
            자세히 →
          </div>
        </div>

        {/* 전체 캠페인 완료율 카드 (새 디자인) */}
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group relative"
          onClick={handleCompletionRateClick}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">전체 캠페인 완료율</h3>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {overview.campaignCompletionRate}%
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-600">
              참여자가 미션을 완료하는 비율
            </p>
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-slate-400 group-hover:text-blue-600 transition-colors">
            자세히 →
          </div>
        </div>
      </div>


      {/* 차트 섹션: 트렌드 & 분포 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* 섹션 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">트렌드 & 분포</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setChartTab('weekly')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                chartTab === 'weekly'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              주간 참여자 추이
            </button>
            <button
              onClick={() => setChartTab('category')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                chartTab === 'category'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              카테고리 분포
            </button>
            <button
              onClick={() => setChartTab('region')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                chartTab === 'region'
                  ? 'bg-teal-100 text-teal-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              지역 분포
            </button>
          </div>
        </div>

        {/* 차트 컨텐츠 */}
        <div className="p-6">
          {chartTab === 'weekly' && (
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                  data={weeklyTrendFormatted} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const payload = data.activePayload[0].payload;
                      // 날짜를 원본 형식으로 변환
                      const originalDate = overview.weeklyTrend.find(item => 
                        new Date(item.date).toLocaleDateString('ko-KR', { weekday: 'short' }) === payload.date
                      )?.date || payload.date;
                      handleChartElementClick('date', originalDate);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="participants" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorParticipants)"
                    style={{ cursor: 'pointer' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartTab === 'category' && (
            <div className="flex flex-col">
              {overview.categoryDistribution.length > 0 ? (
                <>
                  <div className="h-[350px] w-full flex items-center justify-center">
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
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                          onClick={(data: any) => {
                            if (data && data.name) {
                              handleChartElementClick('category', data.name);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {overview.categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
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
                          formatter={(value: any, name: any, props: any) => {
                            const total = overview.categoryDistribution.reduce((sum, cat) => sum + cat.participants, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return [`${value}명 (${percentage}%)`, '참여자'];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
                    {overview.categoryDistribution.map((item, index) => {
                      const total = overview.categoryDistribution.reduce((sum, cat) => sum + cat.participants, 0);
                      const percentage = total > 0 ? ((item.participants / total) * 100).toFixed(1) : '0';
                      return (
                        <div
                          key={item.category}
                          onClick={() => handleChartElementClick('category', item.category)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{item.category}</p>
                            <p className="text-xs text-slate-500">{item.participants}명 ({percentage}%)</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 py-20 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  데이터가 없습니다
                </div>
              )}
            </div>
          )}

          {chartTab === 'region' && (
            <div className="w-full h-[400px]">
              {segmentData && segmentData.regionDistribution && segmentData.regionDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={segmentData.regionDistribution.map((item: any) => ({
                      region: item.region,
                      participants: item.participants
                    }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    onClick={(data: any) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        const payload = data.activePayload[0].payload;
                        if (payload && payload.region) {
                          handleChartElementClick('region', payload.region);
                        }
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="region" 
                      stroke="#64748b" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      formatter={(value: any) => [`${value}명`, '참여자']}
                    />
                    <Bar 
                      dataKey="participants" 
                      fill="#14b8a6"
                      radius={[8, 8, 0, 0]}
                      style={{ cursor: 'pointer' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  {!segmentData ? '데이터를 불러오는 중...' : '지역 데이터가 없습니다'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Rankings Modal */}
      {showCampaignRankingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-orange-500" />
                캠페인 참여도 순위
              </h2>
              <button
                onClick={() => setShowCampaignRankingModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] bg-slate-50/50">
              {campaignRankings ? (
                <div className="space-y-4">
                  {campaignRankings.rankings.map((campaign: any, index: number) => (
                    <div
                      key={campaign.id}
                      className={`relative rounded-xl p-5 transition-all bg-white shadow-sm border ${
                        index === 0
                          ? 'border-yellow-300 ring-1 ring-yellow-200'
                          : index === 1
                            ? 'border-slate-300'
                            : index === 2
                              ? 'border-orange-300'
                              : 'border-slate-200'
                      }`}
                    >
                      {/* Rank Badge */}
                      <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm ${index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                            ? 'bg-slate-500'
                            : index === 2
                              ? 'bg-orange-500'
                              : 'bg-slate-400'
                        }`}>
                        {index + 1}
                      </div>

                      <div className="ml-4 pl-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              {campaign.title}
                            </h3>
                            <div className="flex gap-2 mt-2">
                              {campaign.category && (
                                <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">
                                  {campaign.category}
                                </span>
                              )}
                              {campaign.region && (
                                <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">
                                  {campaign.region}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
                            <Users className="w-4 h-4 text-emerald-600" />
                            <p className="font-bold text-emerald-700">{campaign.participants.toLocaleString()}<span className="text-xs font-normal text-emerald-600 ml-1">참여</span></p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-slate-500 text-xs mb-1">완료</p>
                            <p className="font-bold text-slate-900">{campaign.completed}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-slate-500 text-xs mb-1">전체</p>
                            <p className="font-bold text-slate-900">{campaign.total}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-slate-500 text-xs mb-1">완료율</p>
                            <p className="font-bold text-blue-600">{campaign.completionRate}%</p>
                          </div>
                        </div>

                        <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-500"
                            style={{ width: `${campaign.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <div className="text-slate-400 animate-pulse">순위 데이터를 불러오는 중...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Rate Modal */}
      {showCompletionRateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                캠페인 완료율 분석
              </h2>
              <button
                onClick={() => setShowCompletionRateModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] bg-slate-50/50">
              <div className="space-y-6">
                {/* Overall Rate */}
                <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center">
                  <h3 className="text-lg font-semibold text-slate-600 mb-4">전체 캠페인 평균 완료율</h3>
                  <div className="flex items-center justify-center gap-2 mb-2">
                     <span className="text-6xl font-black text-slate-900 tracking-tight">{overview.campaignCompletionRate}</span>
                     <span className="text-3xl font-bold text-slate-400">%</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">총 {overview.completedMissions.toLocaleString()}개의 미션이 완료되었습니다</p>
                  
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden max-w-lg mx-auto">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full transition-all duration-1000"
                      style={{ width: `${overview.campaignCompletionRate}%` }}
                    />
                  </div>
                </div>

                {/* Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overview.campaignCompletionRate >= 70 ? (
                    <>
                      <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <h4 className="font-bold text-emerald-900">우수한 성과</h4>
                        </div>
                        <p className="text-sm text-emerald-700 leading-relaxed">
                          평균 이상의 완료율로 참여자들의 적극적인 참여를 보여줍니다.
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          <h4 className="font-bold text-blue-900">지속적인 개선</h4>
                        </div>
                        <p className="text-sm text-blue-700 leading-relaxed">
                          현재의 높은 완료율을 유지하며 더 많은 참여자를 유치할 수 있습니다.
                        </p>
                      </div>
                    </>
                  ) : overview.campaignCompletionRate >= 40 ? (
                    <>
                      <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-amber-600" />
                          <h4 className="font-bold text-amber-900">양호한 성과</h4>
                        </div>
                        <p className="text-sm text-amber-700 leading-relaxed">
                          적정 수준의 완료율을 유지하고 있습니다. 조금 더 노력하면 우수 등급에 도달할 수 있습니다.
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          <h4 className="font-bold text-blue-900">개선 기회</h4>
                        </div>
                        <p className="text-sm text-blue-700 leading-relaxed">
                          미완료 미션에 대한 리마인더나 넛지를 통해 완료율을 상승시켜보세요.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-red-600" />
                          <h4 className="font-bold text-red-900">개선 필요</h4>
                        </div>
                        <p className="text-sm text-red-700 leading-relaxed">
                          현재 완료율이 다소 낮습니다. 미션이 너무 어렵거나 보상이 부족한지 점검이 필요합니다.
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-slate-600" />
                          <h4 className="font-bold text-slate-900">권장 조치</h4>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          리마인더 발송, 보상 강화, 또는 미션 난이도 조정을 고려해보세요.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 총 참여자 상세 모달 */}
      {showParticipantsDrawer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* 모달 헤더 */}
            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  총 참여자 상세
                </h2>
                <p className="text-sm text-slate-500 mt-1">{overview.totalParticipants.toLocaleString()}명</p>
              </div>
              <button
                onClick={() => setShowParticipantsDrawer(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 탭 */}
            <div className="border-b border-slate-200 px-6">
              <div className="flex gap-1">
                <button
                  onClick={() => setParticipantsDrawerTab('daily')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    participantsDrawerTab === 'daily'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  일별 추이
                </button>
                <button
                  onClick={() => setParticipantsDrawerTab('campaign')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    participantsDrawerTab === 'campaign'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  캠페인별
                </button>
              </div>
            </div>

            {/* 모달 컨텐츠 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-slate-50/50">
              {participantsDrawerTab === 'daily' && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">일별 참여자 추이</h3>
                  <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={overview.weeklyTrend.map(item => ({
                          date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
                          participants: item.participants
                        }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorDailyParticipants" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="participants"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorDailyParticipants)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {participantsDrawerTab === 'campaign' && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">캠페인별 참여자</h3>
                  {campaignRankings && campaignRankings.rankings && campaignRankings.rankings.length > 0 ? (
                    <div className="space-y-3">
                      {campaignRankings.rankings.slice(0, 10).map((campaign: any, index: number) => (
                        <div
                          key={campaign.id}
                          className="bg-white rounded-xl p-4 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </span>
                                <h4 className="font-bold text-slate-900">{campaign.title}</h4>
                              </div>
                              <div className="flex items-center gap-4 ml-9">
                                <div>
                                  <p className="text-xs text-slate-500">참여자</p>
                                  <p className="text-sm font-bold text-slate-900">{campaign.participants}명</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">완료율</p>
                                  <p className="text-sm font-bold text-emerald-600">{campaign.completionRate}%</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 py-20 bg-white rounded-xl border border-dashed border-slate-200">
                      캠페인 데이터가 없습니다
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 이번 주 신규 상세 모달 */}
      {showNewUsersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  이번 주 신규 참여자 상세
                </h2>
                <p className="text-sm text-slate-500 mt-1">최근 7일간 첫 참여한 신규 사용자</p>
              </div>
              <button
                onClick={() => setShowNewUsersModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-slate-50/50">
              {newUsersData ? (
                <div className="space-y-6">
                  {/* 일별 신규 추이 */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">일별 신규 추이 (7일)</h3>
                    <div className="bg-white rounded-xl p-6 border border-slate-200">
                      <div className="h-[300px]">
                        {newUsersData.dailyTrend && newUsersData.dailyTrend.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={newUsersData.dailyTrend.map((item: any) => ({
                              date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
                              newUsers: item.newUsers
                            }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                              />
                              <Area
                                type="monotone"
                                dataKey="newUsers"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorNewUsers)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            데이터를 불러오는 중...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 신규 유입 캠페인 Top 5 */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4">신규 유입 캠페인 Top 5</h3>
                      {newUsersData.topCampaigns && newUsersData.topCampaigns.length > 0 ? (
                        <div className="space-y-3">
                          {newUsersData.topCampaigns.slice(0, 5).map((campaign: any, index: number) => (
                            <div
                              key={campaign.id || index}
                              className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 text-sm">{campaign.title || campaign.name}</h4>
                                    <p className="text-xs text-slate-500 mt-1">신규 {campaign.newUsers || 0}명</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 py-12 bg-white rounded-xl border border-dashed border-slate-200">
                          캠페인 데이터가 없습니다
                        </div>
                      )}
                    </div>

                    {/* 신규 유입 카테고리 Top 5 */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4">신규 유입 카테고리 Top 5</h3>
                      {newUsersData.topCategories && newUsersData.topCategories.length > 0 ? (
                        <div className="space-y-3">
                          {newUsersData.topCategories.slice(0, 5).map((category: any, index: number) => (
                            <div
                              key={category.category || index}
                              className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 text-sm">{category.category || category.name}</h4>
                                    <p className="text-xs text-slate-500 mt-1">신규 {category.newUsers || 0}명</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 py-12 bg-white rounded-xl border border-dashed border-slate-200">
                          카테고리 데이터가 없습니다
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <div className="text-slate-400 animate-pulse">데이터를 불러오는 중...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 미션 성과 상세 모달 */}
      {showCompletionDrawer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* 모달 헤더 */}
            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  완료율 분석
                </h2>
                <p className="text-sm text-slate-500 mt-1">미션 완료율 {overview.missionCompletionRate}%</p>
              </div>
              <button
                onClick={() => setShowCompletionDrawer(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 탭 */}
            <div className="border-b border-slate-200 px-6">
              <div className="flex gap-1">
                <button
                  onClick={() => setCompletionDrawerTab('daily')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    completionDrawerTab === 'daily'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  일별 완료율
                </button>
                <button
                  onClick={() => setCompletionDrawerTab('campaign')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    completionDrawerTab === 'campaign'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  캠페인별
                </button>
                <button
                  onClick={() => setCompletionDrawerTab('category')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    completionDrawerTab === 'category'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  카테고리별
                </button>
              </div>
            </div>

            {/* 모달 컨텐츠 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-slate-50/50">
              {completionDrawerTab === 'daily' && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">일별 완료율 추이</h3>
                  <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <div className="h-[300px]">
                      {completionData && completionData.dailyTrend && completionData.dailyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={completionData.dailyTrend.map((item: any) => ({
                            date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
                            completionRate: item.completionRate
                          }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorCompletionRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                              formatter={(value: any) => [`${value}%`, '완료율']}
                            />
                            <Area
                              type="monotone"
                              dataKey="completionRate"
                              stroke="#a855f7"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorCompletionRate)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                          데이터를 불러오는 중...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {completionDrawerTab === 'campaign' && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">캠페인별 완료율</h3>
                  {completionData && completionData.campaignStats && completionData.campaignStats.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">캠페인</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
                                완료율
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
                                완료 수
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
                                참여자 수
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {completionData.campaignStats.map((campaign: any) => (
                              <tr key={campaign.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-900">{campaign.title}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`font-semibold ${campaign.completionRate >= 70 ? 'text-emerald-600' : campaign.completionRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {campaign.completionRate}%
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-600">{campaign.completed.toLocaleString()}</td>
                                <td className="px-4 py-3 text-center text-slate-600">{campaign.participants.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 py-20 bg-white rounded-xl border border-dashed border-slate-200">
                      캠페인 데이터가 없습니다
                    </div>
                  )}
                </div>
              )}

              {completionDrawerTab === 'category' && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">카테고리별 완료율</h3>
                  {completionData && completionData.categoryStats && completionData.categoryStats.length > 0 ? (
                    <div className="space-y-3">
                      {completionData.categoryStats.map((category: any, index: number) => (
                        <div
                          key={category.category || index}
                          className="bg-white rounded-xl p-4 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <div>
                                <h4 className="font-bold text-slate-900">{category.category}</h4>
                                <p className="text-xs text-slate-500 mt-1">완료율 {category.completionRate}%</p>
                              </div>
                            </div>
                            {category.co2Contribution !== undefined && (
                              <div className="text-right">
                                <p className="text-xs text-slate-500">CO2 기여</p>
                                <p className="text-sm font-bold text-emerald-600">{category.co2Contribution.toFixed(1)}kg</p>
                              </div>
                            )}
                          </div>
                          <div className="ml-11 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                category.completionRate >= 70 ? 'bg-emerald-500' : category.completionRate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${category.completionRate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 py-20 bg-white rounded-xl border border-dashed border-slate-200">
                      카테고리 데이터가 없습니다
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CO2 절감량 상세 모달 */}
      {showCO2Modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-teal-600" />
                  CO2 계산 상세
                </h2>
                <p className="text-sm text-slate-500 mt-1">카테고리별 CO2 절감량 계산 내역</p>
              </div>
              <button
                onClick={() => setShowCO2Modal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-slate-50/50">
              {co2Data ? (
                <div className="space-y-6">
                  {/* 테이블 */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">카테고리</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">완료 수</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">계수 (kg/회)</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">CO2 (kg)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {co2Data.categoryBreakdown && co2Data.categoryBreakdown.length > 0 ? (
                            co2Data.categoryBreakdown.map((item: any, index: number) => (
                              <tr key={item.category || index} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-900">{item.category}</td>
                                <td className="px-4 py-3 text-center text-slate-600">{item.completed.toLocaleString()}</td>
                                <td className="px-4 py-3 text-center text-slate-600">{item.coefficient}</td>
                                <td className="px-4 py-3 text-center font-semibold text-teal-600">{item.co2.toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                데이터가 없습니다
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-teal-50 border-t-2 border-teal-200">
                          <tr>
                            <td className="px-4 py-4 font-bold text-slate-900">총합</td>
                            <td className="px-4 py-4 text-center font-bold text-slate-900">
                              {co2Data.categoryBreakdown?.reduce((sum: number, item: any) => sum + item.completed, 0).toLocaleString() || '0'}
                            </td>
                            <td className="px-4 py-4 text-center text-slate-600">-</td>
                            <td className="px-4 py-4 text-center font-bold text-teal-700 text-lg">
                              {co2Data.total?.toLocaleString() || overview.co2Reduction.toLocaleString()} kg
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* 계수 편집 안내 (선택) */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-1">계수 편집은 어디서 하나요?</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          CO2 계수는 시스템 관리자에게 문의하시거나, 관리자 페이지에서 설정할 수 있습니다. 
                          현재 계수는 환경 보호 활동의 표준 값을 기반으로 설정되어 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <div className="text-slate-400 animate-pulse">데이터를 불러오는 중...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top 캠페인 상세 모달 */}
      {showTopCampaignDrawer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* 모달 헤더 */}
            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-600" />
                  캠페인 순위
                </h2>
                <p className="text-sm text-slate-500 mt-1">캠페인별 성과 비교</p>
              </div>
              <button
                onClick={() => setShowTopCampaignDrawer(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 정렬 탭 */}
            <div className="border-b border-slate-200 px-6">
              <div className="flex gap-1">
                <button
                  onClick={() => setTopCampaignDrawerSort('participants')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    topCampaignDrawerSort === 'participants'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  참여자순
                </button>
                <button
                  onClick={() => setTopCampaignDrawerSort('completionRate')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    topCampaignDrawerSort === 'completionRate'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  완료율순
                </button>
                <button
                  onClick={() => setTopCampaignDrawerSort('completed')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    topCampaignDrawerSort === 'completed'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  완료수순
                </button>
                <button
                  onClick={() => setTopCampaignDrawerSort('co2')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    topCampaignDrawerSort === 'co2'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  CO2순
                </button>
              </div>
            </div>

            {/* 모달 컨텐츠 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-slate-50/50">
              {topCampaignData && topCampaignData.rankings && topCampaignData.rankings.length > 0 ? (
                <div className="space-y-3">
                  {(() => {
                    // 정렬된 리스트 생성
                    const sortedRankings = [...topCampaignData.rankings].sort((a, b) => {
                      switch (topCampaignDrawerSort) {
                        case 'participants':
                          return b.participants - a.participants;
                        case 'completionRate':
                          return b.completionRate - a.completionRate;
                        case 'completed':
                          return b.completed - a.completed;
                        case 'co2':
                          return (b.co2Reduction || 0) - (a.co2Reduction || 0);
                        default:
                          return 0;
                      }
                    });

                    return sortedRankings.map((campaign: any, index: number) => (
                      <div
                        key={campaign.id}
                        onClick={() => handleCampaignClick(campaign.id)}
                        className="bg-white rounded-xl p-4 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900">{campaign.title}</h4>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                {campaign.category && (
                                  <span>{campaign.category}</span>
                                )}
                                {campaign.region && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {campaign.region}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-xs text-slate-500 mb-1">참여자</p>
                              <p className="font-bold text-slate-900">{campaign.participants.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-slate-500 mb-1">완료율</p>
                              <p className="font-bold text-emerald-600">{campaign.completionRate}%</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-slate-500 mb-1">완료 수</p>
                              <p className="font-bold text-slate-900">{campaign.completed.toLocaleString()}</p>
                            </div>
                            {campaign.co2Reduction !== undefined && (
                              <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">CO2</p>
                                <p className="font-bold text-teal-600">{campaign.co2Reduction.toLocaleString()}kg</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-20 bg-white rounded-xl border border-dashed border-slate-200">
                  캠페인 데이터가 없습니다
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* 차트 상세 드로어 */}
      {showChartDetailDrawer && chartDetailData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
            {/* 드로어 헤더 */}
            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {chartDetailData.type === 'category' && `카테고리: ${chartDetailData.value}`}
                  {chartDetailData.type === 'region' && `지역: ${chartDetailData.value}`}
                  {chartDetailData.type === 'date' && `날짜: ${new Date(chartDetailData.value).toLocaleDateString('ko-KR')}`}
                </h2>
                <p className="text-sm text-slate-500 mt-1">상세 통계</p>
              </div>
              <button
                onClick={() => setShowChartDetailDrawer(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 드로어 컨텐츠 */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <div className="space-y-6">
                {/* 통계 카드 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-slate-500">참여자</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{chartDetailData.participants?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium text-slate-500">완료 수</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{chartDetailData.completed?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-slate-500">완료율</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{chartDetailData.completionRate || '0'}%</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="w-5 h-5 text-teal-600" />
                      <span className="text-sm font-medium text-slate-500">CO2 절감</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{chartDetailData.co2Reduction?.toLocaleString() || '0'}kg</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 차트 상세 드로어 */}
      {showChartDetailDrawer && chartDetailData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
            {/* 드로어 헤더 */}
            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {chartDetailData.type === 'category' && `카테고리: ${chartDetailData.value}`}
                  {chartDetailData.type === 'region' && `지역: ${chartDetailData.value}`}
                  {chartDetailData.type === 'date' && `날짜: ${new Date(chartDetailData.value).toLocaleDateString('ko-KR')}`}
                </h2>
                <p className="text-sm text-slate-500 mt-1">상세 통계</p>
              </div>
              <button
                onClick={() => setShowChartDetailDrawer(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 드로어 컨텐츠 */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <div className="space-y-6">
                {/* 통계 카드 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-slate-500">참여자</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{chartDetailData.participants?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium text-slate-500">완료 수</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{chartDetailData.completed?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-slate-500">완료율</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{chartDetailData.completionRate || '0'}%</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="w-5 h-5 text-teal-600" />
                      <span className="text-sm font-medium text-slate-500">CO2 절감</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{chartDetailData.co2Reduction?.toLocaleString() || '0'}kg</p>
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