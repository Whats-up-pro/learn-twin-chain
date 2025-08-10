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

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token'); // Adjust based on your auth system
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

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
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.append('q', params.q);
      if (params?.difficulty_level) searchParams.append('difficulty_level', params.difficulty_level);
      if (params?.institution) searchParams.append('institution', params.institution);
      if (params?.tags) params.tags.forEach(tag => searchParams.append('tags', tag));
      if (params?.skip) searchParams.append('skip', params.skip.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const response = await fetch(`${API_BASE}/courses?${searchParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to search courses: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching courses:', error);
      throw error;
    }
  }

  async getCourse(courseId: string, includeModules = false) {
    try {
      const params = includeModules ? '?include_modules=true' : '';
      const response = await fetch(`${API_BASE}/courses/${courseId}${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get course: ${response.statusText}`);
      }

      return await response.json();
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
      const response = await fetch(`${API_BASE}/courses/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(courseData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create course: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async updateCourse(courseId: string, updates: Record<string, any>) {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update course: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  async publishCourse(courseId: string) {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}/publish`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to publish course: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error publishing course:', error);
      throw error;
    }
  }

  async enrollInCourse(courseId: string) {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to enroll in course: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  // Module management
  async getCourseModules(courseId: string) {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}/modules`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get course modules: ${response.statusText}`);
      }

      return await response.json();
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
      const response = await fetch(`${API_BASE}/courses/${courseId}/modules`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(moduleData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create module: ${response.statusText}`);
      }

      return await response.json();
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
      const response = await fetch(`${API_BASE}/courses/modules/${moduleId}/progress`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(progressData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update module progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating module progress:', error);
      throw error;
    }
  }

  async getModuleProgress(moduleId: string) {
    try {
      const response = await fetch(`${API_BASE}/courses/modules/${moduleId}/progress`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get module progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting module progress:', error);
      throw error;
    }
  }

  // User enrollment and progress
  async getMyEnrollments() {
    try {
      const response = await fetch(`${API_BASE}/courses/my/enrollments`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get enrollments: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting my enrollments:', error);
      throw error;
    }
  }

  async getMyProgress(courseId?: string) {
    try {
      const params = courseId ? `?course_id=${courseId}` : '';
      const response = await fetch(`${API_BASE}/courses/my/progress${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting my progress:', error);
      throw error;
    }
  }

  // Lessons
  async getModuleLessons(moduleId: string, includeProgress = false) {
    try {
      const params = includeProgress ? '?include_progress=true' : '';
      const response = await fetch(`${API_BASE}/lessons/module/${moduleId}${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get module lessons: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting module lessons:', error);
      throw error;
    }
  }

  async getLesson(lessonId: string, includeContent = false) {
    try {
      const params = includeContent ? '?include_content=true' : '';
      const response = await fetch(`${API_BASE}/lessons/${lessonId}${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get lesson: ${response.statusText}`);
      }

      return await response.json();
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
      const response = await fetch(`${API_BASE}/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(progressData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update lesson progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }
  }

  async getLessonProgress(lessonId: string) {
    try {
      const response = await fetch(`${API_BASE}/lessons/${lessonId}/progress`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get lesson progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting lesson progress:', error);
      throw error;
    }
  }
}

export const courseService = new CourseService();
export default courseService;
