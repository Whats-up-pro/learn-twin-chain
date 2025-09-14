/**
 * Search Service for unified search functionality
 */
import { apiService } from './apiService';

export interface SearchResult {
  id: string;
  type: 'course' | 'module' | 'lesson' | 'quiz' | 'achievement';
  title: string;
  description?: string;
  course_id?: string;
  course_name?: string;
  module_id?: string;
  module_name?: string;
  tags: string[];
  difficulty_level?: string;
  duration_minutes?: number;
  url: string;
  metadata: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  skip: number;
  limit: number;
  type_counts: Record<string, number>;
  filters: {
    type?: string;
    course_id?: string;
    difficulty_level?: string;
  };
}

export interface SearchSuggestions {
  query: string;
  suggestions: string[];
}

export interface SearchStats {
  total_content: {
    courses: number;
    modules: number;
    lessons: number;
    quizzes: number;
    achievements: number;
  };
  total_items: number;
}

class SearchService {
  private baseUrl = '/api/v1/search';

  /**
   * Perform unified search across all content types
   */
  async search(params: {
    q: string;
    type?: 'course' | 'module' | 'lesson' | 'quiz' | 'achievement';
    course_id?: string;
    difficulty_level?: string;
    skip?: number;
    limit?: number;
  }): Promise<SearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiService.searchContent(params.q, params);
      return response;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(query: string, limit: number = 10): Promise<SearchSuggestions> {
    try {
      const response = await apiService.getSearchSuggestions(query);
      return response;
    } catch (error) {
      console.error('Search suggestions error:', error);
      throw error;
    }
  }

  /**
   * Get search statistics
   */
  async getStats(): Promise<SearchStats> {
    try {
      const response = await apiService.getSearchStats();
      return response;
    } catch (error) {
      console.error('Search stats error:', error);
      throw error;
    }
  }

  /**
   * Search courses only
   */
  async searchCourses(query: string, filters: {
    difficulty_level?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<SearchResponse> {
    return this.search({
      q: query,
      type: 'course',
      ...filters
    });
  }

  /**
   * Search modules only
   */
  async searchModules(query: string, filters: {
    course_id?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<SearchResponse> {
    return this.search({
      q: query,
      type: 'module',
      ...filters
    });
  }

  /**
   * Search lessons only
   */
  async searchLessons(query: string, filters: {
    course_id?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<SearchResponse> {
    return this.search({
      q: query,
      type: 'lesson',
      ...filters
    });
  }

  /**
   * Search quizzes only
   */
  async searchQuizzes(query: string, filters: {
    course_id?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<SearchResponse> {
    return this.search({
      q: query,
      type: 'quiz',
      ...filters
    });
  }

  /**
   * Search achievements only
   */
  async searchAchievements(query: string, filters: {
    course_id?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<SearchResponse> {
    return this.search({
      q: query,
      type: 'achievement',
      ...filters
    });
  }

  /**
   * Get type icon for search result
   */
  getTypeIcon(type: string): string {
    switch (type) {
      case 'course':
        return '📚';
      case 'module':
        return '📖';
      case 'lesson':
        return '🎥';
      case 'quiz':
        return '❓';
      case 'achievement':
        return '🏆';
      default:
        return '📄';
    }
  }

  /**
   * Get type color class for search result
   */
  getTypeColor(type: string): string {
    switch (type) {
      case 'course':
        return 'bg-blue-100 text-blue-700';
      case 'module':
        return 'bg-indigo-100 text-indigo-700';
      case 'lesson':
        return 'bg-green-100 text-green-700';
      case 'quiz':
        return 'bg-purple-100 text-purple-700';
      case 'achievement':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  /**
   * Get type label for search result
   */
  getTypeLabel(type: string): string {
    switch (type) {
      case 'course':
        return 'Course';
      case 'module':
        return 'Module';
      case 'lesson':
        return 'Lesson';
      case 'quiz':
        return 'Quiz';
      case 'achievement':
        return 'Achievement';
      default:
        return 'Content';
    }
  }

  /**
   * Format search result for display
   */
  formatResult(result: SearchResult): {
    title: string;
    subtitle: string;
    description: string;
    tags: string[];
    metadata: Record<string, any>;
  } {
    let subtitle = '';
    let description = result.description || '';

    // Build subtitle based on type and context
    switch (result.type) {
      case 'course':
        subtitle = `${result.metadata.institution || 'Course'} • ${result.difficulty_level || 'All Levels'}`;
        if (result.metadata.enrollment_count) {
          subtitle += ` • ${result.metadata.enrollment_count} students`;
        }
        if (result.metadata.average_rating > 0) {
          subtitle += ` • ⭐ ${result.metadata.average_rating}`;
        }
        break;
      
      case 'module':
        subtitle = `Module in ${result.course_name || 'Course'}`;
        if (result.duration_minutes) {
          subtitle += ` • ${Math.round(result.duration_minutes / 60)}h`;
        }
        break;
      
      case 'lesson':
        subtitle = `Lesson in ${result.module_name || 'Module'}`;
        if (result.duration_minutes) {
          subtitle += ` • ${result.duration_minutes}min`;
        }
        if (result.metadata.content_type) {
          subtitle += ` • ${result.metadata.content_type}`;
        }
        break;
      
      case 'quiz':
        subtitle = `Quiz in ${result.course_name || 'Course'}`;
        if (result.metadata.total_points) {
          subtitle += ` • ${result.metadata.total_points} points`;
        }
        if (result.duration_minutes) {
          subtitle += ` • ${result.duration_minutes}min`;
        }
        break;
      
      case 'achievement':
        subtitle = `Achievement in ${result.course_name || 'Course'}`;
        if (result.metadata.tier) {
          subtitle += ` • ${result.metadata.tier}`;
        }
        if (result.metadata.points_reward) {
          subtitle += ` • ${result.metadata.points_reward} points`;
        }
        break;
    }

    return {
      title: result.title,
      subtitle,
      description,
      tags: result.tags,
      metadata: result.metadata
    };
  }
}

export const searchService = new SearchService();
