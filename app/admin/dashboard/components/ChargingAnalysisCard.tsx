import React, { useState } from 'react';
import Card from '@/app/components/Card';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Button } from '@/app/components/UiKit';

const data = [
  { name: 'Mon', 'Direct Login': 200, 'Links to sites': 150, Line: 180 },
  { name: 'Tue', 'Direct Login': 300, 'Links to sites': 200, Line: 250 },
  { name: 'Wed', 'Direct Login': 150, 'Links to sites': 100, Line: 120 },
  { name: 'Thu', 'Direct Login': 250, 'Links to sites': 180, Line: 220 },
  { name: 'Fri', 'Direct Login': 180, 'Links to sites': 120, Line: 150 },
  { name: 'Sat', 'Direct Login': 350, 'Links to sites': 280, Line: 300 },
  { name: 'Sun', 'Direct Login': 280, 'Links to sites': 220, Line: 250 },
];

export default function ChargingAnalysisCard() {
  const [timeframe, setTimeframe] = useState('Year'); // Week, Month, Year

  return (
    <Card title="Charging Analysis">
      <div className="flex justify-end mb-4">
        <Button
          variant={timeframe === 'Week' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setTimeframe('Week')}
        >
          Week
        </Button>
        <Button
          variant={timeframe === 'Month' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setTimeframe('Month')}
        >
          Month
        </Button>
        <Button
          variant={timeframe === 'Year' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setTimeframe('Year')}
        >
          Year
        </Button>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Direct Login" barSize={20} fill="#413ea0" />
            <Bar dataKey="Links to sites" barSize={20} fill="#82ca9d" />
            <Line type="monotone" dataKey="Line" stroke="#ff7300" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
