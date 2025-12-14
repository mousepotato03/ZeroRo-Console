import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import Card from '@/app/components/Card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatData {
  title: string;
  value: string;
  change: string; // e.g., "+0.25%" or "-0.15%"
  changeType: 'increase' | 'decrease';
  chartData: { name: string; uv: number }[];
}

const mockStats: StatData[] = [
  {
    title: 'Total visits',
    value: '54 081',
    change: '+0.25%',
    changeType: 'increase',
    chartData: [
      { name: 'Jan', uv: 4000 }, { name: 'Feb', uv: 3000 }, { name: 'Mar', uv: 2000 },
      { name: 'Apr', uv: 2780 }, { name: 'May', uv: 1890 }, { name: 'Jun', uv: 2390 },
      { name: 'Jul', uv: 3490 }
    ],
  },
  {
    title: 'Realtime users',
    value: '840',
    change: '-0.15%',
    changeType: 'decrease',
    chartData: [
      { name: 'Jan', uv: 2000 }, { name: 'Feb', uv: 2780 }, { name: 'Mar', uv: 1890 },
      { name: 'Apr', uv: 2390 }, { name: 'May', uv: 3490 }, { name: 'Jun', uv: 4000 },
      { name: 'Jul', uv: 3000 }
    ],
  },
  {
    title: 'Bounce rate',
    value: '74.88%',
    change: '-0.32%',
    changeType: 'decrease',
    chartData: [
      { name: 'Jan', uv: 3000 }, { name: 'Feb', uv: 2000 }, { name: 'Mar', uv: 2780 },
      { name: 'Apr', uv: 1890 }, { name: 'May', uv: 2390 }, { name: 'Jun', uv: 3490 },
      { name: 'Jul', uv: 4000 }
    ],
  },
  {
    title: 'Visit duration',
    value: '1m 2s',
    change: '+0.23%',
    changeType: 'increase',
    chartData: [
      { name: 'Jan', uv: 1890 }, { name: 'Feb', uv: 2390 }, { name: 'Mar', uv: 3490 },
      { name: 'Apr', uv: 4000 }, { name: 'May', uv: 3000 }, { name: 'Jun', uv: 2000 },
      { name: 'Jul', uv: 2780 }
    ],
  },
  {
    title: 'In-depth',
    value: '12 532',
    change: '-0.09%',
    changeType: 'decrease',
    chartData: [
      { name: 'Jan', uv: 2390 }, { name: 'Feb', uv: 3490 }, { name: 'Mar', uv: 4000 },
      { name: 'Apr', uv: 3000 }, { name: 'May', uv: 2000 }, { name: 'Jun', uv: 2780 },
      { name: 'Jul', uv: 1890 }
    ],
  },
];

export default function StatsOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {mockStats.map((stat, index) => (
        <Card key={index} className="flex flex-col justify-between p-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className={`text-xs font-semibold ${stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'} flex items-center`}>
              {stat.changeType === 'increase' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
              {stat.change}
            </span>
            <div className="w-20 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stat.chartData}>
                  <Area type="monotone" dataKey="uv" stroke={stat.changeType === 'increase' ? "#22c55e" : "#ef4444"} fillOpacity={0.3} fill={stat.changeType === 'increase' ? "#22c55e" : "#ef4444"} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
