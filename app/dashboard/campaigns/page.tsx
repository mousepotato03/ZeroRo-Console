"use client";

import React, { useState } from 'react';
import {
  Plus,
  MoreHorizontal,
  MapPin,
  Calendar,
  Sparkles,
  Trash2,
  GripVertical
} from 'lucide-react';
import { Button, Card, CardContent, Input, Select, Badge } from '../../components/UiKit';
import { Campaign, CampaignStatus, Mission, MissionType } from '../../types';

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    title: 'Han River Clean Up 2024',
    description: 'Join us to clean the banks of the Han River and protect marine life.',
    status: CampaignStatus.ACTIVE,
    participantCount: 1205,
    startDate: '2024-05-01',
    endDate: '2024-06-01',
    region: 'Seoul',
    missions: []
  },
  {
    id: '2',
    title: 'Zero Waste Challenge',
    description: 'A weekly challenge to reduce plastic usage in daily life.',
    status: CampaignStatus.DRAFT,
    participantCount: 0,
    startDate: '2024-07-01',
    endDate: '2024-07-31',
    region: 'Nationwide',
    missions: []
  },
  {
    id: '3',
    title: 'Plastic Free July',
    description: 'Global movement to help millions of people be part of the solution to plastic pollution.',
    status: CampaignStatus.ENDED,
    participantCount: 5430,
    startDate: '2023-07-01',
    endDate: '2023-07-31',
    region: 'Global',
    missions: []
  }
];

export default function CampaignsPage() {
  const [view, setView] = useState<'list' | 'create'>('list');

  return (
    <div className="space-y-6">
      {view === 'list' ? (
        <CampaignList onViewCreate={() => setView('create')} />
      ) : (
        <CampaignBuilder onCancel={() => setView('list')} />
      )}
    </div>
  );
}

// --- Subcomponent: List ---
const CampaignList: React.FC<{ onViewCreate: () => void }> = ({ onViewCreate }) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
          <p className="text-slate-500 mt-1">Manage and track your environmental initiatives.</p>
        </div>
        <Button onClick={onViewCreate} size="lg" className="shadow-lg shadow-emerald-900/10">
          <Plus className="w-5 h-5 mr-2" />
          Create New Campaign
        </Button>
      </div>

      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Campaign Details</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Participants</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Timeline</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_CAMPAIGNS.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-semibold text-slate-900 text-base mb-1">{campaign.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[240px] flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {campaign.region}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={campaign.status === CampaignStatus.ACTIVE ? 'success' : 'default'}>
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex -space-x-2 overflow-hidden">
                       <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200" />
                       <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-300" />
                       <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-400 flex items-center justify-center text-[10px] text-white font-bold">
                         +
                       </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                       {campaign.participantCount.toLocaleString()} joined
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col text-xs font-medium text-slate-600">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400"/> {campaign.startDate}</span>
                      <span className="pl-4 text-slate-400">to {campaign.endDate}</span>
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
      </Card>
    </>
  );
};

// --- Subcomponent: Builder ---
const CampaignBuilder: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const [step, setStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('');
  const [missions, setMissions] = useState<Mission[]>([]);

  // AI Handlers - Now using API Routes
  const handleGenerateDesc = async () => {
    if (!title) return alert("Please enter a title first.");
    setLoadingAI(true);
    try {
      const response = await fetch('/api/gemini/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, keywords: region || "Environment" })
      });
      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
      } else if (data.error) {
        alert("Failed to generate description");
      }
    } catch (e) {
      alert("Failed to generate description");
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
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Campaign</h1>
           <p className="text-slate-500 text-sm mt-1">Setup the details and missions for your new initiative.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>Discard</Button>
          <Button disabled={loadingAI} onClick={() => step === 1 ? setStep(2) : onCancel()} className="min-w-[120px]">
            {step === 1 ? 'Next Step' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Steps */}
        <div className="lg:col-span-1 space-y-1">
           <div className={`p-4 rounded-lg cursor-pointer transition-colors ${step === 1 ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-50'}`} onClick={() => setStep(1)}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Step 01</div>
              <div className="font-semibold">General Information</div>
              <p className="text-xs mt-1 opacity-80">Title, description and duration.</p>
           </div>
           <div className={`p-4 rounded-lg cursor-pointer transition-colors ${step === 2 ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-50'}`} onClick={() => setStep(2)}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Step 02</div>
              <div className="font-semibold">Mission Builder</div>
              <p className="text-xs mt-1 opacity-80">Gamify the experience.</p>
           </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2">
           {step === 1 && (
            <Card>
              <CardContent className="space-y-6 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Campaign Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Save the Ocean" />
                  <Input label="Target Region" value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Busan, Seoul" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <button
                      onClick={handleGenerateDesc}
                      disabled={loadingAI || !title}
                      className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 px-2 py-1 bg-purple-50 rounded-md transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Generate with AI
                    </button>
                  </div>
                  <textarea
                    className="w-full h-32 rounded-md border border-slate-200 bg-white p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the goals and details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                   <Input type="date" label="Start Date" />
                   <Input type="date" label="End Date" />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                 <div>
                    <h3 className="text-blue-900 font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Assistant</h3>
                    <p className="text-blue-700 text-sm mt-1">Generate relevant missions based on your campaign title.</p>
                 </div>
                 <Button size="sm" variant="primary" onClick={handleSuggestMissions} isLoading={loadingAI} className="bg-blue-600 hover:bg-blue-700 border-none">
                   Auto-Generate
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
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Title</label>
                            <Input
                              value={mission.title}
                              onChange={(e) => updateMission(mission.id, 'title', e.target.value)}
                              className="bg-slate-50"
                            />
                         </div>
                         <div className="w-full sm:w-40">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Type</label>
                            <Select
                              options={[
                                { label: 'Photo Upload', value: MissionType.PHOTO },
                                { label: 'Quiz', value: MissionType.QUIZ },
                                { label: 'GPS Check-in', value: MissionType.LOCATION },
                              ]}
                              value={mission.type}
                              onChange={(e) => updateMission(mission.id, 'type', e.target.value)}
                              className="bg-slate-50"
                            />
                         </div>
                         <div className="w-24">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Points</label>
                            <Input
                              type="number"
                              value={mission.points}
                              onChange={(e) => updateMission(mission.id, 'points', parseInt(e.target.value))}
                              className="bg-slate-50"
                            />
                         </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Description</label>
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
                <Plus className="w-5 h-5 mr-2" /> Add Another Mission
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
