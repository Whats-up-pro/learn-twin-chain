/**
 * Enhanced App.jsx with Authentication and Wallet Integration
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import TopNavigation from './components/Layout/TopNavigation';
import SessionExpirationPopup from './components/Auth/SessionExpirationPopup';
import Dashboard from './pages/Dashboard';
import LearningPath from './pages/LearningPath';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';

// Import existing components
import StudentCard from './components/StudentCard';
import StudentTwinOverview from './components/StudentTwinOverview';
import SystemStatusCard from './components/SystemStatusCard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <TopNavigation />
          
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/learning" element={<LearningPath />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/settings" element={<Settings />} />
              {/* Legacy routes for backward compatibility */}
              <Route path="/students" element={<LegacyStudentView />} />
            </Routes>
          </main>
          
          {/* Global Session Expiration Popup */}
          <SessionExpirationPopup />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Legacy Student View (backward compatibility)
function LegacyStudentView() {
  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Student Digital Twins (Legacy View)
          </h3>
          <div className="mt-4">
            <StudentTwinOverview />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <StudentCard />
        </div>
        <div>
          <SystemStatusCard />
        </div>
      </div>
    </div>
  );
}

export default App;