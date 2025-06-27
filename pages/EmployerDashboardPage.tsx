import React, { useState, useEffect } from 'react';
import { 
  BriefcaseIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { EmployerDashboard, JobPosting, Candidate } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import InteractiveDemo from '../components/InteractiveDemo';
import toast from 'react-hot-toast';

const EmployerDashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<EmployerDashboard | null>(null);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state for job creation/editing
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    salary: '',
    type: 'full-time' as 'full-time' | 'part-time' | 'contract' | 'internship',
    requirements: '',
    skills: ''
  });

  // Mock data for MVP
  useEffect(() => {
    const mockDashboard: EmployerDashboard = {
      totalJobPostings: 5,
      activeJobPostings: 3,
      totalCandidates: 24,
      recentApplications: [
        {
          id: '1',
          learnerDid: 'did:example:learner1',
          name: 'Nguyễn Văn A',
          digitalTwin: {
            learnerDid: 'did:example:learner1',
            knowledge: { 'React': 0.8, 'TypeScript': 0.7, 'Node.js': 0.6 },
            skills: { problemSolving: 0.8, logicalThinking: 0.9, selfLearning: 0.7 },
            behavior: { timeSpent: '45h', quizAccuracy: 0.85, preferredLearningStyle: 'visual' },
            checkpoints: [],
            version: 1,
            lastUpdated: new Date().toISOString()
          },
          matchScore: 92,
          appliedAt: '2024-01-15T10:30:00Z',
          status: 'pending'
        }
      ],
      topSkills: [
        { skill: 'React', count: 15 },
        { skill: 'TypeScript', count: 12 },
        { skill: 'Node.js', count: 8 }
      ]
    };

    const mockJobPostings: JobPosting[] = [
      {
        id: '1',
        title: 'Frontend Developer',
        company: 'TechCorp Vietnam',
        description: 'We are looking for a skilled Frontend Developer...',
        requirements: ['3+ years experience', 'React/TypeScript', 'Team player'],
        skills: ['React', 'TypeScript', 'CSS', 'Git'],
        location: 'Ho Chi Minh City',
        salary: '$2000-3000',
        type: 'full-time',
        postedAt: '2024-01-10T09:00:00Z',
        employerId: 'employer1',
        isActive: true
      },
      {
        id: '2',
        title: 'Backend Developer',
        company: 'TechCorp Vietnam',
        description: 'Join our backend team to build scalable APIs...',
        requirements: ['2+ years experience', 'Node.js/Python', 'Database design'],
        skills: ['Node.js', 'Python', 'PostgreSQL', 'Docker'],
        location: 'Hanoi',
        salary: '$2500-3500',
        type: 'full-time',
        postedAt: '2024-01-08T14:00:00Z',
        employerId: 'employer1',
        isActive: true
      }
    ];

    const mockCandidates: Candidate[] = [
      {
        id: '1',
        learnerDid: 'did:example:learner1',
        name: 'Nguyễn Văn A',
        digitalTwin: {
          learnerDid: 'did:example:learner1',
          knowledge: { 'React': 0.8, 'TypeScript': 0.7, 'Node.js': 0.6 },
          skills: { problemSolving: 0.8, logicalThinking: 0.9, selfLearning: 0.7 },
          behavior: { timeSpent: '45h', quizAccuracy: 0.85, preferredLearningStyle: 'visual' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        matchScore: 92,
        appliedAt: '2024-01-15T10:30:00Z',
        status: 'pending'
      },
      {
        id: '2',
        learnerDid: 'did:example:learner2',
        name: 'Trần Thị B',
        digitalTwin: {
          learnerDid: 'did:example:learner2',
          knowledge: { 'Python': 0.9, 'Django': 0.8, 'PostgreSQL': 0.7 },
          skills: { problemSolving: 0.9, logicalThinking: 0.8, selfLearning: 0.9 },
          behavior: { timeSpent: '60h', quizAccuracy: 0.92, preferredLearningStyle: 'code-first' },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        },
        matchScore: 88,
        appliedAt: '2024-01-14T15:20:00Z',
        status: 'shortlisted'
      }
    ];

    setTimeout(() => {
      setDashboard(mockDashboard);
      setJobPostings(mockJobPostings);
      setCandidates(mockCandidates);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Job management functions
  const handleCreateJob = () => {
    setJobForm({
      title: '',
      company: '',
      description: '',
      location: '',
      salary: '',
      type: 'full-time',
      requirements: '',
      skills: ''
    });
    setIsEditing(false);
    setSelectedJob(null);
    setShowJobModal(true);
  };

  const handleEditJob = (job: JobPosting) => {
    setJobForm({
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      salary: job.salary || '',
      type: job.type,
      requirements: job.requirements.join('\n'),
      skills: job.skills.join(', ')
    });
    setIsEditing(true);
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleDeleteJob = (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      setJobPostings(prev => prev.filter(job => job.id !== jobId));
      toast.success('Job posting deleted successfully');
    }
  };

  const handleSubmitJob = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newJob: JobPosting = {
      id: isEditing ? selectedJob!.id : Date.now().toString(),
      title: jobForm.title,
      company: jobForm.company,
      description: jobForm.description,
      location: jobForm.location,
      salary: jobForm.salary || undefined,
      type: jobForm.type,
      requirements: jobForm.requirements.split('\n').filter(req => req.trim()),
      skills: jobForm.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
      postedAt: isEditing ? selectedJob!.postedAt : new Date().toISOString(),
      employerId: 'employer1',
      isActive: true
    };

    if (isEditing) {
      setJobPostings(prev => prev.map(job => job.id === newJob.id ? newJob : job));
      toast.success('Job posting updated successfully');
    } else {
      setJobPostings(prev => [newJob, ...prev]);
      toast.success('Job posting created successfully');
    }

    setShowJobModal(false);
    setJobForm({
      title: '',
      company: '',
      description: '',
      location: '',
      salary: '',
      type: 'full-time',
      requirements: '',
      skills: ''
    });
  };

  // Candidate management functions
  const handleUpdateCandidateStatus = (candidateId: string, newStatus: string) => {
    setCandidates(prev => prev.map(candidate => 
      candidate.id === candidateId 
        ? { ...candidate, status: newStatus as any }
        : candidate
    ));
    toast.success(`Candidate status updated to ${newStatus}`);
  };

  const handleViewCandidate = (candidate: Candidate) => {
    // In a real app, this would open a detailed view
    toast.success(`Viewing profile of ${candidate.name}`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Interactive Demo Info */}
      <InteractiveDemo />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
        <button
          onClick={handleCreateJob}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <BriefcaseIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{jobPostings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DocumentTextIcon className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{jobPostings.filter(job => job.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Postings */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Job Postings</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {jobPostings.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600">{job.company} • {job.location}</p>
                    <p className="text-sm text-gray-500 mt-1">{job.salary} • {job.type}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {job.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditJob(job)}
                      className="text-green-600 hover:text-green-800"
                      title="Edit job"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete job"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Candidates */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Applications</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {candidate.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                      <p className="text-sm text-gray-600">
                        Match Score: <span className="font-semibold text-green-600">{candidate.matchScore}%</span>
                      </p>
                      <div className="flex items-center mt-1">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-600 ml-1">
                          {candidate.digitalTwin.skills.problemSolving * 100}% Problem Solving
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <select 
                      value={candidate.status}
                      onChange={(e) => handleUpdateCandidateStatus(candidate.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)} border-0`}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                    <button 
                      onClick={() => handleViewCandidate(candidate)}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Skills */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Top Skills in Demand</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dashboard?.topSkills.map((skill) => (
              <div key={skill.skill} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{skill.count}</div>
                <div className="text-sm text-gray-600">{skill.skill}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Job Creation/Editing Modal */}
      <Modal 
        isOpen={showJobModal} 
        onClose={() => setShowJobModal(false)}
        title={isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}
      >
        <div className="p-6">
          <form onSubmit={handleSubmitJob} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title *</label>
              <input 
                type="text" 
                required
                value={jobForm.title}
                onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company *</label>
              <input 
                type="text" 
                required
                value={jobForm.company}
                onChange={(e) => setJobForm(prev => ({ ...prev, company: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea 
                required
                value={jobForm.description}
                onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
                rows={4} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location *</label>
                <input 
                  type="text" 
                  required
                  value={jobForm.location}
                  onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Salary</label>
                <input 
                  type="text" 
                  value={jobForm.salary}
                  onChange={(e) => setJobForm(prev => ({ ...prev, salary: e.target.value }))}
                  placeholder="e.g., $2000-3000"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Type *</label>
              <select 
                required
                value={jobForm.type}
                onChange={(e) => setJobForm(prev => ({ ...prev, type: e.target.value as any }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Requirements (one per line)</label>
              <textarea 
                value={jobForm.requirements}
                onChange={(e) => setJobForm(prev => ({ ...prev, requirements: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
                rows={3}
                placeholder="3+ years experience&#10;React/TypeScript&#10;Team player"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
              <input 
                type="text" 
                value={jobForm.skills}
                onChange={(e) => setJobForm(prev => ({ ...prev, skills: e.target.value }))}
                placeholder="React, TypeScript, CSS, Git"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {isEditing ? 'Update Job' : 'Create Job'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default EmployerDashboardPage; 