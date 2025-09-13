import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { quizService } from '../services/quizService';
import { ApiCourse, ApiModule } from '../types';
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
  BookOpenIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ListBulletIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  video_url?: string;
  completed: boolean;
  type: 'video' | 'text' | 'quiz' | 'assignment';
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

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  quizzes?: ModuleQuiz[];
  progress: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  instructor: string;
  totalDuration: string;
  progress: number;
}

const CourseLearnPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<ModuleQuiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [quizCorrectAnswers, setQuizCorrectAnswers] = useState<Record<string, string>>({});

  // Load course data from API
  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      try {
        setIsLoading(true);
        
        // Load course with modules from API
        const courseResponse = await courseService.getCourse(courseId, true);
        
        if (courseResponse && (courseResponse as any).course) {
          const apiCourse: ApiCourse = (courseResponse as any).course;
          
          // Load modules for the course
          const modulesResponse = await courseService.getCourseModules(courseId);
          let modules: Module[] = [];
          
          if (modulesResponse && (modulesResponse as any).modules) {
            // Load lessons and quizzes for each module
            modules = await Promise.all(
              (modulesResponse as any).modules.map(async (apiModule: ApiModule) => {
                try {
                  const lessonsResponse = await courseService.getModuleLessons(
                    apiModule.module_id, 
                    true // include progress
                  );
                  
                  const lessons: Lesson[] = [];
                  
                  // Load lessons with completion status
                  if ((lessonsResponse as any)?.lessons) {
                    for (const apiLesson of (lessonsResponse as any).lessons) {
                      let isCompleted = false;
                      
                      // Check completion status from API
                      try {
                        const progressResponse = await courseService.getLessonProgress(apiLesson.lesson_id);
                        if ((progressResponse as any)?.lesson_progress?.completion_percentage >= 100) {
                          isCompleted = true;
                        }
                      } catch (error) {
                        console.warn(`Failed to load progress for lesson ${apiLesson.lesson_id}:`, error);
                      }
                      
                      lessons.push({
                        id: apiLesson.lesson_id,
                        title: apiLesson.title,
                        description: apiLesson.description,
                        duration: `${apiLesson.duration_minutes} MIN`,
                        video_url: apiLesson.content_url,
                        completed: isCompleted,
                        type: apiLesson.content_type as 'video' | 'text' | 'quiz' | 'assignment'
                      });
                    }
                  }

                  // Load quizzes for this module
                  console.log(`🔍 Fetching quizzes for module: ${apiModule.module_id} (${apiModule.title})`);
                  let moduleQuizzes: ModuleQuiz[] = [];
                  try {
                    const quizResponse = await quizService.getModuleQuizzes(apiModule.module_id) as any;
                    console.log(`📝 Quiz response for module ${apiModule.module_id}:`, quizResponse);
                    console.log(`📝 Number of quizzes found: ${quizResponse?.quizzes?.length || 0}`);
                    
                    if (quizResponse?.quizzes?.length > 0) {
                      console.log(`✅ Found ${quizResponse.quizzes.length} quiz(es) for module ${apiModule.module_id}`);
                      moduleQuizzes = quizResponse.quizzes.map((quiz: any) => ({
                        quiz_id: quiz.quiz_id,
                        title: quiz.title,
                        description: quiz.description,
                        total_points: quiz.total_points,
                        passing_score: quiz.passing_score,
                        time_limit_minutes: quiz.time_limit_minutes,
                        max_attempts: quiz.max_attempts
                      }));
                    } else {
                      console.log(`❌ No quizzes found for module ${apiModule.module_id}`);
                    }
                  } catch (error) {
                    console.error(`❌ Failed to load quizzes for module ${apiModule.module_id}:`, error);
                  }
                  
                  // Calculate module progress based on completed lessons
                  const completedCount = lessons.filter(l => l.completed).length;
                  const moduleProgress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
                  
                  return {
                    id: apiModule.module_id,
                    title: apiModule.title,
                    description: apiModule.description,
                    progress: moduleProgress,
                    lessons,
                    quizzes: moduleQuizzes
                  };
                } catch (error) {
                  console.error(`Failed to load lessons for module ${apiModule.module_id}:`, error);
                  return {
                    id: apiModule.module_id,
                    title: apiModule.title,
                    description: apiModule.description,
                    progress: 0,
                    lessons: []
                  };
                }
              })
            );
          }
          
          // Calculate overall course progress
          const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
          const completedLessons = modules.reduce((acc, m) => 
            acc + m.lessons.filter(l => l.completed).length, 0
          );
          const courseProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

          // Convert to Course format
          const course: Course = {
            id: apiCourse.course_id,
            title: apiCourse.title,
            description: apiCourse.description,
            instructor: 'Instructor', // TODO: Get instructor name
            totalDuration: `${apiCourse.metadata.estimated_hours || 0} hours`,
            progress: courseProgress,
            modules
          };

          setCourse(course);
          if (modules.length > 0) {
            setCurrentModule(modules[0]);
            if (modules[0].lessons.length > 0) {
              setCurrentLesson(modules[0].lessons[0]);
            }
          }
          
          // Load quiz completion status
          await loadQuizCompletionStatus(course);
        } else {
          throw new Error('Course not found');
        }
      } catch (error) {
        console.error('Failed to load course:', error);
        toast.error('Failed to load course');
        
        // Fallback to demo data
        const mockCourse: Course = {
          id: courseId || '1',
          title: 'Demo Course',
          description: 'Master the fundamentals of modern web development',
          instructor: 'Demo Instructor',
          totalDuration: '12 hours',
          progress: 15,
          modules: [
            {
              id: 'welcome',
              title: 'Welcome',
              description: 'Introduction to the course',
              progress: 100,
              lessons: [
                {
                  id: 'welcome-1',
                  title: 'A message from your instructor',
                  description: 'Welcome message and course overview',
                  duration: '1 MIN',
                  video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                  completed: false,
                  type: 'video'
                }
              ]
            }
          ]
        };
        setCourse(mockCourse);
        setCurrentModule(mockCourse.modules[0]);
        setCurrentLesson(mockCourse.modules[0].lessons[0]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  // Quiz timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (showQuiz && quizTimeLeft > 0 && !quizSubmitted) {
      timer = setInterval(() => {
        setQuizTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - auto submit
            handleQuizSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showQuiz, quizTimeLeft, quizSubmitted]);

  const loadQuizCompletionStatus = async (courseData: Course) => {
    try {
      const completedQuizIds = new Set<string>();
      
      // Get all quiz attempts for this user
      const attemptsResponse = await quizService.getQuizAttempts(courseData.id) as any;
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

  const handleQuizSelect = async (module: Module, quiz: ModuleQuiz) => {
    // Check if quiz is accessible (all lessons in module completed)
    const allLessonsCompleted = module.lessons.every(lesson => lesson.completed);

    if (!allLessonsCompleted) {
      const incompleteLessons = module.lessons.filter(lesson => !lesson.completed);
      
      toast.error(
        `🔒 Quiz locked! Complete ${incompleteLessons.length} remaining lesson${incompleteLessons.length > 1 ? 's' : ''} in "${module.title}" first.`, 
        {
          duration: 5000,
          icon: '🔒'
        }
      );
      return;
    }

    try {
      // Load the full quiz with questions
      console.log(`🔍 Loading quiz: ${quiz.quiz_id}`);
      const quizResponse = await quizService.getQuiz(quiz.quiz_id, true) as any;
      
      if (quizResponse && quizResponse.quiz) {
        const fullQuiz = quizResponse.quiz;
        
        // Store correct answers for results display
        const correctAnswers: Record<string, string> = {};
        fullQuiz.questions?.forEach((question: any) => {
          if (question.correct_answer) {
            correctAnswers[question.question_id] = question.correct_answer;
          }
        });
        
        // Set quiz state
        setCurrentQuiz(quiz);
        setQuizQuestions(fullQuiz.questions || []);
        setQuizAnswers({});
        setQuizCorrectAnswers(correctAnswers);
        setQuizTimeLeft(quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : 1800); // Default 30 minutes
        setQuizSubmitted(false);
        setQuizScore(0);
        setQuizResults(null);
        setShowQuiz(true);
        
        console.log(`✅ Quiz loaded: ${fullQuiz.questions?.length || 0} questions`);
        console.log(`📝 Correct answers stored:`, correctAnswers);
      } else {
        throw new Error('Quiz not found');
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
      toast.error('Failed to load quiz. Please try again.');
    }
  };

  const handleQuizSubmit = async () => {
    if (!currentQuiz || quizSubmitted) return;
    
    try {
      setQuizSubmitted(true);
      
      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;
      const results: any[] = [];
      
      quizQuestions.forEach(question => {
        const userAnswer = quizAnswers[question.question_id];
        const correctAnswer = quizCorrectAnswers[question.question_id];
        const isCorrect = userAnswer === correctAnswer;
        
        if (isCorrect) {
          correctAnswers++;
        }
        
        totalPoints += question.points;
        results.push({
          question: question,
          userAnswer: userAnswer,
          correctAnswer: correctAnswer,
          isCorrect: isCorrect,
          points: isCorrect ? question.points : 0
        });
      });
      
      const score = totalPoints > 0 ? (correctAnswers / quizQuestions.length) * 100 : 0;
      const passed = score >= currentQuiz.passing_score;
      
      setQuizScore(score);
      setQuizResults({ results, passed, correctAnswers, totalQuestions: quizQuestions.length });
      
      // Mark quiz as completed if passed
      if (passed) {
        setCompletedQuizzes(prev => new Set([...prev, currentQuiz.quiz_id]));
      }
      
      // Show result message
      if (passed) {
        toast.success(`🎉 Quiz passed! Score: ${score.toFixed(1)}%`, {
          duration: 5000,
          icon: '🏆'
        });
      } else {
        toast.error(`Quiz score: ${score.toFixed(1)}%. You can retake it to improve!`, {
          duration: 5000,
          icon: '📝'
        });
      }
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
      setQuizSubmitted(false);
    }
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
    setCurrentQuiz(null);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizCorrectAnswers({});
    setQuizTimeLeft(0);
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizResults(null);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Check if a lesson is accessible (previous lessons must be completed)
  const isLessonAccessible = (targetModule: Module, targetLesson: Lesson) => {
    if (!course) return false;
    
    const moduleIndex = course.modules.findIndex(m => m.id === targetModule.id);
    const lessonIndex = targetModule.lessons.findIndex(l => l.id === targetLesson.id);
    
    // First lesson of first module is always accessible
    if (moduleIndex === 0 && lessonIndex === 0) return true;
    
    // If it's the first lesson of a module (but not the first module)
    if (lessonIndex === 0 && moduleIndex > 0) {
      // Check if previous module is completed
      const previousModule = course.modules[moduleIndex - 1];
      const allPreviousLessonsCompleted = previousModule.lessons.every(lesson =>
        lesson.completed
      );
      return allPreviousLessonsCompleted;
    }
    
    // For lessons within a module, check if previous lesson is completed
    const previousLesson = targetModule.lessons[lessonIndex - 1];
    return previousLesson ? previousLesson.completed : false;
  };

  const handleLessonSelect = (module: Module, lesson: Lesson) => {
    if (!course) return;
    
    // Check if lesson is accessible
    if (!isLessonAccessible(module, lesson)) {
      const moduleIndex = course.modules.findIndex(m => m.id === module.id);
      const lessonIndex = module.lessons.findIndex(l => l.id === lesson.id);
      
      if (lessonIndex === 0 && moduleIndex > 0) {
        toast.error(`Complete all lessons in "${course.modules[moduleIndex - 1]?.title}" before accessing this module!`, {
          duration: 4000,
          icon: '🔒'
        });
      } else {
        const previousLesson = module.lessons[lessonIndex - 1];
        toast.error(`Complete "${previousLesson?.title}" before accessing "${lesson.title}"!`, {
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

    // Update lesson and module
    setCurrentModule(module);
    setCurrentLesson(lesson);
  };


  // Store interval ref to clear it when needed
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);

  // Initialize YouTube player when lesson changes
  useEffect(() => {
    const initializePlayer = async () => {
      if (!currentLesson?.video_url || !isYouTubeUrl(currentLesson.video_url)) {
        return;
      }

      const videoId = getYouTubeVideoId(currentLesson.video_url);
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
          const playerId = `youtube-player-${videoId}`;
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

    if (currentLesson?.video_url && isYouTubeUrl(currentLesson.video_url)) {
      initializePlayer();
    }
    
    // Cleanup function
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [currentLesson?.video_url]);

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

  // Function to sync course progress to global state/dashboard
  const syncCourseProgress = async (courseData: Course) => {
    try {
      // Save course progress to backend for dashboard sync
      await courseService.updateCourseProgress(courseData.id, {
        overall_progress: courseData.progress,
        completed_modules: courseData.modules.filter(m => m.progress >= 100).length,
        total_modules: courseData.modules.length,
        completed_lessons: courseData.modules.reduce((acc, m) => 
          acc + m.lessons.filter(l => l.completed).length, 0
        ),
        total_lessons: courseData.modules.reduce((acc, m) => acc + m.lessons.length, 0),
        last_updated: new Date().toISOString()
      });
      console.log(`✅ Synced course progress: ${courseData.progress.toFixed(1)}% for "${courseData.title}"`);
    } catch (error) {
      console.warn('Failed to sync course progress to dashboard:', error);
    }
  };

  const handleCompleteLesson = async () => {
    if (currentLesson && currentModule) {
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

        // Update lesson progress via API
        await courseService.updateLessonProgress(currentLesson.id, {
          completion_percentage: 100,
          time_spent_minutes: 5, // TODO: Track actual time spent
          notes: `Completed lesson: ${currentLesson.title}`
        });
        
        // Update local state
        const updatedLesson = { ...currentLesson, completed: true };
        const updatedLessons = currentModule.lessons.map(l => 
          l.id === currentLesson.id ? updatedLesson : l
        );
        const updatedModule = { ...currentModule, lessons: updatedLessons };
        
        // Update progress
        const completedCount = updatedLessons.filter(l => l.completed).length;
        updatedModule.progress = (completedCount / updatedLessons.length) * 100;
        
        setCurrentModule(updatedModule);
        setCurrentLesson(updatedLesson);
        
        // Update course
        if (course) {
          const updatedModules = course.modules.map(m => 
            m.id === currentModule.id ? updatedModule : m
          );
          const totalLessons = updatedModules.reduce((acc, m) => acc + m.lessons.length, 0);
          const completedLessons = updatedModules.reduce((acc, m) => 
            acc + m.lessons.filter(l => l.completed).length, 0
          );
          const updatedCourse = { 
            ...course, 
            modules: updatedModules,
            progress: (completedLessons / totalLessons) * 100
          };
          setCourse(updatedCourse);
          
          // 🔄 Sync progress to dashboard
          await syncCourseProgress(updatedCourse);
          
          // Notify other components (like sidebar) about progress update
          window.dispatchEvent(new CustomEvent('courseProgressUpdated'));
        }
        
        toast.success('Lesson completed!');

        // Auto-advance to next lesson after completion
        setTimeout(() => {
          const nextLesson = getNextLesson();
          if (nextLesson && isLessonAccessible(nextLesson.module, nextLesson.lesson)) {
            handleLessonSelect(nextLesson.module, nextLesson.lesson);
          }
        }, 1000); // Small delay to let user see completion message
        
      } catch (error) {
        console.error('Failed to update lesson progress:', error);
        toast.error('Failed to save progress. Please try again.');
      } finally {
        setIsCompletingLesson(false); // End loading
      }
    }
  };

  const getNextLesson = () => {
    if (!course || !currentModule || !currentLesson) return null;
    
    const currentModuleIndex = course.modules.findIndex(m => m.id === currentModule.id);
    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
    
    // Next lesson in current module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      return {
        module: currentModule,
        lesson: currentModule.lessons[currentLessonIndex + 1]
      };
    }
    
    // First lesson in next module
    if (currentModuleIndex < course.modules.length - 1) {
      const nextModule = course.modules[currentModuleIndex + 1];
      return {
        module: nextModule,
        lesson: nextModule.lessons[0]
      };
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Course not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col`}>
        {showSidebar && (
          <>
            {/* Course Header */}
            <div className="p-6 border-b border-slate-200">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Go to Dashboard
              </button>
              
              <h1 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h1>
              <p className="text-sm text-slate-600 mb-4">{course.description}</p>
              
              <div className="flex items-center text-sm text-slate-500 mb-3">
                <AcademicCapIcon className="w-4 h-4 mr-2" />
                <span>{course.instructor}</span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>{course.progress.toFixed(0)}% complete</span>
                  <span>{course.totalDuration}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Module List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                  <ListBulletIcon className="w-4 h-4 mr-2" />
                  Search by lesson title
                </h3>
                
                <div className="space-y-4">
                  {course.modules.map((module) => (
                    <div key={module.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* Module Header */}
                      <div className="bg-slate-50 p-3 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-900">{module.title}</h4>
                          <div className="flex items-center text-sm text-slate-500">
                            <span>{module.lessons.length} lessons</span>
                            {module.progress > 0 && (
                              <CheckCircleSolid className="w-4 h-4 text-green-500 ml-1" />
                            )}
                          </div>
                        </div>
                        {module.progress > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-slate-200 rounded-full h-1">
                              <div 
                                className="bg-green-500 h-1 rounded-full"
                                style={{ width: `${module.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Lessons */}
                      <div className="divide-y divide-slate-100">
                        {module.lessons.map((lesson) => {
                          const isAccessible = isLessonAccessible(module, lesson);
                          const isCurrent = currentLesson?.id === lesson.id;
                          
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonSelect(module, lesson)}
                              disabled={!isAccessible}
                              className={`w-full p-3 text-left transition-colors ${
                                isCurrent
                                  ? 'bg-blue-50 border-r-2 border-blue-600'
                                  : isAccessible
                                  ? 'hover:bg-blue-50'
                                  : 'opacity-50 cursor-not-allowed bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {lesson.completed ? (
                                    <CheckCircleSolid className="w-5 h-5 text-green-500" />
                                  ) : !isAccessible ? (
                                    <LockClosedIcon className="w-5 h-5 text-slate-400" />
                                  ) : lesson.type === 'video' ? (
                                    <PlayIcon className="w-5 h-5 text-slate-400" />
                                  ) : lesson.type === 'quiz' ? (
                                    <BookOpenIcon className="w-5 h-5 text-slate-400" />
                                  ) : (
                                    <ClockIcon className="w-5 h-5 text-slate-400" />
                                  )}
                                  <div>
                                    <h5 className={`font-medium text-sm ${
                                      isAccessible ? 'text-slate-900' : 'text-slate-500'
                                    }`}>
                                      {lesson.title}
                                    </h5>
                                    <p className={`text-xs ${
                                      isAccessible ? 'text-slate-500' : 'text-slate-400'
                                    }`}>
                                      {lesson.duration}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Quizzes Section */}
                      {module.quizzes && module.quizzes.length > 0 && (
                        <>
                          <div className="mt-4 pt-2 border-t border-slate-100">
                            <div className="flex items-center space-x-2 mb-2">
                              <BookOpenIcon className="h-4 w-4 text-purple-500" />
                              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                                Quizzes & Assessments
                              </span>
                            </div>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {module.quizzes.map((quiz) => {
                              const allLessonsCompleted = module.lessons.every(lesson => lesson.completed);
                              const isQuizCompleted = completedQuizzes.has(quiz.quiz_id);
                              const isQuizAccessible = allLessonsCompleted;
                              
                              return (
                                <button
                                  key={quiz.quiz_id}
                                  onClick={() => isQuizAccessible ? handleQuizSelect(module, quiz) : undefined}
                                  disabled={!isQuizAccessible}
                                  className={`w-full p-3 text-left transition-colors ${
                                    isQuizCompleted
                                      ? 'bg-green-50 border-r-2 border-green-600'
                                      : isQuizAccessible
                                      ? 'hover:bg-purple-50'
                                      : 'opacity-50 cursor-not-allowed bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      {isQuizCompleted ? (
                                        <CheckCircleSolid className="w-5 h-5 text-green-500" />
                                      ) : !isQuizAccessible ? (
                                        <LockClosedIcon className="w-5 h-5 text-slate-400" />
                                      ) : (
                                        <BookOpenIcon className="w-5 h-5 text-purple-500" />
                                      )}
                                      <div>
                                        <h5 className={`font-medium text-sm ${
                                          isQuizAccessible ? 'text-slate-900' : 'text-slate-500'
                                        }`}>
                                          {quiz.title.replace(/^Module \d+:\s*/, '').replace(/\s*-\s*Assessment$/, '')}
                                        </h5>
                                        <p className={`text-xs ${
                                          isQuizAccessible ? 'text-slate-500' : 'text-slate-400'
                                        }`}>
                                          {quiz.total_points} pts • {quiz.time_limit_minutes || 30} min
                                          {!isQuizAccessible && ' • Complete all lessons'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ListBulletIcon className="w-5 h-5 text-slate-600" />
            </button>
            
            <div>
              <h2 className="font-semibold text-slate-900">{currentLesson?.title}</h2>
              <p className="text-sm text-slate-600">{currentModule?.title}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
              📺 0 DISCUSSIONS
            </span>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChatBubbleLeftIcon className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Cog6ToothIcon className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
        
        {/* Video/Content Area */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          {currentLesson?.type === 'video' && currentLesson.video_url ? (
            <div className="w-full h-full relative">
              {isYouTubeUrl(currentLesson.video_url) ? (
                <div className="w-full h-full">
                  <div 
                    id={`youtube-player-${getYouTubeVideoId(currentLesson.video_url)}`}
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
                  <source src={currentLesson.video_url} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ) : (
            <div className="text-center text-white">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                {currentLesson?.type === 'video' ? (
                  <PlayIcon className="w-10 h-10" />
                ) : currentLesson?.type === 'quiz' ? (
                  <BookOpenIcon className="w-10 h-10" />
                ) : (
                  <ClockIcon className="w-10 h-10" />
                )}
              </div>
              <h3 className="text-lg font-medium mb-2">{currentLesson?.title}</h3>
              <p className="text-white text-opacity-75">{currentLesson?.description}</p>
              {currentLesson?.type === 'video' && !currentLesson.video_url && (
                <p className="text-sm text-red-400 mt-2">Video URL not available</p>
              )}
            </div>
          )}
          
          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                {currentLesson?.type === 'video' && currentLesson.video_url && (
                  <>
                    <button 
                      onClick={handlePlayPause}
                      className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
                      disabled={!youtubePlayer && isYouTubeUrl(currentLesson.video_url)}
                    >
                      {isPlaying ? (
                        <PauseIcon className="w-6 h-6" />
                      ) : (
                        <PlayIcon className="w-6 h-6" />
                      )}
                    </button>
                    
                    <div className="text-sm">
                      <span>{currentTime}</span>
                      <span className="text-white text-opacity-60 mx-2">/</span>
                      <span>{duration}</span>
                    </div>
                  </>
                )}
                
                {currentLesson?.type !== 'video' && (
                  <div className="flex items-center space-x-2 text-white text-opacity-75">
                    <ClockIcon className="w-5 h-5" />
                    <span>{currentLesson?.duration || '0 MIN'}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {!currentLesson?.completed && (
                  <button
                    onClick={handleCompleteLesson}
                    disabled={isCompletingLesson}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                      isCompletingLesson
                        ? 'bg-blue-500 cursor-not-allowed opacity-80'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isCompletingLesson && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span>{isCompletingLesson ? 'COMPLETING...' : 'COMPLETE & CONTINUE'}</span>
                  </button>
                )}
                
                {getNextLesson() && (
                  <button
                    onClick={() => {
                      const next = getNextLesson();
                      if (next && isLessonAccessible(next.module, next.lesson)) {
                        handleLessonSelect(next.module, next.lesson);
                      }
                    }}
                    className={`flex items-center transition-colors ${
                      getNextLesson() && isLessonAccessible(getNextLesson()!.module, getNextLesson()!.lesson)
                        ? 'text-white hover:text-blue-300'
                        : 'text-white/50 cursor-not-allowed'
                    }`}
                    disabled={getNextLesson() ? !isLessonAccessible(getNextLesson()!.module, getNextLesson()!.lesson) : true}
                  >
                    <ArrowRightIcon className="w-5 h-5 mr-1" />
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Overlay */}
      {showQuiz && currentQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="p-6">
              {/* Quiz Header */}
              <div className="mb-6 text-center">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handleQuizClose}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4" />
                      <span className={`font-mono ${quizTimeLeft < 300 ? 'text-red-600 font-bold animate-pulse' : ''}`}>
                        {formatTime(quizTimeLeft)}
                      </span>
                      {quizTimeLeft < 300 && quizTimeLeft > 0 && (
                        <span className="text-red-600 text-xs font-medium">Time running low!</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {quizQuestions.length} questions
                    </div>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  🎯 {currentQuiz.title}
                </h2>
                <p className="text-gray-600 mb-3">
                  {currentQuiz.description}
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <span>🏆 {currentQuiz.total_points} pts</span>
                  <span>⏱️ {currentQuiz.time_limit_minutes || 30} min</span>
                  <span>✅ {currentQuiz.passing_score}% to pass</span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Object.keys(quizAnswers).length} of {quizQuestions.length} answered</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(Object.keys(quizAnswers).length / quizQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {!quizSubmitted ? (
                /* Quiz Questions */
                <div className="space-y-6">
                  {quizQuestions.map((question, index) => (
                    <div key={question.question_id} className="bg-gray-50 rounded-lg p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Question {index + 1} of {quizQuestions.length}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {question.question_text}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        {question.options.map((option: string, optionIndex: number) => (
                          <label
                            key={optionIndex}
                            className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              quizAnswers[question.question_id] === option
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.question_id}
                              value={option}
                              checked={quizAnswers[question.question_id] === option}
                              onChange={(e) => setQuizAnswers(prev => ({
                                ...prev,
                                [question.question_id]: e.target.value
                              }))}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                              quizAnswers[question.question_id] === option
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {quizAnswers[question.question_id] === option && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Submit Button */}
                  <div className="flex justify-center pt-6">
                    <button
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length !== quizQuestions.length}
                      className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                        Object.keys(quizAnswers).length === quizQuestions.length
                          ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Submit Quiz ({Object.keys(quizAnswers).length}/{quizQuestions.length} answered)
                    </button>
                  </div>
                </div>
              ) : (
                /* Quiz Results */
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    quizResults?.passed ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className="text-4xl">
                      {quizResults?.passed ? '🎉' : '📝'}
                    </span>
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-2 ${
                    quizResults?.passed ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {quizResults?.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
                  </h3>
                  
                  <div className="text-4xl font-bold text-gray-900 mb-4">
                    {quizScore.toFixed(1)}%
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                    You answered {quizResults?.correctAnswers} out of {quizResults?.totalQuestions} questions correctly.
                    {quizResults?.passed ? ' Great job!' : ` You need ${currentQuiz.passing_score}% to pass.`}
                  </p>
                  
                  {/* Detailed Results */}
                  <div className="text-left space-y-4 mb-6">
                    {quizResults?.results.map((result: any, index: number) => (
                      <div key={index} className={`p-4 rounded-lg border-l-4 ${
                        result.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            Question {index + 1}
                          </h4>
                          <span className={`text-sm font-medium ${
                            result.isCorrect ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{result.question.question_text}</p>
                        <div className="text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">Your answer:</span> {result.userAnswer || 'No answer'}
                          </p>
                          {!result.isCorrect && (
                            <p className="text-green-600">
                              <span className="font-medium">Correct answer:</span> {result.correctAnswer}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleQuizClose}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Close Quiz
                    </button>
                    {!quizResults?.passed && (
                      <button
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                          setQuizTimeLeft(currentQuiz.time_limit_minutes ? currentQuiz.time_limit_minutes * 60 : 1800);
                          setQuizResults(null);
                        }}
                        className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseLearnPage;
