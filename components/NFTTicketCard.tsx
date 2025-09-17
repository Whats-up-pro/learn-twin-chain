import React from 'react';
import { 
  SparklesIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  AcademicCapIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { 
  SparklesIcon as SparklesIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';

interface NFTTicketCardProps {
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

const NFTTicketCard: React.FC<NFTTicketCardProps> = ({
  id,
  name,
  description,
  type,
  status,
  imageUrl,
  attributes,
  tokenId,
  transactionHash,
  mintedAt,
  blockchainAddress,
  metadata
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'minting':
        return {
          bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
          borderColor: 'border-amber-200',
          statusColor: 'text-amber-700',
          statusBg: 'bg-amber-100',
          statusIcon: ClockIcon,
          statusText: 'Minting',
          statusSubtext: 'Processing on blockchain...',
          pulse: true
        };
      case 'minted':
        return {
          bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50',
          borderColor: 'border-emerald-200',
          statusColor: 'text-emerald-700',
          statusBg: 'bg-emerald-100',
          statusIcon: CheckCircleIconSolid,
          statusText: 'Minted',
          statusSubtext: 'Successfully minted',
          pulse: false
        };
      case 'failed':
        return {
          bgColor: 'bg-gradient-to-br from-red-50 to-rose-50',
          borderColor: 'border-red-200',
          statusColor: 'text-red-700',
          statusBg: 'bg-red-100',
          statusIcon: ExclamationTriangleIcon,
          statusText: 'Failed',
          statusSubtext: 'Minting failed',
          pulse: false
        };
      default:
        return {
          bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
          borderColor: 'border-gray-200',
          statusColor: 'text-gray-700',
          statusBg: 'bg-gray-100',
          statusIcon: ClockIcon,
          statusText: 'Pending',
          statusSubtext: 'Waiting...',
          pulse: false
        };
    }
  };

  const getTypeIcon = () => {
    return type === 'module_progress' ? AcademicCapIcon : TrophyIcon;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'text-purple-600 bg-purple-100';
      case 'epic': return 'text-blue-600 bg-blue-100';
      case 'rare': return 'text-green-600 bg-green-100';
      case 'uncommon': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const config = getStatusConfig();
  const TypeIcon = getTypeIcon();
  const StatusIcon = config.statusIcon;

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 ${config.borderColor} ${config.bgColor} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      {/* Ticket Perforation Effect */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-gray-300 to-transparent opacity-50"></div>
      <div className="absolute right-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-gray-300 to-transparent opacity-50"></div>
      
      {/* Header Section */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${config.statusBg} ${config.pulse ? 'animate-pulse' : ''}`}>
              <TypeIcon className={`w-6 h-6 ${config.statusColor}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{name}</h3>
              <p className="text-sm text-gray-600">{attributes.course}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${config.statusBg} ${config.pulse ? 'animate-pulse' : ''}`}>
            <StatusIcon className={`w-4 h-4 ${config.statusColor}`} />
            <span className={`text-sm font-semibold ${config.statusColor}`}>
              {config.statusText}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm leading-relaxed mb-4">{description}</p>

        {/* Status Subtext */}
        <div className={`text-xs ${config.statusColor} font-medium mb-4`}>
          {config.statusSubtext}
        </div>
      </div>

      {/* Ticket Body */}
      <div className="px-6 pb-6">
        {/* Attributes Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Module</div>
            <div className="text-sm font-medium text-gray-900">{attributes.module || 'N/A'}</div>
          </div>
          
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Score</div>
            <div className="text-sm font-medium text-gray-900">
              {attributes.score ? `${attributes.score}%` : 'N/A'}
            </div>
          </div>
          
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Difficulty</div>
            <div className="text-sm font-medium text-gray-900">{attributes.difficulty}</div>
          </div>
          
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Rarity</div>
            <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${getRarityColor(attributes.rarity)}`}>
              {attributes.rarity}
            </div>
          </div>
        </div>

        {/* Completion Date */}
        <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Completed</div>
          <div className="text-sm font-medium text-gray-900">{formatDate(attributes.completionDate)}</div>
        </div>

        {/* Blockchain Details (only show if minted) */}
        {status === 'minted' && tokenId && (
          <div className="space-y-3">
            <div className="bg-white bg-opacity-60 rounded-lg p-3">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Token ID</div>
              <div className="text-sm font-mono text-gray-900 break-all">{tokenId}</div>
            </div>
            
            {transactionHash && (
              <div className="bg-white bg-opacity-60 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Transaction</div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-mono text-gray-900 break-all flex-1">
                    {transactionHash.slice(0, 20)}...{transactionHash.slice(-8)}
                  </div>
                  <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ZK Proof Badge */}
        {metadata?.properties?.verification?.proof_hash && (
          <div className="mt-4">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              <SparklesIconSolid className="w-4 h-4 mr-2" />
              <span className="text-xs font-semibold">
                ZK Verified • {String(metadata.properties.verification.proof_hash).slice(0, 10)}...
              </span>
            </div>
          </div>
        )}

        {/* Minting Progress (only show if minting) */}
        {status === 'minting' && (
          <div className="mt-4">
            <div className="bg-white bg-opacity-60 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-amber-700">Minting in progress...</span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-amber-200 rounded-full h-2">
                  <div className="bg-amber-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-30"></div>
    </div>
  );
};

export default NFTTicketCard;
