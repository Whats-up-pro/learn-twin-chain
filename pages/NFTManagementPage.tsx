import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import NFTTicketCard from '../components/NFTTicketCard';
import { 
  SparklesIcon, 
  CubeIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { 
  SparklesIcon as SparklesIconSolid
} from '@heroicons/react/24/solid';
// import toast from 'react-hot-toast';
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
  const [selectedTab, setSelectedTab] = useState<'minting' | 'minted' | 'failed'>('minted');
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
        // Also enrich with on-chain ERC-1155 balances
        // Derive tokenIds to check: use backend token_ids if present, else map module completions
        const tokenIds: string[] = Array.from(
          new Set(
            (data?.module_completions || [])
              .map((mc: any) => mc.token_id)
              .filter((x: any) => x !== undefined && x !== null)
              .map((x: any) => String(x))
          )
        );
        // If no ids derived, try known token from module ids
        if (tokenIds.length === 0) {
          (data?.module_completions || []).forEach((mc: any) => {
            if (mc.module_id) tokenIds.push(String(mc.module_id));
          });
        }
        let onchain: any[] = [];
        try {
          if (tokenIds.length > 0) {
            const meta = await blockchainService.getContractsMeta();
            const moduleNftAddress = meta?.addresses?.MODULE_PROGRESS_NFT || '';
            const res = await blockchainService.getErc1155BalancesAndMetadata(studentAddress, tokenIds);
            onchain = res
              .filter(r => r.balance > 0n)
              .map(r => ({
                id: r.tokenId,
                name: r.metadata?.name || 'Module Completion',
                description: r.metadata?.description || '',
                type: 'module_progress' as const,
                status: 'minted' as const,
                imageUrl: r.metadata?.image || '',
                attributes: {
                  course: r.metadata?.attributes?.find((a: any) => a.trait_type === 'Course')?.value || 'Course',
                  module: r.metadata?.attributes?.find((a: any) => a.trait_type === 'Module ID')?.value,
                  score: r.metadata?.attributes?.find((a: any) => a.trait_type === 'Score')?.value,
                  completionDate: new Date().toISOString(),
                  difficulty: r.metadata?.attributes?.find((a: any) => a.trait_type === 'Difficulty')?.value || 'N/A',
                  rarity: r.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value || 'Common'
                },
                tokenId: r.tokenId,
                blockchainAddress: moduleNftAddress,
                metadata: r.metadata
              }));
          }
        } catch (e) {
          console.warn('On-chain ERC-1155 read failed:', e);
        }
        // Merge by tokenId, prefer on-chain metadata when available
        const mergedByToken: Record<string, NFT> = {};
        [...unified, ...onchain].forEach((item: any) => {
          const key = String(item.tokenId || item.id);
          if (!mergedByToken[key]) mergedByToken[key] = item;
          else {
            mergedByToken[key] = { ...mergedByToken[key], ...item };
          }
        });
        // Merge local in-progress/failed tickets from digital twin checkpoints
        const localTickets: NFT[] = (digitalTwin?.checkpoints || [])
          .filter((cp: any) => cp.minting || cp.mintFailed)
          .map((cp: any) => ({
            id: cp.moduleId,
            name: cp.moduleName || 'Module Completion',
            description: 'Module completion minting ticket',
            type: 'module_progress' as const,
            status: cp.minting ? 'minting' as const : 'failed' as const,
            imageUrl: '',
            attributes: {
              course: 'Course',
              module: cp.moduleId,
              score: cp.score,
              completionDate: cp.completedAt,
              difficulty: 'N/A',
              rarity: 'Common'
            },
            tokenId: cp.tokenId ? String(cp.tokenId) : undefined,
            transactionHash: cp.txHash,
            mintedAt: undefined,
            blockchainAddress: cp.contractAddress,
            metadata: undefined
          }));
        const merged = Object.values(mergedByToken);
        // Ensure no duplicates by id
        const existingIds = new Set(merged.map((n: any) => String(n.id)));
        const withLocal = [...localTickets.filter(t => !existingIds.has(String(t.id))), ...merged];
        setNfts(withLocal);
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
    { id: 'minting', name: 'Minting', icon: ClockIcon },
    { id: 'minted', name: 'Minted', icon: CubeIcon },
    { id: 'failed', name: 'Failed', icon: ExclamationTriangleIcon }
  ];

  const filteredNFTs = nfts.filter(nft => {
    switch (selectedTab) {
      case 'minting': return nft.status === 'minting';
      case 'minted': return nft.status === 'minted';
      case 'failed': return nft.status === 'failed';
      default: return true;
    }
  });

  const mintingCount = nfts.filter(n => n.status === 'minting').length;
  const mintedCount = nfts.filter(n => n.status === 'minted').length;

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
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  try {
                    const { blockchainService } = await import('../services/blockchainService');
                    const studentAddress = await blockchainService.getStudentAddress();
                    if (studentAddress) {
                      await blockchainService.detectAndRefreshNFTs(studentAddress);
                      // Reload the page data
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error('Failed to detect NFTs:', error);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                🔍 Auto-Detect NFTs
              </button>
              <Link 
                to="/dashboard"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                {t('pages.nftManagementPage.backToDashboard')}
              </Link>
            </div>
          </div>

          {/* Stats Overview: Only Minting and Minted */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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