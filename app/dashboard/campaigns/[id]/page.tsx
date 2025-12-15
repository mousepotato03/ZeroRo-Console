"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  FileText,
  User,
  AlertCircle
} from 'lucide-react';
import { Button, Card, CardContent, Badge } from '../../../components/UiKit';

interface CampaignData {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  region: string | null;
  status: 'EXPECT' | 'ACTIVE' | 'EXPIRED';
  category: string | null;
}

interface MissionTemplate {
  id: number;
  title: string;
  type: string;
  points: number;
}

interface MissionLog {
  id: number;
  user_id: string;
  mission_template_id: number;
  status: 'PENDING_VERIFICATION' | 'COMPLETED' | 'FAILED';
  proof_data: {
    imageUrl?: string;
    verification_result?: {
      is_valid: boolean;
      confidence: number;
      reason: string;
    };
  } | null;
  created_at: string;
  updated_at: string;
  mission_templates?: MissionTemplate;
  profiles?: {
    username: string | null;
  };
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [missionLogs, setMissionLogs] = useState<MissionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'verification'>('verification');
  const [processingId, setProcessingId] = useState<number | null>(null);

  // 캠페인 정보 조회
  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '캠페인 조회 실패');
      }

      setCampaign(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 미션 로그 조회
  const fetchMissionLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/mission-logs`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '미션 로그 조회 실패');
      }

      setMissionLogs(data.data || []);
    } catch (err) {
      console.error('미션 로그 조회 실패:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
    fetchMissionLogs();
  }, [campaignId]);

  // 미션 승인/거절 처리
  const handleReview = async (logId: number, action: 'approve' | 'reject') => {
    setProcessingId(logId);
    try {
      const res = await fetch(`/api/mission-logs/${logId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '처리 실패');
      }

      // 목록 새로고침
      await fetchMissionLogs();
      alert(action === 'approve' ? '승인되었습니다. 포인트가 지급되었습니다.' : '거절되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
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

  const getLogStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return <Badge variant="warning">검토 대기</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">승인됨</Badge>;
      case 'FAILED':
        return <Badge variant="error">거절됨</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500">{error || '캠페인을 찾을 수 없습니다.'}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          돌아가기
        </Button>
      </div>
    );
  }

  const pendingCount = missionLogs.filter(log => log.status === 'PENDING_VERIFICATION').length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{campaign.title}</h1>
            {getStatusBadge(campaign.status)}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {campaign.region || '전국'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {campaign.start_date} ~ {campaign.end_date}
            </span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            개요
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'verification'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            인증 검토
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' ? (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-2">캠페인 설명</h3>
            <p className="text-slate-600 whitespace-pre-wrap">
              {campaign.description || '설명이 없습니다.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* 새로고침 버튼 */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchMissionLogs} disabled={isLoadingLogs}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>

          {/* 미션 로그 목록 */}
          {isLoadingLogs ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-slate-500 mt-2">로딩 중...</p>
            </div>
          ) : missionLogs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">아직 제출된 인증이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {missionLogs.map((log) => (
                <Card key={log.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* 이미지 */}
                      <div className="lg:w-64 h-48 lg:h-auto bg-slate-100 flex-shrink-0">
                        {log.proof_data?.imageUrl ? (
                          <img
                            src={log.proof_data.imageUrl}
                            alt="인증 사진"
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(log.proof_data?.imageUrl, '_blank')}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-slate-300" />
                          </div>
                        )}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {log.mission_templates?.title || `미션 #${log.mission_template_id}`}
                            </h4>
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                              <User className="w-3 h-3" />
                              {log.profiles?.username || log.user_id.slice(0, 8)}
                            </p>
                          </div>
                          {getLogStatusBadge(log.status)}
                        </div>

                        {/* AI 검증 결과 */}
                        {log.proof_data?.verification_result && (
                          <div className={`p-3 rounded-lg mb-3 ${
                            log.proof_data.verification_result.is_valid
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-red-50 border border-red-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              {log.proof_data.verification_result.is_valid ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className={`text-sm font-medium ${
                                log.proof_data.verification_result.is_valid
                                  ? 'text-green-700'
                                  : 'text-red-700'
                              }`}>
                                AI 판단: {log.proof_data.verification_result.is_valid ? '적합' : '부적합'}
                                ({Math.round(log.proof_data.verification_result.confidence * 100)}%)
                              </span>
                            </div>
                            <p className={`text-sm ${
                              log.proof_data.verification_result.is_valid
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {log.proof_data.verification_result.reason}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {new Date(log.created_at).toLocaleString('ko-KR')}
                          </span>

                          {/* 승인/거절 버튼 */}
                          {log.status === 'PENDING_VERIFICATION' && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReview(log.id, 'reject')}
                                disabled={processingId === log.id}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                거절
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReview(log.id, 'approve')}
                                disabled={processingId === log.id}
                                isLoading={processingId === log.id}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                승인
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
