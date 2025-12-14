import React, { useState } from 'react';
import Card from '@/app/components/Card';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Button } from '@/app/components/UiKit';

const mockPagesData = [
  {
    path: '/store/final',
    visitors: 4890,
    uniquePageVisits: 3985,
    bounceRate: '81.56%',
    chartData: [{ v: 100 }, { v: 200 }, { v: 150 }, { v: 300 }, { v: 250 }, { v: 400 }],
  },
  {
    path: '/store/symbols-styleguides',
    visitors: 3784,
    uniquePageVisits: 3152,
    bounceRate: '62.48%',
    chartData: [{ v: 200 }, { v: 150 }, { v: 300 }, { v: 250 }, { v: 400 }, { v: 350 }],
  },
  {
    path: '/store/dashboard-ui-kit',
    visitors: 2984,
    uniquePageVisits: 2245,
    bounceRate: '58.76%',
    chartData: [{ v: 150 }, { v: 300 }, { v: 250 }, { v: 400 }, { v: 350 }, { v: 200 }],
  },
  {
    path: '/store/webflow-cards',
    visitors: 2440,
    uniquePageVisits: 1789,
    bounceRate: '30.55%',
    chartData: [{ v: 300 }, { v: 250 }, { v: 400 }, { v: 350 }, { v: 200 }, { v: 150 }],
  },
  {
    path: '/store/sates/analytics',
    visitors: 1962,
    uniquePageVisits: 1694,
    bounceRate: '25.87%',
    chartData: [{ v: 250 }, { v: 400 }, { v: 350 }, { v: 200 }, { v: 150 }, { v: 300 }],
  },
];

export default function MostVisitedPagesCard() {
  const [timeframe, setTimeframe] = useState('Year'); // Week, Month, Year

  return (
    <Card title="Most Visited Pages">
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Page Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visitors
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unique Page Visits
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bounce Rate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockPagesData.map((page, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {page.path}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {page.visitors}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {page.uniquePageVisits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {page.bounceRate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-24 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={page.chartData}>
                      <Area type="monotone" dataKey="v" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
