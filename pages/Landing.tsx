import React, { useState } from 'react';
import { Leaf, CheckCircle, ArrowRight, Activity, ShieldCheck, Zap } from 'lucide-react';
import { Button, Input, Card, CardContent } from '../components/UiKit';

interface LandingProps {
  onLoginClick: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onLoginClick }) => {
  const [isApplying, setIsApplying] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setFormSubmitted(true);
      setIsApplying(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Leaf className="text-emerald-400 w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Zeroro</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={onLoginClick}>Log in</Button>
            <Button onClick={() => setIsApplying(true)} className="bg-slate-900 text-white hover:bg-slate-800">Partner Apply</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 flex justify-center items-center overflow-hidden">
        <div className="max-w-4xl text-center space-y-8 relative">
          {/* Decorative gradients */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>

          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Now featuring Gemini 2.5 Vision API
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Gamify your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Environmental Impact</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            The all-in-one console for governments and NGOs. <br/>
            Launch campaigns, track real-time ESG data, and verify missions with AI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Button size="lg" onClick={() => setIsApplying(true)} className="px-8 h-12 text-base rounded-full shadow-xl shadow-emerald-500/20 bg-slate-900 hover:bg-slate-800">
              Start Partnership <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="px-8 h-12 text-base rounded-full">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats/Features Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Campaign Builder", desc: "Drag-and-drop mission creation tool designed for non-technical managers." },
              { icon: ShieldCheck, title: "AI Verification", desc: "Google Gemini Vision API automatically validates photo submissions to prevent fraud." },
              { icon: Activity, title: "Real-time Analytics", desc: "Live dashboards for participation rates, carbon reduction, and regional heatmaps." }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300 group">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 mb-6 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Modal (Preserved functionality, updated style) */}
      {(isApplying || formSubmitted) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg relative animate-in fade-in zoom-in duration-300 shadow-2xl border-0">
            {formSubmitted ? (
               <div className="p-12 text-center space-y-4">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                   <CheckCircle className="w-8 h-8" />
                 </div>
                 <h2 className="text-2xl font-bold tracking-tight">Application Sent</h2>
                 <p className="text-slate-600">We will review your organization details and contact you at the provided email within 24 hours.</p>
                 <Button onClick={() => setFormSubmitted(false)} className="w-full mt-4">Close</Button>
               </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Partner Application</h2>
                  <p className="text-slate-500 text-sm mt-1">Join the network of sustainable organizations.</p>
                </div>
                <div className="space-y-4">
                  <Input label="Organization Name" required placeholder="e.g. Green Seoul" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Contact Name" required />
                    <Input label="Phone" required />
                  </div>
                  <Input label="Work Email" type="email" required placeholder="manager@org.com" />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Organization Type</label>
                    <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none">
                      <option>Government / Local Authority</option>
                      <option>NGO / Non-Profit</option>
                      <option>Corporate CSR</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsApplying(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">Submit Application</Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};