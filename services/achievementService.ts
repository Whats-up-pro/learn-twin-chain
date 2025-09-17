/**
 * Achievement Service - Frontend API integration for achievement management
 */

const API_BASE = 'http://localhost:8000/api/v1';

// API Response types matching backend
export interface ApiAchievement {
  achievement_id: string;
  title: string;
  description: string;
  achievement_type: string;
  tier: string;
  icon_url?: string;
  badge_color?: string;
  criteria: {
    type: string;
    target_value: number;
    current_value?: number;
    conditions?: Record<string, any>;
  };
  points_awarded: number;
  nft_metadata_template?: Record<string, any>;
  is_active: boolean;
  category: string;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApiUserAchievement {
  user_achievement_id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress_percentage: number;
  current_value: number;
  is_completed: boolean;
  nft_minted: boolean;
  nft_token_id?: string;
  nft_tx_hash?: string;
  evidence_data?: Record<string, any>;
  notes?: string;
  achievement?: ApiAchievement;
}

import { jwtService } from './jwtService';

// Helper function for authenticated requests with token refresh
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

class AchievementService {
  
  // Achievement management
  async getAllAchievements(params?: {
    category?: string;
    achievement_type?: string;
    tier?: string;
    skip?: number;
    limit?: number;
  }) {
    try {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append('category', params.category);
      if (params?.achievement_type) searchParams.append('achievement_type', params.achievement_type);
      if (params?.tier) searchParams.append('tier', params.tier);
      if (params?.skip) searchParams.append('skip', params.skip.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      return await makeAuthenticatedRequest(`${API_BASE}/achievements?${searchParams}`);
    } catch (error) {
      console.error('Error getting achievements:', error);
      throw error;
    }
  }

  async getAchievement(achievementId: string) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/achievements/${achievementId}`);
    } catch (error) {
      console.error('Error getting achievement:', error);
      throw error;
    }
  }

  async createAchievement(achievementData: {
    title: string;
    description: string;
    achievement_type: string;
    tier: string;
    icon_url?: string;
    badge_color?: string;
    criteria: {
      type: string;
      target_value: number;
      conditions?: Record<string, any>;
    };
    points_awarded: number;
    nft_metadata_template?: Record<string, any>;
    category: string;
    tags?: string[];
  }) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/achievements/`, {
        method: 'POST',
        body: JSON.stringify(achievementData)
      });
    } catch (error) {
      console.error('Error creating achievement:', error);
      throw error;
    }
  }

  // User achievements
  async getUserAchievements(params?: {
    user_id?: string;
    achievement_type?: string;
    is_completed?: boolean;
    include_progress?: boolean;
    skip?: number;
    limit?: number;
  }) {
    try {
      const searchParams = new URLSearchParams();
      if (params?.user_id) searchParams.append('user_id', params.user_id);
      if (params?.achievement_type) searchParams.append('achievement_type', params.achievement_type);
      if (params?.is_completed !== undefined) searchParams.append('is_completed', params.is_completed.toString());
      if (params?.include_progress) searchParams.append('include_progress', 'true');
      if (params?.skip) searchParams.append('skip', params.skip.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      return await makeAuthenticatedRequest(`${API_BASE}/achievements/my?${searchParams}`);
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  async getUserAchievement(userAchievementId: string) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/achievements/my/${userAchievementId}`);
    } catch (error) {
      console.error('Error getting user achievement:', error);
      throw error;
    }
  }

  async getRecentAchievements(minutes: number = 5) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/achievements/my/recent?minutes=${minutes}`);
    } catch (error) {
      console.error('Error getting recent achievements:', error);
      throw error;
    }
  }

  async unlockAchievement(achievementId: string, evidenceData?: Record<string, any>) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/achievements/${achievementId}/unlock`, {
        method: 'POST',
        body: JSON.stringify({ evidence_data: evidenceData })
      });
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  async checkAchievementProgress(achievementId: string) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/achievements/${achievementId}/progress`);
    } catch (error) {
      console.error('Error checking achievement progress:', error);
      throw error;
    }
  }

  // Achievement categories and statistics
  async getAchievementCategories() {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/achievements/categories`);
    } catch (error) {
      console.error('Error getting achievement categories:', error);
      throw error;
    }
  }

  async getUserAchievementStats(userId?: string) {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      return await makeAuthenticatedRequest(`${API_BASE}/achievements/my/statistics${params}`);
    } catch (error) {
      console.error('Error getting achievement statistics:', error);
      // Return fallback stats on error
      return {
        stats: {
          totalAchievements: 8,
          unlockedCount: 0,
          totalPoints: 0,
          completionRate: 0
        }
      };
    }
  }

  // Achievement NFT minting
  async mintAchievementNFT(userAchievementId: string) {
    try {
      return await makeAuthenticatedRequest(`${API_BASE}/achievements/my/${userAchievementId}/mint-nft`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error minting achievement NFT:', error);
      throw error;
    }
  }

  // Leaderboard
  async getAchievementLeaderboard(params?: {
    achievement_type?: string;
    tier?: string;
    time_period?: string;
    limit?: number;
  }) {
    try {
      const searchParams = new URLSearchParams();
      if (params?.achievement_type) searchParams.append('achievement_type', params.achievement_type);
      if (params?.tier) searchParams.append('tier', params.tier);
      if (params?.time_period) searchParams.append('time_period', params.time_period);
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      return await makeAuthenticatedRequest(`${API_BASE}/achievements/leaderboard?${searchParams}`);
    } catch (error) {
      console.error('Error getting achievement leaderboard:', error);
      throw error;
    }
  }

  // module progress report
  async reportModuleProgress(moduleId: string, progressPercentage: number, moduleTitle?: string) {
    try {
      const payload = {
        module_id: moduleId,
        progress_percentage: progressPercentage,
        module_title: moduleTitle
      };

      const data = await makeAuthenticatedRequest<any>(`${API_BASE}/achievements/report-module-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // nếu hoàn thành module => notify UI
      if (progressPercentage >= 100) {
        window.dispatchEvent(new CustomEvent('moduleCompleted', {
          detail: { moduleId, moduleTitle, progress: progressPercentage }
        }));
      }
      // backend trả unlocked achievements => dispatch sự kiện achievementUnlocked
      const unlocked = data?.unlocked || data?.unlocked_achievements;
      if (unlocked) {
        const items = Array.isArray(unlocked) ? unlocked : [unlocked];
        items.forEach((ua: any) => {
          const detail = {
            userAchievement: ua,
            title: ua?.achievement?.title || ua?.title,
            description: ua?.achievement?.description || ua?.description
          };
          window.dispatchEvent(new CustomEvent('achievementUnlocked', { detail }));
        });
      }

      return data;
    } catch (error) {
      console.error('reportModuleProgress error', error);
      throw error;
    }
  }
}

export const achievementService = new AchievementService();
export default achievementService;
