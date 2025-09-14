/**
 * Course Service - Frontend API integration for course management
 */

const API_BASE = 'http://localhost:8000/api/v1';

// API Response types matching backend
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
  // Analytics fields
  average_rating: number;
  total_ratings: number;
  enrollment_count: number;
  completion_count: number;
}

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

import { apiService } from './apiService';
import { jwtService } from './jwtService';

// Helper function for authenticated requests not covered by apiService
async function makeAuthenticatedRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = jwtService.getAuthHeader();
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
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

  return await response.json();
}

class CourseService {
  
  // Course management
  async searchCourses(params?: {
    q?: string;
    difficulty_level?: string;
    institution?: string;
    tags?: string[];
    skip?: number;
    limit?: number;
  }) {
    try {
      return await apiService.searchCourses(
        params?.q || '',
        {
          difficulty_level: params?.difficulty_level,
          institution: params?.institution,
          tags: params?.tags
        },
        params?.skip || 0,
        params?.limit || 20
      );

    } catch (error) {
      console.error('Error searching courses:', error);
      throw error;
    }
  }

  async getCourse(courseId: string, includeModules = false) {
    try {
      return await apiService.getCourse(courseId, includeModules);
    } catch (error) {
      console.error('Error getting course:', error);
      throw error;
    }
  }

  async createCourse(courseData: {
    title: string;
    description: string;
    institution?: string;
    metadata?: Record<string, any>;
    enrollment_start?: string;
    enrollment_end?: string;
    course_start?: string;
    course_end?: string;
    max_enrollments?: number;
    is_public?: boolean;
    requires_approval?: boolean;
    completion_nft_enabled?: boolean;
    syllabus?: Record<string, any>;
  }) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/courses/`, {
        method: 'POST',
        body: JSON.stringify(courseData)
      });
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async updateCourse(courseId: string, updates: Record<string, any>) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  async publishCourse(courseId: string) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/courses/${courseId}/publish`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error publishing course:', error);
      throw error;
    }
  }

  async enrollInCourse(courseId: string) {
    try {
      return await apiService.enrollInCourse(courseId);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  // Module management
  async getCourseModules(courseId: string) {
    try {
      return await apiService.getCourseModules(courseId);
    } catch (error) {
      console.error('Error getting course modules:', error);
      throw error;
    }
  }

  async createModule(courseId: string, moduleData: {
    title: string;
    description: string;
    content?: Array<Record<string, any>>;
    order?: number;
    parent_module?: string;
    learning_objectives?: string[];
    estimated_duration?: number;
    assessments?: Array<Record<string, any>>;
    completion_criteria?: Record<string, any>;
    is_mandatory?: boolean;
    prerequisites?: string[];
    completion_nft_enabled?: boolean;
  }) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/courses/${courseId}/modules`, {
        method: 'POST',
        body: JSON.stringify(moduleData)
      });
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  }

  async updateModuleProgress(moduleId: string, progressData: {
    content_progress?: Record<string, number>;
    time_spent?: number;
    assessment_score?: number;
    assessment_id?: string;
  }) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/courses/modules/${moduleId}/progress`, {
        method: 'PUT',
        body: JSON.stringify(progressData)
      });
    } catch (error) {
      console.error('Error updating module progress:', error);
      throw error;
    }
  }

  async getModuleProgress(moduleId: string) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/courses/modules/${moduleId}/progress`);
    } catch (error) {
      console.error('Error getting module progress:', error);
      throw error;
    }
  }

  // User enrollment and progress
  async getMyEnrollments() {
    try {
      return await apiService.getMyEnrollments();
    } catch (error) {
      console.error('Error getting my enrollments:', error);
      throw error;
    }
  }

  async getMyProgress(courseId?: string) {
    try {
      return await apiService.getMyProgress(courseId);
    } catch (error) {
      console.error('Error getting my progress:', error);
      throw error;
    }
  }

  // Lessons
  async getModuleLessons(moduleId: string, includeProgress = false) {
    try {
      return await apiService.getModuleLessons(moduleId, includeProgress);
    } catch (error) {
      console.error('Error getting module lessons:', error);
      throw error;
    }
  }

  async getLesson(lessonId: string, includeContent = false) {
    try {
      return await apiService.getLesson(lessonId, includeContent);
    } catch (error) {
      console.error('Error getting lesson:', error);
      throw error;
    }
  }

  async updateLessonProgress(lessonId: string, progressData: {
    completion_percentage: number;
    time_spent_minutes?: number;
    notes?: string;
  }) {
    try {
      return await apiService.updateLessonProgress(lessonId, {
        completion_percentage: progressData.completion_percentage,
        time_spent_minutes: progressData.time_spent_minutes || 0,
        notes: progressData.notes
      });
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }
  }

  async updateCourseProgress(courseId: string, progressData: {
    overall_progress: number;
    completed_modules: number;
    total_modules: number;
    completed_lessons: number;
    total_lessons: number;
    last_updated: string;
  }) {
    try {
      return await apiService.updateCourseProgress(courseId, progressData);
    } catch (error) {
      console.error('Error updating course progress:', error);
      throw error;
    }
  }

  async getLessonProgress(lessonId: string) {
    try {
      // Note: This could also use apiService if we add this method there
      return await makeAuthenticatedRequest(`${API_BASE}/lessons/${lessonId}/progress`);
    } catch (error) {
      console.error('Error getting lesson progress:', error);
      throw error;
    }
  }

  // Course Rating and Analytics methods
  async rateCourse(courseId: string, rating: number, review?: string) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/courses/${courseId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating, review })
      });
    } catch (error) {
      console.error('Error rating course:', error);
      throw error;
    }
  }

  async getCourseRatings(courseId: string, skip: number = 0, limit: number = 20) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/courses/${courseId}/ratings?skip=${skip}&limit=${limit}`);
    } catch (error) {
      console.error('Error getting course ratings:', error);
      throw error;
    }
  }

  async getCourseAnalytics(courseId: string) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/courses/${courseId}/analytics`);
    } catch (error) {
      console.error('Error getting course analytics:', error);
      throw error;
    }
  }

  async getPopularCourses(limit: number = 10) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/courses/popular?limit=${limit}`);
    } catch (error) {
      console.error('Error getting popular courses:', error);
      throw error;
    }
  }

  async getHighlyRatedCourses(limit: number = 10) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/courses/highly-rated?limit=${limit}`);
    } catch (error) {
      console.error('Error getting highly rated courses:', error);
      throw error;
    }
  }
}

export const courseService = new CourseService();
export default courseService;
