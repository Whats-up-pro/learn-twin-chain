import React, { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { achievementService, ApiUserAchievement, ApiAchievement } from '../services/achievementService';
import { 
  TrophyIcon, 
  StarIcon, 
  CheckCircleIcon,
  LockClosedIcon,
  FireIcon, 
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface AchievementDisplayData {
  id: string;
  title: string;
  description: string;
  type: string;
  tier: string;
  category: string;
  points: number;
  icon: string;
  badgeColor: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  progress: number;
  unlockedAt?: string;
  nftMinted?: boolean;
  tags: string[];
}

const AchievementsPage: React.FC = () => {
  const { learnerProfile } = useAppContext();
  const [achievements, setAchievements] = useState<AchievementDisplayData[]>([]);
  const [userAchievements, setUserAchievements] = useState<ApiUserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [stats, setStats] = useState({
    totalAchievements: 0,
    unlockedCount: 0,
    totalPoints: 0,
    completionRate: 0
  });

  useEffect(() => {
    loadAchievements();
    loadUserAchievements();
    loadStats();
  }, []);

  const loadAchievements = async () => {
    try {
      const response = await achievementService.getAllAchievements({
        limit: 100
      });
      
      if (response && response.achievements) {
        // This will be combined with user achievements to show progress
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  const loadUserAchievements = async () => {
    try {
      const response = await achievementService.getUserAchievements({
        include_progress: true,
        limit: 100
      });
      
      if (response && response.user_achievements) {
        setUserAchievements(response.user_achievements);
        
        // Convert to display format
        const displayData: AchievementDisplayData[] = response.user_achievements.map((ua: ApiUserAchievement) => ({
          id: ua.achievement_id,
          title: ua.achievement?.title || 'Unknown Achievement',
          description: ua.achievement?.description || '',
          type: ua.achievement?.achievement_type || 'learning',
          tier: ua.achievement?.tier || 'bronze',
          category: ua.achievement?.category || 'general',
          points: ua.achievement?.points_awarded || 0,
          icon: ua.achievement?.icon_url || getTierIcon(ua.achievement?.tier || 'bronze'),
          badgeColor: ua.achievement?.badge_color || getTierColor(ua.achievement?.tier || 'bronze'),
          isUnlocked: ua.progress_percentage > 0,
          isCompleted: ua.is_completed,
          progress: ua.progress_percentage,
          unlockedAt: ua.is_completed ? ua.unlocked_at : undefined,
          nftMinted: ua.nft_minted,
          tags: ua.achievement?.tags || []
        }));
        
        setAchievements(displayData);
      } else {
        // Fallback to demo data
        setAchievements(getDemoAchievements());
      }
    } catch (error) {
      console.error('Failed to load user achievements:', error);
      setAchievements(getDemoAchievements());
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await achievementService.getUserAchievementStats();
      if (response && response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to load achievement stats:', error);
      // Calculate from local data
      const totalAchievements = achievements.length;
      const unlockedCount = achievements.filter(a => a.isUnlocked).length;
      const totalPoints = achievements.filter(a => a.isCompleted).reduce((sum, a) => sum + a.points, 0);
      setStats({
        totalAchievements,
        unlockedCount,
        totalPoints,
        completionRate: totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0
      });
    }
  };

  const handleMintNFT = async (userAchievementId: string) => {
    try {
      await achievementService.mintAchievementNFT(userAchievementId);
      toast.success('NFT minted successfully!');
      loadUserAchievements(); // Refresh data
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      toast.error('Failed to mint NFT');
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return '💎';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      case 'bronze': return '🥉';
      default: return '🏆';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'from-purple-400 to-blue-500';
      case 'gold': return 'from-yellow-400 to-orange-500';
      case 'silver': return 'from-slate-300 to-slate-500';
      case 'bronze': return 'from-orange-300 to-yellow-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getDemoAchievements = (): AchievementDisplayData[] => [
    {
      id: 'first-lesson',
      title: 'First Steps',
      description: 'Complete your first lesson',
      type: 'learning',
      tier: 'bronze',
      category: 'learning',
      points: 10,
      icon: '🎯',
      badgeColor: 'from-orange-300 to-yellow-600',
      isUnlocked: true,
      isCompleted: true,
      progress: 100,
      unlockedAt: new Date().toISOString(),
      nftMinted: false,
      tags: ['beginner', 'milestone']
    },
    {
      id: 'quiz-master',
      title: 'Quiz Master',
      description: 'Score 90% or higher on 5 quizzes',
      type: 'assessment',
      tier: 'silver',
      category: 'assessment',
      points: 50,
      icon: '🧠',
      badgeColor: 'from-slate-300 to-slate-500',
      isUnlocked: true,
      isCompleted: false,
      progress: 60,
      tags: ['quiz', 'excellence']
    },
    {
      id: 'course-complete',
      title: 'Course Champion',
      description: 'Complete an entire course',
      type: 'completion',
      tier: 'gold',
      category: 'completion',
      points: 100,
      icon: '👑',
      badgeColor: 'from-yellow-400 to-orange-500',
      isUnlocked: false,
      isCompleted: false,
      progress: 25,
      tags: ['completion', 'dedication']
    }
  ];

  const filteredAchievements = achievements.filter(achievement => {
    const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory;
    const matchesTier = selectedTier === 'all' || achievement.tier === selectedTier;
    return matchesCategory && matchesTier;
  });

  const categories = ['all', ...Array.from(new Set(achievements.map(a => a.category)))];
  const tiers = ['all', 'bronze', 'silver', 'gold', 'platinum'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Achievements</h1>
        <p className="text-slate-600">Track your learning milestones and earn rewards</p>
          </div>

          {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
              <p className="text-blue-100 text-sm font-medium">Total Unlocked</p>
              <p className="text-3xl font-bold">{stats.unlockedCount}</p>
              <p className="text-blue-100 text-sm">of {stats.totalAchievements}</p>
            </div>
            <TrophyIcon className="w-12 h-12 text-blue-200" />
          </div>
                </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completion Rate</p>
              <p className="text-3xl font-bold">{Math.round(stats.completionRate)}%</p>
              </div>
            <ChartBarIcon className="w-12 h-12 text-green-200" />
              </div>
            </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
              <p className="text-purple-100 text-sm font-medium">Total Points</p>
              <p className="text-3xl font-bold">{stats.totalPoints}</p>
                </div>
            <StarIcon className="w-12 h-12 text-purple-200" />
              </div>
            </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
              <p className="text-orange-100 text-sm font-medium">NFTs Minted</p>
              <p className="text-3xl font-bold">{achievements.filter(a => a.nftMinted).length}</p>
                </div>
            <FireIcon className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Tier</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {tiers.map(tier => (
                <option key={tier} value={tier}>
                  {tier === 'all' ? 'All Tiers' : tier.charAt(0).toUpperCase() + tier.slice(1)}
                </option>
              ))}
            </select>
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
            className={`relative bg-white rounded-xl shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-xl ${
              achievement.isCompleted 
                ? 'border-green-200 hover:border-green-300' 
                : achievement.isUnlocked
                ? 'border-blue-200 hover:border-blue-300'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Header Gradient */}
            <div className={`h-24 bg-gradient-to-r ${achievement.badgeColor} relative`}>
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
              <div className="absolute top-4 right-4">
                {achievement.isCompleted ? (
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                ) : achievement.isUnlocked ? (
                  <ClockIcon className="w-6 h-6 text-white" />
                ) : (
                  <LockClosedIcon className="w-6 h-6 text-white opacity-60" />
                )}
                </div>
                </div>

            {/* Achievement Icon */}
            <div className="absolute top-12 left-6">
              <div className={`w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl ${
                !achievement.isUnlocked ? 'grayscale opacity-50' : ''
              }`}>
                {achievement.icon}
                  </div>
                </div>

            {/* Content */}
            <div className="pt-8 p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-bold ${
                    achievement.isUnlocked ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {achievement.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    achievement.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                    achievement.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                    achievement.tier === 'silver' ? 'bg-slate-100 text-slate-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {achievement.tier}
                  </span>
                </div>
                <p className={`text-sm ${
                  achievement.isUnlocked ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {achievement.description}
                </p>
              </div>

              {/* Progress */}
              {achievement.isUnlocked && !achievement.isCompleted && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Progress</span>
                    <span>{achievement.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${achievement.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Points and Actions */}
                <div className="flex items-center justify-between">
                <div className="flex items-center text-yellow-600">
                  <StarIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">{achievement.points} pts</span>
                  </div>
                
                {achievement.isCompleted && !achievement.nftMinted && (
                  <button
                    onClick={() => handleMintNFT(achievement.id)}
                    className="btn-primary text-xs px-3 py-1"
                  >
                    Mint NFT
                  </button>
                )}
                
                {achievement.nftMinted && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    NFT Minted ✨
                  </span>
                  )}
                </div>

              {/* Unlock Date */}
              {achievement.unlockedAt && (
                <p className="text-xs text-slate-500 mt-2">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
                )}
              </div>
            </div>
          ))}
        </div>

      {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
          <TrophyIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No achievements found</h3>
          <p className="text-slate-600">
            {selectedCategory !== 'all' || selectedTier !== 'all' 
              ? 'Try adjusting your filters'
              : 'Start learning to unlock your first achievements!'
            }
          </p>
          </div>
        )}
    </div>
  );
};

export default AchievementsPage;