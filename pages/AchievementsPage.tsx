import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { 
  TrophyIcon, 
  StarIcon, 
  FireIcon, 
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  LockClosedIcon,
  SparklesIcon,
  ChartBarIcon,
  BoltIcon,
  RocketLaunchIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid,
  FireIcon as FireIconSolid
} from '@heroicons/react/24/solid';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'learning' | 'progress' | 'streak' | 'special' | 'nft';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  requirements: {
    type: string;
    value: number;
    description: string;
  };
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  points: number;
  nftEligible?: boolean;
}

const AchievementsPage: React.FC = () => {
  const { digitalTwin } = useAppContext();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  // Achievement definitions with Steam-like icons from CDN
  const achievementDefinitions: Achievement[] = [
    {
      id: 'first_steps',
      title: 'First Steps',
      description: 'Complete your first learning module',
      category: 'learning',
      difficulty: 'bronze',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3c6.png',
      requirements: { type: 'modules_completed', value: 1, description: 'Complete 1 module' },
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rarity: 'common',
      points: 10
    },
    {
      id: 'learning_streak_3',
      title: 'Learning Streak',
      description: 'Learn for 3 consecutive days',
      category: 'streak',
      difficulty: 'bronze',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png',
      requirements: { type: 'daily_streak', value: 3, description: 'Study 3 days in a row' },
      progress: 0,
      maxProgress: 3,
      unlocked: false,
      rarity: 'common',
      points: 25
    },
    {
      id: 'python_master',
      title: 'Python Master',
      description: 'Complete all Python course modules',
      category: 'learning',
      difficulty: 'gold',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f40d.png',
      requirements: { type: 'course_completed', value: 1, description: 'Complete Python course' },
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rarity: 'rare',
      points: 100,
      nftEligible: true
    },
    {
      id: 'blockchain_pioneer',
      title: 'Blockchain Pioneer',
      description: 'Complete the blockchain fundamentals course',
      category: 'learning',
      difficulty: 'gold',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4b0.png',
      requirements: { type: 'course_completed', value: 1, description: 'Complete Blockchain course' },
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rarity: 'rare',
      points: 150,
      nftEligible: true
    },
    {
      id: 'speedrun_novice',
      title: 'Speed Learner',
      description: 'Complete a module in under 30 minutes',
      category: 'special',
      difficulty: 'silver',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3ce.png',
      requirements: { type: 'module_time', value: 30, description: 'Complete module < 30 min' },
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rarity: 'rare',
      points: 50
    },
    {
      id: 'perfect_score',
      title: 'Perfectionist',
      description: 'Score 100% on 5 different quizzes',
      category: 'progress',
      difficulty: 'gold',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f947.png',
      requirements: { type: 'perfect_scores', value: 5, description: 'Get 100% on 5 quizzes' },
      progress: 0,
      maxProgress: 5,
      unlocked: false,
      rarity: 'epic',
      points: 200
    },
    {
      id: 'nft_collector_bronze',
      title: 'NFT Collector',
      description: 'Mint your first learning NFT',
      category: 'nft',
      difficulty: 'bronze',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3a8.png',
      requirements: { type: 'nfts_minted', value: 1, description: 'Mint 1 NFT' },
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rarity: 'common',
      points: 75
    },
    {
      id: 'nft_collector_silver',
      title: 'NFT Enthusiast',
      description: 'Mint 5 learning NFTs',
      category: 'nft',
      difficulty: 'silver',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f31f.png',
      requirements: { type: 'nfts_minted', value: 5, description: 'Mint 5 NFTs' },
      progress: 0,
      maxProgress: 5,
      unlocked: false,
      rarity: 'rare',
      points: 250
    },
    {
      id: 'knowledge_seeker',
      title: 'Knowledge Seeker',
      description: 'Reach 80% knowledge level in any subject',
      category: 'progress',
      difficulty: 'silver',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9e0.png',
      requirements: { type: 'knowledge_level', value: 80, description: 'Reach 80% knowledge' },
      progress: 0,
      maxProgress: 80,
      unlocked: false,
      rarity: 'rare',
      points: 125
    },
    {
      id: 'legendary_learner',
      title: 'Legendary Learner',
      description: 'Complete 10 modules with perfect scores',
      category: 'learning',
      difficulty: 'platinum',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f451.png',
      requirements: { type: 'perfect_modules', value: 10, description: 'Complete 10 modules perfectly' },
      progress: 0,
      maxProgress: 10,
      unlocked: false,
      rarity: 'legendary',
      points: 500,
      nftEligible: true
    },
    {
      id: 'study_time_warrior',
      title: 'Study Time Warrior',
      description: 'Accumulate 100 hours of study time',
      category: 'progress',
      difficulty: 'gold',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/23f0.png',
      requirements: { type: 'study_time', value: 6000, description: 'Study for 100 hours total' },
      progress: 0,
      maxProgress: 6000,
      unlocked: false,
      rarity: 'epic',
      points: 300
    },
    {
      id: 'digital_twin_master',
      title: 'Digital Twin Master',
      description: 'Reach maximum optimization in your digital twin',
      category: 'special',
      difficulty: 'diamond',
      icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9ff.png',
      requirements: { type: 'twin_optimization', value: 100, description: 'Optimize digital twin 100%' },
      progress: 0,
      maxProgress: 100,
      unlocked: false,
      rarity: 'mythic',
      points: 1000,
      nftEligible: true
    }
  ];

  useEffect(() => {
    // Calculate achievement progress based on digital twin data
    const updatedAchievements = achievementDefinitions.map(achievement => {
      let progress = 0;
      let unlocked = false;

      switch (achievement.requirements.type) {
        case 'modules_completed':
          progress = Object.keys(digitalTwin.knowledge).length;
          break;
        case 'perfect_scores':
          progress = digitalTwin.checkpoints?.filter(c => c.score === 100).length || 0;
          break;
        case 'study_time':
          progress = digitalTwin.behavior.studyTime || 0;
          break;
        case 'knowledge_level':
          const maxKnowledge = Math.max(...Object.values(digitalTwin.knowledge), 0);
          progress = Math.round(maxKnowledge * 100);
          break;
        case 'nfts_minted':
          progress = digitalTwin.nfts?.length || 0;
          break;
        default:
          progress = 0;
      }

      unlocked = progress >= achievement.maxProgress;

      return {
        ...achievement,
        progress: Math.min(progress, achievement.maxProgress),
        unlocked,
        unlockedAt: unlocked ? new Date().toISOString() : undefined
      };
    });

    setAchievements(updatedAchievements);
  }, [digitalTwin]);

  const categories = [
    { id: 'all', name: 'All Achievements', icon: TrophyIcon },
    { id: 'learning', name: 'Learning', icon: AcademicCapIcon },
    { id: 'progress', name: 'Progress', icon: ChartBarIcon },
    { id: 'streak', name: 'Streaks', icon: FireIcon },
    { id: 'nft', name: 'NFT Collection', icon: SparklesIcon },
    { id: 'special', name: 'Special', icon: StarIcon }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return 'from-amber-600 to-yellow-600';
      case 'silver': return 'from-slate-400 to-gray-500';
      case 'gold': return 'from-yellow-400 to-amber-500';
      case 'platinum': return 'from-cyan-400 to-blue-500';
      case 'diamond': return 'from-purple-400 to-indigo-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-400';
      case 'epic': return 'border-purple-500';
      case 'legendary': return 'border-orange-500';
      case 'mythic': return 'border-pink-500';
      default: return 'border-gray-300';
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    const unlockedMatch = !showUnlockedOnly || achievement.unlocked;
    return categoryMatch && unlockedMatch;
  });

  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <TrophyIconSolid className="h-10 w-10 text-yellow-500 mr-3" />
                Achievements
              </h1>
              <p className="text-gray-600 mt-2">Track your learning progress and unlock special rewards</p>
            </div>
            <Link 
              to="/dashboard"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Achievements Unlocked</p>
                  <p className="text-3xl font-bold">{unlockedAchievements}/{totalAchievements}</p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-emerald-200" />
              </div>
              <div className="mt-4 bg-emerald-600 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(unlockedAchievements / totalAchievements) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Achievement Points</p>
                  <p className="text-3xl font-bold">{totalPoints.toLocaleString()}</p>
                </div>
                <StarIconSolid className="h-12 w-12 text-yellow-200" />
              </div>
              <p className="text-yellow-100 text-sm mt-2">Earn points by unlocking achievements</p>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">NFT Eligible</p>
                  <p className="text-3xl font-bold">
                    {achievements.filter(a => a.nftEligible && a.unlocked).length}
                  </p>
                </div>
                <GiftIcon className="h-12 w-12 text-purple-200" />
              </div>
              <p className="text-purple-100 text-sm mt-2">Special achievements earn NFTs</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="font-medium">{category.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="unlocked-only"
                checked={showUnlockedOnly}
                onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="unlocked-only" className="text-gray-700 font-medium">
                Show unlocked only
              </label>
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map(achievement => (
            <div
              key={achievement.id}
              className={`achievement-badge-container relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                achievement.unlocked ? `border-2 ${getRarityBorder(achievement.rarity)}` : 'border border-gray-200'
              } ${!achievement.unlocked ? 'opacity-75' : ''}`}
            >
              {achievement.unlocked && (
                <div className="absolute top-4 right-4 z-10">
                  <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
                </div>
              )}

              {!achievement.unlocked && (
                <div className="absolute inset-0 bg-gray-500 bg-opacity-20 z-10 flex items-center justify-center">
                  <LockClosedIcon className="h-8 w-8 text-gray-500" />
                </div>
              )}

              <div className={`p-6 bg-gradient-to-r ${getDifficultyColor(achievement.difficulty)}`}>
                <div className="flex items-center space-x-4">
                  <div className="achievement-badge w-16 h-16 rounded-full bg-white p-2 shadow-lg">
                    <img 
                      src={achievement.icon} 
                      alt={achievement.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + achievement.title.charAt(0) + '&background=6366f1&color=fff&size=64';
                      }}
                    />
                  </div>
                  <div className="flex-1 text-white">
                    <h3 className="text-xl font-bold">{achievement.title}</h3>
                    <p className="text-sm opacity-90 capitalize">{achievement.rarity} • {achievement.difficulty}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-4">{achievement.description}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.maxProgress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="progress-bar h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{achievement.requirements.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StarIcon className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">{achievement.points} points</span>
                  </div>
                  {achievement.nftEligible && (
                    <div className="flex items-center space-x-1 text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      <SparklesIcon className="h-3 w-3" />
                      <span>NFT Eligible</span>
                    </div>
                  )}
                </div>

                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3" />
                      <span>Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No achievements found</h3>
            <p className="text-gray-500">Try adjusting your filters or start learning to unlock achievements!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPage;