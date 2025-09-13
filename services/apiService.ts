/**
 * Centralized API service for real backend communication
 */

const API_BASE = 'http://localhost:8000/api/v1';


interface CourseFilters {
  difficulty_level?: string;
  institution?: string;
  tags?: string[];
}

interface AchievementFilters {
  achievement_type?: string;
  tier?: string;
  category?: string;
  course_id?: string;
}

import { jwtService } from './jwtService';

export class ApiService {
  private getAuthHeaders(): Record<string, string> {
    return jwtService.getAuthHeader();
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const authHeaders = this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
        
        // Handle 401 Unauthorized - try refresh token
        if (response.status === 401) {
          const refreshSuccess = await jwtService.handleUnauthorized();
          if (refreshSuccess) {
            // Retry the original request with new token
            const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
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
        
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      // Don't throw errors for non-critical endpoints to prevent white page
      if (endpoint.includes('/enrollments') || endpoint.includes('/progress') || endpoint.includes('/achievements')) {
        console.warn(`Non-critical API call failed: ${endpoint}`, error);
        return {} as T; // Return empty object for non-critical calls
      }
      throw error;
    }
  }

  // Courses API - Updated to include enrollment status
  async getAllCourses(skip = 0, limit = 50) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      include_enrollment: 'true', // Include user enrollment status
    });

    return this.makeRequest(`/courses/?${params}`);
  }

  async searchCourses(query = '', filters: CourseFilters = {}, skip = 0, limit = 20) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (query) params.append('q', query);
    if (filters.difficulty_level) params.append('difficulty_level', filters.difficulty_level);
    if (filters.institution) params.append('institution', filters.institution);
    if (filters.tags && Array.isArray(filters.tags)) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }

    return this.makeRequest(`/courses/?${params}`);
  }

  async getCourse(courseId: string, includeModules = false) {
    const params = includeModules ? '?include_modules=true' : '';
    return this.makeRequest(`/courses/${courseId}${params}`);
  }

  async getCourseById(courseId: string, includeModules = false) {
    // Alias for getCourse for consistency
    return this.getCourse(courseId, includeModules);
  }

  async getCourseModules(courseId: string) {
    return this.makeRequest(`/courses/${courseId}/modules`);
  }

  async getMyEnrollments() {
    // Use the same working endpoint as sidebar enrollment
    return this.makeRequest('/auth/me/enrollments');
  }

  async getMyProgress(courseId?: string) {
    const params = courseId ? `?course_id=${courseId}` : '';
    return this.makeRequest(`/courses/my/progress${params}`);
  }

  async enrollInCourse(courseId: string) {
    return this.makeRequest(`/courses/${courseId}/enroll`, { method: 'POST' });
  }

  async getUserEnrollments() {
    return this.makeRequest('/auth/me/enrollments');
  }

  // Lessons API
  async searchLessons(query?: string, moduleId?: string, courseId?: string, skip = 0, limit = 20) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (query) params.append('q', query);
    if (moduleId) params.append('module_id', moduleId);
    if (courseId) params.append('course_id', courseId);

    return this.makeRequest(`/lessons/?${params}`);
  }

  async getLesson(lessonId: string, includeContent = false) {
    const params = includeContent ? '?include_content=true' : '';
    return this.makeRequest(`/lessons/${lessonId}${params}`);
  }

  async getModuleLessons(moduleId: string, includeProgress = false) {
    const params = includeProgress ? '?include_progress=true' : '';
    return this.makeRequest(`/lessons/module/${moduleId}${params}`);
  }

  async updateLessonProgress(lessonId: string, progressData: {
    completion_percentage: number;
    time_spent_minutes: number;
    notes?: string;
  }) {
    return this.makeRequest(`/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  }

  async updateCourseProgress(courseId: string, progressData: {
    overall_progress: number;
    completed_modules: number;
    total_modules: number;
    completed_lessons: number;
    total_lessons: number;
    last_updated: string;
  }) {
    return this.makeRequest(`/courses/${courseId}/progress`, {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  }

  // Quizzes API
  async searchQuizzes(courseId?: string, moduleId?: string, skip = 0, limit = 20) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (courseId) params.append('course_id', courseId);
    if (moduleId) params.append('module_id', moduleId);

    return this.makeRequest(`/quizzes/?${params}`);
  }

  async getQuiz(quizId: string) {
    return this.makeRequest(`/quizzes/${quizId}`);
  }

  async startQuizAttempt(quizId: string) {
    return this.makeRequest(`/quizzes/${quizId}/attempt`, { method: 'POST' });
  }

  async submitQuizAttempt(quizId: string, attemptId: string, answers: Record<string, any>, timeSpent?: number) {
    return this.makeRequest(`/quizzes/${quizId}/attempt/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        answers,
        time_spent_minutes: timeSpent,
      }),
    });
  }

  async getMyQuizAttempts(courseId?: string) {
    const params = courseId ? `?course_id=${courseId}` : '';
    return this.makeRequest(`/quizzes/my/attempts${params}`);
  }

  // Achievements API
  async searchAchievements(filters: AchievementFilters = {}, skip = 0, limit = 20) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (filters.achievement_type) params.append('achievement_type', filters.achievement_type);
    if (filters.tier) params.append('tier', filters.tier);
    if (filters.category) params.append('category', filters.category);
    if (filters.course_id) params.append('course_id', filters.course_id);

    return this.makeRequest(`/achievements/?${params}`);
  }

  async getMyAchievements(filters: AchievementFilters = {}) {
    const params = new URLSearchParams();
    if (filters.achievement_type) params.append('achievement_type', filters.achievement_type);
    if (filters.course_id) params.append('course_id', filters.course_id);

    return this.makeRequest(`/achievements/my/earned?${params}`);
  }

  async getAchievementStatistics(courseId?: string) {
    const params = courseId ? `?course_id=${courseId}` : '';
    return this.makeRequest(`/achievements/statistics${params}`);
  }

  // Blockchain/NFT API
  async getAchievementTypes() {
    return this.makeRequest('/blockchain/achievements/types');
  }

  async mintModuleCompletionNFT(data: {
    student_address: string;
    student_did: string;
    module_id: string;
    module_title: string;
    completion_data: any;
  }) {
    return this.makeRequest('/blockchain/mint/module-completion', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async mintAchievementNFT(data: {
    student_address: string;
    student_did: string;
    achievement_type: string;
    title: string;
    description: string;
    achievement_data: any;
  }) {
    return this.makeRequest('/blockchain/mint/achievement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Digital Twin API
  async getStudents() {
    return this.makeRequest('/learning/students');
  }

  async getStudentDetail(twinId: string) {
    return this.makeRequest(`/learning/students/${twinId}`);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
