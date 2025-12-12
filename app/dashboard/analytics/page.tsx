"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UiKit';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const dataRegion = [
  { name: 'Seoul', value: 400 },
  { name: 'Busan', value: 300 },
  { name: 'Jeju', value: 300 },
  { name: 'Incheon', value: 200 },
];

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7'];

const dataAge = [
  { name: '10-20', count: 400 },
  { name: '20-30', count: 800 },
  { name: '30-40', count: 600 },
  { name: '40-50', count: 300 },
  { name: '50+', count: 150 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics Report</h1>
        <p className="text-slate-500">Deep dive into your campaign performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Participants by Region</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataRegion}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataRegion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Demographics</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataAge} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" width={50} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
         <CardContent className="p-6">
            <div className="flex justify-between items-center">
               <div>
                  <h3 className="font-bold text-slate-900">Export Raw Data</h3>
                  <p className="text-sm text-slate-500">Download participant logs and mission verification records.</p>
               </div>
               <div className="flex gap-2">
                  <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700">Download PDF</button>
                  <button className="px-4 py-2 bg-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 text-white">Export CSV</button>
               </div>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
