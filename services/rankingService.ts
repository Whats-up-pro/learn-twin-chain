/**
 * Ranking Service - Handle ranking and leaderboard operations
 */

import { apiService } from './apiService';

export interface RankingUser {
  rank: number;
  user_id: string;
  user_name: string;
  user_email?: string;
  avatar_url?: string;
  certificate_count?: number;
  nft_certificate_count?: number;
  total_certificates?: number;
  achievement_count?: number;
  nft_achievement_count?: number;
  total_achievements?: number;
  total_points?: number;
  latest_certificate?: string;
  latest_achievement?: string;
  courses?: Array<{
    course_id: string;
    completed_at: string;
    final_grade?: number;
  }>;
  achievements?: Array<{
    achievement_id: string;
    title: string;
    tier: string;
    points: number;
    earned_at: string;
  }>;
  nfts?: Array<{
    token_id: string;
    achievement_type: string;
    title: string;
    created_at: string;
  }>;
}

export interface RankingResponse {
  success: boolean;
  leaderboard: RankingUser[];
  timeframe: string;
  total_users: number;
}

export interface UserRankingPosition {
  success: boolean;
  user_id: string;
  ranking_type: string;
  rank: number | null;
  total_users: number;
  user_stats: {
    certificate_count: number;
    nft_certificate_count: number;
    total_certificates: number;
    achievement_count: number;
    nft_achievement_count: number;
    total_achievements: number;
    total_points: number;
  };
}

export interface RankingStats {
  success: boolean;
  stats: {
    total_users_with_certificates: number;
    total_users_with_achievements: number;
    total_certificates_issued: number;
    total_achievements_earned: number;
    total_points_earned: number;
    user_rankings: {
      certificate_rank: number | null;
      achievement_rank: number | null;
    };
  };
}

class RankingService {
  private readonly API_BASE = '/api/v1/ranking';

  /**
   * Get certificate leaderboard
   */
  async getCertificateLeaderboard(params?: {
    timeframe?: 'week' | 'month' | 'year' | 'all';
    limit?: number;
  }): Promise<RankingResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeframe) searchParams.append('timeframe', params.timeframe);
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const response = await apiService.get(`${this.API_BASE}/certificates?${searchParams}`);
      return response;
    } catch (error) {
      console.error('Error getting certificate leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get achievement leaderboard
   */
  async getAchievementLeaderboard(params?: {
    timeframe?: 'week' | 'month' | 'year' | 'all';
    limit?: number;
  }): Promise<RankingResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.timeframe) searchParams.append('timeframe', params.timeframe);
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const response = await apiService.get(`${this.API_BASE}/achievements?${searchParams}`);
      return response;
    } catch (error) {
      console.error('Error getting achievement leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get current user's ranking position
   */
  async getMyRankingPosition(rankingType: 'certificates' | 'achievements'): Promise<UserRankingPosition> {
    try {
      const response = await apiService.get(`${this.API_BASE}/my-position?ranking_type=${rankingType}`);
      return response;
    } catch (error) {
      console.error('Error getting my ranking position:', error);
      throw error;
    }
  }

  /**
   * Get overall ranking statistics
   */
  async getRankingStats(): Promise<RankingStats> {
    try {
      const response = await apiService.get(`${this.API_BASE}/stats`);
      return response;
    } catch (error) {
      console.error('Error getting ranking stats:', error);
      throw error;
    }
  }

  /**
   * Get user's ranking position by user ID
   */
  async getUserRankingPosition(userId: string, rankingType: 'certificates' | 'achievements'): Promise<UserRankingPosition> {
    try {
      const response = await apiService.get(`${this.API_BASE}/user-position?user_id=${userId}&ranking_type=${rankingType}`);
      return response;
    } catch (error) {
      console.error('Error getting user ranking position:', error);
      throw error;
    }
  }

  /**
   * Format ranking timeframe for display
   */
  formatTimeframe(timeframe: string): string {
    switch (timeframe) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      case 'all':
        return 'All Time';
      default:
        return 'All Time';
    }
  }

  /**
   * Get ranking badge color based on rank
   */
  getRankingBadgeColor(rank: number): string {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank === 3) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (rank <= 10) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (rank <= 50) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  }

  /**
   * Get ranking badge icon based on rank
   */
  getRankingBadgeIcon(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏆';
    if (rank <= 50) return '⭐';
    return '📊';
  }

  /**
   * Calculate ranking percentage
   */
  calculateRankingPercentage(rank: number, totalUsers: number): number {
    if (totalUsers === 0) return 0;
    return Math.round(((totalUsers - rank + 1) / totalUsers) * 100);
  }

  /**
   * Get ranking tier based on position
   */
  getRankingTier(rank: number): string {
    if (rank === 1) return 'Champion';
    if (rank <= 3) return 'Elite';
    if (rank <= 10) return 'Master';
    if (rank <= 25) return 'Expert';
    if (rank <= 50) return 'Advanced';
    if (rank <= 100) return 'Intermediate';
    return 'Beginner';
  }

  /**
   * Get ranking tier color
   */
  getRankingTierColor(tier: string): string {
    switch (tier) {
      case 'Champion':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'Elite':
        return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
      case 'Master':
        return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
      case 'Expert':
        return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
      case 'Advanced':
        return 'bg-gradient-to-r from-indigo-400 to-indigo-600 text-white';
      case 'Intermediate':
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      case 'Beginner':
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

export const rankingService = new RankingService();
export default rankingService;
