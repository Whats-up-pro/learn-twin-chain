import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  StarIcon,
  XMarkIcon,
  BookOpenIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  requiredSkills: string[];
  requiredInstitutions: string[];
  requiredPrograms: string[];
  minimumGPA: number | '';
  requiredProofTypes: ('skill' | 'identity' | 'academic' | 'experience')[];
  minProofLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  expiryDate: string;
  smartContractAddress?: string;
  blockchainTx?: string;
}

interface Student {
  id: string;
  name: string;
  institution: string;
  program: string;
  gpa: number;
  skills: Record<string, number>;
  matchScore: number;
  hasZKProof?: boolean;
  proofVerified?: boolean;
  zkProofDetails?: {
    proofType: 'skill' | 'identity' | 'academic' | 'experience';
    proofLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
    verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
    expiryDate?: string;
    issuer?: string;
    blockchainTx?: string;
  };
  privacySettings?: {
    allowContact: boolean;
    allowSkillView: boolean;
    allowProfileView: boolean;
    requireNDA: boolean;
  };
}

const EmployerStudentSearchPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;
  
  // Job posting state
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobPosting, setJobPosting] = useState<JobPosting>({
    id: '',
    title: '',
    company: '',
    location: '',
    salary: '',
    jobType: 'full-time',
    requiredSkills: [],
    requiredInstitutions: [],
    requiredPrograms: [],
    minimumGPA: '',
    requiredProofTypes: ['skill'],
    minProofLevel: 'intermediate',
    description: '',
    requirements: [],
    benefits: [],
    postedDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  // Filter states
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minimumGPA, setMinimumGPA] = useState<number | ''>('');
  const [showFilterSection, setShowFilterSection] = useState(false);
  const [showInstitutionSection, setShowInstitutionSection] = useState(false);
  const [showProgramSection, setShowProgramSection] = useState(false);
  
  // ZK Proof state
  const [zkProofVerified, setZkProofVerified] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedProofType, setSelectedProofType] = useState<'skill' | 'identity' | 'academic' | 'experience'>('skill');
  const [proofVerificationStep, setProofVerificationStep] = useState<'select' | 'verify' | 'complete'>('select');
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);

  // Smart contract state
  const [contractDeploying, setContractDeploying] = useState(false);
  const [contractAddress, setContractAddress] = useState<string>('');

  // Available options
  const availableInstitutions = ['UIT', 'BKU', 'HCMUS', 'HCMUT', 'UEL', 'IUH'];
  const availablePrograms = [
    'Computer Science', 
    'Information Systems', 
    'Software Engineering', 
    'Information Technology',
    'Cybersecurity',
    'Data Science',
    'Artificial Intelligence',
    'Computer Engineering'
  ];
  const availableSkills = [
    'Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Django', 'Flask',
    'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud',
    'Machine Learning', 'Deep Learning', 'Data Analysis', 'Statistics',
    'Git', 'Linux', 'DevOps', 'Agile', 'Scrum'
  ];
  const availableGPAs = ['3.0+', '3.2+', '3.5+', '3.7+', '3.8+', '3.9+'];

  // Sample data from NFT (simplified)
  useEffect(() => {
    const mockStudents: Student[] = [
      {
        id: '1',
        name: 'Đoàn Minh Trung',
        institution: 'BKU',
        program: 'Computer Science',
        gpa: 3.8,
        skills: {
          'Python': 0.8,
          'Data Structures': 1.0,
          'Python Basics': 0.95
        },
        matchScore: 95,
        hasZKProof: true,
        proofVerified: true,
        zkProofDetails: {
          proofType: 'skill',
          proofLevel: 'expert',
          verificationStatus: 'verified',
          expiryDate: '2025-12-31',
          issuer: 'LearnTwinChain',
          blockchainTx: '0x1234567890abcdef'
        },
        privacySettings: {
          allowContact: true,
          allowSkillView: true,
          allowProfileView: false,
          requireNDA: true
        }
      },
      {
        id: '2',
        name: 'Phan Thế Duy',
        institution: 'UIT',
        program: 'Information Systems',
        gpa: 3.5,
        skills: {
          'HTML': 0.8,
          'CSS': 0.75,
          'Python': 0.6,
          'HTML & CSS': 0.85
        },
        matchScore: 87,
        hasZKProof: true,
        proofVerified: false,
        zkProofDetails: {
          proofType: 'academic',
          proofLevel: 'intermediate',
          verificationStatus: 'pending',
          expiryDate: '2024-10-15',
          issuer: 'UIT Blockchain',
          blockchainTx: '0xabcdef1234567890'
        },
        privacySettings: {
          allowContact: true,
          allowSkillView: true,
          allowProfileView: true,
          requireNDA: false
        }
      },
      {
        id: '3',
        name: 'Phạm Văn Hậu',
        institution: 'HCMUS',
        program: 'Cybersecurity',
        gpa: 3.9,
        skills: {
          'Python': 0.9,
          'Computer Networks': 0.7,
          'Python Basics': 0.9
        },
        matchScore: 89,
        hasZKProof: false,
        proofVerified: false,
        privacySettings: {
          allowContact: false,
          allowSkillView: false,
          allowProfileView: false,
          requireNDA: false
        }
      },
      {
        id: '4',
        name: 'Lê Hoàng Giang',
        institution: 'UIT',
        program: 'Computer Science',
        gpa: 3.7,
        skills: {
          'Java': 0.8,
          'Python': 0.85,
          'Object-Oriented Programming': 0.8,
          'Python Basics': 0.85
        },
        matchScore: 91,
        hasZKProof: true,
        proofVerified: true,
        zkProofDetails: {
          proofType: 'experience',
          proofLevel: 'advanced',
          verificationStatus: 'verified',
          expiryDate: '2025-11-30',
          issuer: 'Industry Partner',
          blockchainTx: '0x9876543210fedcba'
        },
        privacySettings: {
          allowContact: true,
          allowSkillView: true,
          allowProfileView: true,
          requireNDA: true
        }
      },
      {
        id: '5',
        name: 'Trần Dương Minh Đại',
        institution: 'UIT',
        program: 'Computer Science',
        gpa: 3.6,
        skills: {
          'Python': 0.95,
          'Machine Learning': 0.8,
          'Data Science': 0.85,
          'Python Basics': 0.95
        },
        matchScore: 93,
        hasZKProof: true,
        proofVerified: true,
        zkProofDetails: {
          proofType: 'skill',
          proofLevel: 'expert',
          verificationStatus: 'verified',
          expiryDate: '2025-12-31',
          issuer: 'LearnTwinChain',
          blockchainTx: '0x5555555555555555'
        },
        privacySettings: {
          allowContact: true,
          allowSkillView: true,
          allowProfileView: false,
          requireNDA: true
        }
      },
      {
        id: '6',
        name: 'Nguyễn Thị Anh',
        institution: 'UIT',
        program: 'Software Engineering',
        gpa: 3.4,
        skills: {
          'JavaScript': 0.9,
          'React': 0.85,
          'Node.js': 0.8,
          'Python': 0.7
        },
        matchScore: 88,
        hasZKProof: true,
        proofVerified: false,
        zkProofDetails: {
          proofType: 'experience',
          proofLevel: 'intermediate',
          verificationStatus: 'pending',
          expiryDate: '2025-08-15',
          issuer: 'Industry Partner',
          blockchainTx: '0x3333333333333333'
        },
        privacySettings: {
          allowContact: true,
          allowSkillView: true,
          allowProfileView: false,
          requireNDA: true
        }
      },
      {
        id: '7',
        name: 'Lê Văn Bình',
        institution: 'HCMUS',
        program: 'Data Science',
        gpa: 3.2,
        skills: {
          'Python': 0.8,
          'Machine Learning': 0.9,
          'Statistics': 0.85,
          'SQL': 0.75
        },
        matchScore: 85,
        hasZKProof: true,
        proofVerified: true,
        zkProofDetails: {
          proofType: 'academic',
          proofLevel: 'intermediate',
          verificationStatus: 'verified',
          expiryDate: '2025-09-30',
          issuer: 'HCMUS Blockchain',
          blockchainTx: '0x2222222222222222'
        },
        privacySettings: {
          allowContact: true,
          allowSkillView: true,
          allowProfileView: false,
          requireNDA: true
        }
      },
      {
        id: '8',
        name: 'Trần Thị Cẩm',
        institution: 'UIT',
        program: 'Information Technology',
        gpa: 3.3,
        skills: {
          'Java': 0.7,
          'Spring Boot': 0.8,
          'MySQL': 0.75,
          'Git': 0.9
        },
        matchScore: 82,
        hasZKProof: true,
        proofVerified: false,
        zkProofDetails: {
          proofType: 'experience',
          proofLevel: 'intermediate',
          verificationStatus: 'pending',
          expiryDate: '2025-08-15',
          issuer: 'Industry Partner',
          blockchainTx: '0x3333333333333333'
        },
        privacySettings: {
          allowContact: true,
          allowSkillView: true,
          allowProfileView: false,
          requireNDA: false
        }
      },
      {
        id: '99',
        name: 'Test Account Student099',
        institution: 'UIT',
        program: 'Computer Science',
        gpa: 3.5,
        skills: {
          'Python': 0.7,
          'JavaScript': 0.6,
          'HTML': 0.8,
          'CSS': 0.75
        },
        matchScore: 78,
        hasZKProof: true,
        proofVerified: true,
        zkProofDetails: {
          proofType: 'skill',
          proofLevel: 'basic',
          verificationStatus: 'verified',
          expiryDate: '2025-12-31',
          issuer: 'LearnTwinChain',
          blockchainTx: '0x1234567890abcdef'
        },
        privacySettings: {
          allowContact: true,
          allowSkillView: true,
          allowProfileView: true,
          requireNDA: false
        }
      }
    ];

    setStudents(mockStudents);
    setFilteredStudents(mockStudents);
    setLoading(false);
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  const handleContact = (student: Student) => {
    setSelectedStudent(student);
    setShowProofModal(true);
    setProofVerificationStep('select');
  };

  const handleVerifyZKProof = () => {
    setProofVerificationStep('verify');
    // Simulate verification process
    setTimeout(() => {
      setProofVerificationStep('complete');
      setZkProofVerified(true);
    }, 2000);
  };

  const getSkillLevel = (level: number) => {
    if (level >= 0.9) return { text: 'Expert', color: 'bg-purple-100 text-purple-800' };
    if (level >= 0.7) return { text: 'Advanced', color: 'bg-green-100 text-green-800' };
    if (level >= 0.5) return { text: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Basic', color: 'bg-blue-100 text-blue-800' };
  };

  const getZKProofStatus = (student: Student) => {
    if (!student.hasZKProof || !student.zkProofDetails) {
      return { status: 'No Proof', color: 'bg-red-500', canContact: false };
    }

    const { verificationStatus, expiryDate } = student.zkProofDetails;
    const isExpired = expiryDate && new Date(expiryDate) < new Date();

    if (verificationStatus === 'verified' && !isExpired && student.privacySettings?.allowContact) {
      return { status: 'Verified', color: 'bg-green-500', canContact: true };
    } else if (verificationStatus === 'verified' && !isExpired && !student.privacySettings?.allowContact) {
      return { status: 'Verified (No Contact)', color: 'bg-blue-500', canContact: false };
    } else if (verificationStatus === 'pending') {
      return { status: 'Pending', color: 'bg-yellow-500', canContact: false };
    } else if (verificationStatus === 'rejected') {
      return { status: 'Rejected', color: 'bg-red-500', canContact: false };
    } else if (isExpired) {
      return { status: 'Expired', color: 'bg-red-500', canContact: false };
    }

    return { status: 'No Proof', color: 'bg-red-500', canContact: false };
  };

  const handleJobSubmit = async () => {
    setContractDeploying(true);
    
    try {
      // Simulate smart contract deployment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockContractAddress = '0x' + Math.random().toString(16).substr(2, 40);
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      setContractAddress(mockContractAddress);
      
      // Update job posting with contract details
      const updatedJob = {
        ...jobPosting,
        id: Date.now().toString(),
        smartContractAddress: mockContractAddress,
        blockchainTx: mockTxHash
      };
      
      setJobPosting(updatedJob);
      setShowJobForm(false);
      
      // Filter students based on job requirements
      const matchingStudents = students.filter(student => {
        // Check if student has required ZK proof types
        const hasRequiredProofType = jobPosting.requiredProofTypes.some(
          proofType => student.zkProofDetails?.proofType === proofType
        );
        
        // Check if student has required skills
        const hasRequiredSkills = jobPosting.requiredSkills.some(
          skill => student.skills[skill] !== undefined
        );
        
        // Check if student's proof level meets minimum requirement
        const proofLevels = { basic: 1, intermediate: 2, advanced: 3, expert: 4 };
        const studentLevel = student.zkProofDetails?.proofLevel || 'basic';
        const meetsLevelRequirement = proofLevels[studentLevel] >= proofLevels[jobPosting.minProofLevel];
        
        return hasRequiredProofType && hasRequiredSkills && meetsLevelRequirement && student.hasZKProof;
      });
      
      setFilteredStudents(matchingStudents);
      setCurrentPage(1);
      
      toast.success('Job posted successfully! Smart contract deployed.');
      
    } catch (error) {
      toast.error('Failed to deploy smart contract. Please try again.');
    } finally {
      setContractDeploying(false);
    }
  };

  const resetJobSearch = () => {
    setJobPosting({
      id: '',
      title: '',
      company: '',
      location: '',
      salary: '',
      jobType: 'full-time',
      requiredSkills: [],
      requiredInstitutions: [],
      requiredPrograms: [],
      minimumGPA: '',
      requiredProofTypes: ['skill'],
      minProofLevel: 'intermediate',
      description: '',
      requirements: [],
      benefits: [],
      postedDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setContractAddress('');
    setSelectedInstitutions([]);
    setSelectedPrograms([]);
    setSelectedSkills([]);
    setMinimumGPA('');
  };

  // Filter functions
  const toggleInstitution = (institution: string) => {
    setJobPosting(prev => ({
      ...prev,
      requiredInstitutions: prev.requiredInstitutions.includes(institution)
        ? prev.requiredInstitutions.filter(i => i !== institution)
        : [...prev.requiredInstitutions, institution]
    }));
  };

  const toggleProgram = (program: string) => {
    setJobPosting(prev => ({
      ...prev,
      requiredPrograms: prev.requiredPrograms.includes(program)
        ? prev.requiredPrograms.filter(p => p !== program)
        : [...prev.requiredPrograms, program]
    }));
  };

  const toggleSkill = (skill: string) => {
    setJobPosting(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter(s => s !== skill)
        : [...prev.requiredSkills, skill]
    }));
  };

  const toggleGPA = (gpa: string) => {
    const gpaValue = parseFloat(gpa.replace('+', ''));
    setJobPosting(prev => ({
      ...prev,
      minimumGPA: prev.minimumGPA === gpaValue ? '' : gpaValue
    }));
  };

  const clearAllFilters = () => {
    setJobPosting(prev => ({
      ...prev,
      requiredInstitutions: [],
      requiredPrograms: [],
      requiredSkills: [],
      minimumGPA: ''
    }));
  };

  // Apply filters when job is posted or filters change
  useEffect(() => {
    if (!jobPosting.id) {
      setFilteredStudents([]);
      return;
    }

    let filtered = students.filter(student => {
      // Filter by institutions
      if (jobPosting.requiredInstitutions.length > 0 && !jobPosting.requiredInstitutions.includes(student.institution)) {
        return false;
      }
      
      // Filter by programs
      if (jobPosting.requiredPrograms.length > 0 && !jobPosting.requiredPrograms.includes(student.program)) {
        return false;
      }
      
      // Filter by skills
      if (jobPosting.requiredSkills.length > 0) {
        const hasRequiredSkill = jobPosting.requiredSkills.some(skill => student.skills[skill] !== undefined);
        if (!hasRequiredSkill) {
          return false;
        }
      }
      
      // Filter by GPA
      if (jobPosting.minimumGPA !== '' && student.gpa < jobPosting.minimumGPA) {
        return false;
      }
      
      return true;
    });

    setFilteredStudents(filtered);
  }, [students, jobPosting]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Smart Job Posting Platform
          </h1>
          <p className="text-xl text-gray-600">
            Post job requirements and find candidates with verified ZK proofs
          </p>
        </div>

        {/* Job Posting Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BriefcaseIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Post New Job</h2>
            </div>
            <button
              onClick={() => setShowJobForm(!showJobForm)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {showJobForm ? 'Cancel' : 'Post Job'}
            </button>
          </div>

          {showJobForm && (
            <div className="space-y-6">
              {/* Basic Job Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    value={jobPosting.title}
                    onChange={(e) => setJobPosting({...jobPosting, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    placeholder="e.g., Senior Python Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={jobPosting.company}
                    onChange={(e) => setJobPosting({...jobPosting, company: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    placeholder="e.g., TechCorp Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={jobPosting.location}
                    onChange={(e) => setJobPosting({...jobPosting, location: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    placeholder="e.g., Ho Chi Minh City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                  <input
                    type="text"
                    value={jobPosting.salary}
                    onChange={(e) => setJobPosting({...jobPosting, salary: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    placeholder="e.g., $2000 - $4000"
                  />
                </div>
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                <select
                  value={jobPosting.jobType}
                  onChange={(e) => setJobPosting({...jobPosting, jobType: e.target.value as any})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              {/* Required Skills - Replace with 3 filter bars */}
              <div className="space-y-6">
                {/* Institution Filter */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-blue-600" />
                    Institutions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableInstitutions.slice(0, showInstitutionSection ? availableInstitutions.length : 3).map((institution) => (
                      <button
                        key={institution}
                        onClick={() => toggleInstitution(institution)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          jobPosting.requiredInstitutions.includes(institution)
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {institution}
                      </button>
                    ))}
                    {availableInstitutions.length > 3 && (
                      <button
                        onClick={() => setShowInstitutionSection(!showInstitutionSection)}
                        className="flex items-center gap-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {showInstitutionSection ? (
                          <>
                            <ChevronUpIcon className="w-4 h-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDownIcon className="w-4 h-4" />
                            Show More ({availableInstitutions.length - 3} more)
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Program Filter */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <AcademicCapIcon className="w-4 h-4 text-green-600" />
                    Programs
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availablePrograms.slice(0, showProgramSection ? availablePrograms.length : 3).map((program) => (
                      <button
                        key={program}
                        onClick={() => toggleProgram(program)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          jobPosting.requiredPrograms.includes(program)
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {program}
                      </button>
                    ))}
                    {availablePrograms.length > 3 && (
                      <button
                        onClick={() => setShowProgramSection(!showProgramSection)}
                        className="flex items-center gap-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {showProgramSection ? (
                          <>
                            <ChevronUpIcon className="w-4 h-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDownIcon className="w-4 h-4" />
                            Show More ({availablePrograms.length - 3} more)
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Skills Filter */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <CodeBracketIcon className="w-4 h-4 text-purple-600" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.slice(0, showFilterSection ? availableSkills.length : 3).map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          jobPosting.requiredSkills.includes(skill)
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                    {availableSkills.length > 3 && (
                      <button
                        onClick={() => setShowFilterSection(!showFilterSection)}
                        className="flex items-center gap-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {showFilterSection ? (
                          <>
                            <ChevronUpIcon className="w-4 h-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDownIcon className="w-4 h-4" />
                            Show More ({availableSkills.length - 3} more)
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* GPA Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum GPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4.0"
                    value={jobPosting.minimumGPA === '' ? '' : jobPosting.minimumGPA}
                    onChange={(e) => setJobPosting(prev => ({
                      ...prev,
                      minimumGPA: e.target.value === '' ? '' : parseFloat(e.target.value)
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                    placeholder="e.g., 3.5"
                  />
                </div>

                {/* Clear Filters */}
                {(jobPosting.requiredInstitutions.length > 0 || jobPosting.requiredPrograms.length > 0 || jobPosting.requiredSkills.length > 0 || jobPosting.minimumGPA !== '') && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* ZK Proof Requirements */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Proof Types</label>
                  <div className="space-y-2">
                    {(['skill', 'identity', 'academic', 'experience'] as const).map((proofType) => (
                      <label key={proofType} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={jobPosting.requiredProofTypes.includes(proofType)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setJobPosting({
                                ...jobPosting,
                                requiredProofTypes: [...jobPosting.requiredProofTypes, proofType]
                              });
                            } else {
                              setJobPosting({
                                ...jobPosting,
                                requiredProofTypes: jobPosting.requiredProofTypes.filter(pt => pt !== proofType)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 capitalize">{proofType}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Minimum Proof Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Proof Level</label>
                  <select
                    value={jobPosting.minProofLevel}
                    onChange={(e) => setJobPosting({...jobPosting, minProofLevel: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                <textarea
                  value={jobPosting.description}
                  onChange={(e) => setJobPosting({...jobPosting, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Describe the role and responsibilities..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowJobForm(false)}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJobSubmit}
                  disabled={contractDeploying || !jobPosting.title || !jobPosting.company}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {contractDeploying ? (
                    <>
                      <LoadingSpinner />
                      Deploying Smart Contract...
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="w-5 h-5" />
                      Deploy Smart Contract & Post Job
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Job Status */}
        {jobPosting.id && (
          <div className="bg-green-50 rounded-xl p-6 border border-green-200 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-green-900 mb-2">Active Job Posting</h3>
                <p className="text-green-700 mb-1"><strong>{jobPosting.title}</strong> at {jobPosting.company}</p>
                <p className="text-green-600 text-sm">Smart Contract: {contractAddress}</p>
                <p className="text-green-600 text-sm">Matching candidates: {filteredStudents.length}</p>
              </div>
              <button
                onClick={resetJobSearch}
                className="px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
              >
                Reset Search
              </button>
            </div>
          </div>
        )}

        {/* Candidate List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
              Matching Candidates ({filteredStudents.length})
            </h2>
            {jobPosting.id && (
              <p className="text-gray-600 mt-2">
                Showing candidates with verified ZK proofs matching your job requirements
              </p>
            )}
          </div>
          <div className="p-6">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserGroupIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {jobPosting.id ? 'No matching candidates found' : 'No job posted yet'}
                </h3>
                <p className="text-gray-600 text-lg">
                  {jobPosting.id 
                    ? 'Try adjusting your job requirements or posting a new job'
                    : 'Post a job to find candidates with verified ZK proofs'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {currentStudents.map((student) => (
                    <div 
                      key={student.id} 
                      className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer transform hover:scale-105"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
                        <span className="text-xl font-bold text-white">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 text-center break-words">
                        {student.name}
                      </h3>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                : 'text-gray-500 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Student Contact Modal */}
        <Modal
          isOpen={selectedStudent !== null}
          onClose={() => setSelectedStudent(null)}
          title={`Contact ${selectedStudent?.name}`}
          size="md"
        >
          <div className="p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg mx-auto mb-6">
              <span className="text-2xl font-bold text-white">
                {selectedStudent?.name.charAt(0)}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedStudent?.name}</h3>
            
            <div className="mb-6">
              <button
                onClick={() => {
                  if (selectedStudent) {
                    handleContact(selectedStudent);
                    setSelectedStudent(null);
                  }
                }}
                disabled={selectedStudent && !getZKProofStatus(selectedStudent).canContact}
                className={`px-8 py-4 rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  selectedStudent && getZKProofStatus(selectedStudent).canContact
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                {selectedStudent && getZKProofStatus(selectedStudent).canContact ? 'Contact Student' : 'Contact Disabled'}
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              {selectedStudent && !getZKProofStatus(selectedStudent).canContact && (
                <p>This student requires ZK proof verification before contact.</p>
              )}
            </div>
          </div>
        </Modal>

        {/* ZK Proof Verification Modal */}
        <Modal
          isOpen={showProofModal}
          onClose={() => setShowProofModal(false)}
          title="ZK Proof Verification Required"
          size="lg"
        >
          <div className="p-6">
            {proofVerificationStep === 'select' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">ZK Proof Verification Required</h3>
                  <p className="text-gray-600">
                    To contact {selectedStudent?.name}, you need to verify their Zero-Knowledge proof and accept privacy terms.
                  </p>
                </div>
                
                {selectedStudent?.zkProofDetails && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-900 mb-3">Proof Details:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span> {selectedStudent.zkProofDetails.proofType}
                      </div>
                      <div>
                        <span className="font-medium">Level:</span> {selectedStudent.zkProofDetails.proofLevel}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {selectedStudent.zkProofDetails.verificationStatus}
                      </div>
                      <div>
                        <span className="font-medium">Expires:</span> {selectedStudent.zkProofDetails.expiryDate}
                      </div>
                      <div>
                        <span className="font-medium">Issuer:</span> {selectedStudent.zkProofDetails.issuer}
                      </div>
                      <div>
                        <span className="font-medium">Transaction:</span> {selectedStudent.zkProofDetails.blockchainTx?.substring(0, 10)}...
                      </div>
                    </div>
                  </div>
                )}

                {selectedStudent?.privacySettings?.requireNDA && (
                  <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-yellow-900 mb-3">NDA Required</h4>
                    <p className="text-yellow-800 text-sm mb-4">
                      This candidate requires a Non-Disclosure Agreement before contact.
                    </p>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={ndaAccepted}
                        onChange={(e) => setNdaAccepted(e.target.checked)}
                        className="mr-2 mt-1"
                      />
                      <span className="text-sm text-yellow-800">
                        I agree to the NDA terms and will maintain confidentiality of any shared information.
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowProofModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyZKProof}
                    disabled={selectedStudent?.privacySettings?.requireNDA && !ndaAccepted}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify Proof
                  </button>
                </div>
              </>
            )}

            {proofVerificationStep === 'verify' && (
              <div className="text-center py-8">
                <LoadingSpinner />
                <h3 className="text-lg font-bold text-gray-900 mt-4">Verifying ZK Proof...</h3>
                <p className="text-gray-600">Please wait while we verify the proof on the blockchain.</p>
              </div>
            )}

            {proofVerificationStep === 'complete' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Verification Complete!</h3>
                <p className="text-gray-600 mb-6">
                  ZK proof has been verified successfully. You can now contact {selectedStudent?.name}.
                </p>
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-green-900 mb-2">Contact Information</h4>
                  <p className="text-green-800 text-sm">
                    Contact details will be provided through the secure channel.
                  </p>
                </div>
                <button
                  onClick={() => setShowProofModal(false)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default EmployerStudentSearchPage; 