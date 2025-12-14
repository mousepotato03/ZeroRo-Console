import React from 'react';
import Card from '@/app/components/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'May', Sales: 400, Views: 240 },
  { name: 'Jun', Sales: 300, Views: 139 },
  { name: 'Jul', Sales: 500, Views: 980 },
  { name: 'Aug', Sales: 450, Views: 390 },
  { name: 'Sep', Sales: 350, Views: 480 },
  { name: 'Oct', Sales: 250, Views: 380 },
  { name: 'Nov', Sales: 150, Views: 430 },
];

export default function SalesViewsCard() {
  return (
    <Card title="Sales & Views">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Sales" fill="#8884d8" />
            <Bar dataKey="Views" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
