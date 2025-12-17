"use client";

import React, { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Target,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Check,
  X,
  Image as ImageIcon,
  FileText,
  HelpCircle,
  Navigation,
  Bot,
  Sparkles,
  Mail,
  Copy,
  Gift,
  CheckSquare,
  Square
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../../../components/UiKit';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import ReactMarkdown from 'react-markdown';

interface CampaignData {
  id: number;
  title: string;
  description: string | null;
  host_organizer: string;
  campaign_url: string;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  region: string | null;
  status: 'EXPECT' | 'ACTIVE' | 'EXPIRED';
  category: string | null;
  campaign_type: 'ONLINE' | 'OFFLINE' | null;
  campaign_source: 'ZERORO' | 'EXTERNAL' | null;
  partner_id: string | null;
  updated_at: string;
}

interface MissionStat {
  id: number;
  title: string;
  verificationType: string;
  rewardPoints: number;
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  failed: number;
  completionRate: number;
}

interface StatsData {
  totalParticipants: number;
  totalMissions: number;
  missionStats: MissionStat[];
  statusBreakdown: {
    inProgress: number;
    pendingVerification: number;
    completed: number;
    failed: number;
  };
  completionRate: number;
}

interface VerificationMission {
  missionId: number;
  missionTitle: string;
  verificationType: string;
  rewardPoints: number;
  status: string;
  proofData: any;
  completedAt: string | null;
  aiResult: {
    isValid: boolean;
    confidence: number;
    reason: string;
  } | null;
}

interface Verification {
  userId: string;
  username: string | null;
  userImg: string | null;
  email: string | null; // 구글 이메일
  status: 'pending' | 'approved' | 'rejected';
  totalPoints: number;
  aiQualified: boolean | null; // AI 검증 결과 (null = 검증 없음)
  aiReason: string | null; // AI 판정 이유
  rewardSent: boolean; // 보상 발송 여부
  rewardSentAt: string | null; // 보상 발송 시간
  rewardNote: string | null; // 보상 메모
  missions: VerificationMission[];
  submittedAt: string | null;
}

type AiFilterType = 'all' | 'qualified' | 'not_qualified';
type StatusFilterType = 'all' | 'pending' | 'approved' | 'rejected';
type RewardFilterType = 'all' | 'sent' | 'not_sent';

type TabType = 'info' | 'stats' | 'verification';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [processingReward, setProcessingReward] = useState<string | null>(null);
  const [aiFilter, setAiFilter] = useState<AiFilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [rewardFilter, setRewardFilter] = useState<RewardFilterType>('all');

  // 캠페인 정보 로드
  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '캠페인 조회 실패');
      setCampaign(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  // 통계 로드
  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}/stats`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '통계 조회 실패');
      setStats(data.data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  // 검수 대상 로드
  const fetchVerifications = async (filter: AiFilterType = aiFilter) => {
    try {
      const url = filter === 'all'
        ? `/api/campaigns/${id}/verifications`
        : `/api/campaigns/${id}/verifications?ai_filter=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '검수 대상 조회 실패');
      setVerifications(data.data.verifications || []);
    } catch (err) {
      console.error('Verifications fetch error:', err);
    }
  };

  // 승인/거부 처리
  const handleVerification = async (userId: string, action: 'approve' | 'reject') => {
    if (processingUser) return;
    setProcessingUser(userId);

    try {
      const res = await fetch(`/api/campaigns/${id}/verifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '처리 실패');

      if (action === 'approve') {
        alert(`승인 완료! ${data.pointsAwarded}P 지급됨`);
      } else {
        alert('거부 처리 완료');
      }

      setSelectedVerification(null);
      fetchVerifications();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingUser(null);
    }
  };

  // 보상 발송 토글
  const handleRewardToggle = async (userId: string, currentSent: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    if (processingReward) return;
    setProcessingReward(userId);

    try {
      const res = await fetch(`/api/campaigns/${id}/reward-tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rewardSent: !currentSent })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '처리 실패');

      // 로컬 상태 업데이트
      setVerifications(prev => prev.map(v =>
        v.userId === userId
          ? { ...v, rewardSent: !currentSent, rewardSentAt: !currentSent ? new Date().toISOString() : null }
          : v
      ));

      // 선택된 verification 업데이트
      if (selectedVerification?.userId === userId) {
        setSelectedVerification(prev => prev ? {
          ...prev,
          rewardSent: !currentSent,
          rewardSentAt: !currentSent ? new Date().toISOString() : null
        } : null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingReward(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchCampaign();
      await Promise.all([fetchStats(), fetchVerifications()]);
      setIsLoading(false);
    };
    loadData();
  }, [id]);

  // AI 필터 변경 시 다시 로드
  const handleAiFilterChange = (filter: AiFilterType) => {
    setAiFilter(filter);
    fetchVerifications(filter);
  };

  // 상태 + 보상발송 필터가 적용된 verifications
  const filteredVerifications = useMemo(() => {
    let result = verifications;

    // 상태 필터
    if (statusFilter !== 'all') {
      result = result.filter(v => v.status === statusFilter);
    }

    // 보상 발송 필터 (승인된 유저만 대상)
    if (rewardFilter !== 'all') {
      if (rewardFilter === 'sent') {
        result = result.filter(v => v.status === 'approved' && v.rewardSent);
      } else if (rewardFilter === 'not_sent') {
        result = result.filter(v => v.status === 'approved' && !v.rewardSent);
      }
    }

    return result;
  }, [verifications, statusFilter, rewardFilter]);

  // 상태별 카운트
  const statusCounts = useMemo(() => ({
    all: verifications.length,
    pending: verifications.filter(v => v.status === 'pending').length,
    approved: verifications.filter(v => v.status === 'approved').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
  }), [verifications]);

  // 보상 발송 카운트 (승인된 유저 중)
  const rewardCounts = useMemo(() => {
    const approved = verifications.filter(v => v.status === 'approved');
    return {
      all: approved.length,
      sent: approved.filter(v => v.rewardSent).length,
      not_sent: approved.filter(v => !v.rewardSent).length,
    };
  }, [verifications]);

  // 미션별 퍼센트 데이터 계산
  const missionStatsWithPercentage = useMemo(() => {
    if (!stats) return [];
    return stats.missionStats.map(mission => ({
      ...mission,
      completedPct: mission.total > 0 ? Math.round((mission.completed / mission.total) * 100) : 0,
      pendingPct: mission.total > 0 ? Math.round((mission.pending / mission.total) * 100) : 0,
      inProgressPct: mission.total > 0 ? Math.round((mission.inProgress / mission.total) * 100) : 0,
      failedPct: mission.total > 0 ? Math.round((mission.failed / mission.total) * 100) : 0,
    }));
  }, [stats]);

  // 미션별 현황 커스텀 Tooltip
  const CustomMissionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && stats) {
      const mission = stats.missionStats.find(m => m.title === label);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900 mb-2">{label}</p>
          <p className="text-sm text-slate-500 mb-2">총 참여: {mission?.total || 0}명</p>
          {payload.map((entry: any, index: number) => {
            const originalKey = entry.dataKey.replace('Pct', '');
            const originalValue = mission?.[originalKey as keyof typeof mission] || 0;
            return (
              <div key={index} className="flex items-center gap-2 text-sm py-0.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-600">{entry.name}:</span>
                <span className="font-medium">{entry.value}%</span>
                <span className="text-slate-400">({String(originalValue)}명)</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">진행중</Badge>;
      case 'EXPECT':
        return <Badge variant="warning">예정</Badge>;
      case 'EXPIRED':
        return <Badge variant="default">종료</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getVerificationTypeIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className="w-4 h-4" />;
      case 'TEXT_REVIEW':
        return <FileText className="w-4 h-4" />;
      case 'QUIZ':
        return <HelpCircle className="w-4 h-4" />;
      case 'LOCATION':
        return <Navigation className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getVerificationTypeName = (type: string) => {
    switch (type) {
      case 'IMAGE': return '사진 인증';
      case 'TEXT_REVIEW': return '소감문';
      case 'QUIZ': return '퀴즈';
      case 'LOCATION': return '위치 인증';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-500">{error || '캠페인을 찾을 수 없습니다.'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  const pendingCount = verifications.filter(v => v.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/campaigns')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{campaign.title}</h1>
              {getStatusBadge(campaign.status)}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              {campaign.region && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {campaign.region}
                </span>
              )}
              {campaign.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {campaign.start_date} ~ {campaign.end_date || '미정'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {[
            { id: 'info', label: '캠페인 정보' },
            { id: 'stats', label: '통계' },
            { id: 'verification', label: `미션 검수${pendingCount > 0 ? ` (${pendingCount})` : ''}` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* 1. 사진 상단 */}
          <Card>
            <CardHeader>
              <CardTitle>캠페인 이미지</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {campaign.image_url ? (
                <div className="flex justify-center bg-slate-50 rounded-lg p-4">
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="max-h-[500px] w-auto object-contain rounded-md shadow-sm"
                  />
                </div>
              ) : (
                <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-slate-300" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">카테고리</label>
                  <p className="mt-1 text-sm font-medium text-slate-900">{campaign.category || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">진행 방식</label>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {campaign.campaign_type === 'ONLINE' ? '온라인' : '오프라인'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">운영 기간</label>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {campaign.start_date || '-'} ~ {campaign.end_date || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">지역</label>
                  <p className="mt-1 text-sm font-medium text-slate-900">{campaign.region || '전국'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. 설명 (마크다운) */}
          <Card>
            <CardHeader>
              <CardTitle>상세 설명</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{campaign.description || '설명이 없습니다.'}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalParticipants}</p>
                    <p className="text-sm text-slate-500">총 참여자</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.statusBreakdown.completed}</p>
                    <p className="text-sm text-slate-500">완료된 미션</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.statusBreakdown.pendingVerification}</p>
                    <p className="text-sm text-slate-500">검수 대기</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <Target className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.completionRate}%</p>
                    <p className="text-sm text-slate-500">완료율</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 미션별 현황 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>미션별 현황</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.missionStats.length > 0 ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={missionStatsWithPercentage}
                        margin={{ left: 10, right: 10, top: 20, bottom: 60 }}
                        barCategoryGap="15%"
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="title"
                          tick={{ fontSize: 11 }}
                          angle={-30}
                          textAnchor="end"
                          height={60}
                          interval={0}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip content={<CustomMissionTooltip />} />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="completedPct" name="완료" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pendingPct" name="검수대기" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="inProgressPct" name="진행중" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="failedPct" name="거부" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    미션 데이터가 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 상태별 분포 */}
            <Card>
              <CardHeader>
                <CardTitle>상태별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '완료', value: stats.statusBreakdown.completed, color: '#10b981' },
                          { name: '검수대기', value: stats.statusBreakdown.pendingVerification, color: '#f59e0b' },
                          { name: '진행중', value: stats.statusBreakdown.inProgress, color: '#3b82f6' },
                          { name: '거부', value: stats.statusBreakdown.failed, color: '#ef4444' }
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: '완료', value: stats.statusBreakdown.completed, color: '#10b981' },
                          { name: '검수대기', value: stats.statusBreakdown.pendingVerification, color: '#f59e0b' },
                          { name: '진행중', value: stats.statusBreakdown.inProgress, color: '#3b82f6' },
                          { name: '거부', value: stats.statusBreakdown.failed, color: '#ef4444' }
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 미션 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>미션 상세</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">미션</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">인증방식</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">포인트</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">참여</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">완료</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600">완료율</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.missionStats.map(mission => (
                      <tr key={mission.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{mission.title}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 text-slate-600">
                            {getVerificationTypeIcon(mission.verificationType)}
                            {getVerificationTypeName(mission.verificationType)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">{mission.rewardPoints}P</td>
                        <td className="px-4 py-3 text-center text-slate-600">{mission.total}</td>
                        <td className="px-4 py-3 text-center text-emerald-600 font-medium">{mission.completed}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${mission.completionRate >= 50 ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {mission.completionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'verification' && (
        <>
          {/* AI 필터 버튼 */}
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-slate-600 font-medium mr-2">AI 판정:</span>
            {[
              { value: 'all' as const, label: '전체' },
              { value: 'qualified' as const, label: 'AI 적격', color: 'emerald' },
              { value: 'not_qualified' as const, label: 'AI 부적격', color: 'red' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => handleAiFilterChange(filter.value)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${aiFilter === filter.value
                    ? filter.value === 'qualified'
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200'
                      : filter.value === 'not_qualified'
                        ? 'bg-red-100 text-red-700 ring-2 ring-red-200'
                        : 'bg-slate-200 text-slate-700 ring-2 ring-slate-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-slate-600 font-medium mr-2">상태:</span>
            {[
              { value: 'all' as const, label: '전체', count: statusCounts.all },
              { value: 'pending' as const, label: '검수대기', count: statusCounts.pending, color: 'amber' },
              { value: 'approved' as const, label: '승인됨', count: statusCounts.approved, color: 'emerald' },
              { value: 'rejected' as const, label: '거부됨', count: statusCounts.rejected, color: 'red' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${statusFilter === filter.value
                    ? filter.value === 'approved'
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200'
                      : filter.value === 'rejected'
                        ? 'bg-red-100 text-red-700 ring-2 ring-red-200'
                        : filter.value === 'pending'
                          ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200'
                          : 'bg-slate-200 text-slate-700 ring-2 ring-slate-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          {/* 보상 발송 필터 (승인된 유저가 있을 때만) */}
          {statusCounts.approved > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-slate-500" />
              <span className="text-sm text-slate-600 font-medium mr-2">보상:</span>
              {[
                { value: 'all' as const, label: '전체', count: rewardCounts.all },
                { value: 'not_sent' as const, label: '미발송', count: rewardCounts.not_sent, color: 'amber' },
                { value: 'sent' as const, label: '발송완료', count: rewardCounts.sent, color: 'purple' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => {
                    setRewardFilter(filter.value);
                    // 보상 필터 선택 시 상태 필터를 승인됨으로 변경
                    if (filter.value !== 'all') {
                      setStatusFilter('approved');
                    }
                  }}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${rewardFilter === filter.value
                      ? filter.value === 'sent'
                        ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200'
                        : filter.value === 'not_sent'
                          ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200'
                          : 'bg-slate-200 text-slate-700 ring-2 ring-slate-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }
                  `}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVerifications.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">검수 대상이 없습니다.</p>
                    <p className="text-sm text-slate-400 mt-1">
                      모든 미션을 완료한 사용자가 없거나, 이미 모두 처리되었습니다.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredVerifications.map(verification => (
                <div
                  key={verification.userId}
                  onClick={() => setSelectedVerification(verification)}
                  className="cursor-pointer transition-all hover:-translate-y-1"
                >
                  <Card className={`
                    h-full
                    ${verification.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30' : ''}
                    ${verification.status === 'rejected' ? 'border-red-200 bg-red-50/30' : ''}
                  `}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        {verification.userImg ? (
                          <img
                            src={verification.userImg}
                            alt={verification.username || ''}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium">
                            {verification.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900">{verification.username || '알 수 없음'}</p>
                            {/* AI 판정 배지 */}
                            {verification.aiQualified !== null && (
                              <span className={`
                                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                ${verification.aiQualified
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                                }
                              `}>
                                <Sparkles className="w-3 h-3" />
                                {verification.aiQualified ? '적격' : '부적격'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{verification.totalPoints}P</p>
                        </div>
                      </div>

                      {/* 승인된 유저의 이메일 표시 */}
                      {verification.status === 'approved' && verification.email && (
                        <div className="flex items-center gap-2 mb-3 p-2 bg-emerald-50 rounded-lg">
                          <Mail className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-emerald-700 font-medium truncate">
                            {verification.email}
                          </span>
                        </div>
                      )}

                      {/* 승인된 유저의 보상 발송 체크박스 */}
                      {verification.status === 'approved' && (
                        <button
                          onClick={(e) => handleRewardToggle(verification.userId, verification.rewardSent, e)}
                          disabled={processingReward === verification.userId}
                          className={`
                            flex items-center gap-2 mb-3 p-2 rounded-lg w-full transition-colors
                            ${verification.rewardSent
                              ? 'bg-purple-50 hover:bg-purple-100'
                              : 'bg-slate-50 hover:bg-slate-100'
                            }
                            ${processingReward === verification.userId ? 'opacity-50' : ''}
                          `}
                        >
                          {verification.rewardSent ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                          <Gift className={`w-4 h-4 ${verification.rewardSent ? 'text-purple-600' : 'text-slate-400'}`} />
                          <span className={`text-sm font-medium ${verification.rewardSent ? 'text-purple-700' : 'text-slate-500'}`}>
                            {verification.rewardSent ? '보상 발송 완료' : '보상 미발송'}
                          </span>
                        </button>
                      )}

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">제출일</span>
                          <span className="text-slate-900">
                            {verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString('ko-KR') : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">미션 수</span>
                          <span className="text-slate-900">{verification.missions.length}개</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        {verification.status === 'pending' ? (
                          <Button className="w-full" size="sm">검수하기</Button>
                        ) : (
                          <Badge variant={verification.status === 'approved' ? 'success' : 'error'} className="w-full justify-center py-1.5">
                            {verification.status === 'approved' ? '승인됨' : '거부됨'}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>

          {/* Verification Modal */}
          {selectedVerification && typeof window !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b flex items-center justify-between bg-white z-10">
                  <div className="flex items-center gap-4">
                    {selectedVerification.userImg ? (
                      <img
                        src={selectedVerification.userImg}
                        alt={selectedVerification.username || ''}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium text-lg">
                        {selectedVerification.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-xl text-slate-900">
                        {selectedVerification.username || '알 수 없음'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Badge variant="info">{selectedVerification.totalPoints}P</Badge>
                        <span>•</span>
                        <span>미션 {selectedVerification.missions.length}개 완료</span>
                        {selectedVerification.aiQualified !== null && (
                          <>
                            <span>•</span>
                            <span className={`inline-flex items-center gap-1 font-medium ${selectedVerification.aiQualified ? 'text-emerald-600' : 'text-red-600'}`}>
                              <Sparkles className="w-3.5 h-3.5" />
                              AI {selectedVerification.aiQualified ? '적격' : '부적격'}
                            </span>
                          </>
                        )}
                      </div>
                      {/* 승인된 유저의 이메일 표시 */}
                      {selectedVerification.status === 'approved' && selectedVerification.email && (
                        <div className="flex items-center gap-2 mt-2">
                          <Mail className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-emerald-700 font-medium">
                            {selectedVerification.email}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedVerification.email!);
                              alert('이메일이 복사되었습니다.');
                            }}
                            className="p-1 hover:bg-emerald-100 rounded transition-colors"
                            title="이메일 복사"
                          >
                            <Copy className="w-4 h-4 text-emerald-600" />
                          </button>
                        </div>
                      )}
                      {/* 승인된 유저의 보상 발송 체크박스 */}
                      {selectedVerification.status === 'approved' && (
                        <button
                          onClick={(e) => handleRewardToggle(selectedVerification.userId, selectedVerification.rewardSent, e)}
                          disabled={processingReward === selectedVerification.userId}
                          className={`
                            flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg transition-colors
                            ${selectedVerification.rewardSent
                              ? 'bg-purple-100 hover:bg-purple-200'
                              : 'bg-slate-100 hover:bg-slate-200'
                            }
                            ${processingReward === selectedVerification.userId ? 'opacity-50' : ''}
                          `}
                        >
                          {selectedVerification.rewardSent ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                          <Gift className={`w-4 h-4 ${selectedVerification.rewardSent ? 'text-purple-600' : 'text-slate-400'}`} />
                          <span className={`text-sm font-medium ${selectedVerification.rewardSent ? 'text-purple-700' : 'text-slate-500'}`}>
                            {selectedVerification.rewardSent ? '보상 발송 완료' : '보상 미발송'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedVerification(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  <div className="max-w-3xl mx-auto space-y-8">
                    {selectedVerification.missions.map((mission, idx) => (
                      <div key={mission.missionId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">
                                {idx + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                {getVerificationTypeIcon(mission.verificationType)}
                                <span className="font-bold text-slate-800">{mission.missionTitle}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {/* AI 판정 배지 */}
                              {mission.aiResult && (
                                <span className={`
                                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                  ${mission.aiResult.isValid
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                                  }
                                `}>
                                  <Sparkles className="w-3 h-3" />
                                  {mission.aiResult.isValid ? '적격' : '부적격'}
                                  <span className="opacity-70">({Math.round(mission.aiResult.confidence * 100)}%)</span>
                                </span>
                              )}
                              <span className="text-sm font-bold text-emerald-600">+{mission.rewardPoints}P</span>
                            </div>
                          </div>
                          {/* AI 판정 이유 */}
                          {mission.aiResult?.reason && (
                            <div className="mt-2 ml-9 p-2 bg-slate-100 rounded-md text-sm text-slate-600">
                              <span className="font-medium">AI 판정:</span> {mission.aiResult.reason}
                            </div>
                          )}
                        </div>

                        <div className="p-6">
                          {mission.proofData ? (
                            <div className="space-y-4">
                              {mission.verificationType === 'IMAGE' && mission.proofData.imageUrl && (
                                <div className="space-y-3">
                                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative group">
                                    <img
                                      src={mission.proofData.imageUrl}
                                      alt="인증 이미지"
                                      className="w-full max-h-[600px] object-contain mx-auto"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                                  </div>
                                  <div className="flex justify-end">
                                    <a
                                      href={mission.proofData.imageUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
                                    >
                                      새 탭에서 원본 이미지 보기
                                    </a>
                                  </div>
                                </div>
                              )}

                              {mission.verificationType === 'TEXT_REVIEW' && mission.proofData.text && (
                                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-base font-medium break-keep">
                                    {mission.proofData.text}
                                  </p>
                                </div>
                              )}

                              {mission.verificationType === 'QUIZ' && mission.proofData.answer && (
                                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                                  <p className="text-sm text-blue-800 font-medium mb-2 opacity-80">사용자 답변</p>
                                  <p className="text-xl text-blue-900 font-bold">{mission.proofData.answer}</p>
                                </div>
                              )}

                              {mission.verificationType === 'LOCATION' && (
                                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex items-start gap-4">
                                  <div className="p-3 bg-red-100 text-red-600 rounded-full">
                                    <MapPin className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 text-lg mb-1">위치 인증 완료</p>
                                    {mission.proofData.address ? (
                                      <p className="text-slate-600">{mission.proofData.address}</p>
                                    ) : (
                                      <p className="text-slate-400 text-sm">상세 주소 정보 없음</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="py-12 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                              <p className="text-slate-400">제출된 증거 데이터가 없습니다.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t bg-white flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                  <Button variant="outline" onClick={() => setSelectedVerification(null)} className="px-6">
                    닫기
                  </Button>
                  {selectedVerification.status === 'pending' && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => handleVerification(selectedVerification.userId, 'reject')}
                        disabled={!!processingUser}
                        className="bg-red-600 hover:bg-red-700 text-white px-6"
                      >
                        <X className="w-4 h-4 mr-2" />
                        거부
                      </Button>
                      <Button
                        onClick={() => handleVerification(selectedVerification.userId, 'approve')}
                        disabled={!!processingUser}
                        isLoading={processingUser === selectedVerification.userId}
                        className="bg-emerald-600 hover:bg-emerald-700 px-8 text-base"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        승인
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}