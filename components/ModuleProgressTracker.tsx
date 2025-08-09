import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { 
  TrophyIcon, 
  SparklesIcon, 
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  StarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface ModuleProgressTrackerProps {
  courseId: string;
  completedModules: string[];
  onMilestoneReached: (milestone: string, nftType: 'module_progress' | 'learning_achievement') => void;
}

const ModuleProgressTracker: React.FC<ModuleProgressTrackerProps> = ({
  courseId,
  completedModules,
  onMilestoneReached
}) => {
  const { digitalTwin, updateBehavior } = useAppContext();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Define milestones for different courses
  const courseMilestones = {
    'python_basics_001': [
      {
        id: 'python_first_module',
        title: 'Python Explorer',
        description: 'Complete your first Python module',
        requirement: 1,
        type: 'module_progress' as const,
        icon: '🐍',
        rarity: 'bronze'
      },
      {
        id: 'python_halfway',
        title: 'Python Apprentice',
        description: 'Complete 2 Python modules',
        requirement: 2,
        type: 'module_progress' as const,
        icon: '🔥',
        rarity: 'silver'
      },
      {
        id: 'python_master',
        title: 'Python Master',
        description: 'Complete all Python modules',
        requirement: 3,
        type: 'learning_achievement' as const,
        icon: '🏆',
        rarity: 'gold'
      }
    ],
    'blockchain_fundamentals_001': [
      {
        id: 'blockchain_first_module',
        title: 'Blockchain Explorer',
        description: 'Complete your first blockchain module',
        requirement: 1,
        type: 'module_progress' as const,
        icon: '⛓️',
        rarity: 'bronze'
      },
      {
        id: 'blockchain_developer',
        title: 'Smart Contract Developer',
        description: 'Complete 2 blockchain modules',
        requirement: 2,
        type: 'module_progress' as const,
        icon: '💎',
        rarity: 'silver'
      },
      {
        id: 'blockchain_master',
        title: 'Web3 Pioneer',
        description: 'Complete all blockchain modules',
        requirement: 3,
        type: 'learning_achievement' as const,
        icon: '🚀',
        rarity: 'gold'
      }
    ]
  };

  useEffect(() => {
    const currentMilestones = courseMilestones[courseId] || [];
    setMilestones(currentMilestones);
  }, [courseId]);

  useEffect(() => {
    // Check for milestone completion
    const completedCount = completedModules.length;
    
    milestones.forEach(milestone => {
      if (completedCount >= milestone.requirement) {
        const alreadyUnlocked = digitalTwin.achievements?.includes(milestone.id);
        
        if (!alreadyUnlocked) {
          // Milestone reached!
          setShowCelebration(true);
          
          // Show success toast
          toast.success(
            `🎉 Achievement Unlocked: ${milestone.title}!`,
            {
              duration: 4000,
              style: {
                background: '#10b981',
                color: 'white',
                fontWeight: 'bold'
              }
            }
          );
          
          // Trigger NFT minting
          onMilestoneReached(milestone.id, milestone.type);
          
          // Update behavior to track achievement
          updateBehavior({
            achievements: [...(digitalTwin.achievements || []), milestone.id],
            lastAchievementDate: new Date().toISOString()
          });
          
          // Hide celebration after 3 seconds
          setTimeout(() => setShowCelebration(false), 3000);
        }
      }
    });
  }, [completedModules, milestones, digitalTwin.achievements]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'bronze': return 'from-amber-600 to-yellow-600';
      case 'silver': return 'from-slate-400 to-gray-500';
      case 'gold': return 'from-yellow-400 to-amber-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getProgressPercentage = (milestone: any) => {
    const progress = Math.min(completedModules.length, milestone.requirement);
    return (progress / milestone.requirement) * 100;
  };

  const isUnlocked = (milestone: any) => {
    return completedModules.length >= milestone.requirement;
  };

  if (milestones.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl transform animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">Achievement Unlocked!</div>
            <div className="text-gray-600">Your NFT is being minted...</div>
            <div className="mt-4">
              <div className="w-16 h-16 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <TrophyIconSolid className="h-6 w-6 text-yellow-500 mr-2" />
            Course Milestones
          </h3>
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {completedModules.length} modules completed
          </div>
        </div>

        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const progress = getProgressPercentage(milestone);
            const unlocked = isUnlocked(milestone);
            
            return (
              <div
                key={milestone.id}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                  unlocked 
                    ? 'border-emerald-300 bg-emerald-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Milestone Icon */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-gradient-to-r ${getRarityColor(milestone.rarity)} text-white shadow-lg ${unlocked ? 'animate-pulse' : ''}`}>
                    {milestone.icon}
                  </div>

                  {/* Milestone Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-gray-900">{milestone.title}</h4>
                      {unlocked && (
                        <div className="flex items-center space-x-1 text-emerald-600">
                          <CheckCircleIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Unlocked</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{milestone.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress</span>
                        <span>{Math.min(completedModules.length, milestone.requirement)}/{milestone.requirement}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            unlocked 
                              ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                              : 'bg-gradient-to-r from-blue-400 to-blue-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestone Type Badge */}
                    <div className="mt-3 flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        milestone.type === 'learning_achievement'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {milestone.type === 'learning_achievement' ? '🏆 Achievement NFT' : '📊 Progress NFT'}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        milestone.rarity === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                        milestone.rarity === 'silver' ? 'bg-gray-100 text-gray-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {milestone.rarity}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unlock Effect */}
                {unlocked && (
                  <div className="absolute top-2 right-2">
                    <SparklesIcon className="h-6 w-6 text-yellow-500 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Next Milestone Preview */}
        {completedModules.length < milestones[milestones.length - 1]?.requirement && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2 text-blue-700">
              <StarIcon className="h-5 w-5" />
              <span className="font-semibold">Next Milestone</span>
            </div>
            <p className="text-blue-600 text-sm mt-1">
              Complete {milestones.find(m => completedModules.length < m.requirement)?.requirement} modules to unlock your next achievement!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleProgressTracker;