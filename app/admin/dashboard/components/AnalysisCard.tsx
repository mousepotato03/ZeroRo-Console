import React from 'react';
import Card from '@/app/components/Card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const data = [
  { name: 'May', uv: 400 },
  { name: 'Jun', uv: 300 },
  { name: 'Jul', uv: 500 },
  { name: 'Aug', uv: 450 },
  { name: 'Sep', uv: 350 },
  { name: 'Oct', uv: 250 },
  { name: 'Nov', uv: 150 },
];

export default function AnalysisCard() {
  return (
    <Card title="Analysis">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="uv" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
