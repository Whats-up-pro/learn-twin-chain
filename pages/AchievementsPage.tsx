import React, { useEffect, useState } from 'react';
import { achievementService, ApiUserAchievement } from '../services/achievementService';
import { 
  TrophyIcon, 
  StarIcon, 
  CheckCircleIcon,
  LockClosedIcon,
  FireIcon, 
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useTranslation } from '../src/hooks/useTranslation';

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
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<AchievementDisplayData[]>([]);
  const [, setUserAchievements] = useState<ApiUserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [stats, setStats] = useState({
    totalAchievements: 0,
    unlockedCount: 0,
    totalPoints: 0,
    completionRate: 0
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [allRes, userRes, statsRes] = await Promise.allSettled([
        achievementService.getAllAchievements({ limit: 100 }),
        achievementService.getUserAchievements({ include_progress: true, limit: 100 }),
        achievementService.getUserAchievementStats()
      ]);

      const allAchievements = (allRes.status === 'fulfilled' && (allRes.value as any)?.achievements)
        ? (allRes.value as any).achievements
        : [];

      const userAchievements = (userRes.status === 'fulfilled' && (userRes.value as any)?.user_achievements)
        ? (userRes.value as any).user_achievements as ApiUserAchievement[]
        : [];

      if (statsRes.status === 'fulfilled' && (statsRes.value as any)?.stats) {
        setStats((statsRes.value as any).stats);
      }

      // Build a map of user's earned achievements by achievement_id for fast lookup
      const earnedById = new Map<string, ApiUserAchievement>();
      userAchievements.forEach((ua) => earnedById.set(ua.achievement_id, ua));

      // Merge: show all available achievements, marking unlocked ones based on user data
      const merged: AchievementDisplayData[] = allAchievements.map((a: any) => {
        const ua = earnedById.get(a.achievement_id);
        const isUnlocked = Boolean(ua);
        return {
          id: a.achievement_id,
          title: a.title || t('pages.achievementsPage.UnknownAchievement'),
          description: a.description || '',
          type: a.achievement_type || 'learning',
          tier: a.tier || 'bronze',
          category: a.category || 'general',
          points: (a.points_awarded ?? (a as any).points_reward) || 0,
          icon: a.icon_url || getTierIcon(a.tier || 'bronze'),
          badgeColor: a.badge_color || getTierColor(a.tier || 'bronze'),
          isUnlocked,
          isCompleted: isUnlocked ? true : false,
          progress: isUnlocked ? 100 : 0,
          unlockedAt: ua?.unlocked_at,
          nftMinted: ua?.nft_minted,
          tags: a.tags || []
        };
      });

      // If backend has user achievements not found in current catalog (edge case), append them
      const knownIds = new Set(merged.map(m => m.id));
      userAchievements.forEach((ua) => {
        if (!knownIds.has(ua.achievement_id)) {
          merged.push({
            id: ua.achievement_id,
            title: ua.achievement?.title || t('pages.achievementsPage.UnknownAchievement'),
            description: ua.achievement?.description || '',
            type: ua.achievement?.achievement_type || 'learning',
            tier: ua.achievement?.tier || 'bronze',
            category: ua.achievement?.category || 'general',
            points: (ua.achievement?.points_awarded ?? (ua.achievement as any)?.points_reward) || 0,
            icon: ua.achievement?.icon_url || getTierIcon(ua.achievement?.tier || 'bronze'),
            badgeColor: ua.achievement?.badge_color || getTierColor(ua.achievement?.tier || 'bronze'),
            isUnlocked: true,
            isCompleted: true,
            progress: 100,
            unlockedAt: ua.unlocked_at,
            nftMinted: ua.nft_minted,
            tags: ua.achievement?.tags || []
          });
        }
      });

      setAchievements(merged);
    } catch (e) {
      console.error('Failed to load achievements:', e);
      // fallback placeholders
      setAchievements(getPlaceholderAchievements());
    } finally {
      setLoading(false);
    }
  };

  // Legacy loaders retained for reference but unused after loadAll()
  const loadAchievements = async () => {
    try {
      const response = await achievementService.getAllAchievements({
        limit: 100
      });
      
      if (response && typeof response === 'object' && response !== null && 'achievements' in response) {
        const allAchievements = (response as any).achievements;
        
        // If no user achievements, show all available achievements as unearned
        if (achievements.length === 0 && allAchievements && Array.isArray(allAchievements)) {
          const displayData: AchievementDisplayData[] = allAchievements.map((achievement: any) => ({
            id: achievement.achievement_id,
            title: achievement.title || t('pages.achievementsPage.UnknownAchievement'),
            description: achievement.description || '',
            type: achievement.achievement_type || t('pages.achievementsPage.learning'),
            tier: achievement.tier || t('pages.achievementsPage.bronze'),
            category: achievement.category || t('pages.achievementsPage.general'),
            points: (achievement.points_awarded ?? (achievement as any).points_reward) || 0,
            icon: getTierIcon(achievement.tier || t('pages.achievementsPage.bronze')),
            badgeColor: getTierColor(achievement.tier || t('pages.achievementsPage.bronze')),
            isUnlocked: false, // Not earned yet
            isCompleted: false,
            progress: 0,
            nftMinted: false,
            tags: achievement.tags || []
          }));
          
          // If no user achievements loaded yet, show available achievements
          setTimeout(() => {
            if (achievements.length === 0) {
              setAchievements(displayData);
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error(`${t('pages.achievementsPage.FailedToLoadAchievements')}:`, error);
    }
  };

  const loadUserAchievements = async () => {
    try {
      const response = await achievementService.getUserAchievements({
        include_progress: true,
        limit: 100
      });
      
      console.log('Achievements page - API response:', response);
      
      if (response && typeof response === 'object' && response !== null && 'user_achievements' in response) {
        const userAchievements = (response as any).user_achievements as ApiUserAchievement[];
        console.log('User achievements found:', userAchievements.length);
        setUserAchievements(userAchievements);
        
        if (userAchievements.length > 0) {
          // Convert to display format
          const displayData: AchievementDisplayData[] = userAchievements.map((ua: ApiUserAchievement) => ({
            id: ua.achievement_id,
            title: ua.achievement?.title || t('pages.achievementsPage.UnknownAchievement'),
            description: ua.achievement?.description || '',
            type: ua.achievement?.achievement_type || 'learning',
            tier: ua.achievement?.tier || 'bronze',
            category: ua.achievement?.category || 'general',
            points: (ua.achievement?.points_awarded ?? (ua.achievement as any)?.points_reward) || 0,
            icon: ua.achievement?.icon_url || getTierIcon(ua.achievement?.tier || 'bronze'),
            badgeColor: ua.achievement?.badge_color || getTierColor(ua.achievement?.tier || 'bronze'),
            isUnlocked: true, // If user has this achievement, it's unlocked
            isCompleted: ua.is_completed || true, // All earned achievements are completed
            progress: 100, // All earned achievements are 100% complete
            unlockedAt: ua.unlocked_at,
            nftMinted: ua.nft_minted,
            tags: ua.achievement?.tags || []
          }));
          
          console.log('Display data created:', displayData.length);
          setAchievements(displayData);
        } else {
          // No user achievements, show placeholder
          console.log('No user achievements, showing placeholders');
          setAchievements(getPlaceholderAchievements());
        }
      } else {
        // Show placeholder achievements when no user achievements
        console.log('No user_achievements in response, showing placeholders');
        setAchievements(getPlaceholderAchievements());
      }
    } catch (error) {
      console.error(`${t('pages.achievementsPage.FailedToLoadUserAchievements')}:`, error);
      // Show placeholder achievements on error
      setAchievements(getPlaceholderAchievements());
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await achievementService.getUserAchievementStats();
      if (response && typeof response === 'object' && response !== null && 'stats' in response) {
        setStats((response as any).stats);
      }
    } catch (error) {
      console.error(`${t('pages.achievementsPage.FailedToLoadAchievementsStats')}:`, error);
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
      toast.success(`${t('pages.achievementsPage.NFTMintedSuccessfully')}`);
      loadUserAchievements(); // Refresh data
    } catch (error) {
      console.error(`${t('pages.achievementsPage.FailedToMintNFT')}:`, error);
      toast.error(`${t('pages.achievementsPage.FailedToMintNFT')}`);
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

  const getPlaceholderAchievements = (): AchievementDisplayData[] => [
    {
      id: 'course_completion_placeholder',
      title: 'Course Completion Master',
      description: 'Complete your first course to unlock achievements',
      type: 'course_completion',
      tier: 'bronze',
      category: 'learning',
      points: 10,
      icon: '🎓',
      badgeColor: 'from-orange-300 to-yellow-600',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      nftMinted: false,
      tags: ['course', 'milestone']
    },
    {
      id: 'data_type_master_placeholder',
      title: 'Data Type Master',
      description: 'Demonstrated proficiency in using different data types and operators.',
      type: 'course_completion',
      tier: 'bronze',
      category: 'learning',
      points: 10,
      icon: '💎',
      badgeColor: 'from-orange-300 to-yellow-600',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      nftMinted: false,
      tags: ['programming', 'fundamentals']
    },
    {
      id: 'quiz_master_placeholder',
      title: 'Quiz Master',
      description: 'Score 90% or higher on course quizzes',
      type: 'quiz_mastery',
      tier: 'silver',
      category: 'assessment',
      points: 25,
      icon: '🧠',
      badgeColor: 'from-slate-300 to-slate-500',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      nftMinted: false,
      tags: ['quiz', 'excellence']
    },
    {
      id: 'speed_learner_placeholder',
      title: 'Speed Learner',
      description: 'Complete lessons quickly and efficiently',
      type: 'speed',
      tier: 'silver',
      category: 'performance',
      points: 30,
      icon: '⚡',
      badgeColor: 'from-slate-300 to-slate-500',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      nftMinted: false,
      tags: ['speed', 'efficiency']
    },
    {
      id: 'perfectionist_placeholder',
      title: 'Perfectionist',
      description: 'Achieve perfect scores on multiple assessments',
      type: 'perfectionist',
      tier: 'gold',
      category: 'excellence',
      points: 50,
      icon: '⭐',
      badgeColor: 'from-yellow-400 to-orange-500',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      nftMinted: false,
      tags: ['perfection', 'mastery']
    },
    {
      id: 'dedication_placeholder',
      title: 'Dedicated Learner',
      description: 'Maintain a consistent learning streak',
      type: 'dedication',
      tier: 'gold',
      category: 'consistency',
      points: 40,
      icon: '🔥',
      badgeColor: 'from-yellow-400 to-orange-500',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      nftMinted: false,
      tags: ['dedication', 'consistency']
    },
    {
      id: 'explorer_placeholder',
      title: 'Course Explorer',
      description: 'Explore and enroll in multiple courses',
      type: 'explorer',
      tier: 'platinum',
      category: 'exploration',
      points: 75,
      icon: '🔍',
      badgeColor: 'from-purple-400 to-blue-500',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      nftMinted: false,
      tags: ['exploration', 'curiosity']
    },
    {
      id: 'module_master_placeholder',
      title: 'Module Master',
      description: 'Complete all modules in a course',
      type: 'module_completion',
      tier: 'platinum',
      category: 'completion',
      points: 100,
      icon: '📚',
      badgeColor: 'from-purple-400 to-blue-500',
      isUnlocked: false,
      isCompleted: false,
      progress: 0,
      nftMinted: false,
      tags: ['modules', 'completion']
    }
  ];

  const filteredAchievements = achievements.filter(achievement => {
    const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory;
    const matchesTier = selectedTier === 'all' || achievement.tier === selectedTier;
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'unlocked' && achievement.isUnlocked) ||
                      (selectedTab === 'locked' && !achievement.isUnlocked);
    return matchesCategory && matchesTier && matchesTab;
  });

  const categories = ['all', ...Array.from(new Set(achievements.map(a => a.category)))];
  const tiers = ['all', t('pages.achievementsPage.bronze'), t('pages.achievementsPage.Silver'), t('pages.achievementsPage.Gold'), t('pages.achievementsPage.Platinum')];

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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('pages.achievementsPage.Achievements')}</h1>
        <p className="text-slate-600">{t('pages.achievementsPage.TrackYourLearningMileStones')}</p>
          </div>

          {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
              <p className="text-blue-100 text-sm font-medium">{t('pages.achievementsPage.TotalUnlocked')}</p>
              <p className="text-3xl font-bold">{stats.unlockedCount}</p>
              <p className="text-blue-100 text-sm">of {stats.totalAchievements}</p>
            </div>
            <TrophyIcon className="w-12 h-12 text-blue-200" />
          </div>
                </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">{t('pages.achievementsPage.CompletionRate')}</p>
              <p className="text-3xl font-bold">{Math.round(stats.completionRate)}%</p>
              </div>
            <ChartBarIcon className="w-12 h-12 text-green-200" />
              </div>
            </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
              <p className="text-purple-100 text-sm font-medium">{t('pages.achievementsPage.TotalPoints')}</p>
              <p className="text-3xl font-bold">{stats.totalPoints}</p>
                </div>
            <StarIcon className="w-12 h-12 text-purple-200" />
              </div>
            </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
              <p className="text-orange-100 text-sm font-medium">{t('pages.achievementsPage.NFTsMinted')}</p>
              <p className="text-3xl font-bold">{achievements.filter(a => a.nftMinted).length}</p>
                </div>
            <FireIcon className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-center space-x-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'unlocked', 'locked'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedTab === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {tab === 'all' ? t('pages.achievementsPage.AllAchievements') : tab === 'unlocked' ? t('pages.achievementsPage.MyAchievements') : t('pages.achievementsPage.Locked')}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('pages.achievementsPage.Category')}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? t('pages.achievementsPage.AllCategories') : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('pages.achievementsPage.Tier')}</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {tiers.map(tier => (
                <option key={tier} value={tier}>
                  {tier === 'all' ? t('pages.achievementsPage.AllTiers') : tier.charAt(0).toUpperCase() + tier.slice(1)}
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
                : 'border-slate-200 hover:border-slate-300 opacity-60'
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
                !achievement.isUnlocked ? 'grayscale opacity-40' : ''
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
                    <span>{t('pages.achievementsPage.Progress')}</span>
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
                  <span className="text-sm font-medium">{achievement.points} {t('pages.achievementsPage.Points')}</span>
                  </div>
                
                {achievement.isCompleted && !achievement.nftMinted && (
                  <button
                    onClick={() => handleMintNFT(achievement.id)}
                    className="btn-primary text-xs px-3 py-1"
                  >
                    {t('pages.achievementsPage.MintNFT')}
                  </button>
                )}
                
                {achievement.nftMinted && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {t('pages.achievementsPage.NFTMinted')} ✨
                  </span>
                  )}
                </div>

              {/* Unlock Date */}
              {achievement.unlockedAt && (
                <p className="text-xs text-slate-500 mt-2">
                  {t('pages.achievementsPage.Unlocked', {date: new Date(achievement.unlockedAt).toLocaleDateString()})}
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
          <h3 className="text-lg font-medium text-slate-900 mb-2">{t('pages.achievementsPage.noAchievementsFound')}</h3>
          <p className="text-slate-600">
            {selectedCategory !== 'all' || selectedTier !== 'all' 
              ? t('pages.achievementsPage.tryAdjustingYourFiltersToSeeMoreAchievements')
              : t('pages.achievementsPage.startLearningToUnlockTheseAmazingAchievements')
            }
          </p>
          </div>
        )}
    </div>
  );
};

export default AchievementsPage;