/**
 * Discussion service for handling discussion-related API calls
 */
import { apiService } from './apiService';

export interface Discussion {
  discussion_id: string;
  title: string;
  content: string;
  discussion_type: 'lesson' | 'module' | 'course' | 'general';
  course_id?: string;
  module_id?: string;
  lesson_id?: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  status: 'active' | 'archived' | 'locked';
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  comment_count: number;
  like_count: number;
  tags: string[];
  category?: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  is_liked_by_user: boolean;
}

export interface Comment {
  comment_id: string;
  discussion_id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  parent_comment_id?: string;
  reply_count: number;
  status: 'published' | 'hidden' | 'deleted';
  is_edited: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  is_liked_by_user: boolean;
  replies: Comment[];
}

export interface DiscussionCreateRequest {
  title: string;
  content: string;
  discussion_type: 'lesson' | 'module' | 'course' | 'general';
  course_id?: string;
  module_id?: string;
  lesson_id?: string;
  tags?: string[];
  category?: string;
}

export interface DiscussionUpdateRequest {
  title?: string;
  content?: string;
  tags?: string[];
  category?: string;
  is_pinned?: boolean;
  is_locked?: boolean;
}

export interface CommentCreateRequest {
  content: string;
  parent_comment_id?: string;
}

export interface CommentUpdateRequest {
  content: string;
}

export interface DiscussionListResponse {
  discussions: Discussion[];
  total: number;
  skip: number;
  limit: number;
}

export interface DiscussionStatistics {
  total_discussions: number;
  total_comments: number;
  user_discussions: number;
  user_comments: number;
}

class DiscussionService {
  private baseUrl = '/api/v1/discussions';

  /**
   * Get discussions with filtering and pagination
   */
  async getDiscussions(params: {
    course_id?: string;
    module_id?: string;
    lesson_id?: string;
    discussion_type?: 'lesson' | 'module' | 'course' | 'general';
    status?: 'active' | 'archived' | 'locked';
    search?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<DiscussionListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.getDiscussions(params);
    return response;
  }

  /**
   * Get a specific discussion by ID
   */
  async getDiscussion(discussionId: string): Promise<Discussion> {
    const response = await apiService.getDiscussion(discussionId);
    return response;
  }

  /**
   * Create a new discussion
   */
  async createDiscussion(request: DiscussionCreateRequest): Promise<Discussion> {
    const response = await apiService.createDiscussion(request);
    return response;
  }

  /**
   * Update a discussion
   */
  async updateDiscussion(discussionId: string, request: DiscussionUpdateRequest): Promise<Discussion> {
    const response = await apiService.updateDiscussion(discussionId, request);
    return response;
  }

  /**
   * Delete a discussion
   */
  async deleteDiscussion(discussionId: string): Promise<void> {
    await apiService.deleteDiscussion(discussionId);
  }

  /**
   * Toggle like on a discussion
   */
  async toggleDiscussionLike(discussionId: string): Promise<{ liked: boolean; like_count: number }> {
    const response = await apiService.likeDiscussion(discussionId);
    return response;
  }

  /**
   * Get comments for a discussion
   */
  async getDiscussionComments(
    discussionId: string,
    params: { skip?: number; limit?: number } = {}
  ): Promise<Comment[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.getComments(discussionId, params);
    return response;
  }

  /**
   * Create a new comment
   */
  async createComment(discussionId: string, request: CommentCreateRequest): Promise<Comment> {
    const response = await apiService.createComment(discussionId, request);
    return response;
  }

  /**
   * Update a comment
   */
  async updateComment(discussionId: string, commentId: string, request: CommentUpdateRequest): Promise<Comment> {
    const response = await apiService.updateComment(discussionId, commentId, request);
    return response;
  }

  /**
   * Delete a comment
   */
  async deleteComment(discussionId: string, commentId: string): Promise<void> {
    await apiService.deleteComment(discussionId, commentId);
  }

  /**
   * Toggle like on a comment
   */
  async toggleCommentLike(commentId: string): Promise<{ liked: boolean; like_count: number }> {
    const response = await apiService.post(`${this.baseUrl.replace('/discussions', '/comments')}/${commentId}/like`);
    return response.data;
  }

  /**
   * Get discussion statistics
   */
  async getDiscussionStatistics(courseId?: string): Promise<DiscussionStatistics> {
    const queryParams = courseId ? `?course_id=${courseId}` : '';
    const response = await apiService.get(`${this.baseUrl}/statistics${queryParams}`);
    return response.data;
  }

  /**
   * Get discussions for a specific lesson
   */
  async getLessonDiscussions(lessonId: string, params: { skip?: number; limit?: number } = {}): Promise<DiscussionListResponse> {
    return this.getDiscussions({ lesson_id: lessonId, ...params });
  }

  /**
   * Get discussions for a specific module
   */
  async getModuleDiscussions(moduleId: string, params: { skip?: number; limit?: number } = {}): Promise<DiscussionListResponse> {
    return this.getDiscussions({ module_id: moduleId, ...params });
  }

  /**
   * Get discussions for a specific course
   */
  async getCourseDiscussions(courseId: string, params: { skip?: number; limit?: number } = {}): Promise<DiscussionListResponse> {
    return this.getDiscussions({ course_id: courseId, ...params });
  }

  /**
   * Search discussions
   */
  async searchDiscussions(query: string, params: { skip?: number; limit?: number } = {}): Promise<DiscussionListResponse> {
    return this.getDiscussions({ search: query, ...params });
  }
}

export const discussionService = new DiscussionService();
