import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ModulePage from './pages/ModulePage';
import AiTutorPage from './pages/AiTutorPage';
import ProfilePage from './pages/ProfilePage';
import EmployerDashboardPage from './pages/EmployerDashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Toaster position="top-center" reverseOrder={false} />
        <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<RoleSelectionPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/module/:moduleId" element={<ModulePage />} />
            <Route path="/tutor" element={<AiTutorPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/employer" element={<EmployerDashboardPage />} />
            <Route path="/teacher" element={<TeacherDashboardPage />} />
          </Routes>
        </main>
        <footer className="bg-slate-800 text-white text-center p-4 shadow-md">
          © 2025 LearnTwinChain. Empowering Learners.
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
