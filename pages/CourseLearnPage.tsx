import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { courseService } from '../services/courseService';
import { ApiCourse, ApiModule, ApiLesson } from '../types';
import { 
  PlayIcon, 
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ListBulletIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon
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

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
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
  const { learnerProfile } = useAppContext();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('1:09');

  // Load course data from API
  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      try {
        setIsLoading(true);
        
        // Load course with modules from API
        const courseResponse = await courseService.getCourse(courseId, true);
        
        if (courseResponse && courseResponse.course) {
          const apiCourse: ApiCourse = courseResponse.course;
          
          // Load modules for the course
          const modulesResponse = await courseService.getCourseModules(courseId);
          let modules: Module[] = [];
          
          if (modulesResponse && modulesResponse.modules) {
            // Load lessons for each module
            modules = await Promise.all(
              modulesResponse.modules.map(async (apiModule: ApiModule) => {
                try {
                  const lessonsResponse = await courseService.getModuleLessons(
                    apiModule.module_id, 
                    true // include progress
                  );
                  
                  const lessons: Lesson[] = lessonsResponse?.lessons?.map((apiLesson: ApiLesson) => ({
                    id: apiLesson.lesson_id,
                    title: apiLesson.title,
                    description: apiLesson.description,
                    duration: `${apiLesson.duration_minutes} MIN`,
                    video_url: apiLesson.content_url,
                    completed: false, // TODO: Get from progress
                    type: apiLesson.content_type as 'video' | 'text' | 'quiz' | 'assignment'
                  })) || [];
                  
                  return {
                    id: apiModule.module_id,
                    title: apiModule.title,
                    description: apiModule.description,
                    progress: 0, // TODO: Calculate from lesson progress
                    lessons
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
          
          // Convert to Course format
          const course: Course = {
            id: apiCourse.course_id,
            title: apiCourse.title,
            description: apiCourse.description,
            instructor: 'Instructor', // TODO: Get instructor name
            totalDuration: `${apiCourse.metadata.estimated_hours || 0} hours`,
            progress: 0, // TODO: Calculate overall progress
            modules
          };

          setCourse(course);
          if (modules.length > 0) {
            setCurrentModule(modules[0]);
            if (modules[0].lessons.length > 0) {
              setCurrentLesson(modules[0].lessons[0]);
            }
          }
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

  const handleLessonSelect = (module: Module, lesson: Lesson) => {
    setCurrentModule(module);
    setCurrentLesson(lesson);
    setIsPlaying(false);
  };

  const handleCompleteLesson = async () => {
    if (currentLesson && currentModule) {
      try {
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
        }
        
        toast.success('Lesson completed!');
      } catch (error) {
        console.error('Failed to update lesson progress:', error);
        toast.error('Failed to save progress. Please try again.');
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

  const handleNextLesson = () => {
    const next = getNextLesson();
    if (next) {
      handleLessonSelect(next.module, next.lesson);
    }
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
                            <span>{module.lessons.length}/</span>
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
                        {module.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonSelect(module, lesson)}
                            className={`w-full p-3 text-left hover:bg-blue-50 transition-colors ${
                              currentLesson?.id === lesson.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {lesson.completed ? (
                                  <CheckCircleSolid className="w-5 h-5 text-green-500" />
                                ) : lesson.type === 'video' ? (
                                  <PlayIcon className="w-5 h-5 text-slate-400" />
                                ) : lesson.type === 'quiz' ? (
                                  <BookOpenIcon className="w-5 h-5 text-slate-400" />
                                ) : (
                                  <ClockIcon className="w-5 h-5 text-slate-400" />
                                )}
                                <div>
                                  <h5 className="font-medium text-sm text-slate-900">{lesson.title}</h5>
                                  <p className="text-xs text-slate-500">{lesson.duration}</p>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
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
              <iframe
                src={currentLesson.video_url}
                className="w-full h-full"
                title={currentLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
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
            </div>
          )}
          
          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
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
              </div>
              
              <div className="flex items-center space-x-3">
                {!currentLesson?.completed && (
                  <button
                    onClick={handleCompleteLesson}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    COMPLETE & CONTINUE
                  </button>
                )}
                
                {getNextLesson() && (
                  <button
                    onClick={handleNextLesson}
                    className="flex items-center text-white hover:text-blue-300 transition-colors"
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
    </div>
  );
};

export default CourseLearnPage;
