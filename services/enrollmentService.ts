/**
 * Enrollment Service
 * Handles user course enrollments
 */

import { API_BASE_URL } from '../constants';

export interface EnrollmentResponse {
  success: boolean;
  enrollments: EnrollmentData[];
  total: number;
  message?: string;
}

export interface EnrollmentData {
  enrollment: {
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
  };
  course: {
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
  } | null;
}

class EnrollmentService {
  
  async getMyEnrollments(): Promise<EnrollmentResponse> {
    try {
      // Use the same working endpoint as sidebar enrollment  
      const response = await fetch(`${API_BASE_URL}/auth/me/enrollments`, {
        method: 'GET',
        credentials: 'include', // Important: include session cookie
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching enrollments:', error);
      // Return empty data to prevent UI crashes
      return {
        success: false,
        enrollments: [],
        total: 0,
        message: 'Failed to load enrollments'
      };
    }
  }

  async enrollInCourse(courseId: string): Promise<{ success: boolean; message: string; enrollment?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Successfully enrolled',
        enrollment: data.enrollment
      };
    } catch (error) {
      console.error('❌ Error enrolling in course:', error);
      return {
        success: false,
        message: 'Failed to enroll in course'
      };
    }
  }

  // Helper methods
  getActiveEnrollments(enrollments: EnrollmentData[]): EnrollmentData[] {
    return enrollments.filter(item => 
      item.enrollment.status === 'active' && item.course !== null
    );
  }

  getCompletedEnrollments(enrollments: EnrollmentData[]): EnrollmentData[] {
    return enrollments.filter(item => 
      item.enrollment.status === 'completed' && item.course !== null
    );
  }

  getInProgressEnrollments(enrollments: EnrollmentData[]): EnrollmentData[] {
    return enrollments.filter(item => 
      item.enrollment.status === 'active' && 
      item.enrollment.completion_percentage > 0 &&
      item.enrollment.completion_percentage < 100 &&
      item.course !== null
    );
  }

  formatEnrollmentDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  }

  getDifficultyColor(difficulty: string): string {
    const colors: Record<string, string> = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    };
    return colors[difficulty.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-gray-300';
  }
}

export const enrollmentService = new EnrollmentService();
export default enrollmentService;
