import React from 'react';
import Card from '@/app/components/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

// Mock data for a simplified funnel-like representation
const funnelData = [
  { name: 'Initial Lead', value: 20000, color: '#8884d8' },
  { name: 'Qualified Lead', value: 15000, color: '#82ca9d' },
  { name: 'Proposal', value: 10000, color: '#ffc658' },
  { name: 'Negotiation', value: 7000, color: '#ff7300' },
  { name: 'Closed Won', value: 5000, color: '#00c49f' },
];

export default function SalesAnalyticsCard() {
  return (
    <Card title="Sales Analytics">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={funnelData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barCategoryGap="10%" // Adjust gap to make it look funnel-like
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-sm text-gray-500 mt-4">
        <p>64% +8% vs last year - Lead to Opportunity Conversion</p>
        <p>18% +8% vs last year - Opportunity to Win Conversion</p>
      </div>
    </Card>
  );
}
