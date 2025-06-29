import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { Candidate, DigitalTwin } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import InteractiveDemo from '../components/InteractiveDemo';
import toast from 'react-hot-toast';

const EmployerDashboardPage: React.FC = () => {
  const [students, setStudents] = useState<Candidate[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Available skills for filtering
  const availableSkills = [
    'React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'C#',
    'Node.js', 'Django', 'Flask', 'Spring Boot', 'Angular', 'Vue.js',
    'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes',
    'AWS', 'Azure', 'Git', 'REST API', 'GraphQL', 'Machine Learning',
    'Data Science', 'DevOps', 'UI/UX Design', 'Mobile Development'
  ];

  // Available programs for filtering
  const availablePrograms = [
    'Computer Science', 'Information Systems', 'Cybersecurity',
    'Information Security', 'Data Science', 'Artificial Intelligence',
    'Web Development', 'Mobile Development', 'Game Development',
    'Network Engineering', 'Database Administration'
  ];

  // Mock data for students based on backend data structure
  useEffect(() => {
    const mockStudents: Candidate[] = [
      {
        id: '1',
        learnerDid: 'did:learntwin:student001',
        name: 'Đoàn Minh Trung',
        avatarUrl: undefined,
        digitalTwin: {
          learnerDid: 'did:learntwin:student001',
          knowledge: { 
            'Python': 0.8, 
            'Data Structures': 1.0,
            'Python cơ bản': 0.95
          },
          skills: { problemSolving: 0.7, logicalThinking: 0.8, selfLearning: 0.85 },
          behavior: { timeSpent: '180h', quizAccuracy: 0.92, preferredLearningStyle: 'code-first' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        matchScore: 95,
        appliedAt: '2024-01-15T10:30:00Z',
        status: 'pending'
      },
      {
        id: '2',
        learnerDid: 'did:learntwin:student002',
        name: 'Phan Thế Duy',
        avatarUrl: undefined,
        digitalTwin: {
          learnerDid: 'did:learntwin:student002',
          knowledge: { 
            'HTML': 0.8, 
            'CSS': 0.75,
            'Python': 0.6,
            'HTML & CSS': 0.85
          },
          skills: { problemSolving: 0.8, logicalThinking: 0.75, selfLearning: 0.85 },
          behavior: { timeSpent: '120h', quizAccuracy: 0.88, preferredLearningStyle: 'visual-examples' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        matchScore: 87,
        appliedAt: '2024-01-14T15:20:00Z',
        status: 'pending'
      },
      {
        id: '3',
        learnerDid: 'did:learntwin:student003',
        name: 'Phạm Văn Hậu',
        avatarUrl: undefined,
        digitalTwin: {
          learnerDid: 'did:learntwin:student003',
          knowledge: { 
            'Python': 0.9, 
            'Mạng máy tính': 0.7,
            'Python cơ bản': 0.9
          },
          skills: { problemSolving: 0.75, logicalThinking: 0.8, selfLearning: 0.85 },
          behavior: { timeSpent: '150h', quizAccuracy: 0.85, preferredLearningStyle: 'theory-then-practice' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        matchScore: 89,
        appliedAt: '2024-01-13T09:15:00Z',
        status: 'pending'
      },
      {
        id: '4',
        learnerDid: 'did:learntwin:student004',
        name: 'Lê Hoàng Giang',
        avatarUrl: undefined,
        digitalTwin: {
          learnerDid: 'did:learntwin:student004',
          knowledge: { 
            'Java': 0.8, 
            'Python': 0.85,
            'Lập trình hướng đối tượng': 0.8,
            'Python cơ bản': 0.85
          },
          skills: { problemSolving: 0.8, logicalThinking: 0.85, selfLearning: 0.8 },
          behavior: { timeSpent: '95h', quizAccuracy: 0.90, preferredLearningStyle: 'practice-first' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        matchScore: 91,
        appliedAt: '2024-01-12T14:45:00Z',
        status: 'pending'
      },
      {
        id: '5',
        learnerDid: 'did:learntwin:student005',
        name: 'Trần Dương Minh Đại',
        avatarUrl: undefined,
        digitalTwin: {
          learnerDid: 'did:learntwin:student005',
          knowledge: { 
            'Python': 0.95, 
            'C': 0.6,
            'An toàn hệ thống': 0.6,
            'Python cơ bản': 0.95
          },
          skills: { problemSolving: 0.7, logicalThinking: 0.8, selfLearning: 0.85 },
          behavior: { timeSpent: '200h', quizAccuracy: 0.87, preferredLearningStyle: 'theory-then-practice' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        matchScore: 86,
        appliedAt: '2024-01-11T11:30:00Z',
        status: 'pending'
      },
      {
        id: '6',
        learnerDid: 'did:learntwin:student006',
        name: 'Huỳnh Quốc Khánh',
        avatarUrl: undefined,
        digitalTwin: {
          learnerDid: 'did:learntwin:student006',
          knowledge: { 
            'Python': 0.9, 
            'R': 0.5,
            'Machine Learning cơ bản': 0.7,
            'Python cơ bản': 0.9
          },
          skills: { problemSolving: 0.8, logicalThinking: 0.85, selfLearning: 0.9 },
          behavior: { timeSpent: '160h', quizAccuracy: 0.88, preferredLearningStyle: 'theory-then-practice' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        matchScore: 88,
        appliedAt: '2024-01-10T13:20:00Z',
        status: 'pending'
      },
      {
        id: '7',
        learnerDid: 'did:learntwin:student007',
        name: 'Nguyễn Anh Khoa',
        avatarUrl: undefined,
        digitalTwin: {
          learnerDid: 'did:learntwin:student007',
          knowledge: { 
            'Python': 0.8, 
            'C++': 0.65,
            'Hệ điều hành': 0.6,
            'Python cơ bản': 0.8
          },
          skills: { problemSolving: 0.85, logicalThinking: 0.8, selfLearning: 0.85 },
          behavior: { timeSpent: '140h', quizAccuracy: 0.85, preferredLearningStyle: 'practice-first' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        matchScore: 84,
        appliedAt: '2024-01-09T16:45:00Z',
        status: 'pending'
      },
      {
        id: '8',
        learnerDid: 'did:learntwin:student008',
        name: 'Võ Nguyễn Gia Quốc',
        avatarUrl: undefined,
        digitalTwin: {
          learnerDid: 'did:learntwin:student008',
          knowledge: { 
            'Python': 0.88, 
            'SQL': 0.7,
            'Xử lý dữ liệu': 0.75,
            'Python cơ bản': 0.88
          },
          skills: { problemSolving: 0.85, logicalThinking: 0.8, selfLearning: 0.85 },
          behavior: { timeSpent: '175h', quizAccuracy: 0.89, preferredLearningStyle: 'theory-then-practice' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        matchScore: 90,
        appliedAt: '2024-01-08T12:10:00Z',
        status: 'pending'
      },
      {
        id: '99',
        learnerDid: 'did:learntwin:student099',
        name: 'testaccount',
        avatarUrl: undefined,
        digitalTwin: {
          learnerDid: 'did:learntwin:student099',
          knowledge: {},
          skills: { problemSolving: 0.5, logicalThinking: 0.5, selfLearning: 0.5 },
          behavior: { timeSpent: '0h', quizAccuracy: 0.0, preferredLearningStyle: 'code-first' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        matchScore: 50,
        appliedAt: '2024-01-07T10:00:00Z',
        status: 'pending'
      }
    ];

    setTimeout(() => {
      setStudents(mockStudents);
      setFilteredStudents(mockStudents);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter students based on search term (skills/programs) and selected filters
  useEffect(() => {
    let filtered = students;

    // Filter by search term (skills or programs)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(student => {
        // Check if search term matches any skill
        const hasMatchingSkill = Object.keys(student.digitalTwin.knowledge).some(skill => 
          skill.toLowerCase().includes(searchLower)
        );
        
        // Check if search term matches any program (mock data)
        const studentPrograms = {
          '1': 'Computer Science',
          '2': 'Information Systems', 
          '3': 'Cybersecurity',
          '4': 'Computer Science',
          '5': 'Computer Science',
          '6': 'Information Security',
          '7': 'Computer Science',
          '8': 'Information Security',
          '99': 'Computer Science'
        };
        const studentProgram = studentPrograms[student.id as keyof typeof studentPrograms];
        const hasMatchingProgram = studentProgram.toLowerCase().includes(searchLower);
        
        return hasMatchingSkill || hasMatchingProgram;
      });
    }

    // Filter by selected skills
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(student => {
        const studentSkills = Object.keys(student.digitalTwin.knowledge);
        return selectedSkills.some(skill => 
          studentSkills.includes(skill) && student.digitalTwin.knowledge[skill] >= 0.7
        );
      });
    }

    // Filter by selected programs
    if (selectedPrograms.length > 0) {
      filtered = filtered.filter(student => {
        const studentPrograms = {
          '1': 'Computer Science',
          '2': 'Information Systems', 
          '3': 'Cybersecurity',
          '4': 'Computer Science',
          '5': 'Computer Science',
          '6': 'Information Security',
          '7': 'Computer Science',
          '8': 'Information Security'
        };
        const studentProgram = studentPrograms[student.id as keyof typeof studentPrograms];
        return selectedPrograms.includes(studentProgram);
      });
    }

    // Sort by match score
    filtered.sort((a, b) => b.matchScore - a.matchScore);
    
    setFilteredStudents(filtered);
  }, [students, selectedSkills, selectedPrograms, searchTerm]);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleProgramToggle = (program: string) => {
    setSelectedPrograms(prev => 
      prev.includes(program) 
        ? prev.filter(p => p !== program)
        : [...prev, program]
    );
  };

  const clearFilters = () => {
    setSelectedSkills([]);
    setSelectedPrograms([]);
    setSearchTerm('');
  };

  const handleViewStudent = (student: Candidate) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const getSkillLevel = (level: number) => {
    if (level >= 0.9) return { text: 'Expert', color: 'bg-green-100 text-green-800' };
    if (level >= 0.8) return { text: 'Advanced', color: 'bg-blue-100 text-blue-800' };
    if (level >= 0.7) return { text: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Beginner', color: 'bg-gray-100 text-gray-800' };
  };

  const getTopSkills = (digitalTwin: DigitalTwin) => {
    return Object.entries(digitalTwin.knowledge)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Interactive Demo Info */}
      <InteractiveDemo />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Search</h1>
          <p className="text-gray-600 mt-1">Search students by skills and programs</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{filteredStudents.length}</div>
          <div className="text-sm text-gray-600">Matching students</div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by skills or programs (e.g., React, Python, Computer Science...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Type skill names or programs to search quickly
          </p>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear all filters
          </button>
        </div>

        {/* Skills Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filter by skills:</h3>
            {selectedSkills.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {selectedSkills.length} skills selected
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedSkills.includes(skill)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Programs Filter */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpenIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filter by programs:</h3>
            {selectedPrograms.length > 0 && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {selectedPrograms.length} programs selected
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availablePrograms.map((program) => (
              <button
                key={program}
                onClick={() => handleProgramToggle(program)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedPrograms.includes(program)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {program}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Student list ({filteredStudents.length})
          </h2>
        </div>
        <div className="p-6">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching students found</h3>
              <p className="text-gray-600">Try changing search terms or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{student.name}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <StarIcon className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {student.matchScore}% match
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {student.digitalTwin.behavior.timeSpent} study time
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircleIcon className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-gray-600">
                                {Math.round(student.digitalTwin.behavior.quizAccuracy * 100)}% accuracy
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Top Skills */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Top skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {getTopSkills(student.digitalTwin).map(([skill, level]) => {
                            const skillLevel = getSkillLevel(level);
                            return (
                              <span
                                key={skill}
                                className={`px-2 py-1 rounded text-xs font-medium ${skillLevel.color}`}
                              >
                                {skill} ({skillLevel.text})
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Skills Match */}
                      {selectedSkills.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Matching skills:</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedSkills.map((skill) => {
                              const level = student.digitalTwin.knowledge[skill] || 0;
                              const skillLevel = getSkillLevel(level);
                              return (
                                <span
                                  key={skill}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    level >= 0.7 ? skillLevel.color : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {skill} ({Math.round(level * 100)}%)
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      <Modal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        title={selectedStudent ? `Detailed Profile - ${selectedStudent.name}` : ''}
      >
        {selectedStudent && (
          <div className="p-6 space-y-6">
            {/* Student Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {selectedStudent.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h3>
                <p className="text-gray-600">DID: {selectedStudent.learnerDid}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">{selectedStudent.matchScore}% match</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Overview */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Skills Overview</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Soft Skills</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Problem Solving</span>
                      <span className="text-sm font-medium">{Math.round(selectedStudent.digitalTwin.skills.problemSolving * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Logical Thinking</span>
                      <span className="text-sm font-medium">{Math.round(selectedStudent.digitalTwin.skills.logicalThinking * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Self Learning</span>
                      <span className="text-sm font-medium">{Math.round(selectedStudent.digitalTwin.skills.selfLearning * 100)}%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Learning Behavior</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Study Time</span>
                      <span className="text-sm font-medium">{selectedStudent.digitalTwin.behavior.timeSpent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Accuracy</span>
                      <span className="text-sm font-medium">{Math.round(selectedStudent.digitalTwin.behavior.quizAccuracy * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Learning Style</span>
                      <span className="text-sm font-medium capitalize">{selectedStudent.digitalTwin.behavior.preferredLearningStyle}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Skills */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Technical Skills</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(selectedStudent.digitalTwin.knowledge)
                  .sort(([,a], [,b]) => b - a)
                  .map(([skill, level]) => {
                    const skillLevel = getSkillLevel(level);
                    return (
                      <div key={skill} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-900">{skill}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${skillLevel.color}`}>
                            {skillLevel.text}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${level * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{Math.round(level * 100)}%</div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  toast.success(`Contacted ${selectedStudent.name}`);
                  setShowStudentModal(false);
                }}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Contact now
              </button>
              <button
                onClick={() => setShowStudentModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployerDashboardPage; 