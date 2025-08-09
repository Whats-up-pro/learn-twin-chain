/**
 * Main Dashboard Page with Authentication and Wallet Integration
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { courseService } from '../services/courseService';
import WalletConnection from '../components/Wallet/WalletConnection';
import AuthModal from '../components/Auth/AuthModal';

// Import legacy components for backward compatibility
import StudentTwinOverview from '../components/StudentTwinOverview';
import SystemStatusCard from '../components/SystemStatusCard';

export default function Dashboard() {
  const { 
    isAuthenticated, 
    isEmailVerified, 
    hasConnectedWallet, 
    user,
    canCreateCourse,
    canViewAnalytics 
  } = useAuth();
  
  const [enrollments, setEnrollments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [enrollmentsData, progressData] = await Promise.all([
        courseService.getMyEnrollments(),
        courseService.getMyProgress()
      ]);
      
      setEnrollments(enrollmentsData.enrollments || []);
      setProgress(progressData.progress || []);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to LearnTwinChain
            </h1>
            <p className="text-gray-600 mb-6">
              Your personalized learning journey with blockchain-verified achievements
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🎯 Key Features
            </h2>
            <div className="space-y-3 text-left">
              <div className="flex items-center">
                <span className="mr-3">🤖</span>
                <span>AI-powered Digital Twin tracks your learning progress</span>
              </div>
              <div className="flex items-center">
                <span className="mr-3">🏆</span>
                <span>Earn NFT certificates for your achievements</span>
              </div>
              <div className="flex items-center">
                <span className="mr-3">🔗</span>
                <span>Blockchain-verified credentials</span>
              </div>
              <div className="flex items-center">
                <span className="mr-3">📚</span>
                <span>Personalized learning recommendations</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAuthPrompt(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg"
          >
            Get Started - Sign Up Free
          </button>

          <p className="mt-4 text-sm text-gray-500">
            Already have an account?{' '}
            <button
              onClick={() => setShowAuthPrompt(true)}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>

        <AuthModal
          isOpen={showAuthPrompt}
          onClose={() => setShowAuthPrompt(false)}
          defaultTab="register"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="mt-1 text-gray-600">
                {user?.role === 'student' ? 'Continue your learning journey' : 'Manage your courses and students'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {!isEmailVerified && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  ⚠️ Verify Email
                </span>
              )}
              {!hasConnectedWallet && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                  🔗 Connect Wallet
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {!isEmailVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Email Verification Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please check your email and click the verification link to access all features.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connection Prompt */}
      {isEmailVerified && !hasConnectedWallet && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Connect Your Wallet to Get Started
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Connect your MetaMask wallet to earn NFT certificates and access blockchain features.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Learning Overview */}
          {user?.role === 'student' && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Your Learning Progress
                </h3>
                
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : enrollments.length > 0 ? (
                  <div className="space-y-4">
                    {enrollments.slice(0, 3).map((enrollment, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {enrollment.course?.title || 'Course'}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {enrollment.enrollment?.completion_percentage?.toFixed(0) || 0}% complete
                            </p>
                          </div>
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-blue-600 rounded-full"
                              style={{ width: `${enrollment.enrollment?.completion_percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {enrollments.length > 3 && (
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        View all courses ({enrollments.length})
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No enrollments yet</p>
                    <button className="mt-2 text-blue-600 hover:text-blue-500 font-medium">
                      Browse Courses
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Digital Twin Overview (Legacy Component) */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Digital Twin Analytics
              </h3>
              <StudentTwinOverview />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {user?.role === 'student' && (
                  <>
                    <button className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <span className="mr-2">📚</span>
                      Browse Courses
                    </button>
                    <button className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <span className="mr-2">🏆</span>
                      View Achievements
                    </button>
                  </>
                )}
                
                {canCreateCourse && (
                  <>
                    <button className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <span className="mr-2">➕</span>
                      Create Course
                    </button>
                    <button className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <span className="mr-2">👥</span>
                      Manage Students
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Wallet Connection */}
          <WalletConnection required={user?.role === 'student'} />

          {/* System Status */}
          <SystemStatusCard />

          {/* Recent Activity */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  No recent activity
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}