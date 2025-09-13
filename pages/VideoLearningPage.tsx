import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import ModuleProgressTracker from '../components/ModuleProgressTracker';
import QuizComponent from '../components/QuizComponent';
import { courseService } from '../services/courseService';
import { quizService } from '../services/quizService';
import jwtService from '../services/jwtService';
// achievementService import commented out as it's not used yet
import { 
  isYouTubeUrl, 
  formatVideoTime,
  createYouTubePlayer,
  getYouTubeVideoId
} from '../utils/videoUtils';
import { 
  PlayIcon, 
  PauseIcon, 
  ClockIcon,
  AcademicCapIcon,
  ChevronRightIcon,
  BookOpenIcon,
  TrophyIcon,
  LockClosedIcon
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

interface ModuleQuiz {
  quiz_id: string;
  title: string;
  description: string;
  total_points: number;
  passing_score: number;
  time_limit_minutes?: number;
  max_attempts: number;
}

interface CourseModule {
  module_id: string;
  title: string;
  description: string;
  estimated_duration?: number;
  estimated_hours?: number;
  content?: {
    lessons: Lesson[];
  };
  quizzes?: ModuleQuiz[];
  tags?: string[];
  order?: number;
  status?: string;
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
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<ModuleQuiz | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  const [currentContentType, setCurrentContentType] = useState<'lesson' | 'quiz'>('lesson');

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId]);

  const fetchCourse = async (id: string) => {
    try {
      setLoading(true);
      
      // Fetch course data and modules separately
      console.log(`🔍 Fetching course data for: ${id}`);
      
      // Get auth headers for authenticated requests
      const authHeaders = jwtService.getAuthHeader();
      console.log(`🔑 Auth headers for requests:`, authHeaders);
      
      const [courseResponse, modulesResponse] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/courses/course/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          }
        }),
        fetch(`http://localhost:8000/api/v1/courses/${id}/modules`, {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          }
        })
      ]);
      
      console.log(`📡 Course response status: ${courseResponse.status}`);
      console.log(`📡 Modules response status: ${modulesResponse.status}`);
      
      if (courseResponse.ok && modulesResponse.ok) {
        const courseData = await courseResponse.json();
        const modulesData = await modulesResponse.json();
        
        console.log('📚 Course data:', courseData);
        console.log('📚 Modules data:', modulesData);
        console.log('📚 Module IDs found:', modulesData.modules?.map((m: any) => m.module_id));
        
        // Load quizzes for each module
        const enhancedModules = await Promise.all(
          modulesData.modules.map(async (module: CourseModule) => {
            try {
              console.log(`🔍 Fetching quizzes for module: ${module.module_id} (${module.title})`);
              const quizResponse = await quizService.getModuleQuizzes(module.module_id) as any;
              console.log(`📝 Quiz response for module ${module.module_id}:`, quizResponse);
              console.log(`📝 Number of quizzes found: ${quizResponse?.quizzes?.length || 0}`);
              
              if (quizResponse?.quizzes?.length > 0) {
                console.log(`✅ Found ${quizResponse.quizzes.length} quiz(es) for module ${module.module_id}`);
                quizResponse.quizzes.forEach((quiz: any, quizIndex: number) => {
                  console.log(`  Quiz ${quizIndex + 1}: ${quiz.title} (ID: ${quiz.quiz_id})`);
                });
              } else {
                console.log(`❌ No quizzes found for module ${module.module_id}`);
              }
              
              return {
                ...module,
                quizzes: quizResponse?.quizzes || []
              };
            } catch (error) {
              console.error(`❌ Failed to load quizzes for module ${module.module_id}:`, error);
              return {
                ...module,
                quizzes: []
              };
            }
          })
        );
        
        console.log('🎯 Final enhanced modules:', enhancedModules);
        enhancedModules.forEach((module, index) => {
          console.log(`Module ${index + 1}: ${module.title}`);
          console.log(`  - Module ID: ${module.module_id}`);
          console.log(`  - Lessons: ${module.content?.lessons?.length || 0}`);
          console.log(`  - Quizzes: ${module.quizzes?.length || 0}`);
          if (module.quizzes && module.quizzes.length > 0) {
            module.quizzes.forEach((quiz: any, quizIndex: number) => {
              console.log(`    Quiz ${quizIndex + 1}: ${quiz.title} (${quiz.quiz_id})`);
            });
          }
        });
        
        setCourse({
          ...courseData.course,
          modules: enhancedModules
        });
        
        // Load lesson completion status for all lessons in the course
        await loadLessonCompletionStatus({...courseData.course, modules: enhancedModules});
        await loadQuizCompletionStatus({...courseData.course, modules: enhancedModules});
      } else {
        console.error('❌ Failed to load course or modules:', {
          courseResponse: courseResponse.status,
          modulesResponse: modulesResponse.status
        });
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

  const loadLessonCompletionStatus = async (courseData: Course) => {
    try {
      const completedLessonIds = new Set<string>();
      
      // For each module and lesson, check completion status
      for (const module of courseData.modules) {
        if (!module.content?.lessons) continue;
        for (const lesson of module.content.lessons) {
          try {
            // Get lesson progress from API
            const progressResponse = await fetch(
              `http://localhost:8000/api/v1/lessons/${lesson.lesson_id}/progress`,
              {
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              if (progressData.lesson_progress?.completion_percentage >= 100) {
                completedLessonIds.add(lesson.lesson_id);
              }
            }
          } catch (error) {
            console.warn(`Failed to load progress for lesson ${lesson.lesson_id}:`, error);
          }
        }
      }
      
      setCompletedLessons(completedLessonIds);
    } catch (error) {
      console.error('Failed to load lesson completion status:', error);
    }
  };

  const loadQuizCompletionStatus = async (courseData: Course) => {
    try {
      const completedQuizIds = new Set<string>();
      
      // Get all quiz attempts for this user
      const attemptsResponse = await quizService.getQuizAttempts(courseData.course_id) as any;
      if (attemptsResponse && attemptsResponse.attempts) {
        attemptsResponse.attempts.forEach((attempt: any) => {
          if (attempt.passed && attempt.status === 'submitted') {
            completedQuizIds.add(attempt.quiz_id);
          }
        });
      }
      
      setCompletedQuizzes(completedQuizIds);
    } catch (error) {
      console.warn('Failed to load quiz completion status:', error);
    }
  };

  const currentModule = course?.modules[currentModuleIndex];
  const currentLesson = currentModule?.content?.lessons[currentLessonIndex];

  // Function to sync course progress to global state/dashboard
  const syncCourseProgress = async () => {
    if (!course) return;
    
    try {
      // Calculate current progress
      const totalLessons = course.modules.reduce((acc, m) => acc + (m.content?.lessons?.length || 0), 0);
      const completedLessonsCount = Array.from(completedLessons).length;
      const overallProgress = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0;

      // Save course progress to backend for dashboard sync
      await courseService.updateCourseProgress(course.course_id, {
        overall_progress: overallProgress,
        completed_modules: course.modules.filter(m => {
          const allLessonsCompleted = m.content?.lessons?.every(lesson =>
            completedLessons.has(lesson.lesson_id)
          ) || false;
          return allLessonsCompleted;
        }).length,
        total_modules: course.modules.length,
        completed_lessons: completedLessonsCount,
        total_lessons: totalLessons,
        last_updated: new Date().toISOString()
      });
      
      console.log(`✅ Synced course progress: ${overallProgress.toFixed(1)}% for "${course.title}"`);
    } catch (error) {
      console.warn('Failed to sync course progress to dashboard:', error);
    }
  };

  const navigateToQuiz = (moduleIndex: number, quiz: ModuleQuiz) => {
    const targetModule = course?.modules[moduleIndex];
    if (!targetModule) return;

    // Check if quiz is accessible (all lessons in module completed)
    const allLessonsCompleted = targetModule.content?.lessons?.every(lesson =>
      completedLessons.has(lesson.lesson_id)
    ) || false;

    if (!allLessonsCompleted) {
      const incompleteLessons = targetModule.content?.lessons?.filter(lesson =>
        !completedLessons.has(lesson.lesson_id)
      ) || [];
      
      toast.error(
        `🔒 Quiz locked! Complete ${incompleteLessons.length} remaining lesson${incompleteLessons.length > 1 ? 's' : ''} in "${targetModule.title}" first.`, 
        {
          duration: 5000,
          icon: '🔒'
        }
      );
      return;
    }

    // Set quiz as current content
    setCurrentModuleIndex(moduleIndex);
    setCurrentQuiz(quiz);
    setCurrentContentType('quiz');
    setShowQuiz(true);

    // Reset video states
    if (youtubePlayer) {
      try {
        youtubePlayer.pauseVideo();
        youtubePlayer.destroy();
      } catch (error) {
        console.warn('Failed to stop YouTube player:', error);
      }
      setYoutubePlayer(null);
    }
    setIsPlaying(false);
    setCurrentTime('0:00');
    setDuration('0:00');
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (!currentLesson || !currentModule) return;
    
    setIsCompletingLesson(true); // Start loading
    
    try {
      // Stop current video before completing
      if (youtubePlayer) {
        try {
          youtubePlayer.pauseVideo();
        } catch (error) {
          console.warn('Failed to pause YouTube video:', error);
        }
      }
      setIsPlaying(false);

      // Save lesson completion to backend
      await courseService.updateLessonProgress(lessonId, {
        completion_percentage: 100,
        time_spent_minutes: currentLesson.duration_minutes || 0,
        notes: `Completed lesson: ${currentLesson.title}`
      });

      // Update local state
      setCompletedLessons(prev => new Set([...prev, lessonId]));
      
      // Update knowledge and behavior
      if (currentModule) {
        const currentKnowledge = digitalTwin.knowledge[currentModule.title] || 0;
        const newKnowledge = Math.min(currentKnowledge + 0.1, 1.0);
        
        updateKnowledge({
          [currentModule.title]: newKnowledge
        });

        updateBehavior({
          lastLlmSession: new Date().toISOString()
        });
      }

      // 🔄 Sync progress to dashboard
      await syncCourseProgress();
      
      // Notify other components (like sidebar) about progress update
      window.dispatchEvent(new CustomEvent('courseProgressUpdated'));

      toast.success('Lesson completed! 🎉');
      
      // Check if this is the last lesson in the module and we have quizzes
      const isLastLessonInModule = currentLessonIndex === (currentModule.content?.lessons?.length || 0) - 1;
      const moduleHasQuizzes = currentModule.quizzes && currentModule.quizzes.length > 0;
      
      if (isLastLessonInModule && moduleHasQuizzes) {
        // Show recommendation to take the quiz
        toast.success('🎯 Module completed! Quiz is now unlocked! Take it to test your knowledge!', {
          duration: 5000,
          icon: '📝'
        });
        proceedToNextContent();
      } else {
        // Normal lesson progression flow  
        proceedToNextContent();
      }
      
    } catch (error) {
      console.error('Failed to save lesson completion:', error);
      toast.error('Failed to save progress. Please try again.');
    } finally {
      setIsCompletingLesson(false); // End loading
    }
  };

  const proceedToNextContent = () => {
      // Auto-advance to next lesson after a short delay
      setTimeout(() => {
        if (currentModule && currentLessonIndex < (currentModule.content?.lessons?.length || 0) - 1) {
          navigateToLesson(currentModuleIndex, currentLessonIndex + 1);
        } else if (course && currentModuleIndex < course.modules.length - 1) {
          navigateToLesson(currentModuleIndex + 1, 0);
      } else {
        // Course completed
        checkAndAwardAchievements();
        }
      }, 1000); // Small delay to let user see completion message
  };

  const handleQuizComplete = async (score: number) => {
    try {
      // Mark quiz as completed if passed
      if (currentQuiz && score >= 70) {
        setCompletedQuizzes(prev => new Set([...prev, currentQuiz.quiz_id]));
      }
      
      // Check for achievements after quiz completion
      await checkAndAwardAchievements();
      
      setShowQuiz(false);
      setCurrentQuiz(null);
      setCurrentContentType('lesson');
      
      if (score >= 70) {
        toast.success(`Excellent! Quiz passed with ${score}%! 🎉`);
      } else {
        toast.error(`Quiz score: ${score}%. You can retake it to improve!`);
      }
      
    } catch (error) {
      console.error('Error handling quiz completion:', error);
    }
  };

  const checkAndAwardAchievements = async () => {
    try {
      if (!course) return;
      
      const totalLessons = course.modules.reduce((total, module) => total + (module.content?.lessons?.length || 0), 0);
      const completionRate = completedLessons.size / totalLessons;
      
      // Check for different achievement milestones
      if (completionRate >= 1.0) {
        // Course completion achievement
        toast.success('🏆 Achievement Unlocked: Course Completion Master!', {
          duration: 5000,
          icon: '🎖️',
        });
        
        // Show achievement popup
        showAchievementPopup('Course Completion Master', 'Completed your first course!');
        
      } else if (completionRate >= 0.5) {
        // Halfway achievement
        toast.success('🏆 Achievement Unlocked: Dedicated Learner!', {
          duration: 5000,
          icon: '🔥',
        });
        
        showAchievementPopup('Dedicated Learner', 'Completed 50% of the course material!');
      }

      // Check for module completion achievements
      const completedModules = course.modules.filter(module => {
        return module.content?.lessons?.every(lesson => completedLessons.has(lesson.lesson_id)) || false;
      }).length;

      if (completedModules > 0) {
        const moduleTitle = course.modules[completedModules - 1]?.title;
        if (moduleTitle) {
          showAchievementPopup('Module Master', `Completed "${moduleTitle}" module!`);
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const showAchievementPopup = (title: string, description: string) => {
    // Create and show achievement popup
    toast.success(
      <div className="flex items-center">
        <div className="mr-3 text-2xl">🏆</div>
        <div>
          <div className="font-bold text-yellow-600">{title}</div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
      </div>,
      {
        duration: 6000,
        style: {
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)',
          border: '2px solid #F59E0B',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
        },
        icon: undefined,
      }
    );

    // Add notification to header (this would typically update a global state)
    window.dispatchEvent(new CustomEvent('achievementUnlocked', {
      detail: { title, description }
    }));
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
        const allLessonsCompleted = module.content?.lessons?.every(lesson =>
          completedLessons.has(lesson.lesson_id)
        ) || false;
        return allLessonsCompleted;
      })
      .map(module => module.module_id);
  };

  // Check if a lesson is accessible (previous lessons must be completed)
  const isLessonAccessible = (moduleIndex: number, lessonIndex: number) => {
    if (!course) return false;
    
    // First lesson of first module is always accessible
    if (moduleIndex === 0 && lessonIndex === 0) return true;
    
    const targetModule = course.modules[moduleIndex];
    if (!targetModule) return false;
    
    // If it's the first lesson of a module (but not the first module)
    if (lessonIndex === 0 && moduleIndex > 0) {
      // Check if previous module is completed
      const previousModule = course.modules[moduleIndex - 1];
      const allPreviousLessonsCompleted = previousModule.content?.lessons?.every(lesson =>
        completedLessons.has(lesson.lesson_id)
      ) || false;
      return allPreviousLessonsCompleted;
    }
    
    // For lessons within a module, check if previous lesson is completed
    const previousLesson = targetModule.content?.lessons?.[lessonIndex - 1];
    return previousLesson ? completedLessons.has(previousLesson.lesson_id) : false;
  };

  const navigateToLesson = (moduleIndex: number, lessonIndex: number) => {
    if (!course) return;
    
    // Check if lesson is accessible
    if (!isLessonAccessible(moduleIndex, lessonIndex)) {
      const targetModule = course.modules[moduleIndex];
      const targetLesson = targetModule?.content?.lessons[lessonIndex];
      
      if (lessonIndex === 0 && moduleIndex > 0) {
        toast.error(`Complete all lessons in "${course.modules[moduleIndex - 1]?.title}" before accessing this module!`, {
          duration: 4000,
          icon: '🔒'
        });
      } else {
        const previousLesson = targetModule?.content?.lessons?.[lessonIndex - 1];
        toast.error(`Complete "${previousLesson?.title}" before accessing "${targetLesson?.title}"!`, {
          duration: 4000,
          icon: '🔒'
        });
      }
      return;
    }

    // Stop current video and clear any timers
    if (youtubePlayer) {
      try {
        youtubePlayer.pauseVideo();
        youtubePlayer.destroy();
      } catch (error) {
        console.warn('Failed to stop/destroy YouTube player:', error);
      }
      setYoutubePlayer(null);
    }

    // Reset all video states immediately
    setIsPlaying(false);
    setCurrentTime('0:00');
    setDuration('0:00');
    
    // Update lesson navigation
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
  };

  // Store interval ref to clear it when needed
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);

  // Initialize YouTube player when lesson changes
  useEffect(() => {
    const initializePlayer = async () => {
      if (!currentLesson?.content_url || !isYouTubeUrl(currentLesson.content_url)) {
        return;
      }

      const videoId = getYouTubeVideoId(currentLesson.content_url);
      if (!videoId) return;

      try {
        // Clear any existing interval
        if (progressInterval) {
          clearInterval(progressInterval);
          setProgressInterval(null);
        }

        // Clean up existing player
        if (youtubePlayer) {
          try {
            youtubePlayer.destroy();
          } catch (error) {
            console.warn('Failed to destroy existing player:', error);
          }
        }

        // Reset states for new video
        setCurrentTime('0:00');
        setDuration('0:00');
        setIsPlaying(false);

        // Wait a bit for the iframe to be ready
        setTimeout(async () => {
          const playerId = `youtube-player-${currentLesson.lesson_id}`;
          const playerElement = document.getElementById(playerId);
          
          if (playerElement) {
            const player = await createYouTubePlayer(
              playerId,
              videoId,
              (event: any) => {
                // Player ready
                const totalDuration = event.target.getDuration();
                setDuration(formatVideoTime(totalDuration));
                setCurrentTime('0:00'); // Ensure we start at 0:00
                
                // Start time tracking with a clean interval
                const newInterval = setInterval(() => {
                  if (player && player.getCurrentTime) {
                    try {
                      const current = player.getCurrentTime();
                      setCurrentTime(formatVideoTime(current));
                    } catch (error) {
                      // Player might be destroyed, clear interval
                      clearInterval(newInterval);
                    }
                  }
                }, 1000);
                
                setProgressInterval(newInterval);
              },
              (event: any) => {
                // State change handler
                const playerState = event.data;
                const YT = (window as any).YT;
                
                if (playerState === YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                } else if (playerState === YT.PlayerState.PAUSED || playerState === YT.PlayerState.ENDED) {
                  setIsPlaying(false);
                }
              }
            );

            setYoutubePlayer(player);
          }
        }, 500);
        
      } catch (error) {
        console.error('Failed to initialize YouTube player:', error);
      }
    };

    if (currentLesson?.content_url && isYouTubeUrl(currentLesson.content_url)) {
      initializePlayer();
    }
    
    // Cleanup function
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [currentLesson?.content_url]);

  // Handle play/pause
  const handlePlayPause = () => {
    if (!youtubePlayer) return;

    try {
      if (isPlaying) {
        youtubePlayer.pauseVideo();
      } else {
        youtubePlayer.playVideo();
      }
    } catch (error) {
      console.error('Error controlling video playback:', error);
    }
  };

  const getModuleProgress = (module: CourseModule) => {
    const totalLessons = module.content?.lessons?.length || 0;
    if (totalLessons === 0) return 0;
    const completedCount = module.content?.lessons?.filter(lesson => 
      completedLessons.has(lesson.lesson_id)
    ).length || 0;
    return (completedCount / totalLessons) * 100;
  };

  // Removed formatVideoUrl - now using utility function from utils/videoUtils.ts

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
          <div className="video-container bg-black rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="aspect-video">
              {currentLesson.content_url ? (
                isYouTubeUrl(currentLesson.content_url) ? (
                  <div className="w-full h-full">
                    <div 
                      id={`youtube-player-${getYouTubeVideoId(currentLesson.content_url)}`}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <video
                    className="w-full h-full"
                    controls
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={(e) => {
                      const video = e.target as HTMLVideoElement;
                      setCurrentTime(formatVideoTime(video.currentTime));
                      if (video.duration) {
                        setDuration(formatVideoTime(video.duration));
                      }
                    }}
                  >
                    <source src={currentLesson.content_url} />
                    Your browser does not support the video tag.
                  </video>
                )
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-900 text-white">
                  <div className="text-center">
                    <PlayIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Video not available</p>
                    <p className="text-sm opacity-75 mt-2">Please contact your instructor</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Video Controls Overlay */}
            {currentLesson.content_url && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={handlePlayPause}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
                      disabled={!youtubePlayer && isYouTubeUrl(currentLesson.content_url)}
                    >
                      {isPlaying ? (
                        <PauseIcon className="w-5 h-5" />
                      ) : (
                        <PlayIcon className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div className="text-sm">
                      <span>{currentTime}</span>
                      <span className="text-white text-opacity-60 mx-1">/</span>
                      <span>{duration}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-white text-opacity-75">
                    {currentLesson.title}
                  </div>
                </div>
              </div>
            )}
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
                disabled={completedLessons.has(currentLesson.lesson_id) || isCompletingLesson}
                className={`ml-4 px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                  completedLessons.has(currentLesson.lesson_id)
                    ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                    : isCompletingLesson
                    ? 'bg-blue-500 text-white cursor-not-allowed opacity-80'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                }`}
              >
                {completedLessons.has(currentLesson.lesson_id) ? (
                  <>
                    <CheckCircleIconSolid className="h-5 w-5" />
                    <span>Completed</span>
                  </>
                ) : isCompletingLesson ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Completing...</span>
                  </>
                ) : (
                  <span>Mark Complete</span>
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
              {currentModule.tags?.map((tag, index) => (
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
                {course.modules.length} modules • {course.estimated_hours || Math.round(course.modules.reduce((acc, m) => acc + (m.estimated_duration || 0), 0) / 60)}h total
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
                      {/* Module Summary */}
                      <div className="text-xs text-gray-500 mb-2">
                        {module.content?.lessons?.length || 0} lesson{(module.content?.lessons?.length || 0) !== 1 ? 's' : ''} 
                        {(() => {
                          console.log(`🔍 Module ${moduleIndex + 1} quiz debug:`, {
                            hasQuizzes: !!module.quizzes,
                            quizLength: module.quizzes?.length || 0,
                            quizzes: module.quizzes
                          });
                          return null;
                        })()}
                        {module.quizzes && module.quizzes.length > 0 && (
                          <span> • {module.quizzes.length} quiz{module.quizzes.length !== 1 ? 'zes' : ''}</span>
                        )}
                        {(!module.quizzes || module.quizzes.length === 0) && (
                          <span className="text-gray-400"> • No quizzes available</span>
                        )}
                      </div>

                      {/* Lessons */}
                      {module.content?.lessons?.map((lesson, lessonIndex) => {
                        const isAccessible = isLessonAccessible(moduleIndex, lessonIndex);
                        const isCompleted = completedLessons.has(lesson.lesson_id);
                        const isCurrent = moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex && currentContentType === 'lesson';
                        
                        return (
                          <div
                            key={lesson.lesson_id}
                            onClick={() => navigateToLesson(moduleIndex, lessonIndex)}
                            className={`module-item p-3 rounded-lg transition-all ${
                              isCurrent
                                ? 'active bg-blue-50 border-l-4 border-blue-500'
                                : isCompleted
                                ? 'completed bg-emerald-50 border-l-4 border-emerald-500'
                                : isAccessible
                                ? 'hover:bg-gray-50 cursor-pointer'
                                : 'opacity-50 cursor-not-allowed bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    Lesson {lessonIndex + 1}
                                  </span>
                                </div>
                                <p className={`text-sm font-medium truncate mt-1 ${
                                  isAccessible ? 'text-gray-900' : 'text-gray-500'
                                }`}>
                                  {lesson.title}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <ClockIcon className={`h-3 w-3 ${
                                    isAccessible ? 'text-gray-400' : 'text-gray-300'
                                  }`} />
                                  <span className={`text-xs ${
                                    isAccessible ? 'text-gray-500' : 'text-gray-400'
                                  }`}>
                                    {lesson.duration_minutes} min
                                  </span>
                                </div>
                              </div>
                              <div className="ml-2">
                                {isCompleted ? (
                                  <CheckCircleIconSolid className="h-5 w-5 text-emerald-500" />
                                ) : isCurrent ? (
                                  <PlayIcon className="h-5 w-5 text-blue-500" />
                                ) : isAccessible ? (
                                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                ) : (
                                  <LockClosedIcon className="h-5 w-5 text-gray-300" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Quizzes Section */}
                      {(() => {
                        console.log(`🎯 Quiz section render check for module ${moduleIndex + 1}:`, {
                          hasQuizzes: !!module.quizzes,
                          quizLength: module.quizzes?.length || 0,
                          willRender: !!(module.quizzes && module.quizzes.length > 0)
                        });
                        return null;
                      })()}
                      {module.quizzes && module.quizzes.length > 0 && (
                        <>
                          <div className="mt-4 pt-2 border-t border-gray-100">
                            <div className="flex items-center space-x-2 mb-2">
                              <TrophyIcon className="h-4 w-4 text-purple-500" />
                              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                                Quizzes & Assessments
                              </span>
                            </div>
                          </div>
                          {module.quizzes.map((quiz) => {
                            const allLessonsCompleted = module.content?.lessons?.every(lesson =>
                              completedLessons.has(lesson.lesson_id)
                            ) || false;
                            const isQuizCompleted = completedQuizzes.has(quiz.quiz_id);
                            const isCurrent = currentQuiz?.quiz_id === quiz.quiz_id && currentContentType === 'quiz';
                            const isQuizAccessible = allLessonsCompleted;
                            
                            return (
                              <div
                                key={quiz.quiz_id}
                                onClick={() => isQuizAccessible ? navigateToQuiz(moduleIndex, quiz) : undefined}
                                className={`module-item p-3 rounded-lg transition-all ${
                                  isCurrent
                                    ? 'active bg-purple-50 border-l-4 border-purple-500'
                                    : isQuizCompleted
                                    ? 'completed bg-emerald-50 border-l-4 border-emerald-500'
                                    : isQuizAccessible
                                    ? 'hover:bg-gray-50 cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        isQuizAccessible 
                                          ? 'bg-purple-100 text-purple-700' 
                                          : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        Quiz
                                      </span>
                                      {!isQuizAccessible && (
                                        <span className="text-xs text-gray-400">
                                          (Complete all lessons)
                                        </span>
                                      )}
                                    </div>
                                    <p className={`text-sm font-medium truncate mt-1 ${
                                      isQuizAccessible ? 'text-gray-900' : 'text-gray-500'
                                    }`}>
                                      {quiz.title.replace(/^Module \d+:\s*/, '').replace(/\s*-\s*Assessment$/, '')}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <TrophyIcon className={`h-3 w-3 ${
                                        isQuizAccessible ? 'text-yellow-500' : 'text-gray-300'
                                      }`} />
                                      <span className={`text-xs ${
                                        isQuizAccessible ? 'text-gray-500' : 'text-gray-400'
                                      }`}>
                                        {quiz.total_points} pts • {quiz.time_limit_minutes || 30} min
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-2">
                                    {isQuizCompleted ? (
                                      <CheckCircleIconSolid className="h-5 w-5 text-emerald-500" />
                                    ) : isCurrent ? (
                                      <div className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center">
                                        <span className="text-xs text-white font-bold">?</span>
                                      </div>
                                    ) : isQuizAccessible ? (
                                      <div className="h-5 w-5 rounded-full border-2 border-purple-400 flex items-center justify-center">
                                        <span className="text-xs text-purple-400 font-bold">?</span>
                                      </div>
                                    ) : (
                                      <LockClosedIcon className="h-5 w-5 text-gray-300" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
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
                    width: `${(completedLessons.size / course.modules.reduce((acc, mod) => acc + (mod.content?.lessons?.length || 0), 0)) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {completedLessons.size} of {course.modules.reduce((acc, mod) => acc + (mod.content?.lessons?.length || 0), 0)} lessons completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Overlay */}
      {showQuiz && currentQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="p-6">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  🎯 {currentQuiz.title}
                </h2>
                <p className="text-gray-600">
                  {currentQuiz.description}
                </p>
                <div className="flex items-center justify-center space-x-4 mt-3 text-sm text-gray-500">
                  <span>🏆 {currentQuiz.total_points} pts</span>
                  <span>⏱️ {currentQuiz.time_limit_minutes} min</span>
                  <span>✅ {currentQuiz.passing_score}% to pass</span>
                </div>
              </div>
              
              <QuizComponent 
                quizId={currentQuiz.quiz_id}
                moduleId={currentModule?.module_id}
                onQuizComplete={handleQuizComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLearningPage;