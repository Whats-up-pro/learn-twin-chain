import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import enrollmentService, { EnrollmentData } from '../services/enrollmentService';
import { apiService } from '../services/apiService';
import SubscriptionStatus from './SubscriptionStatus';
import { 
  HomeIcon,
  BookOpenIcon,
  TrophyIcon,
  CreditCardIcon,
  UserIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeSolid,
  BookOpenIcon as BookSolid,
  TrophyIcon as TrophySolid,
  CreditCardIcon as CreditSolid,
  UserIcon as UserSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  DocumentTextIcon as DocumentSolid
} from '@heroicons/react/24/solid';
import { useTranslation } from '../src/hooks/useTranslation';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

interface SidebarItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconSolid: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string | number;
  color?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, className = '' }) => {
  const { t } = useTranslation();
  const { learnerProfile, logout, nfts } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Enrollment state
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Fetch user enrollments with real-time updates
  const fetchEnrollments = async () => {
    if (!learnerProfile?.did) return;
    
    setIsLoadingEnrollments(true);
    try {
        // Load enrollments and progress, then merge by course_id
        const [enrollResp, progressResp] = await Promise.all([
          apiService.getUserEnrollments() as any,
          apiService.getMyProgress() as any
        ]);

        console.log('✅ Sidebar enrollments from users collection:', enrollResp);

        if (enrollResp?.success && enrollResp?.enrollments) {
          // Build progress map by course_id
          const progressMap: Record<string, number> = {};
          const progressItems: any[] = progressResp?.progress || [];
          if (Array.isArray(progressItems)) {
            progressItems.forEach((p: any) => {
              const cid = p?.course_id || p?.course?.course_id || p?.courseId;
              if (!cid) return;
              const percentFromFields = p?.overall_progress ?? p?.completion_percentage;
              const computedPercent = (p?.total_lessons && p?.total_lessons > 0)
                ? ((p?.completed_lessons || 0) / p.total_lessons) * 100
                : 0;
              const percent = Math.round(
                typeof percentFromFields === 'number' ? percentFromFields : computedPercent
              );
              if (!Number.isNaN(percent)) {
                progressMap[cid] = Math.min(Math.max(percent, 0), 100);
              }
            });
          }

          // Filter only active enrollments and merge progress when available
          const activeEnrollments = enrollResp.enrollments
            .filter((item: any) => item?.enrollment?.status === 'active')
            .map((item: any) => {
              const cid = item?.course?.course_id || item?.enrollment?.course_id;
              const enrollmentPercent = Math.round(item?.enrollment?.completion_percentage || 0);
              const progressPercent = cid && progressMap[cid] !== undefined
                ? progressMap[cid]
                : undefined;
              // Be conservative: avoid showing 100% unless both sources agree.
              let resolvedPercent = enrollmentPercent;
              if (typeof progressPercent === 'number') {
                if (progressPercent === 100 || enrollmentPercent === 100) {
                  resolvedPercent = Math.min(progressPercent, enrollmentPercent || 100);
                } else if (progressPercent >= 0) {
                  // Prefer the lower of the two to prevent optimistic over-reporting
                  resolvedPercent = Math.min(progressPercent, enrollmentPercent);
                }
              }
              return {
                ...item,
                enrollment: {
                  ...item.enrollment,
                  completion_percentage: resolvedPercent
                }
              } as EnrollmentData;
            });

          setEnrollments(activeEnrollments.slice(0, 5)); // Show max 5 courses
        } else {
          setEnrollments([]);
        }
    } catch (error) {
      console.error('Failed to load enrollments from users collection:', error);
      setEnrollments([]);
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [learnerProfile?.did]);

  // Refresh enrollments when focus returns to window (to sync progress changes)
  useEffect(() => {
    const handleFocus = () => {
      if (learnerProfile?.did && !isLoadingEnrollments) {
        fetchEnrollments();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [learnerProfile?.did, isLoadingEnrollments]);

  // Listen for course progress updates from other components
  useEffect(() => {
    const handleProgressUpdate = (evt: Event) => {
      try {
        const anyEvt = evt as CustomEvent;
        const courseId = anyEvt?.detail?.courseId as string | undefined;
        const progress = anyEvt?.detail?.progress as number | undefined;
        if (courseId && typeof progress === 'number') {
          // Immediately apply to matching enrollment for instant UI sync
          setEnrollments(prev => prev.map(item => {
            const cid = item?.course?.course_id || item?.enrollment?.course_id;
            if (cid === courseId) {
              return {
                ...item,
                enrollment: {
                  ...item.enrollment,
                  completion_percentage: Math.min(Math.max(Math.round(progress), 0), 100)
                }
              } as EnrollmentData;
            }
            return item;
          }));
        }
      } catch (e) {
        // no-op
      }
      if (learnerProfile?.did && !isLoadingEnrollments) {
        setTimeout(fetchEnrollments, 800); // Small delay to allow backend to persist
      }
    };
    
    window.addEventListener('courseProgressUpdated', handleProgressUpdate as EventListener);
    return () => window.removeEventListener('courseProgressUpdated', handleProgressUpdate as EventListener);
  }, [learnerProfile?.did, isLoadingEnrollments]);

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      name: t('components.sidebar.Dashboard'),
      href: '/dashboard',
      icon: HomeIcon,
      iconSolid: HomeSolid,
      color: 'blue'
    },
    {
      id: 'courses',
      name: t('components.sidebar.Courses'),
      href: '/courses',
      icon: BookOpenIcon,
      iconSolid: BookSolid,
      color: 'indigo'
    },
    {
      id: 'ai-tutor',
      name: t('components.sidebar.AI Tutor'),
      href: '/tutor',
      icon: ChatBubbleLeftRightIcon,
      iconSolid: ChatSolid,
      color: 'purple'
    },
    {
      id: 'achievements',
      name: t('components.sidebar.Achievements'),
      href: '/achievements',
      icon: TrophyIcon,
      iconSolid: TrophySolid,
      color: 'amber'
    },
    {
      id: 'nfts',
      name: t('components.sidebar.NFTs'),
      href: '/nfts',
      icon: CreditCardIcon,
      iconSolid: CreditSolid,
      badge: nfts?.length || 0,
      color: 'emerald'
    },
    {
      id: 'certificates',
      name: t('components.sidebar.Certificates'),
      href: '/certificates',
      icon: DocumentTextIcon,
      iconSolid: DocumentSolid,
      color: 'blue'
    },
    {
      id: 'profile',
      name: t('components.sidebar.Profile'),
      href: '/profile',
      icon: UserIcon,
      iconSolid: UserSolid,
      color: 'slate'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const getItemColorClasses = (item: SidebarItem, active: boolean) => {
    if (active) {
      return {
        bg: 'bg-blue-600',
        text: 'text-white',
        icon: 'text-white',
        border: 'border-blue-600'
      };
    }
    
    return {
      bg: 'bg-transparent hover:bg-blue-50',
      text: 'text-slate-700 hover:text-blue-700',
      icon: 'text-slate-500 hover:text-blue-600',
      border: 'border-transparent hover:border-blue-200'
    };
  };

  const displayName = learnerProfile?.name || 'User';
  const avatarUrl = learnerProfile?.avatarUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e40af&color=fff&size=40`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen bg-white shadow-2xl z-50 transition-all duration-300 ease-in-out
        ${isOpen ? 'w-72' : 'w-20'}
        md:sticky md:top-0 md:h-screen md:shadow-lg border-r border-slate-200
        flex flex-col
        ${className}
      `}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
          {isOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">LearnTwin</h1>
                <p className="text-blue-100 text-xs">{t('components.sidebar.LearningPlatform')}</p>
              </div>
            </div>
          )}
          
          <button
            onClick={onToggle}
            className={`
              p-2 rounded-lg text-white hover:bg-blue-500 transition-colors
              ${!isOpen && 'mx-auto'}
            `}
          >
            {isOpen ? (
              <ChevronLeftIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* User Profile Section */}
        <div className="flex-shrink-0 p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full border-2 border-blue-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e40af&color=fff&size=40`;
              }}
            />
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {learnerProfile?.email || 'Student'}
                </p>
              </div>
            )}
          </div>
          
          {/* Subscription Status */}
          {isOpen && (
            <div className="mt-3">
              <SubscriptionStatus className="justify-center" showUpgrade={true} />
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {sidebarItems.map((item) => {
            const active = isActive(item.href);
            const colorClasses = getItemColorClasses(item, active);
            const IconComponent = active ? item.iconSolid : item.icon;

            return (
              <Link
                key={item.id}
                to={item.href}
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-xl
                  transition-all duration-200 border
                  ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}
                  ${isOpen ? 'justify-start' : 'justify-center'}
                `}
                title={!isOpen ? item.name : undefined}
              >
                <IconComponent className={`
                  w-5 h-5 ${colorClasses.icon} transition-colors
                  ${isOpen ? 'mr-3' : ''}
                `} />
                
                {isOpen && (
                  <>
                    <span className="truncate">{item.name}</span>
                    {item.badge !== undefined && (
                      <span className={`
                        ml-auto px-2 py-0.5 text-xs font-medium rounded-full
                        ${active 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-slate-200 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                        }
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}

          {/* My Enrollment Section */}
          {isOpen && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="px-3 mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t('components.sidebar.MyEnrollment')}
                </h3>
              </div>

              {isLoadingEnrollments ? (
                <div className="px-3 py-2 text-center">
                  <div className="inline-flex items-center text-xs text-slate-500">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('components.sidebar.Loading')}
                  </div>
                </div>
              ) : enrollments.length > 0 ? (
                <div className="space-y-1">
                  {enrollments.map((item) => {
                    if (!item.course) return null;
                    
                    const course = item.course;
                    const enrollment = item.enrollment;
                    const progress = Math.round(enrollment.completion_percentage || 0);
                    
                    return (
                      <Link
                        key={course.course_id}
                        to={`/course/${course.course_id}/learn`}
                        className="block px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-700">
                              {course.title}
                            </p>
                            <div className="flex items-center mt-1 space-x-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${enrollmentService.getProgressColor(progress)}`}
                                  style={{ width: `${Math.max(progress, 2)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-500 font-medium">
                                {progress}%
                              </span>
                            </div>
                            <div className="flex items-center mt-1 space-x-2">
                              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${enrollmentService.getDifficultyColor(course.metadata.difficulty_level)}`}>
                                {course.metadata.difficulty_level}
                              </span>
                              {progress === 100 ? (
                                <CheckCircleIcon className="w-3 h-3 text-green-500" />
                              ) : (
                                <ClockIcon className="w-3 h-3 text-slate-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  
                  {/* View All Link */}
                  <Link
                    to="/courses"
                    className="block px-3 py-2 text-center text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {t('components.sidebar.ViewAllCourses')} →
                  </Link>
                </div>
              ) : (
                <div className="px-3 py-4 text-center">
                  <BookOpenIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 mb-2">{t('components.sidebar.NoEnrollmentsYet')}</p>
                  <Link
                    to="/courses"
                    className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {t('components.sidebar.BrowseCourses')}
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Settings & Logout */}
        <div className="flex-shrink-0 p-2 border-t border-slate-200 space-y-1 bg-white">
          <Link
            to="/settings"
            className={`
              group flex items-center px-3 py-3 text-sm font-medium rounded-xl
              transition-all duration-200 border border-transparent
              bg-transparent hover:bg-slate-50 text-slate-700 hover:text-slate-900
              ${isOpen ? 'justify-start' : 'justify-center'}
            `}
            title={!isOpen ? t('components.sidebar.Settings') : undefined}
          >
            <CogIcon className={`
              w-5 h-5 text-slate-500 hover:text-slate-700 transition-colors
              ${isOpen ? 'mr-3' : ''}
            `} />
            {isOpen && <span>{t('components.sidebar.Settings')}</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={`
              w-full group flex items-center px-3 py-3 text-sm font-medium rounded-xl
              transition-all duration-200 border border-transparent
              bg-transparent hover:bg-red-50 text-slate-700 hover:text-red-700
              ${isOpen ? 'justify-start' : 'justify-center'}
            `}
            title={!isOpen ? t('components.sidebar.Logout') : undefined}
          >
            <ArrowLeftOnRectangleIcon className={`
              w-5 h-5 text-slate-500 group-hover:text-red-600 transition-colors
              ${isOpen ? 'mr-3' : ''}
            `} />
            {isOpen && <span>{t('components.sidebar.Logout')}</span>}
          </button>
        </div>

        {/* Footer */}
        {isOpen && (
          <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500 text-center">
              © 2025 LearnTwinChain
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
