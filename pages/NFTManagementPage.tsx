import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { 
  SparklesIcon, 
  CubeIcon, 
  GiftIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  AcademicCapIcon,
  TrophyIcon,
  FireIcon,
  RocketLaunchIcon,
  TagIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { 
  SparklesIcon as SparklesIconSolid,
  CubeIcon as CubeIconSolid
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { useTranslation } from '../src/hooks/useTranslation';

interface NFT {
  id: string;
  name: string;
  description: string;
  type: 'module_progress' | 'learning_achievement';
  status: 'minting' | 'minted' | 'failed';
  imageUrl: string;
  attributes: {
    course: string;
    module?: string;
    score?: number;
    completionDate: string;
    difficulty: string;
    rarity: string;
  };
  tokenId?: string;
  transactionHash?: string;
  mintedAt?: string;
  blockchainAddress?: string;
  metadata?: any;
}

const NFTManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { digitalTwin } = useAppContext();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'minting' | 'minted' | 'achievements'>('all');
  const [loading, setLoading] = useState(true);

  // Mock NFT data - replace with actual blockchain data
  const mockNFTs: NFT[] = [
    {
      id: 'mp_001',
      name: 'Python Variables Master',
      description: 'Successfully completed Python Variables module with excellent score',
      type: 'module_progress',
      status: 'minted',
      imageUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=400&fit=crop',
      attributes: {
        course: 'Python Programming Fundamentals',
        module: 'Variables and Data Types',
        score: 95,
        completionDate: '2024-12-19T10:30:00Z',
        difficulty: 'Beginner',
        rarity: 'Common'
      },
      tokenId: '12345',
      transactionHash: '0x1234567890abcdef...',
      mintedAt: '2024-12-19T10:35:00Z',
      blockchainAddress: '0x742d35cc6bf...8c4c'
    },
    {
      id: 'mp_002',
      name: 'Blockchain Fundamentals Explorer',
      description: 'Completed Introduction to Blockchain module',
      type: 'module_progress',
      status: 'minting',
      imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
      attributes: {
        course: 'Blockchain and Web3 Development',
        module: 'Blockchain Basics',
        score: 88,
        completionDate: '2024-12-19T11:00:00Z',
        difficulty: 'Intermediate',
        rarity: 'Rare'
      }
    },
    {
      id: 'la_001',
      name: 'Python Course Champion',
      description: 'Completed entire Python Programming Fundamentals course with distinction',
      type: 'learning_achievement',
      status: 'minted',
      imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=400&fit=crop',
      attributes: {
        course: 'Python Programming Fundamentals',
        score: 92,
        completionDate: '2024-12-18T16:45:00Z',
        difficulty: 'Beginner',
        rarity: 'Epic'
      },
      tokenId: '12346',
      transactionHash: '0xabcdef1234567890...',
      mintedAt: '2024-12-18T16:50:00Z',
      blockchainAddress: '0x742d35cc6bf...8c4c'
    },
    {
      id: 'la_002',
      name: 'Learning Streak Master',
      description: 'Maintained a 30-day learning streak',
      type: 'learning_achievement',
      status: 'minted',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
      attributes: {
        course: 'Achievement System',
        completionDate: '2024-12-15T09:00:00Z',
        difficulty: 'Special',
        rarity: 'Legendary'
      },
      tokenId: '12347',
      transactionHash: '0xfedcba0987654321...',
      mintedAt: '2024-12-15T09:05:00Z',
      blockchainAddress: '0x742d35cc6bf...8c4c'
    }
  ];

  useEffect(() => {
    // Simulate loading NFTs from blockchain
    setLoading(true);
    setTimeout(() => {
      setNfts(mockNFTs);
      setLoading(false);
    }, 1500);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'minting': return 'text-yellow-600 bg-yellow-100';
      case 'minted': return 'text-emerald-600 bg-emerald-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-400 bg-blue-50';
      case 'epic': return 'border-purple-500 bg-purple-50';
      case 'legendary': return 'border-orange-500 bg-orange-50';
      case 'mythic': return 'border-pink-500 bg-pink-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'module_progress' ? CubeIconSolid : TrophyIcon;
  };

  const tabs = [
    { id: 'all', name: 'All NFTs', icon: SparklesIcon },
    { id: 'minting', name: 'Minting', icon: ClockIcon },
    { id: 'minted', name: 'Collection', icon: CubeIcon },
    { id: 'achievements', name: 'Achievements', icon: TrophyIcon }
  ];

  const filteredNFTs = nfts.filter(nft => {
    switch (selectedTab) {
      case 'minting': return nft.status === 'minting';
      case 'minted': return nft.status === 'minted';
      case 'achievements': return nft.type === 'learning_achievement';
      default: return true;
    }
  });

  const mintingCount = nfts.filter(n => n.status === 'minting').length;
  const mintedCount = nfts.filter(n => n.status === 'minted').length;
  const achievementCount = nfts.filter(n => n.type === 'learning_achievement' && n.status === 'minted').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{t('pages.nftManagementPage.LoadingYourNFTCollection')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <SparklesIconSolid className="h-10 w-10 text-purple-500 mr-3" />
                {t('pages.nftManagementPage.nftCollection')}
              </h1>
              <p className="text-gray-600 mt-2">{t('pages.nftManagementPage.manageYourLearningAchievementNFTsAndModuleProgressTokens')}</p>
            </div>
            <Link 
              to="/dashboard"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              {t('pages.nftManagementPage.backToDashboard')}
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">{t('pages.nftManagementPage.TotalNFTs')}</p>
                  <p className="text-3xl font-bold">{nfts.length}</p>
                </div>
                <SparklesIconSolid className="h-12 w-12 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Minting</p>
                  <p className="text-3xl font-bold">{mintingCount}</p>
                </div>
                <ClockIcon className="h-12 w-12 text-yellow-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">{t('pages.nftManagementPage.Minted')}</p>
                  <p className="text-3xl font-bold">{mintedCount}</p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-emerald-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">{t('pages.nftManagementPage.Achievements')}</p>
                  <p className="text-3xl font-bold">{achievementCount}</p>
                </div>
                <TrophyIcon className="h-12 w-12 text-blue-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex border-b border-gray-200">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-semibold transition-all ${
                    selectedTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{tab.name}</span>
                  {tab.id === 'minting' && mintingCount > 0 && (
                    <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                      {mintingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNFTs.map(nft => {
            const TypeIcon = getTypeIcon(nft.type);
            return (
              <div
                key={nft.id}
                className={`nft-card relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${getRarityColor(nft.attributes.rarity)}`}
              >
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(nft.status)}`}>
                  {nft.status === 'minting' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                      <span>{t('pages.nftManagementPage.Minting')}...</span>
                    </div>
                  )}
                  {nft.status === 'minted' && <span>{t('pages.nftManagementPage.Minted')}</span>}
                  {nft.status === 'failed' && <span>{t('pages.nftManagementPage.Failed')}</span>}
                </div>

                {/* NFT Type Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div className={`p-2 rounded-full ${nft.type === 'module_progress' ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                    <TypeIcon className={`h-4 w-4 ${nft.type === 'module_progress' ? 'text-blue-600' : 'text-yellow-600'}`} />
                  </div>
                </div>

                {/* NFT Image */}
                <div className="aspect-square bg-gradient-to-br from-purple-400 to-blue-600 relative overflow-hidden">
                  <img 
                    src={nft.imageUrl} 
                    alt={nft.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${nft.name}&background=6366f1&color=fff&size=400`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* NFT Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{nft.name}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold text-purple-700 bg-purple-100`}>
                      {nft.attributes.rarity}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{nft.description}</p>

                  {/* Attributes */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{t('pages.nftManagementPage.Course')}:</span>
                      <span className="font-medium text-gray-800 truncate ml-2">{nft.attributes.course}</span>
                    </div>
                    
                    {nft.attributes.module && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{t('pages.nftManagementPage.Module')}:</span>
                        <span className="font-medium text-gray-800 truncate ml-2">{nft.attributes.module}</span>
                      </div>
                    )}

                    {nft.attributes.score && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{t('pages.nftManagementPage.Score')}:</span>
                        <span className="font-bold text-emerald-600">{nft.attributes.score}%</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{t('pages.nftManagementPage.Completed')}:</span>
                      <span className="font-medium text-gray-800">
                        {new Date(nft.attributes.completionDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {nft.status === 'minted' && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <TagIcon className="h-3 w-3" />
                            <span>{t('pages.nftManagementPage.Token')}: #{nft.tokenId}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          </button>
                          <button className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors">
                            <CurrencyDollarIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {nft.transactionHash && (
                        <div className="mt-2 text-xs text-gray-400 truncate">
                          {t('pages.nftManagementPage.Tx')}: {nft.transactionHash}
                        </div>
                      )}
                    </div>
                  )}

                  {nft.status === 'minting' && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-center space-x-2 text-yellow-600">
                        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">{t('pages.nftManagementPage.MintingInProgress')}...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredNFTs.length === 0 && (
          <div className="text-center py-12">
            <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('pages.nftManagementPage.noNFTsFound')}</h3>
            <p className="text-gray-500 mb-6">{t('pages.nftManagementPage.CompleteLearningModulesAndAchievementsToEarnNFTs')}</p>
            <Link 
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              {t('pages.nftManagementPage.StartLearning')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTManagementPage;