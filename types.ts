export interface LearnerProfile {
  did: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  institution?: string;
  program?: string;
  birth_year?: number;
  enrollment_date?: string;
  createdAt?: string;
}

export interface KnowledgeArea {
  [topic: string]: number; // Progress 0-1
}

export interface Skills {
  problemSolving: number; // 0-1
  logicalThinking: number; // 0-1
  selfLearning: number; // 0-1
}

export interface LearningBehavior {
  timeSpent: string; // e.g., "10h 30m"
  quizAccuracy: number; // 0-1
  preferredLearningStyle?: string; // e.g., "visual", "code-first"
  lastLlmSession?: string; // ISO date string
  mostAskedTopics?: string[];
}

export interface LearningCheckpoint {
  module: string;
  moduleId: string;
  moduleName?: string; // Human-readable module name
  completedAt: string; // ISO date string
  score?: number; // Score achieved in the module (0-100)
  tokenized: boolean;
  nftCid?: string; // IPFS CID for NFT metadata
  nftId?: string;
  txHash?: string; // Blockchain transaction hash
  blockchainMinted?: boolean; // Whether NFT was actually minted on blockchain
  tokenId?: number; // Blockchain token ID
  contractAddress?: string; // Smart contract address
}

export interface DigitalTwin {
  learnerDid: string;
  learnerName?: string; // Student's real name
  knowledge: KnowledgeArea;
  skills: Skills;
  behavior: LearningBehavior;
  checkpoints: LearningCheckpoint[];
  version: number;
  lastUpdated: string; // ISO date string
}

export interface Nft {
  id: string;
  name: string;
  description: string;
  imageUrl: string; // Can be a placeholder or generated
  moduleId: string;
  issuedDate: string;
  cid?: string; // IPFS CID for NFT metadata
  verified?: boolean; // Whether the NFT has been verified by institution
  issuer?: string; // Institution that issued the NFT
  institutionPublicKey?: string; // Public key of the issuing institution
  // Blockchain-specific properties
  txHash?: string; // Blockchain transaction hash
  tokenId?: number; // Blockchain token ID
  contractAddress?: string; // Smart contract address
  blockchainMinted?: boolean; // Whether NFT was actually minted on blockchain
  studentAddress?: string; // Blockchain address of the student
  nftType?: 'module_progress' | 'learning_achievement';
  minting?: boolean;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  content: ModuleContentItem[];
  quiz: QuizQuestion[];
  prerequisites?: string[];
  // Extended to match backend
  module_id?: string;
  course_id?: string;
  order?: number;
  parent_module?: string;
  learning_objectives?: string[];
  estimated_duration?: number;
  assessments?: Array<{
    assessment_id: string;
    title: string;
    type: string;
    max_score: number;
    passing_score: number;
  }>;
  completion_criteria?: Record<string, any>;
  status?: string;
  is_mandatory?: boolean;
  completion_nft_enabled?: boolean;
  content_cid?: string;
  created_at?: string;
  updated_at?: string;
}

// New interface matching backend Module exactly
export interface ApiModule {
  module_id: string;
  course_id: string;
  title: string;
  description: string;
  content: Array<{
    content_type: string;
    content_cid?: string;
    content_url?: string;
    duration_minutes: number;
    order: number;
  }>;
  content_cid?: string;
  order: number;
  parent_module?: string;
  learning_objectives: string[];
  estimated_duration: number;
  assessments: Array<{
    assessment_id: string;
    title: string;
    type: string;
    questions_cid?: string;
    rubric_cid?: string;
    max_score: number;
    passing_score: number;
    time_limit_minutes?: number;
  }>;
  completion_criteria: Record<string, any>;
  status: string;
  is_mandatory: boolean;
  prerequisites: string[];
  completion_nft_enabled: boolean;
  nft_metadata_cid?: string;
  created_at: string;
  updated_at: string;
}

// New interface for Lesson
export interface ApiLesson {
  lesson_id: string;
  module_id: string;
  course_id: string;
  title: string;
  description: string;
  content_type: string;
  content_url?: string;
  content_cid?: string;
  duration_minutes: number;
  order: number;
  learning_objectives: string[];
  keywords: string[];
  status: string;
  is_mandatory: boolean;
  prerequisites: string[];
  created_at: string;
  updated_at: string;
}

// Enrollment and Progress interfaces
export interface ApiEnrollment {
  user_id: string;
  course_id: string;
  enrolled_at: string;
  status: string;
  completed_modules: string[];
  current_module?: string;
  completion_percentage: number;
  completed_at?: string;
  final_grade?: number;
  certificate_issued: boolean;
  certificate_nft_token_id?: string;
  notes?: string;
}

export interface ApiModuleProgress {
  user_id: string;
  course_id: string;
  module_id: string;
  started_at: string;
  last_accessed: string;
  completed_at?: string;
  content_progress: Record<string, number>;
  time_spent_minutes: number;
  assessment_scores: Record<string, number>;
  best_score: number;
  attempts: number;
  status: string;
  completion_percentage: number;
  nft_minted: boolean;
  nft_token_id?: string;
  nft_tx_hash?: string;
}

export interface ModuleContentItem {
  type: 'text' | 'code' | 'image' | 'video' | 'video_placeholder';
  value: string; // Text, code content, image URL, or video URL/placeholder text
  language?: string; // For code blocks, e.g., 'python'
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  metadata?: Record<string, any>; // For potential future use, e.g. references
}

export interface UpdateTwinPayload {
  twin_id: string; // Learner's DID
  owner_did: string; // Learner's DID (for verification)
  learning_state?: {
    progress?: KnowledgeArea;
    checkpoint_history?: LearningCheckpoint[];
  };
  interaction_logs?: {
    last_llm_session?: string;
    most_asked_topics?: string[];
    preferred_learning_style?: string;
  };
}

export interface VerificationResult {
  integrity: boolean; // CID matches content hash
  authenticity: boolean; // Signature/DID verified
  provenance: boolean; // Blockchain/metadata history checked
  message: string;
  details?: {
    checkedCid?: string;
    ownerDid?: string;
    timestamp?: string;
  };
}

// Enum for UI states, API statuses, etc.
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

// New types for Employer and Teacher roles
export enum UserRole {
  LEARNER = 'student',
  TEACHER = 'teacher',
  EMPLOYER = 'employer'
}

export interface User {
  id: string;
  did: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface Employer {
  id: string;
  did: string;
  name: string;
  email: string;
  company: string;
  position: string;
  avatarUrl?: string;
  verified: boolean;
}

export interface Teacher {
  id: string;
  did: string;
  name: string;
  email: string;
  institution: string;
  subjects: string[];
  avatarUrl?: string;
  verified: boolean;
  rating: number;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  skills: string[];
  location: string;
  salary?: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  postedAt: string;
  employerId: string;
  isActive: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: LearningModule[];
  enrolledLearners: number;
  createdAt: string;
  teacherId: string;
  isPublished: boolean;
  // Extended properties to match backend
  course_id?: string;
  created_by?: string;
  institution?: string;
  instructors?: string[];
  status?: string;
  published_at?: string;
  metadata?: {
    difficulty_level?: string;
    estimated_hours?: number;
    prerequisites?: string[];
    learning_objectives?: string[];
    skills_taught?: string[];
    tags?: string[];
    language?: string;
  };
  enrollment_start?: string;
  enrollment_end?: string;
  course_start?: string;
  course_end?: string;
  max_enrollments?: number;
  is_public?: boolean;
  requires_approval?: boolean;
  completion_nft_enabled?: boolean;
  content_cid?: string;
  updated_at?: string;
}

// New interface that matches backend exactly
export interface ApiCourse {
  course_id: string;
  title: string;
  description: string;
  created_by: string;
  institution: string;
  instructors: string[];
  version: number;
  status: string;
  published_at?: string;
  metadata: {
    difficulty_level: string;
    estimated_hours: number;
    prerequisites: string[];
    learning_objectives: string[];
    skills_taught: string[];
    tags: string[];
    language: string;
  };
  enrollment_start?: string;
  enrollment_end?: string;
  course_start?: string;
  course_end?: string;
  max_enrollments?: number;
  is_public: boolean;
  requires_approval: boolean;
  completion_nft_enabled: boolean;
  syllabus_cid?: string;
  content_cid?: string;
  nft_contract_address?: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  jobId: string;
  learnerId: string;
  learnerDid: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  appliedDate: string;
  digitalTwin?: DigitalTwin;
  coverLetter?: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  learnerId: string;
  learnerDid: string;
  status: 'enrolled' | 'completed' | 'dropped';
  enrolledDate: string;
  completedDate?: string;
  progress: number; // 0-1
  digitalTwin?: DigitalTwin;
}

export interface Candidate {
  id: string;
  learnerDid: string;
  name: string;
  avatarUrl?: string;
  digitalTwin: DigitalTwin;
  matchScore: number; // 0-100
  appliedAt: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
}

export interface EmployerDashboard {
  totalJobPostings: number;
  activeJobPostings: number;
  totalCandidates: number;
  recentApplications: Candidate[];
  topSkills: { skill: string; count: number }[];
}

export interface LearnerProgress {
  learnerId: string;
  learnerName: string;
  avatarUrl?: string;
  digitalTwin: DigitalTwin;
  courseProgress: {
    courseId: string;
    completedModules: number;
    totalModules: number;
    averageScore: number;
    lastActivity: string;
  };
}

export interface TeacherDashboard {
  totalCourses: number;
  totalLearners: number;
  activeLearners: number;
  recentLearnerActivity: LearnerProgress[];
  popularModules: { moduleId: string; title: string; completionRate: number }[];
}
