/**
 * Video settings service for handling video learning settings and session tracking
 */
import { apiService } from './apiService';

export interface VideoSettings {
  user_id: string;
  default_playback_speed: '0.25' | '0.5' | '1.0' | '1.25' | '1.5' | '1.75' | '2.0';
  remember_playback_speed: boolean;
  auto_play: boolean;
  auto_advance: boolean;
  preferred_quality: 'auto' | '240p' | '480p' | '720p' | '1080p' | '2160p';
  bandwidth_limit?: number;
  data_saver_mode: boolean;
  captions_enabled: boolean;
  caption_language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko' | 'vi';
  caption_size: 'small' | 'medium' | 'large';
  caption_color: 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'black';
  caption_background: boolean;
  volume: number;
  remember_volume: boolean;
  audio_only_mode: boolean;
  pause_on_tab_switch: boolean;
  show_progress_bar: boolean;
  show_time_remaining: boolean;
  show_lesson_notes: boolean;
  show_discussion_panel: boolean;
  notifications: {
    lesson_complete: boolean;
    module_complete: boolean;
    quiz_available: boolean;
    achievement_earned: boolean;
    discussion_reply: boolean;
    course_update: boolean;
  };
  study_reminders: boolean;
  reminder_frequency: number;
  break_reminders: boolean;
  break_interval: number;
  track_watch_time: boolean;
  track_pause_events: boolean;
  track_seek_events: boolean;
  track_completion_events: boolean;
  share_progress: boolean;
  share_learning_analytics: boolean;
  anonymous_analytics: boolean;
  keyboard_shortcuts: boolean;
  picture_in_picture: boolean;
  fullscreen_on_play: boolean;
  skip_intro: boolean;
  custom_preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface VideoSession {
  session_id: string;
  user_id: string;
  course_id: string;
  module_id: string;
  lesson_id: string;
  video_url: string;
  video_duration: number;
  watch_time: number;
  completion_percentage: number;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  quality_used?: string;
  bandwidth_used?: number;
  started_at: string;
  last_activity_at: string;
  completed_at?: string;
}

export interface VideoSettingsUpdateRequest {
  default_playback_speed?: '0.25' | '0.5' | '1.0' | '1.25' | '1.5' | '1.75' | '2.0';
  remember_playback_speed?: boolean;
  auto_play?: boolean;
  auto_advance?: boolean;
  preferred_quality?: 'auto' | '240p' | '480p' | '720p' | '1080p' | '2160p';
  bandwidth_limit?: number;
  data_saver_mode?: boolean;
  captions_enabled?: boolean;
  caption_language?: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko' | 'vi';
  caption_size?: 'small' | 'medium' | 'large';
  caption_color?: 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'black';
  caption_background?: boolean;
  volume?: number;
  remember_volume?: boolean;
  audio_only_mode?: boolean;
  pause_on_tab_switch?: boolean;
  show_progress_bar?: boolean;
  show_time_remaining?: boolean;
  show_lesson_notes?: boolean;
  show_discussion_panel?: boolean;
  notifications?: {
    lesson_complete?: boolean;
    module_complete?: boolean;
    quiz_available?: boolean;
    achievement_earned?: boolean;
    discussion_reply?: boolean;
    course_update?: boolean;
  };
  study_reminders?: boolean;
  reminder_frequency?: number;
  break_reminders?: boolean;
  break_interval?: number;
  track_watch_time?: boolean;
  track_pause_events?: boolean;
  track_seek_events?: boolean;
  track_completion_events?: boolean;
  share_progress?: boolean;
  share_learning_analytics?: boolean;
  anonymous_analytics?: boolean;
  keyboard_shortcuts?: boolean;
  picture_in_picture?: boolean;
  fullscreen_on_play?: boolean;
  skip_intro?: boolean;
  custom_preferences?: Record<string, any>;
}

export interface VideoSessionCreateRequest {
  course_id: string;
  module_id: string;
  lesson_id: string;
  video_url: string;
  video_duration: number;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
}

export interface VideoSessionUpdateRequest {
  watch_time?: number;
  completion_percentage?: number;
  play_events?: Array<{ timestamp: number; current_time: number }>;
  pause_events?: Array<{ timestamp: number; current_time: number }>;
  seek_events?: Array<{ timestamp: number; from_time: number; to_time: number }>;
  volume_changes?: Array<{ timestamp: number; volume: number }>;
  speed_changes?: Array<{ timestamp: number; speed: string }>;
  quality_used?: string;
  bandwidth_used?: number;
  completed?: boolean;
}

export interface VideoAnalytics {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  summary: {
    total_sessions: number;
    total_watch_time: number;
    total_video_duration: number;
    average_completion_percentage: number;
    engagement_rate: number;
  };
  device_breakdown: Record<string, number>;
  quality_usage: Record<string, number>;
  daily_activity: Record<string, { sessions: number; watch_time: number }>;
}

export interface AvailableOptions {
  playback_speeds: string[];
  video_qualities: string[];
  caption_languages: string[];
  caption_sizes: string[];
  caption_colors: string[];
  device_types: string[];
  notification_types: string[];
}

class VideoSettingsService {
  private baseUrl = '/api/v1/video-settings';
  private sessionsUrl = '/api/v1/video-sessions';

  /**
   * Get user's video learning settings
   */
  async getVideoSettings(): Promise<VideoSettings> {
    const response = await apiService.getVideoSettings();
    return response;
  }

  /**
   * Update user's video learning settings
   */
  async updateVideoSettings(request: VideoSettingsUpdateRequest): Promise<VideoSettings> {
    const response = await apiService.updateVideoSettings(request);
    return response;
  }

  /**
   * Reset video settings to defaults
   */
  async resetVideoSettings(): Promise<void> {
    await apiService.resetVideoSettings();
  }

  /**
   * Export video settings as JSON
   */
  async exportVideoSettings(): Promise<{ user_id: string; exported_at: string; settings: VideoSettings }> {
    const response = await apiService.exportVideoSettings();
    return response;
  }

  /**
   * Get available options for video settings
   */
  async getAvailableOptions(): Promise<AvailableOptions> {
    const response = await apiService.getVideoSettingsOptions();
    return response;
  }

  /**
   * Create a new video learning session
   */
  async createVideoSession(request: VideoSessionCreateRequest): Promise<VideoSession> {
    const response = await apiService.createVideoSession(request);
    return response;
  }

  /**
   * Get a specific video session
   */
  async getVideoSession(sessionId: string): Promise<VideoSession> {
    const response = await apiService.getVideoSession(sessionId);
    return response;
  }

  /**
   * Update a video session
   */
  async updateVideoSession(sessionId: string, request: VideoSessionUpdateRequest): Promise<VideoSession> {
    const response = await apiService.updateVideoSession(sessionId, request);
    return response;
  }

  /**
   * Get user's video sessions with filtering
   */
  async getVideoSessions(params: {
    course_id?: string;
    module_id?: string;
    lesson_id?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<VideoSession[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.getVideoSessions(params);
    return response;
  }

  /**
   * Delete a video session
   */
  async deleteVideoSession(sessionId: string): Promise<void> {
    await apiService.deleteVideoSession(sessionId);
  }

  /**
   * Get video learning analytics for user
   */
  async getVideoAnalytics(params: {
    course_id?: string;
    days?: number;
  } = {}): Promise<VideoAnalytics> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.getVideoSessionAnalytics(params);
    return response;
  }

  /**
   * Track video play event
   */
  async trackPlayEvent(sessionId: string, currentTime: number): Promise<void> {
    const playEvent = {
      timestamp: Date.now(),
      current_time: currentTime
    };

    // Get current session to append to existing play events
    const session = await this.getVideoSession(sessionId);
    const playEvents = session.play_events || [];
    playEvents.push(playEvent);

    await this.updateVideoSession(sessionId, { play_events: playEvents });
  }

  /**
   * Track video pause event
   */
  async trackPauseEvent(sessionId: string, currentTime: number): Promise<void> {
    const pauseEvent = {
      timestamp: Date.now(),
      current_time: currentTime
    };

    // Get current session to append to existing pause events
    const session = await this.getVideoSession(sessionId);
    const pauseEvents = session.pause_events || [];
    pauseEvents.push(pauseEvent);

    await this.updateVideoSession(sessionId, { pause_events: pauseEvents });
  }

  /**
   * Track video seek event
   */
  async trackSeekEvent(sessionId: string, fromTime: number, toTime: number): Promise<void> {
    const seekEvent = {
      timestamp: Date.now(),
      from_time: fromTime,
      to_time: toTime
    };

    // Get current session to append to existing seek events
    const session = await this.getVideoSession(sessionId);
    const seekEvents = session.seek_events || [];
    seekEvents.push(seekEvent);

    await this.updateVideoSession(sessionId, { seek_events: seekEvents });
  }

  /**
   * Track volume change event
   */
  async trackVolumeChange(sessionId: string, volume: number): Promise<void> {
    const volumeEvent = {
      timestamp: Date.now(),
      volume: volume
    };

    // Get current session to append to existing volume changes
    const session = await this.getVideoSession(sessionId);
    const volumeChanges = session.volume_changes || [];
    volumeChanges.push(volumeEvent);

    await this.updateVideoSession(sessionId, { volume_changes: volumeChanges });
  }

  /**
   * Track speed change event
   */
  async trackSpeedChange(sessionId: string, speed: string): Promise<void> {
    const speedEvent = {
      timestamp: Date.now(),
      speed: speed
    };

    // Get current session to append to existing speed changes
    const session = await this.getVideoSession(sessionId);
    const speedChanges = session.speed_changes || [];
    speedChanges.push(speedEvent);

    await this.updateVideoSession(sessionId, { speed_changes: speedChanges });
  }

  /**
   * Update session watch time and completion
   */
  async updateSessionProgress(sessionId: string, watchTime: number, completionPercentage: number): Promise<void> {
    await this.updateVideoSession(sessionId, {
      watch_time: watchTime,
      completion_percentage: completionPercentage
    });
  }

  /**
   * Complete a video session
   */
  async completeVideoSession(sessionId: string): Promise<void> {
    await this.updateVideoSession(sessionId, { completed: true });
  }

  /**
   * Get sessions for a specific lesson
   */
  async getLessonSessions(lessonId: string, params: { skip?: number; limit?: number } = {}): Promise<VideoSession[]> {
    return this.getVideoSessions({ lesson_id: lessonId, ...params });
  }

  /**
   * Get sessions for a specific module
   */
  async getModuleSessions(moduleId: string, params: { skip?: number; limit?: number } = {}): Promise<VideoSession[]> {
    return this.getVideoSessions({ module_id: moduleId, ...params });
  }

  /**
   * Get sessions for a specific course
   */
  async getCourseSessions(courseId: string, params: { skip?: number; limit?: number } = {}): Promise<VideoSession[]> {
    return this.getVideoSessions({ course_id: courseId, ...params });
  }
}

export const videoSettingsService = new VideoSettingsService();
