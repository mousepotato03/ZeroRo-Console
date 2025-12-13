"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus,
  MoreHorizontal,
  MapPin,
  Calendar,
  Sparkles,
  Trash2,
  GripVertical,
  RefreshCw,
  Leaf
} from 'lucide-react';
import { Button, Card, CardContent, Input, Select, Badge } from '../../components/UiKit';
import { Mission, MissionType } from '../../types';

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

export default function CampaignsPage() {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '캠페인 조회 실패');
      }

      setCampaigns(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCampaignCreated = () => {
    setView('list');
    fetchCampaigns();
  };

  return (
    <div className="space-y-6">
      {view === 'list' ? (
        <CampaignList
          campaigns={campaigns}
          isLoading={isLoading}
          error={error}
          onRefresh={fetchCampaigns}
          onViewCreate={() => setView('create')}
        />
      ) : (
        <CampaignBuilder onCancel={() => setView('list')} onSuccess={handleCampaignCreated} />
      )}
    </div>
  );
}

// --- Subcomponent: List ---
interface CampaignListProps {
  campaigns: CampaignData[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onViewCreate: () => void;
}

const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  isLoading,
  error,
  onRefresh,
  onViewCreate
}) => {
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

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
          <p className="text-slate-500 mt-1">내 캠페인을 관리하고 추적합니다.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button onClick={onViewCreate} size="lg" className="shadow-lg shadow-emerald-900/10">
            <Plus className="w-5 h-5 mr-2" />
            새 캠페인 만들기
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>캠페인을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={onRefresh} className="mt-4">
              다시 시도
            </Button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Leaf className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="font-medium">아직 생성한 캠페인이 없습니다.</p>
            <p className="text-sm mt-1">새 캠페인을 만들어 시작해보세요!</p>
            <Button onClick={onViewCreate} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              첫 캠페인 만들기
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">캠페인 정보</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">상태</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">카테고리</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">기간</th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-700">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-900 text-base mb-1">{campaign.title}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[300px] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {campaign.region || '전국'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-slate-600">
                        {campaign.category || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col text-xs font-medium text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400"/>
                          {campaign.start_date || '-'}
                        </span>
                        <span className="pl-4 text-slate-400">
                          ~ {campaign.end_date || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
};

// --- Subcomponent: Builder ---
interface CampaignBuilderProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const CampaignBuilder: React.FC<CampaignBuilderProps> = ({ onCancel, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [campaignType, setCampaignType] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [missions, setMissions] = useState<Mission[]>([]);

  // AI Handlers - Now using API Routes
  const handleGenerateDesc = async () => {
    if (!title) return alert("캠페인 제목을 먼저 입력해주세요.");
    setLoadingAI(true);
    try {
      const response = await fetch('/api/gemini/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, keywords: region || "환경" })
      });
      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
      } else if (data.error) {
        alert("설명 생성에 실패했습니다.");
      }
    } catch (e) {
      alert("설명 생성에 실패했습니다.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSuggestMissions = async () => {
     if (!title) return;
     setLoadingAI(true);
     try {
       const response = await fetch('/api/gemini/missions', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ campaignTitle: title })
       });
       const data = await response.json();
       const suggestions: string[] = data.missions || [];
       const newMissions = suggestions.map((s, idx) => ({
         id: `temp-${Date.now()}-${idx}`,
         title: s,
         description: s,
         type: MissionType.PHOTO,
         points: 100,
         order: missions.length + idx
       }));
       setMissions([...missions, ...newMissions]);
     } catch(e) {
       console.error(e);
     } finally {
       setLoadingAI(false);
     }
  }

  // 캠페인 생성
  const handlePublish = async () => {
    if (!title) {
      alert('캠페인 제목을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          region,
          start_date: startDate || null,
          end_date: endDate || null,
          category: category || null,
          campaign_type: campaignType,
          status: 'ACTIVE',
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '캠페인 생성 실패');
      }

      alert('캠페인이 성공적으로 생성되었습니다!');
      onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : '캠페인 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mission Handlers
  const addMission = () => {
    setMissions([
      ...missions,
      {
        id: `m-${Date.now()}`,
        title: 'New Mission',
        description: '',
        type: MissionType.PHOTO,
        points: 50,
        order: missions.length
      }
    ]);
  };

  const updateMission = (id: string, field: keyof Mission, value: any) => {
    setMissions(missions.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const deleteMission = (id: string) => {
    setMissions(missions.filter(m => m.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">새 캠페인 만들기</h1>
           <p className="text-slate-500 text-sm mt-1">캠페인 정보와 미션을 설정하세요.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>취소</Button>
          <Button
            disabled={loadingAI || isSubmitting}
            isLoading={isSubmitting}
            onClick={() => step === 1 ? setStep(2) : handlePublish()}
            className="min-w-[120px]"
          >
            {step === 1 ? '다음 단계' : '캠페인 발행'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Steps */}
        <div className="lg:col-span-1 space-y-1">
           <div className={`p-4 rounded-lg cursor-pointer transition-colors ${step === 1 ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-50'}`} onClick={() => setStep(1)}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Step 01</div>
              <div className="font-semibold">기본 정보</div>
              <p className="text-xs mt-1 opacity-80">제목, 설명 및 기간 설정</p>
           </div>
           <div className={`p-4 rounded-lg cursor-pointer transition-colors ${step === 2 ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-50'}`} onClick={() => setStep(2)}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Step 02</div>
              <div className="font-semibold">미션 빌더</div>
              <p className="text-xs mt-1 opacity-80">참여자를 위한 미션 설정</p>
           </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2">
           {step === 1 && (
            <Card>
              <CardContent className="space-y-6 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="캠페인 제목" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 한강 플로깅 캠페인" />
                  <Input label="대상 지역" value={region} onChange={e => setRegion(e.target.value)} placeholder="예: 서울, 부산" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="카테고리"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    options={[
                      { label: '선택하세요', value: '' },
                      { label: '재활용', value: '재활용' },
                      { label: '대중교통', value: '대중교통' },
                      { label: '에너지절약', value: '에너지절약' },
                      { label: '제로웨이스트', value: '제로웨이스트' },
                      { label: '자연보호', value: '자연보호' },
                      { label: '교육', value: '교육' },
                      { label: '기타', value: '기타' },
                    ]}
                  />
                  <Select
                    label="캠페인 유형"
                    value={campaignType}
                    onChange={e => setCampaignType(e.target.value as 'ONLINE' | 'OFFLINE')}
                    options={[
                      { label: '온라인', value: 'ONLINE' },
                      { label: '오프라인', value: 'OFFLINE' },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700">캠페인 설명</label>
                    <button
                      onClick={handleGenerateDesc}
                      disabled={loadingAI || !title}
                      className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 px-2 py-1 bg-purple-50 rounded-md transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      AI로 생성하기
                    </button>
                  </div>
                  <textarea
                    className="w-full h-32 rounded-md border border-slate-200 bg-white p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="캠페인의 목표와 세부 내용을 설명해주세요..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                   <Input type="date" label="시작일" value={startDate} onChange={e => setStartDate(e.target.value)} />
                   <Input type="date" label="종료일" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                 <div>
                    <h3 className="text-blue-900 font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI 어시스턴트</h3>
                    <p className="text-blue-700 text-sm mt-1">캠페인 제목을 기반으로 미션을 자동 생성합니다.</p>
                 </div>
                 <Button size="sm" variant="primary" onClick={handleSuggestMissions} isLoading={loadingAI} className="bg-blue-600 hover:bg-blue-700 border-none">
                   자동 생성
                 </Button>
               </div>

              <div className="space-y-3">
                {missions.map((mission, idx) => (
                  <div key={mission.id} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 hover:border-emerald-500/50 transition-colors shadow-sm group">
                    <div className="flex flex-col items-center pt-2 text-slate-300">
                       <GripVertical className="w-5 h-5 cursor-grab active:cursor-grabbing hover:text-slate-500" />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                         <div className="flex-1">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">미션 제목</label>
                            <Input
                              value={mission.title}
                              onChange={(e) => updateMission(mission.id, 'title', e.target.value)}
                              className="bg-slate-50"
                            />
                         </div>
                         <div className="w-full sm:w-40">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">인증 방식</label>
                            <Select
                              options={[
                                { label: '사진 인증', value: MissionType.PHOTO },
                                { label: '퀴즈', value: MissionType.QUIZ },
                                { label: '위치 인증', value: MissionType.LOCATION },
                              ]}
                              value={mission.type}
                              onChange={(e) => updateMission(mission.id, 'type', e.target.value)}
                              className="bg-slate-50"
                            />
                         </div>
                         <div className="w-24">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">포인트</label>
                            <Input
                              type="number"
                              value={mission.points}
                              onChange={(e) => updateMission(mission.id, 'points', parseInt(e.target.value))}
                              className="bg-slate-50"
                            />
                         </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">미션 설명</label>
                        <Input
                          value={mission.description}
                          onChange={(e) => updateMission(mission.id, 'description', e.target.value)}
                          className="bg-slate-50"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => deleteMission(mission.id)}
                      className="text-slate-300 hover:text-red-500 p-2 h-fit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Button onClick={addMission} variant="outline" className="w-full border-dashed border-2 py-8 text-slate-500 hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50/50">
                <Plus className="w-5 h-5 mr-2" /> 미션 추가하기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
