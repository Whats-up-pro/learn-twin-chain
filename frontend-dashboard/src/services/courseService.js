/**
 * Course and Module Management Service
 */

const API_BASE = 'http://localhost:8000/api/v1';

class CourseService {
  // Course Management
  async searchCourses(query = '', filters = {}, skip = 0, limit = 20) {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString()
      });

      if (query) {
        params.append('q', query);
      }

      if (filters.difficulty_level) {
        params.append('difficulty_level', filters.difficulty_level);
      }

      if (filters.institution) {
        params.append('institution', filters.institution);
      }

      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }

      const response = await fetch(`${API_BASE}/courses/?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to search courses');
      }

      return await response.json();
    } catch (error) {
      console.error('Course search error:', error);
      throw error;
    }
  }

  async getCourse(courseId, includeModules = false) {
    try {
      const params = includeModules ? '?include_modules=true' : '';
      const response = await fetch(`${API_BASE}/courses/${courseId}${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Course not found');
        }
        throw new Error('Failed to get course');
      }

      return await response.json();
    } catch (error) {
      console.error('Get course error:', error);
      throw error;
    }
  }

  async createCourse(courseData) {
    try {
      const response = await fetch(`${API_BASE}/courses/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(courseData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Course creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Course creation error:', error);
      throw error;
    }
  }

  async updateCourse(courseId, updates) {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Course update failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Course update error:', error);
      throw error;
    }
  }

  async publishCourse(courseId) {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}/publish`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Course publishing failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Course publishing error:', error);
      throw error;
    }
  }

  async enrollInCourse(courseId) {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}/enroll`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Course enrollment failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Course enrollment error:', error);
      throw error;
    }
  }

  // Module Management
  async getCourseModules(courseId) {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}/modules`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get course modules');
      }

      return await response.json();
    } catch (error) {
      console.error('Get course modules error:', error);
      throw error;
    }
  }

  async createModule(courseId, moduleData) {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(moduleData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Module creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Module creation error:', error);
      throw error;
    }
  }

  async updateModuleProgress(moduleId, progressData) {
    try {
      const response = await fetch(`${API_BASE}/courses/modules/${moduleId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(progressData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Progress update failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Module progress update error:', error);
      throw error;
    }
  }

  async getModuleProgress(moduleId) {
    try {
      const response = await fetch(`${API_BASE}/courses/modules/${moduleId}/progress`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No progress yet
        }
        throw new Error('Failed to get module progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Get module progress error:', error);
      throw error;
    }
  }

  // User-specific data
  async getMyEnrollments() {
    try {
      const response = await fetch(`${API_BASE}/courses/my/enrollments`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get enrollments');
      }

      return await response.json();
    } catch (error) {
      console.error('Get my enrollments error:', error);
      throw error;
    }
  }

  async getMyProgress(courseId = null) {
    try {
      const params = courseId ? `?course_id=${courseId}` : '';
      const response = await fetch(`${API_BASE}/courses/my/progress${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Get my progress error:', error);
      throw error;
    }
  }

  // Utility methods
  calculateCourseProgress(modules, progressRecords) {
    if (!modules || modules.length === 0) {
      return 0;
    }

    const progressMap = {};
    progressRecords.forEach(record => {
      progressMap[record.module_id] = record.completion_percentage;
    });

    const totalProgress = modules.reduce((sum, module) => {
      return sum + (progressMap[module.module_id] || 0);
    }, 0);

    return totalProgress / modules.length;
  }

  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }

  getDifficultyColor(level) {
    const colors = {
      'beginner': 'green',
      'intermediate': 'yellow',
      'advanced': 'red'
    };
    return colors[level] || 'gray';
  }
}

// Create singleton instance
export const courseService = new CourseService();
export default courseService;