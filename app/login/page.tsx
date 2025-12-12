"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button, Input } from '../components/UiKit';
import { Logo } from '../components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 800);
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
            Manage your environmental impact with AI-powered verification.
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 text-sm">Enter the credentials provided by your Zeroro manager.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="name@organization.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-emerald-500/20" isLoading={loading}>
              Sign In to Console
            </Button>
          </form>

          <div className="text-center pt-4">
            <button onClick={handleBack} className="text-sm text-slate-500 hover:text-emerald-600 font-medium">
              &larr; Back to Landing Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
