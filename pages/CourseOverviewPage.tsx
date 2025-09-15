import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  PlayIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  SparklesIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';
import { useAppContext } from '../contexts/AppContext';
import { blockchainService } from '../services/blockchainService';
import toast from 'react-hot-toast';
import { useTranslation } from '../src/hooks/useTranslation';

interface Course {
  course_id: string;
  id: string;
  title: string;
  description: string;
  instructor_name: string;
  instructor_email?: string;
  duration_minutes: number;
  difficulty_level: string;
  enrollment_count: number;
  rating: number;
  tags: string[];
  thumbnail_url?: string;
  is_enrolled?: boolean;
  modules?: any[];
  metadata?: {
    estimated_hours?: number;
    skills_taught?: string[];
    prerequisites?: string[];
    learning_objectives?: string[];
  };
  created_at?: string;
  updated_at?: string;
}

const CourseOverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { learnerProfile, courses } = useAppContext();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
    }
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      
      // First try to find course in context
      const contextCourse = courses.find(c => c.course_id === courseId || c.id === courseId);
      if (contextCourse) {
        setCourse(contextCourse);
        setIsEnrolled(contextCourse.is_enrolled || false);
        setLoading(false);
        return;
      }

      // If not found in context, try to fetch from API
      try {
        const response = await apiService.getCourse(courseId!);
        if (response && (response as any).course) {
          setCourse((response as any).course);
          setIsEnrolled((response as any).course.is_enrolled || false);
        } else {
          toast.error(t('pages.courseOverviewPage.courseNotFound'));
          navigate('/courses');
        }
      } catch (error) {
        console.error(`${t('pages.courseOverviewPage.errorFetchingCourse')}:`, error);
        toast.error(t('pages.courseOverviewPage.failToLoadCourseDetails'));
        navigate('/courses');
      }
    } catch (error) {
      console.error(`${t('pages.courseOverviewPage.errorLoadingCourse')}:`, error);
      toast.error(t('pages.courseOverviewPage.failToLoadCourse'));
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course || !learnerProfile) {
      toast.error(t('pages.courseOverviewPage.pleaseLogInToEnroll'));
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      
      // Check wallet connection for NFT minting
      const isConnected = await blockchainService.checkWalletConnection();
      if (!isConnected) {
        toast.error(t('pages.courseOverviewPage.pleaseConnectYourMetaMaskWallet'));
        return;
      }

      // Enroll in course
      const response = await apiService.enrollInCourse(course.course_id || course.id);
      
      if (response && (response as any).success) {
        toast.success(t('pages.courseOverviewPage.successFullyEnrolled', { courseTitle: course.title }));
        setIsEnrolled(true);
        
        // Navigate to course learning page after successful enrollment
        setTimeout(() => {
          navigate(`/course/${course.course_id || course.id}/learn`);
        }, 1500);
      } else {
        toast.error(t('pages.courseOverviewPage.failedToEnroll'));
      }
    } catch (error) {
      console.error(`${t('pages.courseOverviewPage.enrollmentError')}:`, error);
      toast.error(t('pages.courseOverviewPage.failedToEnroll'));
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    if (!course) return;
    
    if (isEnrolled) {
      navigate(`/course/${course.course_id || course.id}/learn`);
    } else {
      toast.error(t('pages.courseOverviewPage.pleaseEnrollInTheCourseFirst'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('pages.courseOverviewPage.loadingCourse')}</h2>
          <p className="text-gray-600">{t('pages.courseOverviewPage.pleaseWaitWhileWeFetchTheCourseDetails')}</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl p-8 text-center max-w-md mx-4">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-700 mb-4">{t('pages.courseOverviewPage.courseNotFound')}</h1>
          <p className="text-gray-600 mb-6">{t('pages.courseOverviewPage.theCourseYouAreLookingForDoesNotExistOrHasBeenRemoved')}</p>
          <button
            onClick={() => navigate('/courses')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            {t('pages.courseOverviewPage.browseCourses')}
          </button>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-blue-600 bg-blue-100';
      case 'advanced': return 'text-orange-600 bg-orange-100';
      case 'expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyGradient = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'from-green-400 to-teal-500';
      case 'intermediate': return 'from-blue-400 to-purple-500';
      case 'advanced': return 'from-orange-400 to-red-500';
      case 'expert': return 'from-purple-400 to-pink-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const estimatedHours = course.metadata?.estimated_hours || Math.round(course.duration_minutes / 60);
  const moduleCount = course.modules?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>{t('pages.courseOverviewPage.backToCourses')}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Header */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(course.difficulty_level)}`}>
                      {course.difficulty_level}
                    </span>
                    {isEnrolled && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        {t('pages.courseOverviewPage.enrolled')}
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">{course.title}</h1>
                  <p className="text-lg text-gray-600 leading-relaxed">{course.description}</p>
                </div>
              </div>

              {/* Course Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl overflow-hidden mb-6">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpenIcon className="w-20 h-20 text-white" />
                  </div>
                )}
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/50 rounded-xl">
                  <ClockIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{estimatedHours}h</div>
                  <div className="text-sm text-gray-600">{t('pages.courseOverviewPage.duration')}</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl">
                  <AcademicCapIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{moduleCount}</div>
                  <div className="text-sm text-gray-600">{t('pages.courseOverviewPage.modules')}</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl">
                  <UserGroupIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{course.enrollment_count || 0}</div>
                  <div className="text-sm text-gray-600">{t('pages.courseOverviewPage.students')}</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl">
                  <StarIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{course.rating || 0}</div>
                  <div className="text-sm text-gray-600">{t('pages.courseOverviewPage.rating')}</div>
                </div>
              </div>
            </div>

            {/* Course Details */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <BookOpenIcon className="h-7 w-7 text-blue-500 mr-3" />
                {t('pages.courseOverviewPage.whatYouWillLearn')}
              </h2>
              
              {course.metadata?.learning_objectives && course.metadata.learning_objectives.length > 0 ? (
                <ul className="space-y-3">
                  {course.metadata.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">{t('pages.courseOverviewPage.learningObjectives')}</p>
              )}
            </div>

            {/* Skills Taught */}
            {course.metadata?.skills_taught && course.metadata.skills_taught.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <SparklesIcon className="h-7 w-7 text-purple-500 mr-3" />
                  {t('pages.courseOverviewPage.skillsYouWillGain')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {course.metadata.skills_taught.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {course.metadata?.prerequisites && course.metadata.prerequisites.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <AcademicCapIcon className="h-7 w-7 text-orange-500 mr-3" />
                  {t('pages.courseOverviewPage.prerequisites')}
                </h2>
                <ul className="space-y-2">
                  {course.metadata.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-700">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20 sticky top-8">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${getDifficultyGradient(course.difficulty_level)} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <BookOpenIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {estimatedHours}h
                  </span>
                  <span className="flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-1" />
                    {t('pages.courseOverviewPage.modulesLower', { count: moduleCount })}
                  </span>
                </div>
              </div>

              {isEnrolled ? (
                <button
                  onClick={handleStartLearning}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <PlayIcon className="h-5 w-5" />
                  <span>{t('pages.courseOverviewPage.startLearning')}</span>
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {enrolling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('pages.courseOverviewPage.enrolling')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>{t('pages.courseOverviewPage.enrollNow')}</span>
                    </>
                  )}
                </button>
              )}

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  {isEnrolled 
                    ? t('pages.courseOverviewPage.youAreEnrolled')
                    : t('pages.courseOverviewPage.enrollNowToStartYourLearningJourneyAndEarnNFTs')
                  }
                </p>
              </div>
            </div>

            {/* Instructor Info */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 text-blue-500 mr-2" />
                {t('pages.courseOverviewPage.instructor')}
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{course.instructor_name}</div>
                  <div className="text-sm text-gray-600">{t('pages.courseOverviewPage.courseInstructor')}</div>
                </div>
              </div>
            </div>

            {/* Course Tags */}
            {course.tags && course.tags.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <TagIcon className="h-5 w-5 text-purple-500 mr-2" />
                  {t('pages.courseOverviewPage.tags')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseOverviewPage;
