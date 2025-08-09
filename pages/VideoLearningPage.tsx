import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import ModuleProgressTracker from '../components/ModuleProgressTracker';
import { 
  PlayIcon, 
  PauseIcon, 
  CheckCircleIcon, 
  LockClosedIcon,
  ClockIcon,
  AcademicCapIcon,
  ChevronRightIcon,
  BookOpenIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface Lesson {
  lesson_id: string;
  title: string;
  content_type: string;
  content_url?: string;
  duration_minutes: number;
  order: number;
  description: string;
}

interface CourseModule {
  module_id: string;
  title: string;
  description: string;
  estimated_hours: number;
  content: {
    lessons: Lesson[];
  };
  tags: string[];
}

interface Course {
  course_id: string;
  title: string;
  description: string;
  modules: CourseModule[];
  instructor: string;
  difficulty: string;
  estimated_hours: number;
}

const VideoLearningPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { digitalTwin, updateKnowledge, updateBehavior } = useAppContext();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId]);

  const fetchCourse = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/v1/courses/course/${id}`);
      if (response.ok) {
        const courseData = await response.json();
        setCourse(courseData);
      } else {
        toast.error('Failed to load course');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Error loading course');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const currentModule = course?.modules[currentModuleIndex];
  const currentLesson = currentModule?.content?.lessons[currentLessonIndex];

  const handleLessonComplete = (lessonId: string) => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
    
    // Update knowledge and behavior
    if (currentModule) {
      const currentKnowledge = digitalTwin.knowledge[currentModule.title] || 0;
      const newKnowledge = Math.min(currentKnowledge + 0.1, 1.0);
      
      updateKnowledge({
        [currentModule.title]: newKnowledge
      });

      updateBehavior({
        lastLlmSession: new Date().toISOString(),
        studyTime: (digitalTwin.behavior.studyTime || 0) + (currentLesson?.duration_minutes || 0)
      });
    }

    toast.success('Lesson completed! 🎉');
    
    // Auto-advance to next lesson
    if (currentModule && currentLessonIndex < currentModule.content.lessons.length - 1) {
      setCurrentLessonIndex(prev => prev + 1);
    } else if (course && currentModuleIndex < course.modules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
      setCurrentLessonIndex(0);
    }
  };

  const handleMilestoneReached = (milestoneId: string, nftType: 'module_progress' | 'learning_achievement') => {
    // Here you would typically call your NFT minting service
    console.log('Milestone reached:', milestoneId, nftType);
    
    // Show specific success message based on NFT type
    if (nftType === 'learning_achievement') {
      toast.success('🏆 Learning Achievement NFT minting started!', { duration: 5000 });
    } else {
      toast.success('📊 Module Progress NFT minting started!', { duration: 5000 });
    }
    
    // You could add blockchain interaction here
    // mintNFT(milestoneId, nftType);
  };

  const getCompletedModuleIds = () => {
    if (!course) return [];
    
    return course.modules
      .filter(module => {
        const allLessonsCompleted = module.content.lessons.every(lesson =>
          completedLessons.has(lesson.lesson_id)
        );
        return allLessonsCompleted;
      })
      .map(module => module.module_id);
  };

  const navigateToLesson = (moduleIndex: number, lessonIndex: number) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
  };

  const getModuleProgress = (module: CourseModule) => {
    const totalLessons = module.content.lessons.length;
    const completedCount = module.content.lessons.filter(lesson => 
      completedLessons.has(lesson.lesson_id)
    ).length;
    return (completedCount / totalLessons) * 100;
  };

  const formatVideoUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'www.youtube.com/embed/');
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!course || !currentModule || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or failed to load.</p>
          <Link 
            to="/dashboard" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5 mr-2 rotate-180" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 rotate-180" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-600">
                  Module {currentModuleIndex + 1}: {currentModule.title}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ClockIcon className="h-4 w-4" />
                <span>{currentLesson.duration_minutes} min</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <AcademicCapIcon className="h-4 w-4" />
                <span>{course.difficulty}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Video Player Section - 3/4 width */}
        <div className="lg:col-span-3 space-y-6">
          {/* Video Container */}
          <div className="video-container bg-black rounded-2xl overflow-hidden shadow-2xl">
            <div className="aspect-video">
              {currentLesson.content_url ? (
                <iframe
                  className="w-full h-full"
                  src={formatVideoUrl(currentLesson.content_url)}
                  title={currentLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setIsPlaying(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-900 text-white">
                  <div className="text-center">
                    <PlayIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Video not available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lesson Info */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentLesson.title}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {currentLesson.description}
                </p>
              </div>
              <button
                onClick={() => handleLessonComplete(currentLesson.lesson_id)}
                disabled={completedLessons.has(currentLesson.lesson_id)}
                className={`ml-4 px-6 py-3 rounded-xl font-semibold transition-all ${
                  completedLessons.has(currentLesson.lesson_id)
                    ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                }`}
              >
                {completedLessons.has(currentLesson.lesson_id) ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircleIconSolid className="h-5 w-5" />
                    <span>Completed</span>
                  </div>
                ) : (
                  'Mark Complete'
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Module Progress</span>
                <span>{Math.round(getModuleProgress(currentModule))}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="progress-bar h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getModuleProgress(currentModule)}%` }}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {currentModule.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          {/* Module Progress Tracker */}
          <ModuleProgressTracker
            courseId={course.course_id}
            completedModules={getCompletedModuleIds()}
            onMilestoneReached={handleMilestoneReached}
          />
        </div>

        {/* Module List Sidebar - 1/4 width */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-fit max-h-screen">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <h3 className="text-lg font-bold flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Course Modules
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                {course.modules.length} modules • {course.estimated_hours}h total
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {course.modules.map((module, moduleIndex) => (
                <div key={module.module_id} className="border-b border-gray-100 last:border-0">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Module {moduleIndex + 1}: {module.title}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">
                            {Math.round(getModuleProgress(module))}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {module.content.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.lesson_id}
                          onClick={() => navigateToLesson(moduleIndex, lessonIndex)}
                          className={`module-item p-3 rounded-lg cursor-pointer transition-all ${
                            moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex
                              ? 'active bg-blue-50 border-l-4 border-blue-500'
                              : completedLessons.has(lesson.lesson_id)
                              ? 'completed bg-emerald-50 border-l-4 border-emerald-500'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {lesson.title}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <ClockIcon className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {lesson.duration_minutes} min
                                </span>
                              </div>
                            </div>
                            <div className="ml-2">
                              {completedLessons.has(lesson.lesson_id) ? (
                                <CheckCircleIconSolid className="h-5 w-5 text-emerald-500" />
                              ) : moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex ? (
                                <PlayIcon className="h-5 w-5 text-blue-500" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Course completion status */}
            <div className="p-6 bg-gray-50 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <TrophyIcon className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(completedLessons.size / course.modules.reduce((acc, mod) => acc + mod.content.lessons.length, 0)) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {completedLessons.size} of {course.modules.reduce((acc, mod) => acc + mod.content.lessons.length, 0)} lessons completed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoLearningPage;