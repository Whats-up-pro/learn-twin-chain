/**
 * Achievements Page - NFT Certificates and Learning Milestones
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Achievements() {
  const { isAuthenticated, hasConnectedWallet, user, primaryWallet } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && hasConnectedWallet) {
      loadAchievements();
    }
  }, [isAuthenticated, hasConnectedWallet]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      // This would fetch NFT achievements from the backend
      // For now, we'll show placeholder data
      const mockAchievements = [
        {
          id: '1',
          title: 'Python Programming Mastery',
          description: 'Completed advanced Python programming course',
          type: 'course_completion',
          date: '2024-01-15',
          nft_token_id: '0x123...',
          verified: true,
          image: '/api/placeholder/200/200'
        },
        {
          id: '2',
          title: 'Blockchain Fundamentals',
          description: 'Mastered blockchain technology concepts',
          type: 'skill_verification',
          date: '2024-01-20',
          nft_token_id: '0x456...',
          verified: true,
          image: '/api/placeholder/200/200'
        }
      ];
      
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-[#005acd] mb-4">
          Sign in to view your achievements
        </h2>
        <p className="text-[#0093cb]">
          Track your learning progress and blockchain-verified certificates
        </p>
      </div>
    );
  }

  if (!hasConnectedWallet) {
    return (
      <div className="text-center py-12">
        <div className="mb-8">
          <svg className="mx-auto h-12 w-12 text-[#0093cb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#005acd] mb-4">
          Connect your wallet to view achievements
        </h2>
        <p className="text-[#0093cb] mb-6">
          Your NFT certificates and blockchain-verified achievements are stored in your wallet
        </p>
        <button className="bg-[#005acd] hover:bg-[#0093cb] text-white px-6 py-3 rounded-lg">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#005acd] mb-2">
              Your Achievements 🏆
            </h1>
            <p className="text-[#0093cb]">
              Blockchain-verified certificates and learning milestones
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#0093cb]">Connected Wallet</div>
            <div className="font-mono text-sm">
              {primaryWallet ? primaryWallet.address.slice(0, 6) + '...' + primaryWallet.address.slice(-4) : 'No wallet'}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[#bef0ff] rounded-lg flex items-center justify-center">
                <span className="text-[#005acd]">🎓</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[#0093cb]">Total NFTs</p>
              <p className="text-2xl font-semibold text-[#005acd]">{achievements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[#bef0ff] rounded-lg flex items-center justify-center">
                <span className="text-[#005acd]">✅</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[#0093cb]">Verified</p>
              <p className="text-2xl font-semibold text-[#005acd]">
                {achievements.filter(a => a.verified).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[#6dd7fd] rounded-lg flex items-center justify-center">
                <span className="text-[#005acd]">📚</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[#0093cb]">Courses</p>
              <p className="text-2xl font-semibold text-[#005acd]">
                {achievements.filter(a => a.type === 'course_completion').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[#f5ffff] rounded-lg flex items-center justify-center">
                <span className="text-[#005acd]">🛠️</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[#0093cb]">Skills</p>
              <p className="text-2xl font-semibold text-[#005acd]">
                {achievements.filter(a => a.type === 'skill_verification').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[#005acd] mb-6">
          Recent Achievements
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-[#bef0ff] h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-[#bef0ff] rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-[#bef0ff] rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-[#0093cb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-[#005acd] mb-2">
              No achievements yet
            </h3>
            <p className="text-[#0093cb] mb-6">
              Start learning and completing courses to earn your first NFT certificate!
            </p>
            <button className="bg-[#005acd] hover:bg-[#0093cb] text-white px-6 py-3 rounded-lg">
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AchievementCard({ achievement }) {
  const getTypeIcon = (type) => {
    const icons = {
      'course_completion': '🎓',
      'skill_verification': '🛠️',
      'module_completion': '📚'
    };
    return icons[type] || '🏆';
  };

  const getTypeColor = (type) => {
    const colors = {
      'course_completion': 'bg-[#bef0ff] text-[#005acd]',
      'skill_verification': 'bg-[#6dd7fd] text-[#005acd]',
      'module_completion': 'bg-[#0093cb] text-white'
    };
    return colors[type] || 'bg-[#f5ffff] text-[#005acd]';
  };

  return (
    <div className="bg-gradient-to-br from-[#f5ffff] to-[#bef0ff] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gradient-to-br from-[#005acd] to-[#0093cb] flex items-center justify-center">
        <div className="text-white text-6xl">
          {getTypeIcon(achievement.type)}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(achievement.type)}`}>
            {achievement.type.replace('_', ' ').toUpperCase()}
          </span>
          {achievement.verified && (
            <span className="text-[#005acd]" title="Blockchain Verified">
              🔗
            </span>
          )}
        </div>
        
        <h3 className="font-semibold text-[#005acd] mb-2">
          {achievement.title}
        </h3>
        
        <p className="text-sm text-[#0093cb] mb-3">
          {achievement.description}
        </p>
        
        <div className="text-xs text-[#0093cb] mb-3">
          Earned on {new Date(achievement.date).toLocaleDateString()}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-[#0093cb]">
            Token: {achievement.nft_token_id?.slice(0, 8)}...
          </span>
          <button className="text-[#005acd] hover:text-[#0093cb] text-sm font-medium">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}