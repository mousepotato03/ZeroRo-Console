"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Activity, ShieldCheck, Zap, Map, Navigation, Loader2, AlertCircle, Users, MessageCircle, Trophy, Camera } from 'lucide-react';
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
            margin="mb-0"
          />
        </div>

        {/* Minimal Button Group - 분리해서 mt-auto로 하단 배치 */}
        <div className="relative z-10 mt-auto mb-24 flex flex-col sm:flex-row gap-6 justify-center animate-in fade-in slide-in-from-bottom-10 delay-300">
          {/* Minimal Button Group */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-in fade-in slide-in-from-bottom-10 delay-300">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsApplying(true)}
              className="px-10 h-16 text-xl rounded-full bg-gradient-to-b from-white/90 via-white/60 to-white/30 border border-white/60 text-slate-900 font-bold backdrop-blur-xl shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] transition-all hover:scale-105"
            >
              파트너쉽 시작하기 <ArrowRight className="ml-2 w-6 h-6 text-slate-900" />
            </Button>
          </div>
        </div>
      </section>

      {/* Intro Section (Moved Content) */}
      <section className="py-24 bg-white relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            함께하는 환경 활동,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">전국의 캠페인을 한곳에서</span>
          </h2>

          <p className="text-xl md:text-2xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            환경 활동, 더 쉽게 시작하는 방법 <br />
            캠페인 참여부터 기록까지, ZeroRo 하나로
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
                  앱 기능
                </div>
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                  만나보세요, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">AI 에코 어시스턴트.</span>
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  생성형 AI 에이전트가 24시간 운영을 지원합니다.
                  실질적인 변화를 이끌어낼 인사이트를 제공합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: ShieldCheck, title: "정보 제공", desc: "환경에 대해 궁금한 내용을 물어보세요!" },
                  { icon: Activity, title: "캠페인 참가", desc: "사용자 맞춤형 캠페인을 찾고, 바로 참여할 수 있어요!" }
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
                  세상을 탐험하세요, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">한 걸음씩.</span>
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  <strong>ZeroRo 앱</strong>과 연결하여 플로깅을 진행해 보세요.
                  지도로 플로깅 진행이 더딘 구역을 확인 가능하고, 경로를 추적하며
                  에코 포인트로 기여에 보상합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Navigation, title: "부정 행위 방지", desc: "20분 간격으로 AI 에이전트가 플로깅 진행을 검증합니다." },
                  { icon: Activity, title: "실시간 히트맵", desc: "플로깅 경로를 실시간으로 시각화하여 플로깅 진행을 격려합니다." }
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

      {/* App Feature Showcase: Campaign & Recruiting (Combined) */}
      <section className="py-24 relative overflow-hidden bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Side */}
            <div className="order-1 relative z-10 space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-emerald-600 font-bold tracking-wider text-sm uppercase">
                  <Activity className="w-4 h-4" />
                  앱 기능
                </div>
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">참여하고, 함께하세요.</span><br />
                  캠페인 & 커뮤니티
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  다양한 환경 캠페인에 참여하여 보상을 받고, <br className="hidden md:block" />
                  비슷한 관심사를 가진 이웃들과 팀을 이루어 더 즐겁게 활동하세요.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[
                  { icon: Trophy, title: "캠페인 & 챌린지", desc: "기업/단체 주최 캠페인 참여 및 AI 자동 인증, 에코 포인트 리워드" },
                  { icon: Users, title: "동료 모집 & 커뮤니티", desc: "지역 기반 플로깅 동료 모집 및 활동 공유" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-white/60 border border-white/60 shadow-sm hover:bg-white/80 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Side */}
            <div className="order-2 relative group">
              {/* Decorative background blob */}
              <div className="absolute -inset-4 bg-gradient-to-l from-emerald-300 to-blue-300 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500"></div>

              <GlassCard className="relative overflow-hidden p-0 border-white/60 shadow-2xl -rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="rounded-xl overflow-hidden bg-slate-100 relative">
                  {/* Combined Image */}
                  <img
                    src="/campaign_recruiting.png"
                    alt="Campaign and Recruiting Interface"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </GlassCard>
            </div>
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
