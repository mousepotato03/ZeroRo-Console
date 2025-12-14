import React, { useState } from 'react';
import Card from '@/app/components/Card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/app/components/UiKit'; // Assuming UiKit has a Button component

const mockData = [
  { name: 'Jan', 'Direct Login': 4000, 'Links to sites': 2400 },
  { name: 'Feb', 'Direct Login': 3000, 'Links to sites': 1398 },
  { name: 'Mar', 'Direct Login': 2000, 'Links to sites': 9800 },
  { name: 'Apr', 'Direct Login': 2780, 'Links to sites': 3908 },
  { name: 'May', 'Direct Login': 1890, 'Links to sites': 4800 },
  { name: 'Jun', 'Direct Login': 2390, 'Links to sites': 3800 },
  { name: 'Jul', 'Direct Login': 3490, 'Links to sites': 4300 },
  { name: 'Aug', 'Direct Login': 3200, 'Links to sites': 4100 },
  { name: 'Sep', 'Direct Login': 3000, 'Links to sites': 3900 },
  { name: 'Oct', 'Direct Login': 2800, 'Links to sites': 3700 },
  { name: 'Nov', 'Direct Login': 2600, 'Links to sites': 3500 },
  { name: 'Dec', 'Direct Login': 2400, 'Links to sites': 3300 },
];

export default function NewVisitorsCard() {
  const [timeframe, setTimeframe] = useState('Year'); // Week, Month, Year

  return (
    <Card title="New visitors">
      <div className="flex justify-end mb-4">
        <Button
          variant={timeframe === 'Week' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setTimeframe('Month')}
        >
          Week
        </Button>
        <Button
          variant={timeframe === 'Month' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setTimeframe('Week')}
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
          <AreaChart
            data={mockData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="Direct Login" stackId="1" stroke="#8884d8" fill="#8884d8" />
            <Area type="monotone" dataKey="Links to sites" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
