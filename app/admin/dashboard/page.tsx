"use client";

import DashboardLayout from './DashboardLayout';
import StatsOverview from './components/StatsOverview';
import SalesAnalyticsCard from './components/SalesAnalyticsCard';
import TrafficSourcesCard from './components/TrafficSourcesCard';
import NewVisitorsCard from './components/NewVisitorsCard';
import SalesViewsCard from './components/SalesViewsCard';
import ChargingAnalysisCard from './components/ChargingAnalysisCard';
import AnalysisCard from './components/AnalysisCard';
import MostVisitedPagesCard from './components/MostVisitedPagesCard';
import SocialMediaTrafficCard from './components/SocialMediaTrafficCard'; // Import the new component

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
      <StatsOverview />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <SalesAnalyticsCard />
        <TrafficSourcesCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <NewVisitorsCard />
        <SalesViewsCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ChargingAnalysisCard />
        <AnalysisCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <MostVisitedPagesCard />
        <SocialMediaTrafficCard />
      </div>
    </DashboardLayout>
  );
}

