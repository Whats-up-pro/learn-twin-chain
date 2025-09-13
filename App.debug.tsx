import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
// Comment out the SessionTimeoutPopup temporarily for debugging
// import SessionTimeoutPopup from './components/SessionTimeoutPopup';
import DashboardPage from './pages/DashboardPage';
import ModulePage from './pages/ModulePage';
import VideoLearningPage from './pages/VideoLearningPage';
import CourseLearnPage from './pages/CourseLearnPage';
import AchievementsPage from './pages/AchievementsPage';
import NFTManagementPage from './pages/NFTManagementPage';
import AiTutorPage from './pages/AiTutorPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VerifyEmailSentPage from './pages/VerifyEmailSentPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import EmployerDashboardPage from './pages/EmployerDashboardPage';
import SearchPage from './pages/SearchPage';
import CoursesPage from './pages/CoursesPage';
import { Toaster } from 'react-hot-toast';
import { useAppContext } from './contexts/AppContext';
import { UserRole } from './types';
// Comment out session monitor for debugging
// import sessionMonitor from './services/sessionMonitorService';

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
  
  console.log('🚀 App debug version loaded');
  
  // Check localStorage on mount to restore session
  useEffect(() => {
    const savedProfile = localStorage.getItem('learnerProfile');
    const savedRole = localStorage.getItem('userRole');
    if (savedProfile && !learnerProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        updateLearnerProfile(profile, savedRole as UserRole);
      } catch (error) {
        console.error('Error parsing saved profile:', error);
        localStorage.removeItem('learnerProfile');
        localStorage.removeItem('userRole');
      }
    }
  }, [learnerProfile, updateLearnerProfile]);

  // Define isLoggedIn before using it
  const isLoggedIn = Boolean(learnerProfile && learnerProfile.did);
  console.log('🔍 isLoggedIn:', isLoggedIn, 'learnerProfile:', learnerProfile?.email);

  // Session monitoring disabled for debugging
  console.log('⚠️ Session monitoring disabled for debugging');

  const hideNavbarAndSidebar = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/verify-email' || location.pathname === '/verify-email-sent';
  const showSidebar = isLoggedIn && role === UserRole.LEARNER && !hideNavbarAndSidebar;

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && showSidebar) { // md breakpoint
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showSidebar]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar for learners */}
      {showSidebar && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Header */}
        <Header 
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          showSidebar={showSidebar}
        />
        
        {/* Toast notifications */}
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e40af',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500'
            },
            success: {
              style: {
                background: '#10b981',
              }
            },
            error: {
              style: {
                background: '#ef4444',
              }
            }
          }}
        />
        
        {/* Main content */}
        <main className={`
          flex-1 transition-all duration-300
          ${hideNavbarAndSidebar 
            ? 'p-0' 
            : showSidebar && isSidebarOpen 
              ? 'md:ml-0 p-4 md:p-6 lg:p-8' 
              : 'p-4 md:p-6 lg:p-8'
          }
        `}>
        <Routes>
          <Route path="/login" element={
            isLoggedIn ? <Navigate to={role === UserRole.TEACHER ? "/teacher" : role === UserRole.EMPLOYER ? "/employer" : "/dashboard"} replace /> : <LoginPage />
          } />
          <Route path="/register" element={
            isLoggedIn ? <Navigate to={role === UserRole.TEACHER ? "/teacher" : role === UserRole.EMPLOYER ? "/employer" : "/dashboard"} replace /> : <RegisterPage />
          } />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />
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
          <Route path="/course/:courseId/learn" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <CourseLearnPage />
            </ProtectedRoute>
          } />
          <Route path="/course/:courseId/video" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <VideoLearningPage />
            </ProtectedRoute>
          } />
          <Route path="/achievements" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <AchievementsPage />
            </ProtectedRoute>
          } />
          <Route path="/nfts" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <NFTManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/tutor" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <AiTutorPage />
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            isLoggedIn ? <SearchPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/courses" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <CoursesPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            isLoggedIn ? <ProfilePage /> : <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to={isLoggedIn ? (role === UserRole.TEACHER ? "/teacher" : role === UserRole.EMPLOYER ? "/employer" : "/dashboard") : "/login"} />} />
        </Routes>
        </main>
        
        {/* Footer */}
        {!hideNavbarAndSidebar && (
          <footer className="bg-slate-800 text-white text-center p-4 shadow-md">
            © 2025 LearnTwinChain. Empowering Learners.
          </footer>
        )}

        {/* Session Timeout Popup - DISABLED FOR DEBUGGING */}
        {/* 
        {sessionActive && showTimeoutPopup && (
          <SessionTimeoutPopup
            isVisible={showTimeoutPopup}
            timeRemaining={timeRemaining}
            onStayLearning={handleStayLearning}
            onLogout={handleLogout}
            onClose={() => setShowTimeoutPopup(false)}
          />
        )}
        */}
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded text-xs">
          DEBUG MODE - Session monitoring disabled
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
