import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { rankingService, RankingUser, RankingStats } from '../services/rankingService';
import { 
  TrophyIcon, 
  DocumentTextIcon, 
  UserIcon,
  CalendarIcon,
  StarIcon,
  FireIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophySolid,
  DocumentTextIcon as DocumentSolid,
  StarIcon as StarSolid,
  FireIcon as FireSolid
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

type RankingType = 'certificates' | 'achievements';
type Timeframe = 'week' | 'month' | 'year' | 'all';

interface RankingData {
  leaderboard: RankingUser[];
  timeframe: string;
  total_users: number;
}

const RankingPage: React.FC = () => {
  const { learnerProfile } = useAppContext();
  const [activeTab, setActiveTab] = useState<RankingType>('certificates');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [certificateData, setCertificateData] = useState<RankingData | null>(null);
  const [achievementData, setAchievementData] = useState<RankingData | null>(null);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    fetchRankingData();
  }, [timeframe]);

  const fetchRankingData = async () => {
    try {
      setLoading(true);
      
      const [certResponse, achievementResponse, statsResponse] = await Promise.all([
        rankingService.getCertificateLeaderboard({ timeframe, limit: 50 }),
        rankingService.getAchievementLeaderboard({ timeframe, limit: 50 }),
        rankingService.getRankingStats()
      ]);

      setCertificateData(certResponse);
      setAchievementData(achievementResponse);
      setStats(statsResponse);
    } catch (error) {
      console.error('Error fetching ranking data:', error);
      toast.error('Failed to load ranking data');
    } finally {
      setLoading(false);
    }
  };

  const currentData = activeTab === 'certificates' ? certificateData : achievementData;

  const getRankingIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏆';
    if (rank <= 50) return '⭐';
    return '📊';
  };

  const getRankingBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank === 3) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (rank <= 10) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (rank <= 50) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getRankingTier = (rank: number) => {
    if (rank === 1) return 'Champion';
    if (rank <= 3) return 'Elite';
    if (rank <= 10) return 'Master';
    if (rank <= 25) return 'Expert';
    if (rank <= 50) return 'Advanced';
    if (rank <= 100) return 'Intermediate';
    return 'Beginner';
  };

  const getRankingTierColor = (tier: string) => {
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
  };

  const formatTimeframe = (timeframe: string) => {
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
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const shareRanking = async () => {
    try {
      const shareUrl = `${window.location.origin}/ranking`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Ranking link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing ranking:', error);
      toast.error('Failed to share ranking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <TrophySolid className="h-8 w-8 text-yellow-600 mr-3" />
                Leaderboards
              </h1>
              <p className="text-slate-600 mt-2">
                See how you rank against other learners in certificates and achievements
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={shareRanking}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ShareIcon className="h-5 w-5 mr-2" />
                Share
              </button>
              <button
                onClick={fetchRankingData}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DocumentSolid className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Certificates</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.stats.total_certificates_issued}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <TrophySolid className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Achievements</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.stats.total_achievements_earned}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <StarSolid className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Points</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.stats.total_points_earned.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <UserIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Active Learners</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.stats.total_users_with_certificates}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('certificates')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'certificates'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5 inline mr-2" />
                Certificates
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'achievements'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrophyIcon className="h-5 w-5 inline mr-2" />
                Achievements
              </button>
            </div>

            {/* Timeframe Filter */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-slate-700">Timeframe:</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="year">This Year</option>
                <option value="month">This Month</option>
                <option value="week">This Week</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {currentData && currentData.leaderboard.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {activeTab === 'certificates' ? 'Certificate' : 'Achievement'} Leaderboard
              </h2>
              <p className="text-slate-600 mt-1">
                {formatTimeframe(currentData.timeframe)} • {currentData.total_users} learners
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {currentData.leaderboard.map((user, index) => {
                const isExpanded = expandedUser === user.user_id;
                const isCurrentUser = user.user_id === learnerProfile?.did;
                
                return (
                  <div
                    key={user.user_id}
                    className={`p-6 hover:bg-slate-50 transition-colors ${
                      isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getRankingBadgeColor(user.rank)}`}>
                            {getRankingIcon(user.rank)}
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.user_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-6 w-6 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                              {user.user_name}
                              {isCurrentUser && (
                                <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  You
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-slate-600">
                              <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Rank #{user.rank}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRankingTierColor(getRankingTier(user.rank))}`}>
                                {getRankingTier(user.rank)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-6">
                        {activeTab === 'certificates' ? (
                          <>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-slate-900">{user.total_certificates || 0}</p>
                              <p className="text-sm text-slate-600">Certificates</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-slate-700">{user.nft_certificate_count || 0}</p>
                              <p className="text-sm text-slate-600">NFTs</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-slate-900">{user.total_achievements || 0}</p>
                              <p className="text-sm text-slate-600">Achievements</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-slate-700">{user.total_points || 0}</p>
                              <p className="text-sm text-slate-600">Points</p>
                            </div>
                          </>
                        )}
                        
                        {/* Expand Button */}
                        <button
                          onClick={() => toggleUserExpansion(user.user_id)}
                          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Recent Activity */}
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-3">Recent Activity</h4>
                            <div className="space-y-2">
                              {activeTab === 'certificates' ? (
                                user.courses?.slice(0, 3).map((course, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Course completed</span>
                                    <span className="text-slate-900 font-medium">
                                      {new Date(course.completed_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                user.achievements?.slice(0, 3).map((achievement, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">{achievement.title}</span>
                                    <span className="text-slate-900 font-medium">
                                      {achievement.points} pts
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* NFT Collection */}
                          {user.nfts && user.nfts.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-slate-900 mb-3">NFT Collection</h4>
                              <div className="space-y-2">
                                {user.nfts.slice(0, 3).map((nft, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">{nft.title}</span>
                                    <span className="text-slate-900 font-medium">
                                      #{nft.token_id}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <TrophyIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No rankings available</h3>
            <p className="text-slate-600 mb-6">
              {timeframe === 'all' 
                ? "No learners have earned certificates or achievements yet."
                : `No learners have earned certificates or achievements ${formatTimeframe(timeframe).toLowerCase()}.`
              }
            </p>
            <button
              onClick={() => window.location.href = '/courses'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Learning
            </button>
          </div>
        )}

        {/* My Ranking Position */}
        {learnerProfile && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Ranking Position</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DocumentSolid className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Certificate Rank</p>
                  <p className="text-xl font-bold text-slate-900">
                    {stats?.stats.user_rankings.certificate_rank 
                      ? `#${stats.stats.user_rankings.certificate_rank}` 
                      : 'Not ranked'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <TrophySolid className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Achievement Rank</p>
                  <p className="text-xl font-bold text-slate-900">
                    {stats?.stats.user_rankings.achievement_rank 
                      ? `#${stats.stats.user_rankings.achievement_rank}` 
                      : 'Not ranked'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingPage;
