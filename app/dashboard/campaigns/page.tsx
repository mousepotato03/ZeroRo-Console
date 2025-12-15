"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import {
  Plus,
  MoreHorizontal,
  MapPin,
  Calendar,
  Sparkles,
  Trash2,
  GripVertical,
  RefreshCw,
  Leaf,
  ImagePlus,
  X,
  ChevronRight,
  Eye,
  Pencil
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
  const router = useRouter();
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
          onCampaignClick={(id) => router.push(`/dashboard/campaigns/${id}`)}
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
  onCampaignClick: (id: number) => void;
}

const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  isLoading,
  error,
  onRefresh,
  onViewCreate,
  onCampaignClick
}) => {
  const router = useRouter();
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
        <div className="flex gap-3 items-center">
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
                  <th className="px-6 py-4 font-semibold text-slate-700 text-left">캠페인 정보</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-center">상태</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-center">카테고리</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-center">기간</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                  >
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-900 text-base mb-1">{campaign.title}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[300px] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {campaign.region || '전국'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm text-slate-600">
                        {campaign.category || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col text-xs font-medium text-slate-600">
                        <span className="flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400"/>
                          {campaign.start_date || '-'}
                        </span>
                        <span className="text-slate-400">
                          ~ {campaign.end_date || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors inline-block" />
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

// --- Subcomponent: MarkdownEditor ---
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onGenerateAI: () => void;
  loadingAI: boolean;
  disabled: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, onGenerateAI, loadingAI, disabled }) => {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-700">캠페인 설명</label>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setTab('edit')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'edit'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Pencil className="w-3 h-3" />
              편집
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'preview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye className="w-3 h-3" />
              미리보기
            </button>
          </div>
          <button
            type="button"
            onClick={onGenerateAI}
            disabled={loadingAI || disabled}
            className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            AI 자동 생성
          </button>
        </div>
      </div>

      {tab === 'edit' ? (
        <textarea
          className="w-full h-72 rounded-lg border border-slate-200 bg-white p-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed font-mono"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`캠페인의 목적, 참여 방법, 기대 효과 등을 상세히 설명해주세요...

마크다운 문법을 지원합니다:
# 제목
## 소제목
**굵은 글씨**, *기울임*
- 목록 항목
1. 번호 목록`}
        />
      ) : (
        <div className="w-full h-72 rounded-lg border border-slate-200 bg-white p-4 text-sm overflow-auto prose prose-sm prose-slate max-w-none">
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-slate-400 italic">미리볼 내용이 없습니다. 편집 탭에서 내용을 입력해주세요.</p>
          )}
        </div>
      )}
      <p className="text-xs text-slate-400">마크다운 문법을 지원합니다. (# 제목, **굵게**, *기울임*, - 목록 등)</p>
    </div>
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

  // Image Upload State
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 파일 업로드 처리 (공통 함수)
  const processImageFile = async (file: File) => {
    // 파일 타입 검증
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 서버에 업로드
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/campaigns/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '이미지 업로드 실패');
      }

      setImageUrl(data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Input 변경 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  // 드래그앤드롭 핸들러
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImagePreview(null);
  };

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
       const suggestions: Array<string | { title: string; successCriteria?: string }> = data.missions || [];
       const newMissions = suggestions.map((s, idx) => ({
         id: `temp-${Date.now()}-${idx}`,
         title: typeof s === 'string' ? s : s.title,
         description: '',
         type: MissionType.IMAGE,
         points: 100,
         order: missions.length + idx,
         successCriteria: typeof s === 'string' ? '' : (s.successCriteria || '')
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
          image_url: imageUrl,
          missions: missions.map(m => ({
            title: m.title,
            description: m.description,
            type: m.type,
            points: m.points,
            order: m.order,
            successCriteria: m.successCriteria || null
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '캠페인 생성 실패');
      }

      if (data.warning) {
        alert(`캠페인이 생성되었습니다.\n(경고: ${data.warning})`);
      } else {
        alert('캠페인이 성공적으로 생성되었습니다!');
      }
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
        type: MissionType.IMAGE,
        points: 50,
        order: missions.length,
        successCriteria: ''
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
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
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

      <div className="w-full">
         {/* Step Indicator (Optional, simpler version) */}
         <div className="flex items-center gap-4 mb-8 text-sm text-slate-500">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-emerald-600 font-bold' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step === 1 ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>1</div>
              기본 정보
            </div>
            <div className="h-px w-8 bg-slate-200"></div>
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-emerald-600 font-bold' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step === 2 ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>2</div>
              미션 빌더
            </div>
         </div>

         {step === 1 && (
            <div className="space-y-6">
              {/* 섹션 1: 캠페인 이미지 (가장 중요하므로 최상단) */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="px-8 pt-5 pb-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                      <ImagePlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">대표 이미지</h3>
                      <p className="text-sm text-slate-500">캠페인을 대표할 매력적인 이미지를 등록해주세요.</p>
                    </div>
                  </div>

                  <div
                    className={`bg-slate-50 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-300 hover:bg-slate-100/50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {imagePreview ? (
                      <div className="relative inline-block group">
                        <img
                          src={imagePreview}
                          alt="캠페인 이미지 미리보기"
                          className="max-h-[400px] w-auto mx-auto rounded-lg shadow-md object-contain"
                        />
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-3 -right-3 bg-white text-red-500 border border-slate-200 rounded-full p-2 shadow-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer py-12">
                        <div className={`w-16 h-16 rounded-full shadow-sm flex items-center justify-center mb-4 transition-colors ${
                          isDragging ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-emerald-600'
                        }`}>
                          <ImagePlus className="w-8 h-8" />
                        </div>
                        <span className={`text-lg font-medium mb-1 ${isDragging ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {isDragging ? '여기에 이미지를 놓으세요' : '이미지를 드래그하거나 클릭하여 업로드'}
                        </span>
                        <span className="text-sm text-slate-500">JPG, PNG, WEBP (최대 5MB)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 섹션 2: 기본 정보 (제목, 설명) - 좌측/상단 배치 */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="h-full border-slate-200 shadow-sm">
                    <CardContent className="px-8 pt-5 pb-8">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                          <Leaf className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">기본 정보</h3>
                          <p className="text-sm text-slate-500">캠페인의 핵심 내용을 작성해주세요.</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <Input 
                          label="캠페인 제목" 
                          value={title} 
                          onChange={e => setTitle(e.target.value)} 
                          placeholder="참여를 유도할 수 있는 매력적인 제목을 입력하세요" 
                          className="text-lg"
                        />
                        
                        <MarkdownEditor
                          value={description}
                          onChange={setDescription}
                          onGenerateAI={handleGenerateDesc}
                          loadingAI={loadingAI}
                          disabled={!title}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 섹션 3: 상세 설정 (지역, 기간, 유형 등) - 우측/하단 배치 */}
                <div className="lg:col-span-1 space-y-6">
                  <Card className="h-full border-slate-200 shadow-sm">
                    <CardContent className="px-8 pt-5 pb-8">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">상세 설정</h3>
                          <p className="text-sm text-slate-500">운영 정보를 설정하세요.</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <Input 
                          label="대상 지역" 
                          value={region} 
                          onChange={e => setRegion(e.target.value)} 
                          placeholder="예: 서울특별시 마포구" 
                        />

                        <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-2">
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
                           </div>
                           <div className="col-span-2">
                            <Select
                              label="진행 방식"
                              value={campaignType}
                              onChange={e => setCampaignType(e.target.value as 'ONLINE' | 'OFFLINE')}
                              options={[
                                { label: '온라인', value: 'ONLINE' },
                                { label: '오프라인', value: 'OFFLINE' },
                              ]}
                            />
                           </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-4">
                          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" /> 운영 기간
                          </label>
                          <div className="grid grid-cols-1 gap-4">
                            <Input type="date" label="시작일" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <Input type="date" label="종료일" value={endDate} onChange={e => setEndDate(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
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
                                { label: '사진 인증', value: MissionType.IMAGE },
                                { label: '퀴즈', value: MissionType.QUIZ },
                                { label: '소감문', value: MissionType.TEXT_REVIEW },
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
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          처리요건 <span className="text-slate-400 font-normal">(성공 기준, 옵션)</span>
                        </label>
                        <Input
                          value={mission.successCriteria || ''}
                          onChange={(e) => updateMission(mission.id, 'successCriteria', e.target.value)}
                          placeholder="예: 쓰레기 3개 이상이 보이는 사진, 나무가 포함된 사진"
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
  );
};
