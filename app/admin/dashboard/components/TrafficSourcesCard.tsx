import React from 'react';
import Card from '@/app/components/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'Direct', value: 300 },
  { name: 'Social', value: 150 },
  { name: 'Referral', value: 100 },
  { name: 'Other', value: 50 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']; // Example colors

export default function TrafficSourcesCard() {
  return (
    <Card title="Traffic sources">
      <div className="flex items-center justify-center h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend
              align="center"
              verticalAlign="bottom"
              layout="horizontal"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
                <p className="text-3xl font-bold text-gray-800">58%</p>
                <p className="text-sm text-gray-500">Completed</p>
            </div>
        </div>
      </div>
    </Card>
  );
}
