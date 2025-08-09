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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Sign in to view your achievements
        </h2>
        <p className="text-gray-600">
          Track your learning progress and blockchain-verified certificates
        </p>
      </div>
    );
  }

  if (!hasConnectedWallet) {
    return (
      <div className="text-center py-12">
        <div className="mb-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Connect your wallet to view achievements
        </h2>
        <p className="text-gray-600 mb-6">
          Your NFT certificates and blockchain-verified achievements are stored in your wallet
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your Achievements 🏆
            </h1>
            <p className="text-gray-600">
              Blockchain-verified certificates and learning milestones
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Connected Wallet</div>
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
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">🎓</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total NFTs</p>
              <p className="text-2xl font-semibold text-gray-900">{achievements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">✅</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Verified</p>
              <p className="text-2xl font-semibold text-gray-900">
                {achievements.filter(a => a.verified).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600">📚</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Courses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {achievements.filter(a => a.type === 'course_completion').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600">🛠️</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Skills</p>
              <p className="text-2xl font-semibold text-gray-900">
                {achievements.filter(a => a.type === 'skill_verification').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Your NFT Certificates
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No achievements yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start learning and completing courses to earn your first NFT certificate!
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
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
      'course_completion': 'bg-blue-100 text-blue-800',
      'skill_verification': 'bg-green-100 text-green-800',
      'module_completion': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
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
            <span className="text-green-500" title="Blockchain Verified">
              ✅
            </span>
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2">
          {achievement.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3">
          {achievement.description}
        </p>
        
        <div className="text-xs text-gray-500 mb-3">
          Earned on {new Date(achievement.date).toLocaleDateString()}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-gray-400">
            Token: {achievement.nft_token_id?.slice(0, 8)}...
          </span>
          <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}