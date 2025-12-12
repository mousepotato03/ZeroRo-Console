"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Activity, ShieldCheck, Zap, Map, Navigation } from 'lucide-react';
import { Button, Input } from './components/UiKit';
import { LiquidGlassTitle } from './components/LiquidGlassTitle';
import { Logo } from './components/Logo';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`backdrop-blur-xl bg-white/30 border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl ${className}`}>
    {children}
  </div>
);

export default function LandingPage() {
  const [isApplying, setIsApplying] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setFormSubmitted(true);
      setIsApplying(false);
    }, 1000);
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
                Log in
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
              Start Partnership <ArrowRight className="ml-2 w-6 h-6 text-slate-900" />
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
            Now featuring Gemini 2.5 Vision API
          </div>

          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Gamify your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Environmental Impact</span>
          </h2>

          <p className="text-xl md:text-2xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            The all-in-one console for governments and NGOs. <br />
            Launch campaigns, track real-time ESG data, and verify missions with AI.
          </p>
        </div>
      </section>

      {/* App Feature Showcase: Plogging Map */}
      <section className="py-24 relative overflow-hidden bg-slate-50/50">
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
                         Live Tracking
                      </div>
                      <div className="bg-emerald-500/90 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-bold text-white shadow-sm ml-auto">
                         + 150 Points
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
                  App Feature
                </div>
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                  Explore the World, <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">One Step at a Time.</span>
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Connect with the <strong>ZeroRo App</strong> to discover local plogging hotspots. 
                  Our interactive map guides you to areas that need attention, tracks your cleaning path in real-time, 
                  and rewards your contribution with eco-points.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Navigation, title: "Smart Routing", desc: "Optimized paths for maximum cleanup efficiency." },
                  { icon: Activity, title: "Live Heatmaps", desc: "See community impact visualization in real-time." }
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
              { icon: Zap, title: "Campaign Builder", desc: "Drag-and-drop mission creation tool designed for non-technical managers." },
              { icon: ShieldCheck, title: "AI Verification", desc: "Google Gemini Vision API automatically validates photo submissions to prevent fraud." },
              { icon: Activity, title: "Real-time Analytics", desc: "Live dashboards for participation rates, carbon reduction, and regional heatmaps." }
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

      {/* Application Modal (Preserved functionality, updated style) */}
      {(isApplying || formSubmitted) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <GlassCard className="w-full max-w-lg relative animate-in fade-in zoom-in duration-300 shadow-2xl border border-white/50 bg-white/70">
            {formSubmitted ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100/50 backdrop-blur-sm text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Application Sent</h2>
                <p className="text-slate-700">We will review your organization details and contact you at the provided email within 24 hours.</p>
                <Button onClick={() => setFormSubmitted(false)} className="w-full mt-4 bg-slate-900/90 hover:bg-slate-800 text-white shadow-lg">Close</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Partner Application</h2>
                  <p className="text-slate-600 text-sm mt-1">Join the network of sustainable organizations.</p>
                </div>
                <div className="space-y-4">
                  <Input label="Organization Name" required placeholder="e.g. Green Seoul" className="bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 transition-all" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Contact Name" required className="bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 transition-all" />
                    <Input label="Phone" required className="bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 transition-all" />
                  </div>
                  <Input label="Work Email" type="email" required placeholder="manager@org.com" className="bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 transition-all" />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Organization Type</label>
                    <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none backdrop-blur-sm">
                      <option>Government / Local Authority</option>
                      <option>NGO / Non-Profit</option>
                      <option>Corporate CSR</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsApplying(false)} className="flex-1 hover:bg-white/40">Cancel</Button>
                  <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-lg">Submit Application</Button>
                </div>
              </form>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
