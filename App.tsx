import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SessionTimeoutPopup from './components/SessionTimeoutPopup';
import MetaMaskConnectionNotification from './components/MetaMaskConnectionNotification';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardPage from './pages/DashboardPage';
import ModulePage from './pages/ModulePage';
import CourseLearnPage from './pages/CourseLearnPage';
import CourseOverviewPage from './pages/CourseOverviewPage';
import AchievementsPage from './pages/AchievementsPage';
import NFTManagementPage from './pages/NFTManagementPage';
import CertificatesPage from './pages/CertificatesPage';
import RankingPage from './pages/RankingPage';
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
import SettingsPage from './pages/SettingsPage';
import WelcomePage from './pages/WelcomePage';
import SubscriptionPage from './pages/SubscriptionPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import { Toaster } from 'react-hot-toast';
import { useAppContext } from './contexts/AppContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { UserRole } from './types';
import sessionMonitor from './services/sessionMonitorService';
import { achievementService } from './services/achievementService';
import { notificationService } from './services/notificationService';

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

// Component to handle achievement notifications
const AchievementNotificationHandler: React.FC = () => {
  const { learnerProfile } = useAppContext();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!learnerProfile?.did) return;

    // Check for recent achievements every 30 seconds
    const checkAchievements = async () => {
      try {
        const response = await achievementService.getRecentAchievements(1); // Last 1 minute
        if (response && (response as any).recent_achievements) {
          (response as any).recent_achievements.forEach((achievement: any) => {
            // Only show if not already shown (check timestamp)
            const lastShown = localStorage.getItem(`achievement_shown_${achievement.achievement_id}`);
            const earnedAt = new Date(achievement.earned_at).getTime();
            const lastShownTime = lastShown ? parseInt(lastShown) : 0;
            
            if (earnedAt > lastShownTime) {
              notificationService.showAchievementNotification(achievement.title);
              addNotification({
                type: 'achievement',
                title: `🏆 Achievement Unlocked!`,
                message: achievement.description || `You've earned: ${achievement.title}`,
                icon: '🏆'
              });
              
              // Mark as shown
              localStorage.setItem(`achievement_shown_${achievement.achievement_id}`, earnedAt.toString());
            }
          });
        }
      } catch (error) {
        console.warn('Failed to check for recent achievements:', error);
      }
    };

    // Initial check
    checkAchievements();
    
    // Set up interval
    const interval = setInterval(checkAchievements, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [learnerProfile?.did, addNotification]);

  return null; // This component doesn't render anything
};

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { learnerProfile, updateLearnerProfile, role } = useAppContext();
  const location = useLocation();
  
  // Session timeout state
  const [showTimeoutPopup, setShowTimeoutPopup] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  
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

  // Session monitoring effect (optional - won't break app if it fails)
  useEffect(() => {
    // Add a small delay to prevent blocking initial render
    const timeoutId = setTimeout(async () => {
      try {
        // Only monitor if user is logged in
        if (isLoggedIn) {
          console.log('🔍 Initializing session monitoring...');
          
          // Check if backend is available first
          const status = await sessionMonitor.getCurrentStatus();
          if (status?.authenticated) {
            setSessionActive(true);
            console.log('🔍 Starting session monitoring (15-second sessions)...');
            
            sessionMonitor.startMonitoring(
              // On timeout (≤5 seconds remaining)
              (timeLeft: number) => {
                console.log('⏰ Session timeout warning:', timeLeft);
                setTimeRemaining(timeLeft);
                setShowTimeoutPopup(true);
              },
              // On session expired
              () => {
                console.log('❌ Session expired, forcing logout');
                setSessionActive(false);
                setShowTimeoutPopup(false);
                handleForceLogout();
              },
              // On session refreshed
              () => {
                console.log('✅ Session was refreshed');
                setShowTimeoutPopup(false);
              }
            );
          } else {
            console.log('ℹ️ No active session to monitor');
            setSessionActive(false);
          }
        } else {
          // Stop monitoring if not logged in
          console.log('⏹️ User not logged in');
          sessionMonitor.stopMonitoring();
          setSessionActive(false);
        }
      } catch (error) {
        console.warn('⚠️ Session monitoring unavailable:', error instanceof Error ? error.message : 'Unknown error');
        // Don't fail the app if session monitoring fails
        setSessionActive(false);
      }
    }, 1000); // 1 second delay

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      sessionMonitor.stopMonitoring();
    };
  }, [isLoggedIn]);

  const handleStayLearning = async () => {
    console.log('📚 User chose to stay learning...');
    const success = await sessionMonitor.refreshSession();
    if (success) {
      setShowTimeoutPopup(false);
      console.log('✅ Session extended for 15 more seconds');
    } else {
      console.error('❌ Failed to extend session');
      await handleLogout();
    }
  };

  const handleLogout = async () => {
    console.log('🚪 User chose to logout...');
    await sessionMonitor.logout();
    setSessionActive(false);
    setShowTimeoutPopup(false);
    handleForceLogout();
  };

  const handleForceLogout = () => {
    // Clear all local data
    localStorage.removeItem('learnerProfile');
    localStorage.removeItem('userRole');
    localStorage.clear();
    
    // Force redirect to login
    window.location.href = '/login';
  };
  const hideNavbarAndSidebar = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/verify-email' || location.pathname === '/verify-email-sent' || location.pathname === '/welcome';
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
        {!hideNavbarAndSidebar && (
          <Header 
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            showSidebar={showSidebar}
          />
        )}
        
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
        
        {/* Achievement Notification Handler */}
        <AchievementNotificationHandler />
        
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
          <Route path="/" element={<Navigate to={isLoggedIn ? (role === UserRole.TEACHER ? "/teacher" : role === UserRole.EMPLOYER ? "/employer" : "/dashboard") : "/welcome"} />} />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <ErrorBoundary>
                <DashboardPage />
              </ErrorBoundary>
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
          <Route path="/course/:courseId" element={
            isLoggedIn ? <CourseOverviewPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/course/:courseId/learn" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <CourseLearnPage />
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
          <Route path="/certificates" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <CertificatesPage />
            </ProtectedRoute>
          } />
          <Route path="/ranking" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <RankingPage />
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
            isLoggedIn ? <CoursesPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/profile" element={
            isLoggedIn ? <ProfilePage /> : <Navigate to="/login" replace />
          } />
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={[UserRole.LEARNER]}>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/subscription" element={
            isLoggedIn ? <SubscriptionPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/subscription/payment/success" element={
            isLoggedIn ? <PaymentSuccessPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/payments" element={
            isLoggedIn ? <PaymentHistoryPage /> : <Navigate to="/login" replace />
          } />
          <Route path="/welcome" element={
            isLoggedIn ? <Navigate to={role === UserRole.TEACHER ? "/teacher" : role === UserRole.EMPLOYER ? "/employer" : "/dashboard"} replace /> : <WelcomePage />
          } />
          <Route path="*" element={<Navigate to={isLoggedIn ? (role === UserRole.TEACHER ? "/teacher" : role === UserRole.EMPLOYER ? "/employer" : "/dashboard") : "/welcome"} />} />
        </Routes>
        </main>
        
        {/* Footer */}
        {!hideNavbarAndSidebar && (
          <footer className="bg-slate-800 text-white text-center p-4 shadow-md">
            © 2025 LearnTwinChain. Empowering Learners.
          </footer>
        )}

        {/* Session Timeout Popup */}
        {sessionActive && showTimeoutPopup && (
          <SessionTimeoutPopup
            isVisible={showTimeoutPopup}
            timeRemaining={timeRemaining}
            onStayLearning={handleStayLearning}
            onLogout={handleLogout}
            onClose={() => setShowTimeoutPopup(false)}
          />
        )}

        {/* MetaMask Connection Notification */}
        <MetaMaskConnectionNotification />
        </div>
      </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  </BrowserRouter>
);

export default App;
