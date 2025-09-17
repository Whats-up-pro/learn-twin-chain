import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import NFTTicketCard from '../components/NFTTicketCard';
import { 
  SparklesIcon, 
  CubeIcon, 
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { 
  SparklesIcon as SparklesIconSolid
} from '@heroicons/react/24/solid';

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
  const { digitalTwin } = useAppContext();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'minting' | 'minted' | 'achievements'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { blockchainService } = await import('../services/blockchainService');
        // Ensure user wallet is connected
        const isWalletConnected = await blockchainService.checkWalletConnection();
        const studentAddress = isWalletConnected ? await blockchainService.getStudentAddress() : null;
        if (!studentAddress || !digitalTwin?.learnerDid) {
          setNfts([]);
          setLoading(false);
          return;
        }
        const data = await blockchainService.getStudentBlockchainData(studentAddress, digitalTwin.learnerDid);
        const unified = (data?.nfts || []).map((n: any) => {
          const type = n.nft_type === 'module_progress' ? 'module_progress' : 'learning_achievement';
          return {
            id: n.id || n.token_id,
            name: n.name || 'Learning NFT',
            description: n.description || '',
            type,
            status: 'minted' as const,
            imageUrl: n.metadata?.image || n.image_url || '',
            attributes: {
              course: n.course || n.metadata?.attributes?.find((a: any) => a.trait_type === 'Course')?.value || 'Course',
              module: n.module_id,
              score: n.metadata?.attributes?.find((a: any) => a.trait_type === 'Score')?.value,
              completionDate: n.mint_date || n.created_at || new Date().toISOString(),
              difficulty: n.metadata?.attributes?.find((a: any) => a.trait_type === 'Difficulty')?.value || 'N/A',
              rarity: n.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value || 'Common'
            },
            tokenId: n.token_id,
            transactionHash: n.tx_hash,
            mintedAt: n.mint_date || n.created_at,
            blockchainAddress: n.contract_address,
            metadata: n.metadata
          } as NFT;
        });
        setNfts(unified);
      } catch (e) {
        console.warn('Failed to load real NFTs:', e);
        setNfts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [digitalTwin?.learnerDid]);


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
          <p className="text-gray-600 text-lg">Loading your NFT collection...</p>
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
                NFT Collection
              </h1>
              <p className="text-gray-600 mt-2">Manage your learning achievement NFTs and module progress tokens</p>
            </div>
            <Link 
              to="/dashboard"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total NFTs</p>
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
                  <p className="text-emerald-100 text-sm font-medium">Minted</p>
                  <p className="text-3xl font-bold">{mintedCount}</p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-emerald-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Achievements</p>
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

        {/* NFT Ticket Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredNFTs.map(nft => (
            <NFTTicketCard
              key={nft.id}
              id={nft.id}
              name={nft.name}
              description={nft.description}
              type={nft.type}
              status={nft.status}
              imageUrl={nft.imageUrl}
              attributes={nft.attributes}
              tokenId={nft.tokenId}
              transactionHash={nft.transactionHash}
              mintedAt={nft.mintedAt}
              blockchainAddress={nft.blockchainAddress}
              metadata={nft.metadata}
            />
          ))}
        </div>

        {filteredNFTs.length === 0 && (
          <div className="text-center py-12">
            <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No NFTs found</h3>
            <p className="text-gray-500 mb-6">Complete learning modules and achievements to earn NFTs!</p>
            <Link 
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              Start Learning
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTManagementPage;