import React, { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { User, Nft, Achievement } from '../types';
import { DigitalTwin } from '../../types';
import NftCard from '../components/NftCard';
import { simulateFetchTwinByDid as getUserProfile } from '../../services/digitalTwinService';

const ProfilePage: React.FC = () => {
  const { user } = useAppContext();
  const [profile, setProfile] = useState<User | null>(null);
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (!user) return;

        // Fetch user profile
        const mockTwin: DigitalTwin = {
          learnerDid: user.did,
          knowledge: {},
          skills: { problemSolving: 0, logicalThinking: 0, selfLearning: 0 },
          behavior: { timeSpent: "0h", quizAccuracy: 0 },
          checkpoints: [],
          version: 1,
          lastUpdated: new Date().toISOString()
        };
        await getUserProfile(user.did, mockTwin);

        // Fetch NFTs (this would typically come from an NFT service)
        const mockNfts: Nft[] = [
          {
            id: 'nft-1',
            title: 'Blockchain Explorer',
            description: 'Completed Blockchain Basics module',
            imageUrl: '/images/nft-1.png',
            tokenId: '1',
            earnedAt: new Date().toISOString(),
            userId: user.did
          },
          {
            id: 'nft-2',
            title: 'Smart Contract Developer',
            description: 'Completed Smart Contracts module',
            imageUrl: '/images/nft-2.png',
            tokenId: '2',
            earnedAt: new Date().toISOString(),
            userId: user.did
          },
        ];
        setNfts(mockNfts);

        // Fetch achievements (this would typically come from an achievement service)
        const mockAchievements: Achievement[] = [
          {
            id: 'achievement-1',
            title: 'First Steps',
            description: 'Complete your first module',
            criteria: 'Complete any module',
            icon: '🎯',
            unlockedAt: new Date().toISOString(),
          },
          {
            id: 'achievement-2',
            title: 'Quick Learner',
            description: 'Complete 3 modules in one week',
            criteria: 'Complete 3 modules within 7 days',
            icon: '⚡',
          },
        ];
        setAchievements(mockAchievements);

        setProfile({
          id: user.did,
          username: user.name,
          email: user.did,
          role: 'student',
          avatar: user.avatarUrl
        });

        setError(null);
      } catch (err) {
        setError('Failed to load profile data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
        Profile not found
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.username}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-2xl text-gray-500">
                {profile.username[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
            <p className="text-gray-600">{profile.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {profile.role}
            </span>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border ${
                achievement.unlockedAt
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {achievement.description}
                  </p>
                  {achievement.unlockedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NFTs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your NFTs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <NftCard key={nft.id} nft={nft} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
