import React, { useState, useEffect } from 'react';
import { AcademicCapIcon, UserGroupIcon, ChartBarIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon, CheckCircleIcon, UserIcon, ArrowPathIcon, CodeBracketIcon, HeartIcon, BookOpenIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Course, LearnerProgress, ApiCourse } from '../types';
import { courseService } from '../services/courseService';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const TeacherDashboardPage: React.FC = () => {
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

  // Helper function to convert ApiCourse to Course
  const convertApiCourseToLegacy = (apiCourse: ApiCourse): Course => {
    return {
      id: apiCourse.course_id,
      title: apiCourse.title,
      description: apiCourse.description,
      modules: [], // Will be populated separately if needed
      enrolledLearners: 0, // Would need separate API call
      createdAt: apiCourse.created_at,
      teacherId: apiCourse.created_by,
      isPublished: apiCourse.status === 'published',
      // Map additional properties
      course_id: apiCourse.course_id,
      created_by: apiCourse.created_by,
      institution: apiCourse.institution,
      instructors: apiCourse.instructors,
      status: apiCourse.status,
      published_at: apiCourse.published_at,
      metadata: apiCourse.metadata,
      enrollment_start: apiCourse.enrollment_start,
      enrollment_end: apiCourse.enrollment_end,
      course_start: apiCourse.course_start,
      course_end: apiCourse.course_end,
      max_enrollments: apiCourse.max_enrollments,
      is_public: apiCourse.is_public,
      requires_approval: apiCourse.requires_approval,
      completion_nft_enabled: apiCourse.completion_nft_enabled,
      content_cid: apiCourse.content_cid,
      updated_at: apiCourse.updated_at
    };
  };

  // Demo data fallback for My Courses
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
  
  console.log('learnerProgress:', learnerProgress);
  console.log('studentLearners:', studentLearners);

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

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedCourse) {
        // Update existing course
        const updates = {
          title: courseForm.title,
          description: courseForm.description,
        };
        
        const response = await courseService.updateCourse(selectedCourse.course_id || selectedCourse.id, updates);
        
        if (response && response.course) {
          const updatedCourse = convertApiCourseToLegacy(response.course);
          setCourses(prev => prev.map(course => 
            (course.course_id || course.id) === (selectedCourse.course_id || selectedCourse.id) 
              ? updatedCourse 
              : course
          ));
          toast.success('Course updated successfully');
        }
      } else {
        // Create new course
        const courseData = {
          title: courseForm.title,
          description: courseForm.description,
          institution: 'Default Institution',
          metadata: {
            difficulty_level: 'intermediate',
            estimated_hours: 10,
            prerequisites: [],
            learning_objectives: [],
            skills_taught: [],
            tags: [courseForm.category.toLowerCase()],
            language: 'en'
          },
          is_public: true,
          requires_approval: false,
          completion_nft_enabled: true
        };
        
        const response = await courseService.createCourse(courseData);
        
        if (response && response.course) {
          const newCourse = convertApiCourseToLegacy(response.course);
          setCourses(prev => [newCourse, ...prev]);
          toast.success('Course created successfully');
        }
      }

      setShowCourseModal(false);
      setCourseForm({
        title: '',
        description: '',
        category: 'Programming'
      });
      setSelectedCourse(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error submitting course:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} course`);
    }
  };

  // Learner management functions
  const handleViewLearnerDetails = (learner: LearnerProgress) => {
    setSelectedLearner(learner);
    setShowLearnerModal(true);
  };

  const handleOpenFeedback = (learner: LearnerProgress) => {
    setFeedbackTarget(learner);
    setFeedbackContent('');
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTarget || !feedbackContent.trim()) {
      toast.error('Please enter feedback content');
      return;
    }

    try {
      // Send feedback to backend
      const response = await fetch('http://localhost:8000/api/v1/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_did: feedbackTarget.learnerId,
          teacher_id: 'teacher001', // In real app, this would be the logged-in teacher's ID
          content: feedbackContent,
          score: null, // Optional score
          created_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast.success('Feedback sent successfully!');
        setShowFeedbackModal(false);
        setFeedbackContent('');
        setFeedbackTarget(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to send feedback');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast.error('Failed to send feedback. Please try again.');
    }
  };

  // Helper function to get student display name
  const getStudentDisplayName = (student: any) => {
    // Lấy từ digital twin profile hoặc fallback
    return student.learnerName || 
           (student.digitalTwin as any)?.profile?.full_name || 
           'Unknown Student';
  };

  // Helper function to get student institution
  const getStudentInstitution = (student: any) => {
    return (student.digitalTwin as any)?.profile?.institution || 'UIT';
  };

  // Helper function to get student program
  const getStudentProgram = (student: any) => {
    return (student.digitalTwin as any)?.profile?.program || 'Computer Science';
  };

  // Helper function to get student progress
  const getStudentProgress = (student: any) => {
    // Tính progress từ digital twin knowledge
    const knowledge = (student.digitalTwin as any)?.knowledge;
    if (!knowledge || Object.keys(knowledge).length === 0) {
      return student.courseProgress?.averageScore / 100 || 0;
    }
    
    const values = Object.values(knowledge) as number[];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.min(average, 1); // Đảm bảo không vượt quá 1
  };

  // Helper function to get student skills
  const getStudentSkills = (student: any) => {
    const skills = (student.digitalTwin as any)?.skill_profile?.programming_languages;
    if (skills && Object.keys(skills).length > 0) {
      return Object.keys(skills).filter(skill => skills[skill] > 0.5);
    }
    return ['Python', 'Basic Programming'];
  };

  // Helper function to get current modules
  const getCurrentModules = (student: any) => {
    const currentModules = (student.digitalTwin as any)?.learning_state?.current_modules;
    if (currentModules && currentModules.length > 0) {
      return currentModules;
    }
    return ['Introduction to Python', 'Variables and Data Types'];
  };

  // Helper function to get student birth year
  const getStudentBirthYear = (student: any) => {
    return (student.digitalTwin as any)?.profile?.birth_year || 'N/A';
  };

  // Helper function to get student enrollment date
  const getStudentEnrollmentDate = (student: any) => {
    const enrollmentDate = (student.digitalTwin as any)?.profile?.enrollment_date;
    if (enrollmentDate) {
      return new Date(enrollmentDate).toLocaleDateString();
    }
    return 'N/A';
  };

  // Helper function to get student soft skills
  const getStudentSoftSkills = (student: any) => {
    const softSkills = (student.digitalTwin as any)?.skill_profile?.soft_skills;
    if (softSkills && Object.keys(softSkills).length > 0) {
      return Object.keys(softSkills).filter(skill => softSkills[skill] > 0.5);
    }
    return ['Problem Solving', 'Logical Thinking'];
  };

  // Helper function to get student learning style
  const getStudentLearningStyle = (student: any) => {
    return (student.digitalTwin as any)?.interaction_logs?.preferred_learning_style || 'hands-on';
  };

  // Helper function to get student last activity
  const getStudentLastActivity = (student: any) => {
    const lastSessionTime = (student.digitalTwin as any)?.interaction_logs?.last_llm_session;
    if (lastSessionTime) {
      const lastDate = new Date(lastSessionTime);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} days ago`;
      }
    }
    return 'No recent activity';
  };

  // Hàm lấy danh sách học sinh/DT từ API thật
  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Fetch students from backend API
      const response = await fetch('http://localhost:8000/api/v1/learning/students');
      if (response.ok) {
        const data = await response.json();
        const students = data.students || [];
        
        // Transform data to match LearnerProgress interface
        const transformedStudents: LearnerProgress[] = students.map((student: any) => ({
          learnerId: student.twin_id || student.did,
          learnerName: student.profile?.full_name || 'Unknown Student',
          avatarUrl: '', // API không trả về avatarUrl
          digitalTwin: {
            learnerDid: student.twin_id || student.did,
            version: student.version || 1,
            knowledge: student.learning_state?.progress || {},
            skills: {
              problemSolving: student.skill_profile?.soft_skills?.problem_solving || 0.5,
              logicalThinking: student.skill_profile?.soft_skills?.logical_thinking || 0.5,
              selfLearning: student.skill_profile?.soft_skills?.self_learning || 0.5
            },
            behavior: {
              timeSpent: "0h",
              quizAccuracy: 0.5,
              lastLlmSession: student.interaction_logs?.last_llm_session || null,
              preferredLearningStyle: student.interaction_logs?.preferred_learning_style || "hands-on",
              mostAskedTopics: student.interaction_logs?.most_asked_topics || []
            },
            checkpoints: student.learning_state?.checkpoint_history || [],
            lastUpdated: new Date().toISOString(),
            profile: student.profile || {},
            learning_state: student.learning_state || {},
            skill_profile: student.skill_profile || {},
            interaction_logs: student.interaction_logs || {}
          },
          courseProgress: {
            courseId: 'default-course',
            completedModules: Object.values(student.learning_state?.progress || {}).filter((v: any) => v >= 1).length,
            totalModules: Object.keys(student.learning_state?.progress || {}).length || 4,
            averageScore: Object.values(student.learning_state?.progress || {}).reduce((sum: number, val: any) => sum + val, 0) / Math.max(Object.keys(student.learning_state?.progress || {}).length, 1) * 100,
            lastActivity: student.interaction_logs?.last_llm_session || new Date().toISOString()
          }
        }));
        
        setLearnerProgress(transformedStudents);
        console.log('Transformed students:', transformedStudents);
      } else {
        console.error('Failed to fetch students');
        // Fallback to demo data
        setLearnerProgress([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Fallback to demo data
      setLearnerProgress([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load courses from API
        try {
          const coursesResponse = await courseService.searchCourses({
            limit: 20 // Get first 20 courses
          });
          
          if (coursesResponse && coursesResponse.courses) {
            const convertedCourses = coursesResponse.courses.map(convertApiCourseToLegacy);
            setCourses(convertedCourses);
            console.log('Loaded courses from API:', convertedCourses);
          } else {
            // Fallback to demo data
            setCourses(demoCourses);
            console.log('Using demo courses data');
          }
        } catch (error) {
          console.error('Error loading courses from API:', error);
          setCourses(demoCourses);
          toast.error('Failed to load courses. Using demo data.');
        }

        // Load learner progress
        await fetchStudents();
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-xl shadow-lg mb-8">
        <div className="px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-white mb-2">Teacher Dashboard</h1>
              <p className="text-sky-100">Monitor your students' progress and manage courses</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSyncData}
                className={`bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${syncing ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={syncing}
              >
                <ArrowPathIcon className={`w-5 h-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Data'}
              </button>
              <button
                onClick={handleCreateCourse}
                className="bg-white text-sky-600 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Course
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Students */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{totalLearners}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        {/* Active Learners - moved up */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Learners</p>
              <p className="text-3xl font-bold text-gray-900">{activeLearners}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+5%</span>
            <span className="text-gray-500 ml-1">from last week</span>
          </div>
        </div>

        {/* Active Courses - now third */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Courses</p>
              <p className="text-3xl font-bold text-gray-900">{totalCourses}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <BookOpenIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+3</span>
            <span className="text-gray-500 ml-1">new this month</span>
          </div>
        </div>

        {/* Avg. Completion */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
              <p className="text-3xl font-bold text-gray-900">78%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+8%</span>
            <span className="text-gray-500 ml-1">this week</span>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <BookOpenIcon className="w-6 h-6 mr-3 text-emerald-600" />
            My Courses
          </h2>
          <p className="text-sm text-gray-600 mt-1">Manage and monitor your course offerings</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(courses.length > 0 ? courses : demoCourses).map((course) => (
              <div key={course.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-emerald-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{course.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        course.isPublished 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Enrolled Learners</span>
                    <span className="text-lg font-bold text-gray-900">{course.enrolledLearners}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Created</span>
                    <span className="text-sm font-semibold text-gray-900">{new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => handleEditCourse(course)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleTogglePublish(course.id)}
                    className={`flex-1 text-sm font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center ${
                      course.isPublished 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {course.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button 
                    onClick={() => handleDeleteCourse(course.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
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
                  const studentAvatarUrl = (learner as any)?.avatarUrl && (learner as any).avatarUrl.trim() !== ''
                    ? (learner as any).avatarUrl
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(getStudentDisplayName(learner))}&background=0ea5e9&color=fff&size=80`;
                  
                  return (
                    <div key={learner.learnerId} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                      {/* Header với avatar và tên */}
                      <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-6">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <img 
                              src={studentAvatarUrl}
                              alt={getStudentDisplayName(learner)}
                              className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getStudentDisplayName(learner))}&background=0ea5e9&color=fff&size=80`;
                              }}
                            />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {getStudentDisplayName(learner)}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">{learner.learnerId}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs bg-sky-100 text-sky-800 px-2 py-1 rounded-full font-medium">
                                {getStudentInstitution(learner)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-4">
                        {/* Progress Section */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                            <span className="text-lg font-bold text-sky-600">
                              {Math.round(progressPercentage * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-500 ${
                                progressPercentage >= 0.8 ? 'bg-green-500' : 
                                progressPercentage >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.round(progressPercentage * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Student Info */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-gray-500 text-xs font-medium mb-1">Program</div>
                            <div className="font-semibold text-gray-900 truncate">{getStudentProgram(learner)}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-gray-500 text-xs font-medium mb-1">Learning Style</div>
                            <div className="font-semibold text-gray-900 truncate">{getStudentLearningStyle(learner)}</div>
                          </div>
                        </div>

                        {/* Skills Section */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {getStudentSkills(learner).slice(0, 3).map((skill, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md font-medium border border-green-200"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Current Modules */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Modules</h4>
                          <div className="space-y-1">
                            {getCurrentModules(learner).slice(0, 2).map((module: string, index: number) => (
                              <div key={index} className="flex items-center p-2 bg-blue-50 rounded-lg">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                <span className="text-xs text-blue-800 font-medium truncate">{module}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Last Activity */}
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Last Activity</span>
                            <span className="font-medium">{getStudentLastActivity(learner)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-6 pb-6">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewLearnerDetails(learner)}
                            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View Details
                          </button>
                          <button 
                            onClick={() => handleOpenFeedback(learner)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                            </svg>
                            Feedback
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserGroupIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Students Found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                There are no students enrolled in your courses yet. Try syncing data or creating new courses.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleSyncData}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  Sync Data
                </button>
                <button
                  onClick={handleCreateCourse}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Course
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popular Modules */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="w-6 h-6 mr-3 text-green-600" />
            Popular Modules
          </h2>
          <p className="text-sm text-gray-600 mt-1">Most completed modules by your students</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoPopularModules.map((mod) => (
              <div key={mod.moduleId} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-green-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{mod.title}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Active Module</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <BookOpenIcon className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">Completion Rate</span>
                      <span className="text-lg font-bold text-green-600">
                        {Math.round(mod.completionRate * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          mod.completionRate >= 0.8 ? 'bg-green-500' : 
                          mod.completionRate >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.round(mod.completionRate * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Students enrolled</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {Math.floor(mod.completionRate * 50) + 15}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course Creation/Editing Modal */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${showCourseModal ? '' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold mb-4">Create New Course</h3>
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
      </div>

      {/* Learner Details Modal */}
      <Modal 
        isOpen={showLearnerModal} 
        onClose={() => setShowLearnerModal(false)}
        title="Student Details"
        size="full"
      >
        <div className="p-8">
          {selectedLearner && (
            <div className="space-y-8">
              {/* Header Section */}
              <div className="flex items-center space-x-6 pb-6 border-b border-gray-200">
                <div className="relative">
                  <img 
                    src={(selectedLearner as any)?.avatarUrl && (selectedLearner as any).avatarUrl.trim() !== ''
                      ? (selectedLearner as any).avatarUrl
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(getStudentDisplayName(selectedLearner))}&background=0ea5e9&color=fff&size=96`
                    }
                    alt={getStudentDisplayName(selectedLearner)}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getStudentDisplayName(selectedLearner))}&background=0ea5e9&color=fff&size=96`;
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
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
      <Modal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Feedback">
        <form onSubmit={handleSubmitFeedback} className="space-y-4 p-4">
          <h2 className="text-xl font-bold mb-2">Send Feedback to {feedbackTarget?.learnerName}</h2>
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
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Send</button>
          </div>
        </form>
      </Modal>
    </div>
    </div>
  );
};

export default TeacherDashboardPage; 