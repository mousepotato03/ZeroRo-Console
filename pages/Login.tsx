import React, { useState } from 'react';
import { Leaf } from 'lucide-react';
import { Button, Input } from '../components/UiKit';

export const Login: React.FC<{ onLogin: () => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2874&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Leaf className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Zeroro</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight max-w-lg leading-tight">
            Manage your environmental impact with AI-powered verification.
          </h2>
        </div>
        <div className="relative z-10 text-slate-400 text-sm">
          &copy; 2024 Zeroro Inc. All rights reserved.
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
            <button onClick={onBack} className="text-sm text-slate-500 hover:text-emerald-600 font-medium">
              &larr; Back to Landing Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};