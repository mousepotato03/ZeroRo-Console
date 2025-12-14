import React from 'react';
import Card from '@/app/components/Card';

interface SocialMediaData {
  network: string;
  visitors: number;
  percentage: number;
}

const mockSocialMedia: SocialMediaData[] = [
  { network: 'Facebook', visitors: 3540, percentage: 80 },
  { network: 'Twitter', visitors: 2245, percentage: 60 },
  { network: 'Linkedin', visitors: 1842, percentage: 50 },
  { network: 'Youtube', visitors: 1748, percentage: 45 },
  { network: 'GooglePlus', visitors: 262, percentage: 10 },
];

export default function SocialMediaTrafficCard() {
  return (
    <Card title="Social Media Traffic">
      <div className="space-y-4">
        {mockSocialMedia.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-24 text-sm font-medium text-gray-700">{item.network}</div>
            <div className="w-20 text-sm text-gray-500 mr-4">{item.visitors}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
