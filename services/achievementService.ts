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

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

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

      const response = await fetch(`${API_BASE}/achievements?${searchParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get achievements: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting achievements:', error);
      throw error;
    }
  }

  async getAchievement(achievementId: string) {
    try {
      const response = await fetch(`${API_BASE}/achievements/${achievementId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get achievement: ${response.statusText}`);
      }

      return await response.json();
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
      const response = await fetch(`${API_BASE}/achievements/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(achievementData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create achievement: ${response.statusText}`);
      }

      return await response.json();
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

      const response = await fetch(`${API_BASE}/achievements/my?${searchParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get user achievements: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  async getUserAchievement(userAchievementId: string) {
    try {
      const response = await fetch(`${API_BASE}/achievements/my/${userAchievementId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get user achievement: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user achievement:', error);
      throw error;
    }
  }

  async unlockAchievement(achievementId: string, evidenceData?: Record<string, any>) {
    try {
      const response = await fetch(`${API_BASE}/achievements/${achievementId}/unlock`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ evidence_data: evidenceData })
      });

      if (!response.ok) {
        throw new Error(`Failed to unlock achievement: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  async checkAchievementProgress(achievementId: string) {
    try {
      const response = await fetch(`${API_BASE}/achievements/${achievementId}/progress`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to check achievement progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking achievement progress:', error);
      throw error;
    }
  }

  // Achievement categories and statistics
  async getAchievementCategories() {
    try {
      const response = await fetch(`${API_BASE}/achievements/categories`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get achievement categories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting achievement categories:', error);
      throw error;
    }
  }

  async getUserAchievementStats(userId?: string) {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await fetch(`${API_BASE}/achievements/my/statistics${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get achievement statistics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting achievement statistics:', error);
      throw error;
    }
  }

  // Achievement NFT minting
  async mintAchievementNFT(userAchievementId: string) {
    try {
      const response = await fetch(`${API_BASE}/achievements/my/${userAchievementId}/mint-nft`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to mint achievement NFT: ${response.statusText}`);
      }

      return await response.json();
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

      const response = await fetch(`${API_BASE}/achievements/leaderboard?${searchParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get achievement leaderboard: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting achievement leaderboard:', error);
      throw error;
    }
  }
}

export const achievementService = new AchievementService();
export default achievementService;
