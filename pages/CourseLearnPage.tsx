import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { quizService } from '../services/quizService';
import { videoSettingsService, VideoSession } from '../services/videoSettingsService';
import { discussionService } from '../services/discussionService';
import DiscussionPanel from '../components/DiscussionPanel';
import VideoSettingsPanel from '../components/VideoSettingsPanel';
import CourseCompletionPopup from '../components/CourseCompletionPopup';
import NFTMintingTicketPopup from '../components/NFTMintingTicketPopup';
import { ApiCourse, ApiModule } from '../types';
import VideoPlayer from '../components/VideoPlayer';
import { apiService } from '../services/apiService';
import { achievementService } from '../services/achievementService';
import { notificationService } from '../services/notificationService';
import { useNotifications } from '../contexts/NotificationContext';
import { useAppContext } from '../contexts/AppContext';
import { 
  PlayIcon, 
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
import { useTranslation } from '../src/hooks/useTranslation';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  duration_minutes?: number;
  video_url?: string;
  video_content_id?: string;
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
  const { t } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { mintNftForModule } = useAppContext();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [, setIsPlaying] = useState(false);
  // Removed legacy YouTube player state
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<ModuleQuiz | null>(null);
  
  // Discussion and Video Settings state
  const [showDiscussionPanel, setShowDiscussionPanel] = useState(false);
  const [showVideoSettingsPanel, setShowVideoSettingsPanel] = useState(false);
  const [discussionCount, setDiscussionCount] = useState(0);
  const [videoSession, setVideoSession] = useState<VideoSession | null>(null);
  const [userVideoSettings, setUserVideoSettings] = useState<any | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [quizCorrectAnswers, setQuizCorrectAnswers] = useState<Record<string, string>>({});
  const [streamingUrl, setStreamingUrl] = useState<string>('');
  const [qualities, setQualities] = useState<any[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [showCourseCompletionPopup, setShowCourseCompletionPopup] = useState(false);
  const [showNFTMintingPopup, setShowNFTMintingPopup] = useState(false);
  const [nftMintingData, setNftMintingData] = useState<{
    moduleTitle: string;
    courseTitle: string;
    status: 'minting' | 'minted' | 'failed';
    tokenId?: string;
    transactionHash?: string;
  } | null>(null);

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
                        console.warn(`${t('pages.courseLearnPage.failedToLoadProgress')} ${apiLesson.lesson_id}:`, error);
                      }
                      
                      lessons.push({
                        id: apiLesson.lesson_id,
                        title: apiLesson.title,
                        description: apiLesson.description,
                        duration: `${apiLesson.duration_minutes} MIN`,
                        duration_minutes: apiLesson.duration_minutes,
                        video_url: apiLesson.content_url,
                        video_content_id: (apiLesson as any).video_content_id,
                        completed: isCompleted,
                        type: apiLesson.content_type as 'video' | 'text' | 'quiz' | 'assignment'
                      });
                    }
                  }

                  // Load quizzes for this module
                  console.log(`🔍 ${t('pages.courseLearnPage.fetchingQuizzes')} ${apiModule.module_id} (${apiModule.title})`);
                  let moduleQuizzes: ModuleQuiz[] = [];
                  try {
                    const quizResponse = await quizService.getModuleQuizzes(apiModule.module_id) as any;
                    console.log(`📝 ${t('pages.courseLearnPage.quizResponse')} ${apiModule.module_id}:`, quizResponse);
                    console.log(`📝 ${t('pages.courseLearnPage.numberOfQuizzesFound')} ${quizResponse?.quizzes?.length || 0}`);
                    
                    if (quizResponse?.quizzes?.length > 0) {
                      const message = t("quiz.foundQuizzes", {
                        count: quizResponse.quizzes.length,
                        moduleId: apiModule.module_id
                      });
                      console.log(message);
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
                      console.log(`❌ ${t('pages.courseLearnPage.noQuizzesFound')} ${apiModule.module_id}`);
                    }
                  } catch (error) {
                    console.error(`❌${t('pages.courseLearnPage.failToLoadQuizzes')} ${apiModule.module_id}:`, error);
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
                  console.error(`${t('pages.courseLearnPage.failToLoadLessons')} ${apiModule.module_id}:`, error);
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
        console.error(`${t('pages.courseLearnPage.failToLoadCourse')}: `, error);
        toast.error(t('pages.courseLearnPage.failToLoadCourse'));
        
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
              title: t('pages.courseLearnPage.welcome'),
              description: t('pages.courseLearnPage.introductionToTheCourse'),
              progress: 100,
              lessons: [
                {
                  id: 'welcome-1',
                  title: t('pages.courseLearnPage.welcomeLessons'),
                  description: t('pages.courseLearnPage.welcomeMessage'),
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

  // Fetch streaming info for S3-backed videos
  useEffect(() => {
    const fetchStreaming = async () => {
      try {
        if (currentLesson?.type === 'video' && (currentLesson as any).video_content_id) {
          const videoId = (currentLesson as any).video_content_id as string;
          try {
            const res = (await apiService.getVideoStreamingUrl(videoId)) as {
              streaming_url: string;
              qualities?: any[];
              thumbnail_url?: string;
            };
            setStreamingUrl(res.streaming_url);
            setQualities(res.qualities || []);
            setThumbnailUrl(res.thumbnail_url);
            return;
          } catch (err) {
            // If the stored video_content_id doesn't resolve (404), fall back to lesson videos
            const list = (await apiService.getLessonVideos(currentLesson.id)) as any;
            const first = list?.videos?.[0];
            if (first?.video_id) {
              setCurrentLesson(prev => prev ? ({ ...prev, video_content_id: first.video_id } as any) : prev);
              const res = (await apiService.getVideoStreamingUrl(first.video_id)) as {
                streaming_url: string;
                qualities?: any[];
                thumbnail_url?: string;
              };
              setStreamingUrl(res.streaming_url);
              setQualities(res.qualities || []);
              setThumbnailUrl(res.thumbnail_url || first.thumbnail_url);
              return;
            }
            throw err;
          }
        } else if (currentLesson?.type === 'video' && !((currentLesson as any).video_content_id)) {
          // Fallback: query lesson videos and use the first one
          const list = (await apiService.getLessonVideos(currentLesson.id)) as any;
          const first = list?.videos?.[0];
          if (first?.video_id) {
            // Update current lesson with discovered video_content_id
            setCurrentLesson(prev => prev ? ({ ...prev, video_content_id: first.video_id } as any) : prev);
            const res = (await apiService.getVideoStreamingUrl(first.video_id)) as {
              streaming_url: string;
              qualities?: any[];
              thumbnail_url?: string;
            };
            setStreamingUrl(res.streaming_url);
            setQualities(res.qualities || []);
            setThumbnailUrl(res.thumbnail_url || first.thumbnail_url);
          } else {
            setStreamingUrl('');
            setQualities([]);
            setThumbnailUrl(undefined);
          }
        } else {
          setStreamingUrl('');
          setQualities([]);
          setThumbnailUrl(undefined);
        }
      } catch (e) {
        console.error('Failed to fetch streaming URL', e);
        // Final fallback: derive S3 URL from YouTube ID if possible
        try {
          let youtubeId: string | null = null;
          const vcid = (currentLesson as any)?.video_content_id as string | undefined;
          if (vcid && vcid.startsWith('youtube_')) {
            const after = vcid.slice('youtube_'.length);
            youtubeId = after.split('_course_')[0];
          }
          if (!youtubeId && currentLesson?.video_url) {
            const url = currentLesson.video_url;
            if (url.includes('watch?v=')) youtubeId = new URL(url).searchParams.get('v');
            else if (url.includes('youtu.be/')) youtubeId = url.split('youtu.be/')[1]?.split('?')[0] || null;
          }
          if (youtubeId) {
            const derived = `https://learntwinchain.s3.ap-southeast-1.amazonaws.com/videos/${youtubeId}.mp4`;
            setStreamingUrl(derived);
            setQualities([]);
            setThumbnailUrl(`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`);
          }
        } catch {}
      }
    };
    fetchStreaming();
  }, [currentLesson]);

  // Load video settings and discussion count
  useEffect(() => {
    const loadVideoSettings = async () => {
      try {
        const vs = await videoSettingsService.getVideoSettings();
        setUserVideoSettings(vs);
      } catch (error) {
        console.warn('Failed to load video settings:', error);
      }
    };

    loadVideoSettings();
  }, []);

  // Load discussion count for current lesson
  useEffect(() => {
    const loadDiscussionCount = async () => {
      if (!courseId || !currentLesson) return;
      
      try {
        const discussions = await discussionService.getDiscussions({
          course_id: courseId,
          lesson_id: currentLesson.id,
          limit: 1
        });
        setDiscussionCount(discussions.total || 0);
      } catch (error) {
        console.warn('Failed to load discussion count:', error);
        setDiscussionCount(0);
      }
    };

    loadDiscussionCount();
  }, [courseId, currentLesson]);

  // Create video session when lesson starts
  useEffect(() => {
    const createVideoSession = async () => {
      if (!courseId || !currentLesson || !currentModule) return;
      
      try {
        const session = await videoSettingsService.createVideoSession({
          course_id: courseId,
          module_id: currentModule.id,
          lesson_id: currentLesson.id,
          video_url: currentLesson.video_url || '',
          video_duration: parseInt(currentLesson.duration) || 0
        });
        setVideoSession(session);
      } catch (error) {
        console.warn('Failed to create video session:', error);
      }
    };

    if (currentLesson && currentLesson.type === 'video') {
      createVideoSession();
    }
  }, [courseId, currentLesson, currentModule]);

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
      
      // First try to load from localStorage as fallback
      try {
        const storedQuizzes = localStorage.getItem(`completed_quizzes_${courseData.id}`);
        if (storedQuizzes) {
          const storedIds = JSON.parse(storedQuizzes);
          storedIds.forEach((id: string) => completedQuizIds.add(id));
          console.log('Loaded completed quizzes from localStorage:', storedIds);
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
      
      // Get all quiz attempts for this user
      const attemptsResponse = await quizService.getQuizAttempts(courseData.id) as any;
      console.log('Quiz attempts response:', attemptsResponse);
      
      if (attemptsResponse && attemptsResponse.attempts) {
        attemptsResponse.attempts.forEach((attempt: any) => {
          console.log('Quiz attempt:', attempt);
          // Check multiple conditions for completion
          const isCompleted = (
            (attempt.passed === true) ||
            (attempt.status === 'completed') ||
            (attempt.status === 'submitted' && attempt.percentage >= 70) ||
            (attempt.score >= 70) // Assuming 70% is passing
          );
          
          if (isCompleted) {
            completedQuizIds.add(attempt.quiz_id);
            console.log(`Quiz ${attempt.quiz_id} marked as completed`);
          }
        });
      }
      
      console.log('Completed quiz IDs:', Array.from(completedQuizIds));
      setCompletedQuizzes(completedQuizIds);
      
      // Also save to localStorage as backup
      localStorage.setItem(`completed_quizzes_${courseData.id}`, JSON.stringify(Array.from(completedQuizIds)));
    } catch (error) {
      console.warn('Failed to load quiz completion status:', error);
      // Fallback to localStorage only
      try {
        const storedQuizzes = localStorage.getItem(`completed_quizzes_${courseData.id}`);
        if (storedQuizzes) {
          const storedIds = JSON.parse(storedQuizzes);
          setCompletedQuizzes(new Set(storedIds));
          console.log('Using localStorage fallback for completed quizzes:', storedIds);
        }
      } catch (fallbackError) {
        console.warn('Failed to load from localStorage fallback:', fallbackError);
      }
    }
  };

  const handleQuizSelect = async (module: Module, quiz: ModuleQuiz) => {
    // Check if quiz is accessible (all lessons in module completed)
    const allLessonsCompleted = module.lessons.every(lesson => lesson.completed);

    if (!allLessonsCompleted) {
      const incompleteLessons = module.lessons.filter(lesson => !lesson.completed);
      
      toast.error(
        `🔒 ${t('pages.courseLearnPage.quizLocked', {
          count: incompleteLessons.length,
          moduleTitle: module.title
        })}`, 
        {
          duration: 5000,
          icon: '🔒'
        }
      );
      return;
    }

    try {
      // Load the full quiz with questions
      console.log(`🔍 ${t('pages.courseLearnPage.loadingQuiz')} ${quiz.quiz_id}`);
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
        
        console.log(`✅ ${t('pages.courseLearnPage.quizLoaded', {
          count: fullQuiz.questions?.length || 0
        })}`);
        console.log(`📝 ${t('pages.courseLearnPage.correctAnswers')}`, correctAnswers);
      } else {
        throw new Error(t('pages.courseLearnPage.quizNotFound'));
      }
    } catch (error) {
      console.error(`${t('pages.courseLearnPage.failedToLoadQuiz')}`, error);
      toast.error(t('pages.courseLearnPage.failToLoadQuizTryAgain'));
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
      
      // Submit quiz attempt to backend
      try {
        // First start a quiz attempt
        const startResponse = await quizService.startQuizAttempt(currentQuiz.quiz_id);
        console.log('Quiz attempt started:', startResponse);
        
        // Then submit the attempt with answers
        const attemptId = startResponse.attempt_id || `attempt_${Date.now()}`;
        const submitResponse = await quizService.submitQuizAttempt(attemptId, quizAnswers);
        console.log('Quiz attempt submitted:', submitResponse);
        
        // Update module progress with quiz score
        if (currentModule && passed) {
          await courseService.updateModuleProgress(currentModule.id, {
            assessment_score: score,
            assessment_id: currentQuiz.quiz_id
          });
        }
        
      } catch (apiError) {
        console.warn('Failed to submit quiz to backend:', apiError);
        // Continue with local logic even if backend fails
      }
      
      // Mark quiz as completed if passed
      if (passed) {
        setCompletedQuizzes(prev => {
          const newSet = new Set([...prev, currentQuiz.quiz_id]);
          // Also save to localStorage immediately
          if (course) {
            localStorage.setItem(`completed_quizzes_${course.id}`, JSON.stringify(Array.from(newSet)));
          }
          return newSet;
        });
        
        // Show achievement notifications
        notificationService.showQuizCompletionNotification(currentQuiz.title, score);
        addNotification({
          type: 'achievement',
          title: '🎯 Quiz Completed!',
          message: `Great job! You passed "${currentQuiz.title}" with ${score.toFixed(1)}%`,
          icon: '🎯'
        });
        
        // Check for NFT earning for excellent quiz performance
        if (score >= 90) {
          addNotification({
            type: 'achievement',
            title: '🏆 Excellent Score!',
            message: `Outstanding performance! You scored ${score.toFixed(1)}% on "${currentQuiz.title}"`,
            icon: '🏆'
          });

          // Check if this is the last quiz in the module and module is now complete
          if (currentModule) {
            const moduleHasQuizzes = currentModule.quizzes && currentModule.quizzes.length > 0;
            const allQuizzesCompleted = moduleHasQuizzes ? 
              currentModule.quizzes!.every(quiz => completedQuizzes.has(quiz.quiz_id)) : true;
            const allLessonsCompleted = currentModule.lessons.every(lesson => lesson.completed);

            // If module is now fully completed (lessons + quizzes), mint NFT
            if (allLessonsCompleted && allQuizzesCompleted) {
              try {
                // Show NFT minting ticket popup
                setNftMintingData({
                  moduleTitle: currentModule.title,
                  courseTitle: course?.title || 'Course',
                  status: 'minting'
                });
                setShowNFTMintingPopup(true);

                // Show NFT minting notification
                addNotification({
                  type: 'achievement',
                  title: '🎫 NFT Ticket Generated!',
                  message: `Congratulations! You've earned an NFT for completing "${currentModule.title}"`,
                  icon: '🎫'
                });

                // Start NFT minting process
                await mintNftForModule(currentModule.id, currentModule.title, score);
                
                // Update popup with success status
                setNftMintingData(prev => prev ? {
                  ...prev,
                  status: 'minted',
                  tokenId: `token_${currentModule.id}`,
                  transactionHash: `tx_${currentModule.id}_${Date.now()}`
                } : null);
                
                // Show success notification after minting
                setTimeout(() => {
                  addNotification({
                    type: 'achievement',
                    title: '🎉 NFT Minted Successfully!',
                    message: `Your module completion NFT for "${currentModule.title}" has been minted!`,
                    icon: '🎉'
                  });
                }, 1000);

              } catch (error) {
                console.error('Failed to mint NFT for module:', error);
                
                // Update popup with failed status
                setNftMintingData(prev => prev ? {
                  ...prev,
                  status: 'failed'
                } : null);
                
                addNotification({
                  type: 'achievement',
                  title: '⚠️ NFT Minting Failed',
                  message: `Failed to mint NFT for "${currentModule.title}". Please try again later.`,
                  icon: '⚠️'
                });
              }
            }
          }
        }
        
        // Check for recent achievements
        try {
          const response = await achievementService.getRecentAchievements(1);
          if (response && (response as any).recent_achievements) {
            (response as any).recent_achievements.forEach((achievement: any) => {
              notificationService.showAchievementNotification(achievement.title);
              addNotification({
                type: 'achievement',
                title: `🏆 Achievement Unlocked!`,
                message: achievement.description || `You've earned: ${achievement.title}`,
                icon: '🏆'
              });
            });
          }
        } catch (error) {
          console.warn('Failed to check for new achievements:', error);
        }
        
        // Refresh quiz completion status to ensure UI is updated
        if (course) {
          await loadQuizCompletionStatus(course);
          
          // Check if course is now completed after quiz completion
          const isCourseCompleted = await checkCourseCompletion(course);
          if (isCourseCompleted) {
            // Course completed! Show certificate notification
            setTimeout(() => {
              notificationService.showCourseCompletionNotification(course.title);
              addNotification({
                type: 'achievement',
                title: '🎓 Course Completed!',
                message: `Congratulations! You've completed "${course.title}" and earned a certificate!`,
                icon: '🎓'
              });
              toast.success(`🎉 Congratulations! You've completed "${course.title}" and earned a certificate!`, {
                duration: 6000,
              });
              
              // Show completion popup
              setShowCourseCompletionPopup(true);
            }, 1500);
          }
        }
      }
      
      // Show result message
      if (passed) {
        toast.success(`🎉 ${t('pages.courseLearnPage.quizPassedScore', {
          score: score.toFixed(1)
        })}`, {
          duration: 5000,
          icon: '🏆'
        });
      } else {
        toast.error(`${t('pages.courseLearnPage.quizScore', {
          score: score.toFixed(1)
        })}`, {
          duration: 5000,
          icon: '📝'
        });
      }
      
    } catch (error) {
      console.error(`${t('pages.courseLearnPage.errorSubmittingQuiz')}`, error);
      toast.error(t('pages.courseLearnPage.failedToSubmitQuiz'));
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
        toast.error(`${t('pages.courseLearnPage.completeAllLessons', {
          moduleTitle: course.modules[moduleIndex - 1]?.title
        })}`, {
          duration: 4000,
          icon: '🔒'
        });
      } else {
        const previousLesson = module.lessons[lessonIndex - 1];
        toast.error(`${t('pages.courseLearnPage.completePreviousLesson', {
          previousLesson: previousLesson?.title,
          lesson: lesson.title
        })}`, {
          duration: 4000,
          icon: '🔒'
        });
      }
      return;
    }

    // Reset all video states immediately
    setIsPlaying(false);
    // setCurrentTime('0:00'); // Removed
    // setDuration('0:00'); // Removed

    // Update lesson and module
    setCurrentModule(module);
    setCurrentLesson(lesson);
  };


  // Removed legacy YouTube effects and controls

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

  const checkCourseCompletion = async (courseData: Course): Promise<boolean> => {
    try {
      // Check if all lessons are completed
      const allLessonsCompleted = courseData.modules.every(module => 
        module.lessons.every(lesson => lesson.completed)
      );
      
      if (!allLessonsCompleted) {
        return false;
      }
      
      // Check if all quizzes are completed
      const allQuizzesCompleted = courseData.modules.every(module => {
        if (!module.quizzes || module.quizzes.length === 0) {
          return true; // No quizzes in this module
        }
        return module.quizzes.every(quiz => completedQuizzes.has(quiz.quiz_id));
      });
      
      return allQuizzesCompleted;
    } catch (error) {
      console.error('Failed to check course completion:', error);
      return false;
    }
  };

  const checkModuleCompletionAndAchievements = async (module: Module, course: Course | null) => {
    try {
      // Check if module is completed (all lessons completed)
      const allLessonsCompleted = module.lessons.every(lesson => lesson.completed);
      
      if (allLessonsCompleted && module.progress >= 100) {
        // Module completed! Show notification
        notificationService.showLessonCompletionNotification(module.title);
        addNotification({
          type: 'achievement',
          title: '📚 Module Completed!',
          message: `Great job! You've completed the module "${module.title}"`,
          icon: '📚'
        });

        // Check if module has quizzes and if they're all completed
        const moduleHasQuizzes = module.quizzes && module.quizzes.length > 0;
        const allQuizzesCompleted = moduleHasQuizzes ? 
          module.quizzes!.every(quiz => completedQuizzes.has(quiz.quiz_id)) : true;

        // If module is fully completed (lessons + quizzes), mint NFT
        if (allQuizzesCompleted) {
          try {
            // Show NFT minting ticket popup
            setNftMintingData({
              moduleTitle: module.title,
              courseTitle: course?.title || 'Course',
              status: 'minting'
            });
            setShowNFTMintingPopup(true);

            // Show NFT minting notification
            addNotification({
              type: 'achievement',
              title: '🎫 NFT Ticket Generated!',
              message: `Congratulations! You've earned an NFT for completing "${module.title}"`,
              icon: '🎫'
            });

            // Start NFT minting process
            await mintNftForModule(module.id, module.title, 100);
            
            // Update popup with success status
            setNftMintingData(prev => prev ? {
              ...prev,
              status: 'minted',
              tokenId: `token_${module.id}`,
              transactionHash: `tx_${module.id}_${Date.now()}`
            } : null);
            
            // Show success notification after minting
            setTimeout(() => {
              addNotification({
                type: 'achievement',
                title: '🎉 NFT Minted Successfully!',
                message: `Your module completion NFT for "${module.title}" has been minted!`,
                icon: '🎉'
              });
            }, 1000);

          } catch (error) {
            console.error('Failed to mint NFT for module:', error);
            
            // Update popup with failed status
            setNftMintingData(prev => prev ? {
              ...prev,
              status: 'failed'
            } : null);
            
            addNotification({
              type: 'achievement',
              title: '⚠️ NFT Minting Failed',
              message: `Failed to mint NFT for "${module.title}". Please try again later.`,
              icon: '⚠️'
            });
          }
        }

        // Check for achievements related to this module
        if (course) {
          try {
            const response = await achievementService.getRecentAchievements(5); // Last 5 minutes

            if (response && (response as any).recent_achievements) {
              // Show notifications for new achievements
              (response as any).recent_achievements.forEach((achievement: any) => {
                notificationService.showAchievementNotification(achievement.title);
                addNotification({
                  type: 'achievement',
                  title: `🏆 Achievement Unlocked!`,
                  message: achievement.description || `You've earned: ${achievement.title}`,
                  icon: '🏆'
                });

                // Dispatch custom event for other components
                window.dispatchEvent(new CustomEvent('achievementUnlocked', {
                  detail: {
                    title: achievement.title,
                    description: achievement.description,
                    tier: achievement.tier,
                    points: achievement.points_reward
                  }
                }));
              });
            }
          } catch (error) {
            console.warn('Failed to check for new achievements:', error);
          }
        }
      }
    } catch (error) {
      console.warn(`${t('pages.courseLearnPage.failToSyncCourseProgress')}`, error);
    }
  };

  const handleCompleteLesson = async () => {
    if (currentLesson && currentModule) {
      setIsCompletingLesson(true); // Start loading
      
      try {
        // Reset playback state when completing
        setIsPlaying(false);

        // Update lesson progress via API
        await courseService.updateLessonProgress(currentLesson.id, {
          completion_percentage: 100,
          time_spent_minutes: 5, // TODO: Track actual time spent
          notes: `${t('pages.courseLearnPage.completedLesson', {
            lesson: currentLesson.title
          })}`
        });

        // Complete video session if it exists
        if (videoSession) {
          try {
            await videoSettingsService.completeVideoSession(videoSession.session_id);
            setVideoSession(null);
          } catch (error) {
            console.warn('Failed to complete video session:', error);
          }
        }
        
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
          
          // Notify other components (like sidebar) about progress update with details
          window.dispatchEvent(new CustomEvent('courseProgressUpdated', {
            detail: {
              courseId: updatedCourse.id,
              progress: Math.round(updatedCourse.progress)
            }
          }));

          // Check for module completion and achievements
          await checkModuleCompletionAndAchievements(updatedModule, updatedCourse);

          // Check if course is completed (all lessons AND all quizzes)
          const isCourseCompleted = await checkCourseCompletion(updatedCourse);
          if (isCourseCompleted) {
            // Course completed! Show certificate notification
            setTimeout(() => {
              notificationService.showCourseCompletionNotification(updatedCourse.title);
              addNotification({
                type: 'achievement',
                title: '🎓 Course Completed!',
                message: `Congratulations! You've completed "${updatedCourse.title}" and earned a certificate!`,
                icon: '🎓'
              });
              toast.success(`🎉 Congratulations! You've completed "${updatedCourse.title}" and earned a certificate!`, {
                duration: 6000,
              });
              
              // Show completion popup
              setShowCourseCompletionPopup(true);
            }, 1500);
          }
        }
        
        toast.success(t('pages.courseLearnPage.lessionCompleted'));

        // Auto-advance to next lesson after completion
        setTimeout(() => {
          const nextLesson = getNextLesson();
          if (nextLesson && isLessonAccessible(nextLesson.module, nextLesson.lesson)) {
            handleLessonSelect(nextLesson.module, nextLesson.lesson);
          }
        }, 1000); // Small delay to let user see completion message
        
      } catch (error) {
        console.error(`${t('pages.courseLearnPage.failedToUpdateLessonPregress')}`, error);
        toast.error(t('pages.courseLearnPage.failedToSaveProgress'));
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
          <h2 className="text-xl font-semibold text-slate-700 mb-2">{t('pages.courseLearnPage.courseNotFound')}</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            {t('pages.courseLearnPage.backToDashboard')}
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
                {t('pages.courseLearnPage.goToDashboar')}
              </button>
              
              <h1 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h1>
              <p className="text-sm text-slate-600 mb-4">{course.description}</p>
              
              <div className="flex items-center text-sm text-slate-500 mb-3">
                <AcademicCapIcon className="w-4 h-4 mr-2" />
                <span>{course.instructor}</span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>{t("pages.courseLearnPage.complete", { value: course.progress.toFixed(0) })}</span>
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
                  {t('pages.courseLearnPage.searchByLessonTitle')}
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
                                {t('pages.courseLearnPage.quizzesAndAssessments')}
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
                                          {!isQuizAccessible && ` • ${t('pages.courseLearnPage.completeAllLessonsAccessible')}`}
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
              💬 {discussionCount} DISCUSSIONS
            </span>
            <button 
              onClick={() => setShowDiscussionPanel(!showDiscussionPanel)}
              className={`p-2 rounded-lg transition-colors ${
                showDiscussionPanel ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <ChatBubbleLeftIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowVideoSettingsPanel(!showVideoSettingsPanel)}
              className={`p-2 rounded-lg transition-colors ${
                showVideoSettingsPanel ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Video/Content Area */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          {currentLesson?.type === 'video' ? (
            <div className="w-full h-full relative">
              <VideoPlayer
                streamingUrl={
                  streamingUrl || (
                    currentLesson.video_url && /youtube|youtu\.be/i.test(currentLesson.video_url)
                      ? ''
                      : (currentLesson.video_url || '')
                  )
                }
                thumbnailUrl={thumbnailUrl}
                qualities={qualities}
                title={currentLesson.title}
                duration={0}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full"
                initialVolume={userVideoSettings?.volume}
                preferredQuality={userVideoSettings?.preferred_quality}
                captionsEnabled={userVideoSettings?.captions_enabled}
                captionLanguage={userVideoSettings?.caption_language}
                lockPlaybackRate={true}
              />
            </div>
          ) : (
            <div className="text-center text-white">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                {currentLesson?.type === 'quiz' ? (
                  <BookOpenIcon className="w-10 h-10" />
                ) : (
                  <ClockIcon className="w-10 h-10" />
                )}
              </div>
              <h3 className="text-lg font-medium mb-2">{currentLesson?.title}</h3>
              <p className="text-white text-opacity-75">{currentLesson?.description}</p>
            </div>
          )}
          
          
        </div>

        {/* Action Bar under Video (inside main content) */}
        <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-start">
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

            {getNextLesson() && currentLesson && (
              <button
                onClick={() => {
                  const next = getNextLesson();
                  if (next && isLessonAccessible(next.module, next.lesson)) {
                    handleLessonSelect(next.module, next.lesson);
                  }
                }}
                className={`flex items-center transition-colors ${
                  getNextLesson() && isLessonAccessible(getNextLesson()!.module, getNextLesson()!.lesson)
                    ? 'text-slate-900 hover:text-blue-600'
                    : 'text-slate-400 cursor-not-allowed'
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
                        <span className="text-red-600 text-xs font-medium">{t('pages.courseLearnPage.timeRunningLow')}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t('pages.courseLearnPage.questions', { count: quizQuestions.length })}
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
                  <span>🏆 {t('pages.courseLearnPage.pts', { value: currentQuiz.total_points })}</span>
                  <span>⏱️ {t('pages.courseLearnPage.min', { value: currentQuiz.time_limit_minutes || 30 })}</span>
                  <span>✅ {t('pages.courseLearnPage.toPass', { value: currentQuiz.passing_score })}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{t('pages.courseLearnPage.progress')}</span>
                    <span>{t('pages.courseLearnPage.answered', { count: Object.keys(quizAnswers).length, value: quizQuestions.length })}</span>
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
                          {t('pages.courseLearnPage.questionOF', { count: index + 1, value: quizQuestions.length })}
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
                      {t('pages.courseLearnPage.submitQuiz', { value: `${Object.keys(quizAnswers).length}/${quizQuestions.length}` })}
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
                    {quizResults?.passed ? t('pages.courseLearnPage.quizPassed') : t('pages.courseLearnPage.quizNotPassed')}
                  </h3>
                  
                  <div className="text-4xl font-bold text-gray-900 mb-4">
                    {quizScore.toFixed(1)}%
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                    {t('pages.courseLearnPage.youAnswered', { count: quizResults?.correctAnswers, value: quizResults?.totalQuestions })}
                    {quizResults?.passed ? t('pages.courseLearnPage.greatJob') : t('pages.courseLearnPage.youNeed', { value: currentQuiz.passing_score })}
                  </p>
                  
                  {/* Detailed Results */}
                  <div className="text-left space-y-4 mb-6">
                    {quizResults?.results.map((result: any, index: number) => (
                      <div key={index} className={`p-4 rounded-lg border-l-4 ${
                        result.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {t('pages.courseLearnPage.questionNum', { count: index + 1 })}
                          </h4>
                          <span className={`text-sm font-medium ${
                            result.isCorrect ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {result.isCorrect ? '✓ ' + t('pages.courseLearnPage.correct') : '✗ ' + t('pages.courseLearnPage.incorrect')}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{result.question.question_text}</p>
                        <div className="text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">{t('pages.courseLearnPage.yourAnswer')}</span> {result.userAnswer || t('pages.courseLearnPage.noAnswer')}
                          </p>
                          {!result.isCorrect && (
                            <p className="text-green-600">
                              <span className="font-medium">{t('pages.courseLearnPage.correctAnswer')}</span> {result.correctAnswer}
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
                      {t('pages.courseLearnPage.closeQuiz')}
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
                        {t('pages.courseLearnPage.retakeQuiz')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Discussion Panel */}
      {showDiscussionPanel && courseId && currentModule && currentLesson && (
        <DiscussionPanel
          courseId={courseId}
          moduleId={currentModule.id}
          lessonId={currentLesson.id}
          isOpen={showDiscussionPanel}
          onClose={() => setShowDiscussionPanel(false)}
        />
      )}

      {/* Video Settings Panel */}
      {showVideoSettingsPanel && (
        <VideoSettingsPanel
          isOpen={showVideoSettingsPanel}
          onClose={() => setShowVideoSettingsPanel(false)}
        />
      )}

      {/* Course Completion Popup */}
      <CourseCompletionPopup
        isOpen={showCourseCompletionPopup}
        onClose={() => setShowCourseCompletionPopup(false)}
        courseTitle={course?.title || ''}
        onViewCertificate={() => {
          setShowCourseCompletionPopup(false);
          navigate('/certificates');
        }}
        onContinueLearning={() => {
          setShowCourseCompletionPopup(false);
          navigate('/dashboard');
        }}
      />

      {/* NFT Minting Ticket Popup */}
      {nftMintingData && (
        <NFTMintingTicketPopup
          isOpen={showNFTMintingPopup}
          onClose={() => {
            setShowNFTMintingPopup(false);
            setNftMintingData(null);
          }}
          moduleTitle={nftMintingData.moduleTitle}
          courseTitle={nftMintingData.courseTitle}
          status={nftMintingData.status}
          tokenId={nftMintingData.tokenId}
          transactionHash={nftMintingData.transactionHash}
          onViewNFT={() => {
            setShowNFTMintingPopup(false);
            setNftMintingData(null);
            navigate('/nfts');
          }}
        />
      )}
    </div>
  );
};

export default CourseLearnPage;
