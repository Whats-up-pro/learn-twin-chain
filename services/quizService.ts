/**
 * Quiz Service - Frontend API integration for quiz management
 */

const API_BASE = 'http://localhost:8000/api/v1';

// API Response types matching backend
export interface ApiQuiz {
  quiz_id: string;
  title: string;
  description: string;
  quiz_type: string;
  questions: ApiQuizQuestion[];
  time_limit_minutes?: number;
  max_attempts?: number;
  passing_score: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  show_correct_answers: boolean;
  created_by: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ApiQuizQuestion {
  question_id: string;
  question_text: string;
  question_type: string;
  options?: Array<{
    option_id: string;
    text: string;
    is_correct: boolean;
  }>;
  correct_answer?: string;
  explanation?: string;
  points: number;
  order: number;
}

export interface ApiQuizAttempt {
  attempt_id: string;
  user_id: string;
  quiz_id: string;
  started_at: string;
  completed_at?: string;
  score: number;
  max_score: number;
  percentage: number;
  answers: Record<string, any>;
  time_spent_seconds: number;
  status: string;
  feedback?: string;
}

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

class QuizService {
  
  // Quiz management
  async getQuiz(quizId: string, includeAnswers = false) {
    try {
      const params = includeAnswers ? '?include_answers=true' : '';
      const response = await fetch(`${API_BASE}/quizzes/${quizId}${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get quiz: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting quiz:', error);
      throw error;
    }
  }

  async getModuleQuizzes(moduleId: string) {
    try {
      const response = await fetch(`${API_BASE}/quizzes/module/${moduleId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get module quizzes: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting module quizzes:', error);
      throw error;
    }
  }

  async getCourseQuizzes(courseId: string) {
    try {
      const response = await fetch(`${API_BASE}/quizzes/course/${courseId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get course quizzes: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting course quizzes:', error);
      throw error;
    }
  }

  async createQuiz(quizData: {
    title: string;
    description: string;
    quiz_type?: string;
    questions: Array<{
      question_text: string;
      question_type: string;
      options?: Array<{
        text: string;
        is_correct: boolean;
      }>;
      correct_answer?: string;
      explanation?: string;
      points: number;
    }>;
    time_limit_minutes?: number;
    max_attempts?: number;
    passing_score: number;
    randomize_questions?: boolean;
    randomize_options?: boolean;
    show_correct_answers?: boolean;
    tags?: string[];
  }) {
    try {
      const response = await fetch(`${API_BASE}/quizzes/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(quizData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create quiz: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  }

  // Quiz attempts
  async startQuizAttempt(quizId: string) {
    try {
      const response = await fetch(`${API_BASE}/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to start quiz attempt: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      throw error;
    }
  }

  async submitQuizAttempt(attemptId: string, answers: Record<string, any>) {
    try {
      const response = await fetch(`${API_BASE}/quizzes/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit quiz attempt: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      throw error;
    }
  }

  async getQuizAttempts(quizId?: string) {
    try {
      const params = quizId ? `?quiz_id=${quizId}` : '';
      const response = await fetch(`${API_BASE}/quizzes/my/attempts${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get quiz attempts: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting quiz attempts:', error);
      throw error;
    }
  }

  async getQuizAttempt(attemptId: string) {
    try {
      const response = await fetch(`${API_BASE}/quizzes/attempts/${attemptId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get quiz attempt: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting quiz attempt:', error);
      throw error;
    }
  }

  // User quiz progress
  async getUserQuizProgress(userId?: string) {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await fetch(`${API_BASE}/quizzes/my/progress${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get quiz progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting quiz progress:', error);
      throw error;
    }
  }

  // Quiz statistics
  async getQuizStatistics(quizId: string) {
    try {
      const response = await fetch(`${API_BASE}/quizzes/${quizId}/statistics`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get quiz statistics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting quiz statistics:', error);
      throw error;
    }
  }
}

export const quizService = new QuizService();
export default quizService;
