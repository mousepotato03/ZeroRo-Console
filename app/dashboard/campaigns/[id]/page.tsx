"use client";

import React, { useState, useEffect, use } from 'react';
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
  Navigation
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
  Cell
} from 'recharts';

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
}

interface Verification {
  userId: string;
  username: string | null;
  userImg: string | null;
  status: 'pending' | 'approved' | 'rejected';
  totalPoints: number;
  missions: VerificationMission[];
  submittedAt: string | null;
}

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
  const fetchVerifications = async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}/verifications`);
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchCampaign();
      await Promise.all([fetchStats(), fetchVerifications()]);
      setIsLoading(false);
    };
    loadData();
  }, [id]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 이미지 */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {campaign.image_url ? (
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="w-full h-auto max-h-[400px] object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-slate-300" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 상세 정보 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500">카테고리</label>
                  <p className="text-sm text-slate-900">{campaign.category || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">진행 방식</label>
                  <p className="text-sm text-slate-900">
                    {campaign.campaign_type === 'ONLINE' ? '온라인' : '오프라인'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">운영 기간</label>
                  <p className="text-sm text-slate-900">
                    {campaign.start_date || '-'} ~ {campaign.end_date || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">지역</label>
                  <p className="text-sm text-slate-900">{campaign.region || '전국'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>설명</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {campaign.description || '설명이 없습니다.'}
                </p>
              </CardContent>
            </Card>
          </div>
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
            {/* 미션별 완료율 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>미션별 현황</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.missionStats.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.missionStats} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="title"
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Bar dataKey="completed" name="완료" fill="#10b981" stackId="stack" />
                        <Bar dataKey="pending" name="검수대기" fill="#f59e0b" stackId="stack" />
                        <Bar dataKey="inProgress" name="진행중" fill="#3b82f6" stackId="stack" />
                        <Bar dataKey="failed" name="거부" fill="#ef4444" stackId="stack" />
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
                          { name: '완료', value: stats.statusBreakdown.completed },
                          { name: '검수대기', value: stats.statusBreakdown.pendingVerification },
                          { name: '진행중', value: stats.statusBreakdown.inProgress },
                          { name: '거부', value: stats.statusBreakdown.failed }
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {verifications.length === 0 ? (
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
              verifications.map(verification => (
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
                        <div>
                          <p className="font-medium text-slate-900">{verification.username || '알 수 없음'}</p>
                          <p className="text-sm text-slate-500">{verification.totalPoints}P</p>
                        </div>
                      </div>

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
                      </div>
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
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">
                              {idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              {getVerificationTypeIcon(mission.verificationType)}
                              <span className="font-bold text-slate-800">{mission.missionTitle}</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">+{mission.rewardPoints}P</span>
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
