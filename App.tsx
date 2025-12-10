import React, { useState, useEffect } from 'react';
import { DashboardLayout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Campaigns } from './pages/Campaigns';
import { Analytics } from './pages/Analytics';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';

// Simple Router implementation based on state
type Route = 'landing' | 'login' | 'dashboard' | 'campaigns' | 'analytics' | 'settings' | 'billing';

const App: React.FC = () => {
  // Try to restore session for demo
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route>('landing');

  // Simple navigation handler
  const navigate = (route: Route) => {
    setCurrentRoute(route);
    window.scrollTo(0, 0);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    navigate('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('landing');
  };

  // Render Logic
  if (!isAuthenticated) {
    if (currentRoute === 'login') {
      return <Login onLogin={handleLogin} onBack={() => navigate('landing')} />;
    }
    return <Landing onLoginClick={() => navigate('login')} />;
  }

  const renderContent = () => {
    switch (currentRoute) {
      case 'dashboard': return <Dashboard />;
      case 'campaigns': return <Campaigns />;
      case 'analytics': return <Analytics />;
      case 'billing': 
        return (
           <div className="p-12 text-center text-slate-500">
             <h2 className="text-xl font-bold mb-2">Billing & API Settings</h2>
             <p>This module allows Plan selection (Free vs Plus) and API Key management.</p>
           </div>
        );
      default: return <div className="p-8 text-center text-slate-500">Module under construction</div>;
    }
  };

  return (
    <DashboardLayout 
      activePage={currentRoute} 
      onNavigate={(page) => navigate(page as Route)}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default App;
