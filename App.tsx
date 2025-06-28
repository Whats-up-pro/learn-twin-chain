import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ModulePage from './pages/ModulePage';
import AiTutorPage from './pages/AiTutorPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import EmployerDashboardPage from './pages/EmployerDashboardPage';
import { Toaster } from 'react-hot-toast';
import { useAppContext } from './contexts/AppContext';
import { UserRole } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: UserRole[] }> = ({ children, allowedRoles }) => {
  const { role } = useAppContext();
  if (!role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) {
    // Redirect về dashboard đúng role
    if (role === UserRole.TEACHER) return <Navigate to="/teacher" replace />;
    if (role === UserRole.EMPLOYER) return <Navigate to="/employer" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { learnerProfile, updateLearnerProfile, role } = useAppContext();
  const location = useLocation();
  
  // Check localStorage on mount to restore session
  useEffect(() => {
    const savedProfile = localStorage.getItem('learnerProfile');
    if (savedProfile && !learnerProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        updateLearnerProfile(profile);
      } catch (error) {
        console.error('Error parsing saved profile:', error);
        localStorage.removeItem('learnerProfile');
      }
    }
  }, []); // Remove dependencies to avoid infinite loop

  const isLoggedIn = Boolean(learnerProfile && learnerProfile.did);
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="flex flex-col min-h-screen">
      {!hideNavbar && <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />}
      <Toaster position="top-center" reverseOrder={false} />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <Routes>
          <Route path="/login" element={
            isLoggedIn ? <Navigate to={role === UserRole.TEACHER ? "/teacher" : role === UserRole.EMPLOYER ? "/employer" : "/dashboard"} replace /> : <LoginPage />
          } />
          <Route path="/register" element={
            isLoggedIn ? <Navigate to={role === UserRole.TEACHER ? "/teacher" : role === UserRole.EMPLOYER ? "/employer" : "/dashboard"} replace /> : <RegisterPage />
          } />
          <Route path="/" element={<Navigate to={isLoggedIn ? (role === UserRole.TEACHER ? "/teacher" : role === UserRole.EMPLOYER ? "/employer" : "/dashboard") : "/login"} />} />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
              <TeacherDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/employer" element={
            <ProtectedRoute allowedRoles={[UserRole.EMPLOYER]}>
              <EmployerDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/module/:moduleId" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <ModulePage />
            </ProtectedRoute>
          } />
          <Route path="/tutor" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <AiTutorPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            isLoggedIn ? <ProfilePage /> : <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to={isLoggedIn ? (role === UserRole.TEACHER ? "/teacher" : role === UserRole.EMPLOYER ? "/employer" : "/dashboard") : "/login"} />} />
        </Routes>
      </main>
      <footer className="bg-slate-800 text-white text-center p-4 shadow-md">
        © 2025 LearnTwinChain. Empowering Learners.
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <HashRouter>
    <AppContent />
  </HashRouter>
);

export default App;
