"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase/client';
import { Button, Input } from '../components/UiKit';
import { Logo } from '../components/Logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'password-set') {
      setSuccessMessage('비밀번호가 설정되었습니다. 로그인해주세요.');
    } else if (message === 'password-reset') {
      setSuccessMessage('비밀번호가 재설정되었습니다. 로그인해주세요.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('/login-image.png')" }}
        />
        <div className="relative z-10">
          <Logo variant="light" className="mb-8" onClick={handleBack} />
          <h2 className="text-4xl font-bold tracking-tight max-w-lg leading-tight">
            AI 기반 검증으로<br/>
            환경 영향을 관리하세요.
          </h2>
        </div>
        <div className="relative z-10 text-slate-400 text-sm">
          &copy; 2025 Zeroro Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">다시 오신 것을 환영합니다</h1>
            <p className="text-slate-500 text-sm">Zeroro 관리자가 제공한 계정 정보를 입력하세요.</p>
          </div>

          {successMessage && (
            <div className="text-emerald-600 text-sm bg-emerald-50 p-3 rounded-lg">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="업무용 이메일"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="name@organization.com"
            />
            <Input
              label="비밀번호"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-emerald-500/20" isLoading={loading}>
              콘솔 로그인
            </Button>

            <div className="text-center">
              <Link href="/auth/reset-password" className="text-sm text-slate-500 hover:text-emerald-600 font-medium">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </form>

          <div className="text-center pt-4">
            <button onClick={handleBack} className="text-sm text-slate-500 hover:text-emerald-600 font-medium">
              &larr; 메인 페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">로딩 중...</div>}>
      <LoginForm />
    </Suspense>
  );
}
