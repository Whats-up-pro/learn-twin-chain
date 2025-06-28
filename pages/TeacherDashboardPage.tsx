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
  UserIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  HeartIcon,
  BookOpenIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { TeacherDashboard, Course, LearnerProgress } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackTarget, setFeedbackTarget] = useState<LearnerProgress | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Form state for course creation/editing
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Programming'
  });

  // Demo data for My Courses and Popular Modules (Python theme)
  const demoCourses: Course[] = [
    {
      id: 'python101',
      title: 'Python Basics',
      description: 'Learn the fundamentals of Python programming.',
      modules: [],
      enrolledLearners: 30,
      createdAt: '2024-06-01T00:00:00Z',
      teacherId: 'teacher1',
      isPublished: true
    },
    {
      id: 'python-adv',
      title: 'Advanced Python',
      description: 'Deep dive into advanced Python topics and best practices.',
      modules: [],
      enrolledLearners: 18,
      createdAt: '2024-06-10T00:00:00Z',
      teacherId: 'teacher1',
      isPublished: false
    },
    {
      id: 'python-ds',
      title: 'Python for Data Science',
      description: 'Apply Python in data analysis, visualization, and machine learning.',
      modules: [],
      enrolledLearners: 25,
      createdAt: '2024-06-15T00:00:00Z',
      teacherId: 'teacher1',
      isPublished: true
    }
  ];
  const demoPopularModules = [
    { moduleId: 'mod1', title: 'Python Syntax & Variables', completionRate: 0.92 },
    { moduleId: 'mod2', title: 'Control Flow in Python', completionRate: 0.85 },
    { moduleId: 'mod3', title: 'Functions & Modules', completionRate: 0.81 },
    { moduleId: 'mod4', title: 'Data Structures in Python', completionRate: 0.78 },
    { moduleId: 'mod5', title: 'OOP in Python', completionRate: 0.74 }
  ];

  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(6);

  // Responsive studentsPerPage theo kích thước màn hình
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) {
        setStudentsPerPage(2); // mobile
      } else if (window.innerWidth < 1024) {
        setStudentsPerPage(4); // tablet
      } else {
        setStudentsPerPage(6); // desktop
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lọc chỉ lấy học sinh (did chứa 'student')
  const studentLearners = learnerProgress.filter(l => l.learnerId.includes('student'));

  // Tính toán students hiển thị theo trang
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = studentLearners.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(studentLearners.length / studentsPerPage);

  // Tính toán các thông số dashboard thực tế
  const totalCourses = courses.length;
  const totalLearners = learnerProgress.length;
  const now = new Date();
  const activeLearners = learnerProgress.filter(l => {
    const last = (l.digitalTwin as any)?.interaction_logs?.last_llm_session;
    if (!last) return false;
    const lastDate = new Date(last);
    return (now.getTime() - lastDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;

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

  const handleOpenFeedback = (learner: LearnerProgress) => {
    setFeedbackTarget(learner);
    setFeedbackContent('');
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTarget) return;
    if (!feedbackContent.trim()) {
      toast.error('Feedback content is required');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_did: feedbackTarget.digitalTwin.learnerDid,
          teacher_id: 'did:learntwin:teacher001', // TODO: lấy từ context nếu có
          content: feedbackContent
        })
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail || 'Failed to send feedback');
        return;
      }
      toast.success('Feedback sent successfully!');
      setShowFeedbackModal(false);
    } catch (err) {
      toast.error('Network error!');
    }
  };

  // Helper function to get student display name
  const getStudentDisplayName = (student: any) => {
    if (student.digitalTwin?.profile?.full_name) {
      return student.digitalTwin.profile.full_name;
    }
    return student.name || student.email || 'Unknown Student';
  };

  // Helper function to get student institution
  const getStudentInstitution = (student: any) => {
    return student.digitalTwin?.profile?.institution || 'Not specified';
  };

  // Helper function to get student program
  const getStudentProgram = (student: any) => {
    return student.digitalTwin?.profile?.program || 'Not specified';
  };

  // Helper function to get student progress
  const getStudentProgress = (student: any) => {
    const progress = student.digitalTwin?.learning_state?.progress;
    if (!progress || Object.keys(progress).length === 0) {
      return 0;
    }
    const values = Object.values(progress) as number[];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  // Helper function to get student skills
  const getStudentSkills = (student: any) => {
    const skills = student.digitalTwin?.skill_profile?.programming_languages;
    if (!skills || Object.keys(skills).length === 0) {
      return ['No skills recorded'];
    }
    return Object.keys(skills).slice(0, 3); // Show top 3 skills
  };

  // Helper function to get current modules
  const getCurrentModules = (student: any) => {
    const modules = student.digitalTwin?.learning_state?.current_modules;
    if (!modules || modules.length === 0) {
      return ['No active modules'];
    }
    return modules.slice(0, 2); // Show top 2 current modules
  };

  // Helper function to get student birth year
  const getStudentBirthYear = (student: any) => {
    return student.digitalTwin?.profile?.birth_year || 'Not specified';
  };

  // Helper function to get student enrollment date
  const getStudentEnrollmentDate = (student: any) => {
    const date = student.digitalTwin?.profile?.enrollment_date;
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString();
  };

  // Helper function to get student soft skills
  const getStudentSoftSkills = (student: any) => {
    const softSkills = student.digitalTwin?.skill_profile?.soft_skills;
    if (!softSkills || Object.keys(softSkills).length === 0) {
      return ['No soft skills recorded'];
    }
    return Object.keys(softSkills).slice(0, 2); // Show top 2 soft skills
  };

  // Helper function to get student learning style
  const getStudentLearningStyle = (student: any) => {
    return student.digitalTwin?.interaction_logs?.preferred_learning_style || 'Not specified';
  };

  // Helper function to get student last activity
  const getStudentLastActivity = (student: any) => {
    const lastSession = student.digitalTwin?.interaction_logs?.last_llm_session;
    if (!lastSession) return 'No recent activity';
    return new Date(lastSession).toLocaleDateString();
  };

  // Hàm lấy danh sách học sinh/DT từ API thật
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/learning/students');
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      
      // Map data.students về LearnerProgress với dữ liệu Digital Twin đầy đủ
      const mapped: LearnerProgress[] = (data.students || []).map((dt: any) => ({
        learnerId: dt.twin_id || dt.learnerDid || '',
        learnerName: dt.profile?.full_name || 'Unknown',
        avatarUrl: '',
        digitalTwin: {
          learnerDid: dt.twin_id || dt.learnerDid || '',
          knowledge: dt.knowledge || {},
          skills: dt.skills || {},
          behavior: dt.behavior || {},
          checkpoints: dt.checkpoints || [],
          version: dt.version || 1,
          lastUpdated: dt.lastUpdated || new Date().toISOString(),
          // Thêm dữ liệu Digital Twin đầy đủ
          profile: dt.profile || {},
          learning_state: dt.learning_state || {},
          skill_profile: dt.skill_profile || {},
          interaction_logs: dt.interaction_logs || {}
        },
        courseProgress: {
          courseId: 'N/A',
          completedModules: dt.learning_state?.checkpoint_history?.length || 0,
          totalModules: Object.keys(dt.learning_state?.progress || {}).length || 0,
          averageScore: getStudentProgress({ digitalTwin: dt }) * 100,
          lastActivity: dt.interaction_logs?.last_llm_session || new Date().toISOString()
        }
      }));
      setLearnerProgress(mapped);
      toast.success('Student/DT list updated!');
    } catch (err) {
      setLearnerProgress([]);
      toast.error('Failed to fetch student/DT list!');
    } finally {
      setLoading(false);
    }
  };

  // Gọi fetchStudents khi load trang
  useEffect(() => {
    fetchStudents();
  }, []);

  // Hàm đồng bộ dữ liệu
  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/sync-users-twins', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      toast.success('Data synchronized successfully!');
      await fetchStudents();
    } catch (err) {
      toast.error('Data synchronization failed!');
    } finally {
      setSyncing(false);
    }
  };

  // Progress color helpers
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={handleSyncData}
            className={`bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 ${syncing ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={syncing}
          >
            <ArrowPathIcon className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
          <button
            onClick={handleCreateCourse}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <PlusIcon className="w-5 h-5" />
            Create Course
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <AcademicCapIcon className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Learners</p>
              <p className="text-2xl font-bold text-gray-900">{totalLearners}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Learners</p>
              <p className="text-2xl font-bold text-gray-900">{activeLearners}</p>
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
            {(courses.length > 0 ? courses : demoCourses).map((course) => (
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
          <h2 className="text-xl font-semibold text-gray-900">My Students</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : studentLearners.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentStudents.map((learner) => {
                  const progressPercentage = getStudentProgress(learner);
                  return (
                    <div key={learner.learnerId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {getStudentDisplayName(learner)}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{learner.learnerId}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Institution:</span>
                              <span className="font-medium">{getStudentInstitution(learner)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Program:</span>
                              <span className="font-medium">{getStudentProgram(learner)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Section */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {Math.round(progressPercentage * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${Math.round(progressPercentage * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Skills Section */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Programming Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {getStudentSkills(learner).map((skill, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Current Modules */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Modules</h4>
                        <div className="space-y-1">
                          {getCurrentModules(learner).map((module: string, index: number) => (
                            <div key={index} className="text-sm text-gray-600 flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                              {module}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Last Activity */}
                      <div className="mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Activity:</span>
                          <span className="font-medium">{getStudentLastActivity(learner)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-gray-100">
                        <button 
                          onClick={() => handleViewLearnerDetails(learner)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handleOpenFeedback(learner)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                        >
                          Send Feedback
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md border ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded-md border ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md border ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No students found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Popular Modules */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Popular Modules</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoPopularModules.map((mod) => (
              <div key={mod.moduleId} className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{mod.title}</h3>
                  <p className="text-sm text-gray-600">Completion Rate:</p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2 mb-1">
                    <div 
                      className="h-3 rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.round(mod.completionRate * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-blue-700">{Math.round(mod.completionRate * 100)}%</span>
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
        title="Student Details"
        size="full"
      >
        <div className="p-8 max-h-[85vh] overflow-y-auto">
          {selectedLearner && (
            <div className="space-y-8">
              {/* Header Section */}
              <div className="flex items-center space-x-6 pb-6 border-b border-gray-200">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {getStudentDisplayName(selectedLearner).charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">{getStudentDisplayName(selectedLearner)}</h3>
                  <p className="text-xl text-gray-600 mb-2">ID: {selectedLearner.learnerId}</p>
                  <div className="flex items-center space-x-6 text-base text-gray-500">
                    <span>Institution: {getStudentInstitution(selectedLearner)}</span>
                    <span>•</span>
                    <span>Program: {getStudentProgram(selectedLearner)}</span>
                    <span>•</span>
                    <span>Birth Year: {getStudentBirthYear(selectedLearner)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-600">
                    {Math.round(getStudentProgress(selectedLearner) * 100)}%
                  </div>
                  <div className="text-lg text-gray-500">Overall Progress</div>
                </div>
              </div>
              
              {/* Main Content Grid - 3 columns for wider layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Profile Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                      Profile Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Institution</span>
                        <span className="font-semibold">{getStudentInstitution(selectedLearner)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Program</span>
                        <span className="font-semibold">{getStudentProgram(selectedLearner)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Birth Year</span>
                        <span className="font-semibold">{getStudentBirthYear(selectedLearner)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Enrollment Date</span>
                        <span className="font-semibold">{getStudentEnrollmentDate(selectedLearner)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Learning Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <AcademicCapIcon className="w-5 h-5 mr-2 text-green-600" />
                      Learning Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Learning Style</span>
                        <span className="font-semibold">{getStudentLearningStyle(selectedLearner)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Last Activity</span>
                        <span className="font-semibold">{getStudentLastActivity(selectedLearner)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Completed Modules</span>
                        <span className="font-semibold">{selectedLearner.courseProgress.completedModules}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column */}
                <div className="space-y-6">
                  {/* Programming Skills */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CodeBracketIcon className="w-5 h-5 mr-2 text-purple-600" />
                      Programming Skills
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {getStudentSkills(selectedLearner).map((skill: string, index: number) => (
                        <span 
                          key={index}
                          className="px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-full border border-green-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Soft Skills */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <HeartIcon className="w-5 h-5 mr-2 text-pink-600" />
                      Soft Skills
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {getStudentSoftSkills(selectedLearner).map((skill: string, index: number) => (
                        <span 
                          key={index}
                          className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full border border-blue-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Current Modules */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <BookOpenIcon className="w-5 h-5 mr-2 text-indigo-600" />
                      Current Modules
                    </h4>
                    <div className="space-y-3">
                      {getCurrentModules(selectedLearner).map((module: string, index: number) => (
                        <div key={index} className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          <span className="text-gray-800 font-medium">{module}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Module Progress */}
                <div className="space-y-6">
                  {(selectedLearner.digitalTwin as any)?.learning_state?.progress && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <ChartBarIcon className="w-5 h-5 mr-2 text-orange-600" />
                        Module Progress Details
                      </h4>
                      <div className="space-y-4">
                        {Object.entries((selectedLearner.digitalTwin as any).learning_state.progress).map(([module, progress]: [string, any]) => (
                          <div key={module} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-gray-800 font-medium">{module}</span>
                              <span className="text-lg font-bold text-blue-600">{Math.round(progress * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="h-3 rounded-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${Math.round(progress * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <InformationCircleIcon className="w-5 h-5 mr-2 text-teal-600" />
                      Additional Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Total Modules</span>
                        <span className="font-semibold">{selectedLearner.courseProgress.totalModules}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Average Score</span>
                        <span className="font-semibold">{Math.round(selectedLearner.courseProgress.averageScore)}%</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Last Updated</span>
                        <span className="font-semibold">{new Date(selectedLearner.digitalTwin.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleOpenFeedback(selectedLearner)}
                  className="flex-1 bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 font-medium transition-colors text-lg"
                >
                  Send Feedback
                </button>
                <button
                  onClick={() => setShowLearnerModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-400 font-medium transition-colors text-lg"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Feedback Modal */}
      {showFeedbackModal && feedbackTarget && (
        <Modal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Feedback">
          <form onSubmit={handleSubmitFeedback} className="space-y-4 p-4">
            <h2 className="text-xl font-bold mb-2">Send Feedback to {feedbackTarget.learnerName}</h2>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              placeholder="Enter feedback..."
              value={feedbackContent}
              onChange={e => setFeedbackContent(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowFeedbackModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Send</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TeacherDashboardPage; 