import React, { useState, useEffect } from 'react';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { TeacherDashboard, Course, LearnerProgress } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import InteractiveDemo from '../components/InteractiveDemo';
import toast from 'react-hot-toast';

const TeacherDashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [learnerProgress, setLearnerProgress] = useState<LearnerProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<LearnerProgress | null>(null);

  // Form state for course creation/editing
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Programming'
  });

  // Mock data for MVP
  useEffect(() => {
    const mockDashboard: TeacherDashboard = {
      totalCourses: 4,
      totalLearners: 156,
      activeLearners: 89,
      recentLearnerActivity: [
        {
          learnerId: 'learner1',
          learnerName: 'Nguyễn Văn A',
          digitalTwin: {
            learnerDid: 'did:example:learner1',
            knowledge: { 'React': 0.8, 'TypeScript': 0.7, 'Node.js': 0.6 },
            skills: { problemSolving: 0.8, logicalThinking: 0.9, selfLearning: 0.7 },
            behavior: { timeSpent: '45h', quizAccuracy: 0.85, preferredLearningStyle: 'visual' },
            checkpoints: [],
            version: 1,
            lastUpdated: new Date().toISOString()
          },
          courseProgress: {
            courseId: 'course1',
            completedModules: 3,
            totalModules: 5,
            averageScore: 87,
            lastActivity: '2024-01-15T10:30:00Z'
          }
        }
      ],
      popularModules: [
        { moduleId: 'module1', title: 'React Fundamentals', completionRate: 0.85 },
        { moduleId: 'module2', title: 'TypeScript Basics', completionRate: 0.78 },
        { moduleId: 'module3', title: 'State Management', completionRate: 0.72 }
      ]
    };

    const mockCourses: Course[] = [
      {
        id: 'course1',
        title: 'React Development Masterclass',
        description: 'Learn React from basics to advanced concepts with hands-on projects',
        modules: [],
        enrolledLearners: 45,
        createdAt: '2024-01-01T00:00:00Z',
        teacherId: 'teacher1',
        isPublished: true
      },
      {
        id: 'course2',
        title: 'TypeScript for Beginners',
        description: 'Master TypeScript fundamentals and best practices',
        modules: [],
        enrolledLearners: 32,
        createdAt: '2024-01-05T00:00:00Z',
        teacherId: 'teacher1',
        isPublished: true
      },
      {
        id: 'course3',
        title: 'Node.js Backend Development',
        description: 'Build scalable backend applications with Node.js',
        modules: [],
        enrolledLearners: 28,
        createdAt: '2024-01-10T00:00:00Z',
        teacherId: 'teacher1',
        isPublished: false
      }
    ];

    const mockLearnerProgress: LearnerProgress[] = [
      {
        learnerId: 'learner1',
        learnerName: 'Nguyễn Văn A',
        digitalTwin: {
          learnerDid: 'did:example:learner1',
          knowledge: { 'React': 0.8, 'TypeScript': 0.7, 'Node.js': 0.6 },
          skills: { problemSolving: 0.8, logicalThinking: 0.9, selfLearning: 0.7 },
          behavior: { timeSpent: '45h', quizAccuracy: 0.85, preferredLearningStyle: 'visual' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        courseProgress: {
          courseId: 'course1',
          completedModules: 3,
          totalModules: 5,
          averageScore: 87,
          lastActivity: '2024-01-15T10:30:00Z'
        }
      },
      {
        learnerId: 'learner2',
        learnerName: 'Trần Thị B',
        digitalTwin: {
          learnerDid: 'did:example:learner2',
          knowledge: { 'Python': 0.9, 'Django': 0.8, 'PostgreSQL': 0.7 },
          skills: { problemSolving: 0.9, logicalThinking: 0.8, selfLearning: 0.9 },
          behavior: { timeSpent: '60h', quizAccuracy: 0.92, preferredLearningStyle: 'code-first' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        courseProgress: {
          courseId: 'course2',
          completedModules: 2,
          totalModules: 4,
          averageScore: 92,
          lastActivity: '2024-01-14T15:20:00Z'
        }
      }
    ];

    setTimeout(() => {
      setDashboard(mockDashboard);
      setCourses(mockCourses);
      setLearnerProgress(mockLearnerProgress);
      setLoading(false);
    }, 1000);
  }, []);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Course management functions
  const handleCreateCourse = () => {
    setCourseForm({
      title: '',
      description: '',
      category: 'Programming'
    });
    setIsEditing(false);
    setSelectedCourse(null);
    setShowCourseModal(true);
  };

  const handleEditCourse = (course: Course) => {
    setCourseForm({
      title: course.title,
      description: course.description,
      category: 'Programming' // In real app, this would come from course data
    });
    setIsEditing(true);
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      setCourses(prev => prev.filter(course => course.id !== courseId));
      toast.success('Course deleted successfully');
    }
  };

  const handleTogglePublish = (courseId: string) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? { ...course, isPublished: !course.isPublished }
        : course
    ));
    toast.success('Course publication status updated');
  };

  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCourse: Course = {
      id: isEditing ? selectedCourse!.id : Date.now().toString(),
      title: courseForm.title,
      description: courseForm.description,
      modules: [],
      enrolledLearners: isEditing ? selectedCourse!.enrolledLearners : 0,
      createdAt: isEditing ? selectedCourse!.createdAt : new Date().toISOString(),
      teacherId: 'teacher1',
      isPublished: false
    };

    if (isEditing) {
      setCourses(prev => prev.map(course => course.id === newCourse.id ? newCourse : course));
      toast.success('Course updated successfully');
    } else {
      setCourses(prev => [newCourse, ...prev]);
      toast.success('Course created successfully');
    }

    setShowCourseModal(false);
    setCourseForm({
      title: '',
      description: '',
      category: 'Programming'
    });
  };

  // Learner management functions
  const handleViewLearnerDetails = (learner: LearnerProgress) => {
    setSelectedLearner(learner);
    setShowLearnerModal(true);
  };

  const handleSendMessage = (learnerId: string) => {
    toast.success(`Message sent to learner ${learnerId}`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Interactive Demo Info */}
      <InteractiveDemo />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <button
          onClick={handleCreateCourse}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
        >
          <PlusIcon className="w-5 h-5" />
          Create Course
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <AcademicCapIcon className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Learners</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard?.totalLearners}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Learners</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard?.activeLearners}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
              <p className="text-2xl font-bold text-gray-900">78%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.isPublished 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Enrolled Learners</span>
                    <span className="font-semibold">{course.enrolledLearners}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created</span>
                    <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => handleEditCourse(course)}
                    className="flex-1 text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    <PencilIcon className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleTogglePublish(course.id)}
                    className={`flex-1 text-sm font-medium ${
                      course.isPublished ? 'text-orange-600 hover:text-orange-800' : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    {course.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button 
                    onClick={() => handleDeleteCourse(course.id)}
                    className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    <TrashIcon className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learner Progress */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Learner Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {learnerProgress.map((learner) => {
              const progressPercentage = (learner.courseProgress.completedModules / learner.courseProgress.totalModules) * 100;
              return (
                <div key={learner.learnerId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {learner.learnerName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{learner.learnerName}</h3>
                        <p className="text-sm text-gray-600">Learner ID: {learner.learnerId}</p>
                        <div className="flex items-center mt-1">
                          <ChartBarIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <span className={`text-sm font-semibold ${getProgressColor(learner.courseProgress.averageScore)}`}>
                            {learner.courseProgress.averageScore}% Average Score
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {new Date(learner.courseProgress.lastActivity).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSendMessage(learner.learnerId)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Message
                        </button>
                        <button 
                          onClick={() => handleViewLearnerDetails(learner)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Section */}
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Course Progress</span>
                      <span className={`text-sm font-semibold ${getProgressColor(progressPercentage)}`}>
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(progressPercentage)}`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{learner.courseProgress.completedModules} of {learner.courseProgress.totalModules} modules completed</span>
                    </div>
                  </div>

                  {/* Skills Overview */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Overview</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {Math.round(learner.digitalTwin.skills.problemSolving * 100)}%
                        </div>
                        <div className="text-xs text-gray-600">Problem Solving</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {Math.round(learner.digitalTwin.skills.logicalThinking * 100)}%
                        </div>
                        <div className="text-xs text-gray-600">Logical Thinking</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {Math.round(learner.digitalTwin.skills.selfLearning * 100)}%
                        </div>
                        <div className="text-xs text-gray-600">Self Learning</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Modules */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Popular Modules</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dashboard?.popularModules.map((module) => (
              <div key={module.moduleId} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">{module.title}</h3>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(module.completionRate * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {Math.round(module.completionRate * 100)}% of learners completed
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course Creation/Editing Modal */}
      <Modal 
        isOpen={showCourseModal} 
        onClose={() => setShowCourseModal(false)}
        title={isEditing ? 'Edit Course' : 'Create New Course'}
      >
        <div className="p-6">
          <form onSubmit={handleSubmitCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Title *</label>
              <input 
                type="text" 
                required
                value={courseForm.title}
                onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea 
                required
                value={courseForm.description}
                onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500" 
                rows={4} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select 
                value={courseForm.category}
                onChange={(e) => setCourseForm(prev => ({ ...prev, category: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="Programming">Programming</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="Marketing">Marketing</option>
                <option value="Data Science">Data Science</option>
              </select>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                {isEditing ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Learner Details Modal */}
      <Modal 
        isOpen={showLearnerModal} 
        onClose={() => setShowLearnerModal(false)}
        title="Learner Details"
      >
        <div className="p-6">
          {selectedLearner && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {selectedLearner.learnerName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedLearner.learnerName}</h3>
                  <p className="text-sm text-gray-600">ID: {selectedLearner.learnerId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Learning Behavior</h4>
                  <div className="space-y-1 text-sm">
                    <div>Time Spent: {selectedLearner.digitalTwin.behavior.timeSpent}</div>
                    <div>Quiz Accuracy: {Math.round(selectedLearner.digitalTwin.behavior.quizAccuracy * 100)}%</div>
                    <div>Learning Style: {selectedLearner.digitalTwin.behavior.preferredLearningStyle}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Course Progress</h4>
                  <div className="space-y-1 text-sm">
                    <div>Completed: {selectedLearner.courseProgress.completedModules}/{selectedLearner.courseProgress.totalModules}</div>
                    <div>Average Score: {selectedLearner.courseProgress.averageScore}%</div>
                    <div>Last Activity: {new Date(selectedLearner.courseProgress.lastActivity).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Knowledge Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedLearner.digitalTwin.knowledge).map(([topic, progress]) => (
                    <span key={topic} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {topic}: {Math.round(progress * 100)}%
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => handleSendMessage(selectedLearner.learnerId)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Send Message
                </button>
                <button
                  onClick={() => setShowLearnerModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TeacherDashboardPage; 