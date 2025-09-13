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
  options?: string[] | Array<{
    option_id: string;
    text: string;
    is_correct: boolean;
  }>; // Support both MongoDB format (string[]) and legacy format
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

import { jwtService } from './jwtService';

// Helper function for authenticated requests with token refresh
async function makeAuthenticatedRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = jwtService.getAuthHeader();
  
  console.log(`🌐 Making authenticated request to: ${url}`);
  console.log(`🔑 Auth headers:`, authHeaders);
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });
  
  console.log(`📡 Response status: ${response.status} ${response.statusText}`);
  console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    // Log response body for debugging
    try {
      const errorBody = await response.text();
      console.log(`❌ Error response body:`, errorBody);
    } catch (e) {
      console.log(`❌ Could not read error response body:`, e);
    }
    // Handle 401 Unauthorized - try refresh token
    if (response.status === 401) {
      const refreshSuccess = await jwtService.handleUnauthorized();
      if (refreshSuccess) {
        // Retry the original request with new token
        const retryResponse = await fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...jwtService.getAuthHeader(),
            ...options.headers,
          },
          ...options,
        });
        
        if (!retryResponse.ok) {
          const retryErrorData = await retryResponse.json().catch(() => ({ detail: 'Network error' }));
          throw new Error(retryErrorData.detail || `HTTP ${retryResponse.status}`);
        }
        
        return await retryResponse.json();
      }
      
      // Refresh failed, clear tokens and redirect
      localStorage.removeItem('learnerProfile');
      localStorage.removeItem('userRole');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }
    
    const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Response data:`, data);
  return data;
}

class QuizService {
  
  // Quiz management
  async getQuiz(quizId: string, includeAnswers = false) {
    try {
      const params = includeAnswers ? '?include_answers=true' : '';
      return await makeAuthenticatedRequest(`${API_BASE}/quizzes/${quizId}${params}`);
    } catch (error) {
      console.error('Error getting quiz:', error);
      throw error;
    }
  }

  async getModuleQuizzes(moduleId: string) {
    try {
      console.log(`🔍 QuizService: Fetching quizzes for module ID: ${moduleId}`);
      console.log(`🔍 QuizService: API URL: ${API_BASE}/quizzes/module/${moduleId}`);
      console.log(`🔍 QuizService: User authenticated: ${jwtService.isAuthenticated()}`);
      console.log(`🔍 QuizService: Auth header:`, jwtService.getAuthHeader());
      
      const result = await makeAuthenticatedRequest(`${API_BASE}/quizzes/module/${moduleId}`);
      console.log(`📝 QuizService: API response for module ${moduleId}:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ QuizService: Error getting module quizzes for ${moduleId}:`, error);
      // Return empty result instead of throwing to prevent breaking the flow
      return { quizzes: [] };
    }
  }

  async getCourseQuizzes(courseId: string) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/quizzes/course/${courseId}`);
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
      return await makeAuthenticatedRequest(`${API_BASE}/quizzes/`, {
        method: 'POST',
        body: JSON.stringify(quizData)
      });
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
        ...jwtService.getAuthHeader()
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
        ...jwtService.getAuthHeader(),
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


  async getQuizAttempt(attemptId: string) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/quizzes/attempts/${attemptId}`);
    } catch (error) {
      console.error('Error getting quiz attempt:', error);
      throw error;
    }
  }

  // User quiz progress
  async getQuizAttempts(courseId?: string) {
    try {
      const params = courseId ? `?course_id=${courseId}` : '';
      return await makeAuthenticatedRequest(`${API_BASE}/quizzes/my/attempts${params}`);
    } catch (error) {
      console.error('Error getting user quiz attempts:', error);
      // Return empty for graceful handling
      return { attempts: [] };
    }
  }

  // Quiz statistics
  async getQuizStatistics(quizId: string) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/quizzes/${quizId}/statistics`);
    } catch (error) {
      console.error('Error getting quiz statistics:', error);
      throw error;
    }
  }
}

export const quizService = new QuizService();
export default quizService;
