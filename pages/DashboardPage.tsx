import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import enrollmentService, { EnrollmentData } from '../services/enrollmentService';
import AutoSlidingBanner from '../components/AutoSlidingBanner';
import {
  TrophyIcon, 
  CheckCircleIcon,
  EyeIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon,
  SparklesIcon,
  PlayIcon,
  ClockIcon,
  ChartBarIcon,
  BookOpenIcon,
  UserIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Nft } from '../types';
import { blockchainService } from '../services/blockchainService';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const { learnerProfile, digitalTwin, nfts, learningModules, achievements, courses } = useAppContext();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [realEnrollments, setRealEnrollments] = useState<EnrollmentData[]>([]);
  // const [progressData, setProgressData] = useState<any[]>([]); // Currently unused
  const [dashboardStats, setDashboardStats] = useState({
    overallProgress: 0,
    completedModules: 0,
    totalModules: 0,
    learningStreak: 0,
    totalEnrollments: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nftTab, setNftTab] = useState<'owned'|'minting'|'all'>('owned');
  const navigate = useNavigate();

  // Add loading state and error handling
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Show loading for at least 1 second

    return () => clearTimeout(timer);
  }, []);

  // Load real dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!learnerProfile?.did) {
      console.log('DashboardPage: No learner profile DID, skipping data load');
      return;
    }
    
    try {
      setLoadingStats(true);
      setError(null);
      console.log('DashboardPage: Loading dashboard data...');
      
      // Load real enrollment and progress data with timeout
      const [enrollmentResponse, progressResponse] = await Promise.allSettled([
        apiService.getUserEnrollments(),
        apiService.getMyProgress()
      ]);
      
      let enrollments: EnrollmentData[] = [];
      if (enrollmentResponse.status === 'fulfilled' && 
          (enrollmentResponse.value as any)?.success && 
          (enrollmentResponse.value as any)?.enrollments) {
        enrollments = (enrollmentResponse.value as any).enrollments;
        setRealEnrollments(enrollments);
        console.log('DashboardPage: Loaded enrollments:', enrollments.length);
      } else {
        console.warn('DashboardPage: Failed to load enrollments:', enrollmentResponse);
      }
      
      let progress: any[] = [];
      if (progressResponse.status === 'fulfilled' && 
          (progressResponse.value as any)?.progress) {
        progress = (progressResponse.value as any).progress;
        console.log('DashboardPage: Loaded progress data:', progress.length);
      } else {
        console.warn('DashboardPage: Failed to load progress:', progressResponse);
      }
      
      // Calculate real statistics with safe fallbacks
      const activeEnrollments = enrollments.filter(e => e?.enrollment?.status === 'active');
      const completedEnrollments = enrollments.filter(e => e?.enrollment?.status === 'completed');
      
      // Calculate overall progress (average of all enrolled courses)
      const totalProgress = activeEnrollments.reduce((sum, e) => {
        return sum + (e?.enrollment?.completion_percentage || 0);
      }, 0) + completedEnrollments.reduce((sum) => sum + 100, 0);
      const avgProgress = enrollments.length > 0 ? totalProgress / enrollments.length : 0;
      
      // Count completed modules from progress data
      const completedModules = progress.reduce((count, p) => {
        return count + (p?.completed_modules?.length || 0);
      }, 0);
      
      // Estimate total modules (this could be improved with actual data)
      const totalModules = progress.reduce((count, p) => {
        return count + (p?.total_modules || 0);
      }, 0);
      
      // Calculate learning streak (simplified - could be improved)
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) { // Check last 30 days
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toDateString();
        
        // Check if user has any activity on this date
        const hasActivity = enrollments.some(e => 
          e?.enrollment?.enrolled_at && 
          new Date(e.enrollment.enrolled_at).toDateString() === dateStr ||
          (e?.enrollment?.completed_at && new Date(e.enrollment.completed_at).toDateString() === dateStr)
        );
        
        if (hasActivity) {
          streak++;
        } else if (i === 0) {
          // If no activity today, streak is 0
          break;
        }
      }
      
      setDashboardStats({
        overallProgress: Math.min(Math.max(avgProgress, 0), 100), // Clamp between 0-100
        completedModules: Math.max(completedModules, 0),
        totalModules: Math.max(totalModules, 0),
        learningStreak: Math.min(Math.max(streak, 0), 7), // Cap at 7 days for display
        totalEnrollments: Math.max(enrollments.length, 0)
      });
      
      console.log('DashboardPage: Dashboard stats calculated:', {
        overallProgress: avgProgress,
        completedModules,
        totalModules,
        learningStreak: streak,
        totalEnrollments: enrollments.length
      });
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
      
      // Fallback to digital twin data with safe defaults
      const totalModules = learningModules?.length || 0;
      const completedModulesCount = digitalTwin?.checkpoints?.length || 0;
      const overallProgress = totalModules > 0 ? (completedModulesCount / totalModules) * 100 : 0;
      
      setDashboardStats({
        overallProgress: Math.min(Math.max(overallProgress, 0), 100),
        completedModules: Math.max(completedModulesCount, 0),
        totalModules: Math.max(totalModules, 0),
        learningStreak: 0, // Default value
        totalEnrollments: 0
      });
    } finally {
      setLoadingStats(false);
    }
  }, [learnerProfile?.did, learningModules, digitalTwin]);
  
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  console.log('DashboardPage: learnerProfile:', learnerProfile);
  console.log('DashboardPage: digitalTwin:', digitalTwin);
  console.log('DashboardPage: nfts:', nfts);
  console.log('DashboardPage: learningModules:', learningModules);

  // Show loading screen while context is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Dashboard...</h2>
          <p className="text-gray-600">Please wait while we prepare your learning dashboard.</p>
        </div>
      </div>
    );
  }

  // Show error state if there's a critical error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add safety checks for context data with better error handling
  const safeLearnerProfile = learnerProfile || { did: '', name: 'User', avatarUrl: '' };
  const safeDigitalTwin = digitalTwin || { 
    checkpoints: [], 
    knowledge: {}, 
    skills: { problemSolving: 0, logicalThinking: 0, selfLearning: 0 },
    behavior: { learningPatterns: [], preferences: {} }
  };
  const safeLearningModules = learningModules || [];
  const safeNfts = nfts || [];
  const safeAchievements = achievements || [];
  
  // Legacy fallback values with safe defaults
  const totalModules = dashboardStats.totalModules || safeLearningModules.length;
  const completedModulesCount = dashboardStats.completedModules || safeDigitalTwin.checkpoints.length;
  const overallProgress = dashboardStats.overallProgress || (totalModules > 0 ? (completedModulesCount / totalModules) * 100 : 0);

  const avatarUrl = safeLearnerProfile.avatarUrl && safeLearnerProfile.avatarUrl.trim() !== ''
    ? safeLearnerProfile.avatarUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(safeLearnerProfile.name)}&background=0ea5e9&color=fff&size=80`;

  const displayName = safeLearnerProfile.name || 'User';
  const displayDid = safeLearnerProfile.did || '';

  const handleVerifyNft = (nft: Nft) => {
    setIsVerificationModalOpen(true);
    toast.success(`Verifying NFT: ${nft.name}`);
  };

  const handleStartLearning = async (moduleId: string) => {
    const isConnected = await blockchainService.checkWalletConnection();
    if (!isConnected) {
      toast.error('Please connect your MetaMask wallet before learning to enable NFT minting.');
      return;
    }
    navigate(`/module/${moduleId}`);
  };

  // Helper function to get intelligent course selection
  const getRecommendedCourse = () => {
    const incompleteEnrollments = realEnrollments.filter(e => 
      e.enrollment.status === 'active' && 
      e.enrollment.completion_percentage < 100 &&
      e.course
    );

    if (incompleteEnrollments.length === 0) {
      return null;
    }

    // Intelligent selection logic:
    // 1. Prefer courses with some progress (started but not finished)
    // 2. If all are 0% or all have progress, pick randomly
    const startedCourses = incompleteEnrollments.filter(e => e.enrollment.completion_percentage > 0);
    const notStartedCourses = incompleteEnrollments.filter(e => e.enrollment.completion_percentage === 0);

    let coursesToChooseFrom = incompleteEnrollments;
    
    // If there are started courses, prefer them (70% chance)
    if (startedCourses.length > 0 && Math.random() < 0.7) {
      coursesToChooseFrom = startedCourses;
    }
    // If there are not started courses and no started courses, prefer them (80% chance)
    else if (notStartedCourses.length > 0 && startedCourses.length === 0 && Math.random() < 0.8) {
      coursesToChooseFrom = notStartedCourses;
    }

    // Select random course from the chosen subset
    const randomIndex = Math.floor(Math.random() * coursesToChooseFrom.length);
    return coursesToChooseFrom[randomIndex];
  };

  const handleContinueLearning = async () => {
    const isConnected = await blockchainService.checkWalletConnection();
    if (!isConnected) {
      toast.error('Please connect your MetaMask wallet before continuing.');
      return;
    }
    
    // Use intelligent course selection
    const selectedEnrollment = getRecommendedCourse();
    
    if (selectedEnrollment && selectedEnrollment.course) {
      const course = selectedEnrollment.course;
      const progress = Math.round(selectedEnrollment.enrollment.completion_percentage || 0);
      
      // Navigate to the course learning page
      navigate(`/course/${course.course_id}/learn`);
      
      // Show informative toast message based on progress
      if (progress === 0) {
        toast.success(`Starting: ${course.title} 🚀`);
      } else if (progress < 25) {
        toast.success(`Getting started: ${course.title} (${progress}% complete) 📖`);
      } else if (progress < 50) {
        toast.success(`Making progress: ${course.title} (${progress}% complete) 📚`);
      } else if (progress < 75) {
        toast.success(`Almost there: ${course.title} (${progress}% complete) 🎯`);
      } else {
        toast.success(`Finishing up: ${course.title} (${progress}% complete) 🏁`);
      }
      
      console.log(`Continue Learning: Selected course "${course.title}" with ${progress}% progress`);
    } else {
      // Check if user has any enrollments at all
      if (realEnrollments.length === 0) {
        toast.success('No courses enrolled yet. Browse courses to start learning! 📖');
        navigate('/courses');
      } else {
        // All courses are completed
        toast.success('🎉 Congratulations! All enrolled courses completed! Browse more courses to continue learning.');
        navigate('/courses');
      }
    }
  };

  // const handleOpenTutor = () => {
  //   navigate('/tutor');
  // };

  const handleOpenProfile = () => {
    navigate('/profile');
  };

  // Derived views (kept minimal now; lists compute on demand)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-semibold">Dashboard Error</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Auto-Sliding Banner */}
        <AutoSlidingBanner />

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center space-x-6">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-24 w-24 rounded-2xl border-4 border-white/20 shadow-xl"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(safeLearnerProfile.name)}&background=0ea5e9&color=fff&size=96`;
                }}
              />
              <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                <div className="h-3 w-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">Welcome back, {displayName}! 👋</h1>
              <p className="text-blue-100 text-lg">Ready to continue your learning journey?</p>
              <p className="text-blue-200 text-sm mt-1">DID: <span className="font-mono">{displayDid}</span></p>
            </div>
            <div className="hidden lg:block">
              <div className="text-right animate-fade-in">
                <div className="text-3xl font-bold">{overallProgress.toFixed(0)}%</div>
                <div className="text-blue-200">Overall Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <button
            onClick={handleContinueLearning}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <PlayIcon className="h-8 w-8" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold">
                  {(() => {
                    const incompleteCount = realEnrollments.filter(e => 
                      e.enrollment.status === 'active' && 
                      e.enrollment.completion_percentage < 100
                    ).length;
                    
                    if (incompleteCount === 0 && realEnrollments.length === 0) {
                      return 'Start Learning';
                    } else if (incompleteCount === 0) {
                      return 'Browse Courses';
                    } else {
                      return 'Continue Learning';
                    }
                  })()}
                </div>
                <div className="text-blue-100">
                  {(() => {
                    const incompleteCount = realEnrollments.filter(e => 
                      e.enrollment.status === 'active' && 
                      e.enrollment.completion_percentage < 100
                    ).length;
                    
                    if (incompleteCount === 0 && realEnrollments.length === 0) {
                      return 'Begin your journey';
                    } else if (incompleteCount === 0) {
                      return 'Find new courses';
                    } else {
                      return `Resume your progress (${incompleteCount} active)`;
                    }
                  })()}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/achievements')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <TrophyIcon className="h-8 w-8" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold">Achievements</div>
                <div className="text-yellow-100">View your trophies</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/nfts')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <SparklesIcon className="h-8 w-8" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold">NFT Collection</div>
                <div className="text-purple-100">Manage your NFTs</div>
              </div>
            </div>
          </button>

          <button
            onClick={handleOpenProfile}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <UserIcon className="h-8 w-8" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold">Profile</div>
                <div className="text-purple-100">Manage your data</div>
              </div>
            </div>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Overall Progress" 
            value={loadingStats ? '...' : `${overallProgress.toFixed(0)}%`} 
            icon={<ArrowTrendingUpIcon className="h-8 w-8 text-blue-500"/>}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard 
            title="Modules Completed" 
            value={loadingStats ? '...' : `${completedModulesCount}${totalModules > 0 ? `/${totalModules}` : ''}`} 
            icon={<AcademicCapIcon className="h-8 w-8 text-green-500"/>}
            gradient="from-green-500 to-green-600"
          />
          <StatCard 
            title="NFTs Earned" 
            value={`${safeNfts.length}`} 
            icon={<SparklesIcon className="h-8 w-8 text-yellow-500"/>}
            gradient="from-yellow-500 to-yellow-600"
          />
          <StatCard 
            title="Learning Streak" 
            value={loadingStats ? '...' : `${dashboardStats.learningStreak} days`} 
            icon={<FireIcon className="h-8 w-8 text-orange-500"/>}
            gradient="from-orange-500 to-red-500"
          />
        </div>

        {/* Your Learning Path - Real Enrolled Courses */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <FireIcon className="h-8 w-8 text-orange-500 mr-3" />
              Your Learning Path
            </h2>
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {loadingStats ? 'Loading...' : realEnrollments.length > 0 ? `${realEnrollments.length} enrolled courses` : 'No enrollments yet'}
            </div>
          </div>
          
          {loadingStats ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your learning path...</p>
            </div>
          ) : realEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {realEnrollments.map(enrollmentItem => {
                if (!enrollmentItem.course) return null;
                
                const course = enrollmentItem.course;
                const enrollment = enrollmentItem.enrollment;
                const progress = Math.round(enrollment.completion_percentage || 0);
                const isCompleted = progress >= 100;
                const isStarted = progress > 0;
                
                return (
                  <div key={course.course_id} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">{course.title}</h3>
                      {isCompleted && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircleIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Complete</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 mb-6 line-clamp-2">{course.description}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm font-bold text-gray-800">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              isCompleted ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              isStarted ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                              'bg-gradient-to-r from-gray-400 to-gray-600'
                            }`}
                            style={{ width: `${Math.max(progress, 2)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {course.metadata.estimated_hours || 0}h
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${enrollmentService.getDifficultyColor(course.metadata.difficulty_level)}`}>
                          {course.metadata.difficulty_level}
                        </span>
                        {isStarted && (
                          <span className="flex items-center text-blue-600">
                            <StarIcon className="h-4 w-4 mr-1" />
                            {progress}% done
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => navigate(`/course/${course.course_id}/learn`)}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : isStarted
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                            : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {isCompleted ? '✓ Review Course' : isStarted ? 'Continue Learning' : 'Start Learning'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Fallback to old learning modules if no real enrollments
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeLearningModules.slice(0, 3).map(module => {
                const moduleKnowledge = safeDigitalTwin.knowledge[module.title] ?? 0;
                const isCompleted = safeDigitalTwin.checkpoints.some(cp => cp.moduleId === module.id);
                const isStarted = moduleKnowledge > 0;
                return (
                  <div key={module.id} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">{module.title}</h3>
                      {isCompleted && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircleIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Complete</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 mb-6 line-clamp-2">{module.description}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm font-bold text-gray-800">{isCompleted ? 100 : Math.round(moduleKnowledge * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              isCompleted ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              isStarted ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                              'bg-gradient-to-r from-gray-400 to-gray-600'
                            }`}
                            style={{ width: `${isCompleted ? 100 : moduleKnowledge * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {module.estimatedTime}
                        </span>
                        {isStarted && (
                          <span className="flex items-center text-blue-600">
                            <StarIcon className="h-4 w-4 mr-1" />
                            {isCompleted ? '100% done' : `${Math.round(moduleKnowledge * 100)}% done`}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleStartLearning(module.id)}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : isStarted
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                            : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {isCompleted ? '✓ Completed' : isStarted ? 'Continue Learning' : 'Start Learning'}
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {/* Browse More Courses Card */}
              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-dashed border-blue-200 hover:border-blue-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <BookOpenIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Browse More Courses</h3>
                  <p className="text-gray-600 mb-6">Discover new learning opportunities</p>
                  <button
                    onClick={() => navigate('/courses')}
                    className="w-full py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Browse Courses
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Skills & Knowledge Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skills Development - Based on Course Skills */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <ChartBarIcon className="h-7 w-7 text-green-500 mr-3" />
              Skills Development
            </h2>
            
            {loadingStats ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Loading skills...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Calculate skills based on enrolled courses */}
                {(() => {
                  const skillsMap = new Map();
                  
                  // Extract skills from enrolled courses
                  realEnrollments.forEach(enrollmentItem => {
                    if (enrollmentItem.course?.metadata?.skills_taught) {
                      enrollmentItem.course.metadata.skills_taught.forEach(skill => {
                        const progress = enrollmentItem.enrollment.completion_percentage / 100;
                        const currentValue = skillsMap.get(skill) || 0;
                        skillsMap.set(skill, Math.max(currentValue, progress));
                      });
                    }
                  });
                  
                  // Add default skills if no enrollments or fallback to digital twin data
                  if (skillsMap.size === 0) {
                    return (
                      <>
                        <SkillBar 
                          name="Problem Solving" 
                          value={safeDigitalTwin.skills.problemSolving} 
                          color="from-green-400 to-green-600"
                          icon="🧩"
                        />
                        <SkillBar 
                          name="Logical Thinking" 
                          value={safeDigitalTwin.skills.logicalThinking} 
                          color="from-blue-400 to-blue-600"
                          icon="🧠"
                        />
                        <SkillBar 
                          name="Self Learning" 
                          value={safeDigitalTwin.skills.selfLearning} 
                          color="from-purple-400 to-purple-600"
                          icon="📚"
                        />
                      </>
                    );
                  }
                  
                  const skills = Array.from(skillsMap.entries()).slice(0, 6); // Limit to 6 skills
                  const skillIcons: Record<string, string> = {
                    'programming': '💻',
                    'javascript': '⚡',
                    'python': '🐍',
                    'web development': '🌍',
                    'blockchain': '🔗',
                    'data science': '📈',
                    'problem solving': '🧩',
                    'critical thinking': '🧠',
                    'communication': '💬',
                    'leadership': '👨‍💼',
                    'teamwork': '🤝',
                    'creativity': '🎨'
                  };
                  
                  const skillColors = [
                    'from-green-400 to-green-600',
                    'from-blue-400 to-blue-600',
                    'from-purple-400 to-purple-600',
                    'from-yellow-400 to-yellow-600',
                    'from-red-400 to-red-600',
                    'from-indigo-400 to-indigo-600'
                  ];
                  
                  return skills.map(([skill, value], index) => {
                    const normalizedSkill = skill.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
                    const icon = skillIcons[normalizedSkill] || '🎆';
                    const color = skillColors[index % skillColors.length];
                    
                    return (
                      <SkillBar 
                        key={skill}
                        name={skill.charAt(0).toUpperCase() + skill.slice(1)} 
                        value={value} 
                        color={color}
                        icon={icon}
                      />
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Knowledge Areas - Based on Course Topics */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <BookOpenIcon className="h-7 w-7 text-blue-500 mr-3" />
              Knowledge Areas
            </h2>
            
            {loadingStats ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Loading knowledge areas...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Calculate knowledge areas based on enrolled courses */}
                {(() => {
                  const knowledgeMap = new Map();
                  
                  // Extract learning objectives and topics from enrolled courses
                  realEnrollments.forEach(enrollmentItem => {
                    if (enrollmentItem.course) {
                      const course = enrollmentItem.course;
                      const progress = enrollmentItem.enrollment.completion_percentage / 100;
                      
                      // Use course title as knowledge area
                      knowledgeMap.set(course.title, progress);
                      
                      // Add tags as knowledge areas too
                      if (course.metadata?.tags) {
                        course.metadata.tags.forEach(tag => {
                          const currentValue = knowledgeMap.get(tag) || 0;
                          knowledgeMap.set(tag, Math.max(currentValue, progress));
                        });
                      }
                    }
                  });
                  
                  // Fallback to digital twin knowledge if no real data
                  if (knowledgeMap.size === 0) {
                    return Object.entries(safeDigitalTwin.knowledge).map(([topic, progress]) => (
                      <KnowledgeBar 
                        key={topic}
                        name={topic} 
                        value={progress} 
                      />
                    ));
                  }
                  
                  // Display top knowledge areas
                  const knowledgeAreas = Array.from(knowledgeMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8); // Limit to 8 areas
                  
                  return knowledgeAreas.map(([topic, progress]) => (
                    <KnowledgeBar 
                      key={topic}
                      name={topic} 
                      value={progress} 
                    />
                  ));
                })()}
                
                {realEnrollments.length === 0 && Object.keys(safeDigitalTwin.knowledge).length === 0 && (
                  <div className="text-center py-8">
                    <BookOpenIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Enroll in courses to build your knowledge areas!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <ClockIcon className="h-7 w-7 text-orange-500 mr-3" />
            Recent Activity
          </h2>
          
          {loadingStats ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading recent activity...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Real enrollment activities */}
              {realEnrollments.length > 0 ? (
                realEnrollments
                  .filter(e => e.course)
                  .sort((a, b) => new Date(b.enrollment.enrolled_at).getTime() - new Date(a.enrollment.enrolled_at).getTime())
                  .slice(0, 5)
                  .map((enrollmentItem, index) => {
                    const course = enrollmentItem.course;
                    const enrollment = enrollmentItem.enrollment;
                    if (!course) return null;
                    
                    const progress = Math.round(enrollment.completion_percentage || 0);
                    const isCompleted = progress >= 100;
                    
                    return (
                      <div key={`${course.course_id}-${index}`} className="flex items-center space-x-4 p-4 bg-white/50 rounded-2xl border border-white/20 hover:bg-white/70 transition-all duration-300">
                        <div className={`p-3 rounded-xl ${
                          isCompleted 
                            ? 'bg-green-100'
                            : progress > 0 
                            ? 'bg-blue-100' 
                            : 'bg-gray-100'
                        }`}>
                          {isCompleted ? (
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                          ) : progress > 0 ? (
                            <BookOpenIcon className="h-6 w-6 text-blue-600" />
                          ) : (
                            <ClockIcon className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {isCompleted ? 'Completed' : progress > 0 ? 'In Progress' : 'Enrolled in'} {course.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {isCompleted && enrollment.completed_at 
                              ? `Completed on ${new Date(enrollment.completed_at).toLocaleDateString()}`
                              : `Enrolled on ${new Date(enrollment.enrolled_at).toLocaleDateString()}`
                            } • {course.metadata.difficulty_level}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            isCompleted ? 'text-green-600' : progress > 0 ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {progress}%
                          </div>
                          {!isCompleted && (
                            <button
                              onClick={() => navigate(`/course/${course.course_id}/learn`)}
                              className="text-xs text-blue-600 hover:text-blue-800 transition-colors mt-1"
                            >
                              Continue →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              ) : (
                // Fallback to checkpoint data if no enrollments
                safeDigitalTwin.checkpoints.slice(-3).reverse().map((checkpoint: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-white/50 rounded-2xl border border-white/20 hover:bg-white/70 transition-all duration-300">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Completed {checkpoint.moduleName || checkpoint.module}</p>
                      <p className="text-sm text-gray-600">Score: {checkpoint.score}% • {new Date(checkpoint.completedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{checkpoint.score}%</div>
                    </div>
                  </div>
                ))
              )}
              
              {realEnrollments.length === 0 && safeDigitalTwin.checkpoints.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚀</div>
                  <p className="text-gray-600 text-lg mb-4">No recent activity. Start learning to see your progress!</p>
                  <button
                    onClick={() => navigate('/courses')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Browse Courses
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* NFT Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <TrophyIcon className="h-7 w-7 text-yellow-500 mr-3" />
              Your NFTs
            </h2>
            <NftTabs active={nftTab} onChange={setNftTab} />
          </div>

          <NftLists active={nftTab} onVerify={handleVerifyNft} />
          <div className="mt-4 text-xs text-gray-500">Tags: <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Module Progress NFT</span> <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 ml-2">Learning Achievement NFT</span></div>
        </div>

        {/* Achievements Gallery */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <TrophyIcon className="h-7 w-7 text-yellow-500 mr-3" />
              Achievement Gallery
            </h2>
            <div className="text-sm text-gray-600">Manage your achievements</div>
          </div>
          {safeAchievements && safeAchievements.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {safeAchievements.map((achievement: any, idx: number) => (
                <div key={idx} className="aspect-square rounded-2xl border border-gray-200 bg-white flex items-center justify-center shadow-sm hover:shadow-md transition">
                  <img 
                    src={achievement.icon_url || achievement.achievement?.icon_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(achievement.title || achievement.achievement?.title || 'Achievement')}&background=0ea5e9&color=fff&size=64`} 
                    alt={achievement.title || achievement.achievement?.title || `Achievement ${idx+1}`} 
                    className="h-12 w-12" 
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrophyIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No achievements yet. Complete courses to earn achievements!</p>
            </div>
          )}
        </div>

        {/* Recommended Courses */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <SparklesIcon className="h-8 w-8 text-purple-500 mr-3" />
              Recommended for You
            </h2>
            <div className="text-sm text-gray-600 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full border border-purple-200">
              {loadingStats ? 'Loading...' : 'Courses you haven\'t enrolled in'}
            </div>
          </div>
          
          {loadingStats ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Finding courses for you...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                // Get enrolled course IDs
                const enrolledCourseIds = new Set(realEnrollments.map(e => e.course?.course_id).filter(Boolean));
                
                // Filter courses not enrolled in from the context courses
                const unenrolledCourses = courses.filter(course => 
                  course && 
                  !enrolledCourseIds.has(course.course_id || course.id) &&
                  course.status === 'published'
                ).slice(0, 6); // Show max 6 recommendations
                
                if (unenrolledCourses.length === 0) {
                  return (
                    <div className="col-span-full text-center py-12">
                      <SparklesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">All Set!</h3>
                      <p className="text-gray-600 mb-6">You've explored most of our available courses. Check back later for new content!</p>
                      <button
                        onClick={() => navigate('/courses')}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Browse All Courses
                      </button>
                    </div>
                  );
                }
                
                // Show actual unenrolled courses
                return unenrolledCourses.map(course => {
                  const courseId = course.course_id || course.id;
                  const difficulty = course.metadata?.difficulty_level || 'Beginner';
                  const estimatedHours = course.metadata?.estimated_hours || 0;
                  const moduleCount = course.modules?.length || 0;
                  
                  // Get course icon based on title or tags
                  const getCourseIcon = (title: string) => {
                    const lowerTitle = title.toLowerCase();
                    if (lowerTitle.includes('javascript') || lowerTitle.includes('js')) return '⚡';
                    if (lowerTitle.includes('python')) return '🐍';
                    if (lowerTitle.includes('data') || lowerTitle.includes('analytics')) return '📊';
                    if (lowerTitle.includes('web') || lowerTitle.includes('frontend') || lowerTitle.includes('backend')) return '🌐';
                    if (lowerTitle.includes('blockchain') || lowerTitle.includes('crypto')) return '🔗';
                    if (lowerTitle.includes('ai') || lowerTitle.includes('machine learning') || lowerTitle.includes('ml')) return '🤖';
                    if (lowerTitle.includes('mobile') || lowerTitle.includes('app')) return '📱';
                    if (lowerTitle.includes('react')) return '⚛️';
                    if (lowerTitle.includes('node')) return '🟢';
                    if (lowerTitle.includes('sql') || lowerTitle.includes('database')) return '🗄️';
                    return '📚';
                  };
                  
                  // Get course gradient based on difficulty
                  const getDifficultyGradient = (difficulty: string) => {
                    switch (difficulty.toLowerCase()) {
                      case 'beginner': return 'from-green-400 to-teal-500';
                      case 'intermediate': return 'from-blue-400 to-purple-500';
                      case 'advanced': return 'from-orange-400 to-red-500';
                      case 'expert': return 'from-purple-400 to-pink-500';
                      default: return 'from-gray-400 to-gray-500';
                    }
                  };
                  
                  // Get difficulty color
                  const getDifficultyColor = (difficulty: string) => {
                    switch (difficulty.toLowerCase()) {
                      case 'beginner': return 'text-green-600';
                      case 'intermediate': return 'text-blue-600';
                      case 'advanced': return 'text-orange-600';
                      case 'expert': return 'text-red-600';
                      default: return 'text-gray-600';
                    }
                  };
                  
                  const handleEnrollCourse = async () => {
                    try {
                      const isConnected = await blockchainService.checkWalletConnection();
                      if (!isConnected) {
                        toast.error('Please connect your MetaMask wallet before enrolling to enable NFT minting.');
                        return;
                      }
                      
                      // Navigate to course overview page where enrollment happens
                      navigate(`/course/${courseId}`);
                      toast.success(`Navigating to ${course.title}`);
                    } catch (error) {
                      console.error('Error enrolling in course:', error);
                      toast.error('Failed to enroll in course. Please try again.');
                    }
                  };
                  
                  return (
                    <div key={courseId} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getDifficultyGradient(difficulty)} opacity-10 rounded-full -translate-y-16 translate-x-16`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 bg-gradient-to-br ${getDifficultyGradient(difficulty)} rounded-xl text-white`}>
                            <span className="text-2xl">{getCourseIcon(course.title)}</span>
                  </div>
                  <div className="text-right">
                            <div className={`text-sm font-medium ${getDifficultyColor(difficulty)} bg-gray-100 px-2 py-1 rounded-full`}>
                              {difficulty}
                  </div>
                </div>
                  </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                            <span className="font-medium">{estimatedHours}h</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Level</span>
                            <span className={`font-medium ${getDifficultyColor(difficulty)}`}>{difficulty}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Modules</span>
                            <span className="font-medium">{moduleCount} modules</span>
                  </div>
                </div>
                
                        <button 
                          onClick={handleEnrollCourse}
                          className={`w-full py-3 px-4 bg-gradient-to-r ${getDifficultyGradient(difficulty)} text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl`}
                        >
                          Enroll Now
                </button>
              </div>
            </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${isVerificationModalOpen ? '' : 'hidden'}`}>
        <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">NFT Verification</h3>
          <div className="space-y-6">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-2xl">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-semibold text-green-800">Verification Successful</div>
                <div className="text-sm text-green-600">This NFT is authentic</div>
              </div>
            </div>
            <p className="text-gray-600">
              This NFT has been verified on the blockchain and is authentic.
            </p>
            <button
              onClick={() => setIsVerificationModalOpen(false)}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient }) => (
  <div className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/20">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`p-4 bg-gradient-to-br ${gradient} rounded-2xl text-white shadow-lg`}>
      {icon}
      </div>
    </div>
  </div>
);

interface SkillBarProps {
  name: string;
  value: number;
  color: string;
  icon: string;
}

const SkillBar: React.FC<SkillBarProps> = ({ name, value, color, icon }) => (
  <div>
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">{icon}</span>
        <span className="font-semibold text-gray-800">{name}</span>
      </div>
      <span className="font-bold text-gray-800">{Math.round(value * 100)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div 
        className={`h-3 rounded-full bg-gradient-to-r ${color} transition-all duration-1000`}
        style={{ width: `${value * 100}%` }}
      ></div>
    </div>
  </div>
);

interface KnowledgeBarProps {
  name: string;
  value: number;
}

const KnowledgeBar: React.FC<KnowledgeBarProps> = ({ name, value }) => (
    <div>
    <div className="flex justify-between items-center mb-2">
      <span className="font-medium text-gray-800">{name}</span>
      <span className="font-bold text-gray-800">{Math.round(value * 100)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div 
        className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
        style={{ width: `${value * 100}%` }}
      ></div>
    </div>
  </div>
);

// Lightweight tabs and lists for NFTs
const NftTabs: React.FC<{ active: 'owned'|'minting'|'all'; onChange: (v: 'owned'|'minting'|'all') => void }> = ({ active, onChange }) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-xl p-1 text-sm">
      {(['owned','minting','all'] as const).map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-3 py-1 rounded-lg capitalize ${active===tab ? 'bg-white shadow text-gray-800' : 'text-gray-600'}`}
        >
          {tab === 'owned' ? 'Owned' : tab === 'minting' ? 'Minting' : 'All'}
        </button>
      ))}
    </div>
  );
};

const NftLists: React.FC<{ active: 'owned'|'minting'|'all'; onVerify: (nft: Nft) => void }>= ({ active, onVerify }) => {
  const { digitalTwin, nfts } = useAppContext();
  const safeDigitalTwin = digitalTwin || { checkpoints: [], knowledge: {}, skills: { problemSolving: 0, logicalThinking: 0, selfLearning: 0 } };
  const safeNfts = nfts || [];
  const checkpoints = (safeDigitalTwin.checkpoints || []);

  // Convert checkpoints to NFT-like items for display (module progress)
  const checkpointNfts: (Nft & { minting?: boolean })[] = checkpoints
    .filter((cp: any) => (active === 'minting' ? (cp.minting && !cp.tokenized) : true))
    .filter((cp: any) => (active === 'owned' ? cp.tokenized : true))
    .map((checkpoint: any) => ({
      id: checkpoint.nftId || `nft-${checkpoint.moduleId}`,
      name: `${checkpoint.moduleName || checkpoint.module} Completion`,
      description: `Certificate for completing ${checkpoint.moduleName || checkpoint.module}`,
      imageUrl: `https://via.placeholder.com/300x200/0ea5e9/ffffff?text=${encodeURIComponent(checkpoint.moduleName || checkpoint.module)}`,
      moduleId: checkpoint.moduleId,
      issuedDate: checkpoint.completedAt,
      cid: checkpoint.nftCid,
      nftType: 'module_progress' as const,
      minting: Boolean(checkpoint.minting)
    }));

  // Include NFTs from state (module progress minted or learning achievements)
  const ownedStateNfts: Nft[] = safeNfts.map((n) => ({
    ...n,
    nftType: n.nftType || (n.moduleId ? 'module_progress' : 'learning_achievement')
  }));

  // Filter by active tab
  const displayNfts: (Nft & { minting?: boolean })[] = [
    ...checkpointNfts,
    ...(active === 'minting' ? [] : ownedStateNfts)
  ].filter(n => active === 'all' ? true : active === 'minting' ? n.minting : !n.minting);

  if (displayNfts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-gray-600 text-lg">Complete modules to earn NFTs!</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayNfts.map((nft) => (
        <div key={nft.id} className={`group bg-white rounded-2xl p-6 shadow-lg ${nft.minting ? 'border border-yellow-200' : 'border border-gray-100'} hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{nft.name}{nft.minting ? ' (Minting...)' : ''}</h3>
            <div className={`p-2 rounded-full ${nft.minting ? 'bg-yellow-100' : 'bg-green-100'}`}>
              {nft.minting ? '⏳' : <CheckCircleIcon className="h-5 w-5 text-green-600" />}
            </div>
          </div>
          <p className="text-gray-600 mb-2">{nft.description}</p>
          <div className="mb-4">
            <span className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full ${nft.nftType === 'learning_achievement' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              {nft.nftType === 'learning_achievement' ? 'Learning Achievement NFT' : 'Module Progress NFT'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {new Date(nft.issuedDate).toLocaleDateString()}
            </span>
            {!nft.minting && (
              <button
                onClick={() => onVerify(nft)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <EyeIcon className="h-4 w-4" />
                <span>Verify</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardPage;
