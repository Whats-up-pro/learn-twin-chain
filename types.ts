
export interface LearnerProfile {
  did: string;
  name: string;
  avatarUrl?: string;
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
  completedAt: string; // ISO date string
  tokenized: boolean;
  nftCid?: string; // Simulated IPFS CID for NFT metadata
  nftId?: string;
}

export interface DigitalTwin {
  learnerDid: string;
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
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  content: ModuleContentItem[];
  quiz: QuizQuestion[];
  prerequisites?: string[];
}

export interface ModuleContentItem {
  type: 'text' | 'code' | 'image' | 'video_placeholder';
  value: string; // Text, code content, image URL, or video placeholder text
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
