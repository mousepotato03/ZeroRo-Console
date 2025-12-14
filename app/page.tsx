"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Activity, ShieldCheck, Zap, Map, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Button, Input, FileInput } from './components/UiKit';
import { LiquidGlassTitle } from './components/LiquidGlassTitle';
import { Logo } from './components/Logo';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`backdrop-blur-xl bg-white/30 border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl ${className}`}>
    {children}
  </div>
);

interface FormData {
  organization_name: string;
  contact_name: string;
  phone: string;
  email: string;
  organization_type: string;
}

export default function LandingPage() {
  const [isApplying, setIsApplying] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessFile, setBusinessFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    organization_name: '',
    contact_name: '',
    phone: '',
    email: '',
    organization_type: 'Government',
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let businessRegistrationUrl: string | undefined;

      // 파일 업로드 (선택사항)
      if (businessFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', businessFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json();
          throw new Error(uploadError.error || '파일 업로드에 실패했습니다.');
        }

        const uploadData = await uploadRes.json();
        businessRegistrationUrl = uploadData.url;
      }

      // 신청 제출
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          business_registration_url: businessRegistrationUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '신청 처리 중 오류가 발생했습니다.');
      }

      setFormSubmitted(true);
      setIsApplying(false);
      // 폼 초기화
      setFormData({
        organization_name: '',
        contact_name: '',
        phone: '',
        email: '',
        organization_type: 'Government',
      });
      setBusinessFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-200 selection:text-emerald-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@1000&display=swap');
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
      `}</style>

      {/* Navbar */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-200/50 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
          <Logo variant={isScrolled ? 'dark' : 'light'} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <div className="flex gap-4">
            <Link href="/login">
              <Button
                variant="ghost"
                className={`backdrop-blur-xl shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] transition-all hover:scale-105 rounded-full font-bold ${isScrolled
                  ? 'bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 border border-slate-900/10'
                  : 'bg-gradient-to-b from-white/90 via-white/60 to-white/30 border border-white/60 text-slate-900'
                  }`}
              >
                로그인
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-start items-center overflow-hidden pt-32">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/hero-image.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent via-70% to-slate-50/90"></div>
        </div>

        <div className="relative z-10 max-w-5xl w-full text-center px-4">

          {/* Liquid Glass Title "ZeroRo" */}
          <LiquidGlassTitle
            text="ZeroRo"
            fontSize="text-[9rem] md:text-[15rem]"
            margin="mb-80"
          />

          {/* Minimal Button Group */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-in fade-in slide-in-from-bottom-10 delay-300">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsApplying(true)}
              className="px-10 h-16 text-xl rounded-full bg-gradient-to-b from-white/90 via-white/60 to-white/30 border border-white/60 text-slate-900 font-bold backdrop-blur-xl shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] transition-all hover:scale-105"
            >
              파트너십 시작하기 <ArrowRight className="ml-2 w-6 h-6 text-slate-900" />
            </Button>
          </div>
        </div>
      </section>

      {/* Intro Section (Moved Content) */}
      <section className="py-24 bg-white relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-800 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Gemini 2.5 Vision API 탑재
          </div>

          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            환경 활동을 <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">게임처럼</span>
          </h2>

          <p className="text-xl md:text-2xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            정부 및 NGO를 위한 올인원 콘솔. <br />
            캠페인 런칭, 실시간 ESG 데이터 추적, AI 미션 검증까지.
          </p>
        </div>
      </section>

      {/* App Feature Showcase: AI Agent */}
      <section className="py-24 relative overflow-hidden bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Side */}
            <div className="order-1 relative z-10 space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-emerald-600 font-bold tracking-wider text-sm uppercase">
                  <Zap className="w-4 h-4" />
                  핵심 기술
                </div>
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                  만나보세요, <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">AI 에코 어시스턴트.</span>
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  최첨단 Gemini 모델 기반의 AI 에이전트가 24시간 운영을 지원합니다.
                  즉각적인 미션 검증부터 예측 분석까지, 실질적인 변화를 이끌어낼 인사이트를 제공합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: ShieldCheck, title: "자동 검증", desc: "컴퓨터 비전으로 사용자 제출물을 즉시 검증합니다." },
                  { icon: Activity, title: "데이터 인사이트", desc: "원시 데이터를 실행 가능한 환경 전략으로 전환합니다." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Side */}
            <div className="order-2 relative group">
              {/* Decorative background blob */}
              <div className="absolute -inset-4 bg-gradient-to-l from-emerald-300 to-blue-300 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500"></div>
              
              <GlassCard className="relative overflow-hidden p-3 border-white/60 shadow-2xl -rotate-1 hover:rotate-0 transition-transform duration-500">
                 <div className="rounded-xl overflow-hidden bg-[#F5F5F7] relative aspect-[4/3]">
                    <img 
                      src="/agent.jpg" 
                      alt="ZeroRo AI Agent Interface" 
                      className="relative z-10 w-full h-full object-contain"
                    />
                    {/* Overlay UI Mockup Elements */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 border border-emerald-100">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                         AI 분석 완료
                      </div>
                    </div>
                 </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* App Feature Showcase: Plogging Map */}
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Visual Side */}
            <div className="order-2 lg:order-1 relative group">
              {/* Decorative background blob */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-300 to-blue-300 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500"></div>
              
              <GlassCard className="relative overflow-hidden p-3 border-white/60 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                 <div className="rounded-xl overflow-hidden bg-white relative aspect-[4/3]">
                    <div className="absolute inset-0 bg-slate-100 animate-pulse" /> {/* Loading placeholder */}
                    <img 
                      src="/ploggingmap.gif" 
                      alt="ZeroRo App Plogging Map Interface" 
                      className="relative z-10 w-full h-full object-cover"
                    />
                    {/* Overlay UI Mockup Elements */}
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-2">
                      <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                         실시간 추적
                      </div>
                      <div className="bg-emerald-500/90 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-bold text-white shadow-sm ml-auto">
                         + 150 포인트
                      </div>
                    </div>
                 </div>
              </GlassCard>
            </div>

            {/* Text Side */}
            <div className="order-1 lg:order-2 space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-emerald-600 font-bold tracking-wider text-sm uppercase">
                  <Map className="w-4 h-4" />
                  앱 기능
                </div>
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                  세상을 탐험하세요, <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">한 걸음씩.</span>
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  <strong>ZeroRo 앱</strong>과 연결하여 주변 플로깅 핫스팟을 찾아보세요.
                  인터랙티브 지도가 관심이 필요한 지역으로 안내하고, 실시간으로 청소 경로를 추적하며,
                  에코 포인트로 기여에 보상합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Navigation, title: "스마트 경로", desc: "최대 청소 효율을 위한 최적화된 경로." },
                  { icon: Activity, title: "실시간 히트맵", desc: "커뮤니티 영향을 실시간으로 시각화합니다." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Features Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Decorative background for glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-200 via-transparent to-transparent"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "캠페인 빌더", desc: "비기술 관리자를 위해 설계된 드래그 앤 드롭 미션 생성 도구." },
              { icon: ShieldCheck, title: "AI 검증", desc: "Google Gemini Vision API가 사진 제출물을 자동으로 검증하여 부정행위를 방지합니다." },
              { icon: Activity, title: "실시간 분석", desc: "참여율, 탄소 감소량, 지역 히트맵을 위한 라이브 대시보드." }
            ].map((f, i) => (
              <GlassCard key={i} className="p-8 hover:bg-white/40 transition-all duration-300 group hover:-translate-y-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-900 mb-6 bg-white/50 border border-white/60 shadow-sm group-hover:bg-emerald-500/10 group-hover:text-emerald-700 transition-colors">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Application Modal (입점 신청 모달) */}
      {(isApplying || formSubmitted) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <GlassCard className="w-full max-w-lg relative animate-in fade-in zoom-in duration-300 shadow-2xl border border-white/50 bg-white/70">
            {formSubmitted ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100/50 backdrop-blur-sm text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">신청이 완료되었습니다</h2>
                <p className="text-slate-700">입력하신 이메일로 심사 결과를 안내해 드리겠습니다. 심사에는 1-2 영업일이 소요됩니다.</p>
                <Button onClick={() => setFormSubmitted(false)} className="w-full mt-4 bg-slate-900/90 hover:bg-slate-800 text-white shadow-lg">닫기</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">파트너 입점 신청</h2>
                  <p className="text-slate-600 text-sm mt-1">환경 캠페인 네트워크에 참여하세요.</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <Input
                    label="단체명"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleInputChange}
                    required
                    placeholder="예: 서울시 환경재단"
                    className="bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 transition-all"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="담당자명"
                      name="contact_name"
                      value={formData.contact_name}
                      onChange={handleInputChange}
                      required
                      placeholder="홍길동"
                      className="bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 transition-all"
                    />
                    <Input
                      label="연락처"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="010-1234-5678"
                      className="bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 transition-all"
                    />
                  </div>
                  <Input
                    label="업무용 이메일"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="manager@organization.kr"
                    className="bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 transition-all"
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">단체 유형</label>
                    <select
                      name="organization_type"
                      value={formData.organization_type}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none backdrop-blur-sm"
                    >
                      <option value="Government">지자체 / 공공기관</option>
                      <option value="NGO">비영리단체 / NGO</option>
                      <option value="Corporate">기업 CSR</option>
                    </select>
                  </div>
                  <FileInput
                    label="사업자등록증 (선택)"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={setBusinessFile}
                    hint="PDF, JPG, PNG (최대 5MB)"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setIsApplying(false); setError(null); }}
                    className="flex-1 hover:bg-white/40"
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      '신청하기'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
