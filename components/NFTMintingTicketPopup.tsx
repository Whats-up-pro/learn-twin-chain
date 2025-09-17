import React from 'react';
import { 
  XMarkIcon, 
  SparklesIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { 
  SparklesIcon as SparklesIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';

interface NFTMintingTicketPopupProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  courseTitle: string;
  status: 'minting' | 'minted' | 'failed';
  tokenId?: string;
  transactionHash?: string;
  onViewNFT?: () => void;
}

const NFTMintingTicketPopup: React.FC<NFTMintingTicketPopupProps> = ({
  isOpen,
  onClose,
  moduleTitle,
  courseTitle,
  status,
  tokenId,
  transactionHash,
  onViewNFT
}) => {
  if (!isOpen) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'minting':
        return {
          bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
          borderColor: 'border-amber-300',
          headerColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
          statusColor: 'text-amber-700',
          statusBg: 'bg-amber-100',
          statusIcon: ClockIcon,
          statusText: 'Minting in Progress',
          statusSubtext: 'Your NFT is being minted on the blockchain...',
          pulse: true
        };
      case 'minted':
        return {
          bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50',
          borderColor: 'border-emerald-300',
          headerColor: 'bg-gradient-to-r from-emerald-500 to-green-500',
          statusColor: 'text-emerald-700',
          statusBg: 'bg-emerald-100',
          statusIcon: CheckCircleIconSolid,
          statusText: 'Successfully Minted!',
          statusSubtext: 'Your NFT has been minted and is now in your wallet',
          pulse: false
        };
      case 'failed':
        return {
          bgColor: 'bg-gradient-to-br from-red-50 to-rose-50',
          borderColor: 'border-red-300',
          headerColor: 'bg-gradient-to-r from-red-500 to-rose-500',
          statusColor: 'text-red-700',
          statusBg: 'bg-red-100',
          statusIcon: ExclamationTriangleIcon,
          statusText: 'Minting Failed',
          statusSubtext: 'There was an error minting your NFT. Please try again.',
          pulse: false
        };
      default:
        return {
          bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
          borderColor: 'border-gray-300',
          headerColor: 'bg-gradient-to-r from-gray-500 to-slate-500',
          statusColor: 'text-gray-700',
          statusBg: 'bg-gray-100',
          statusIcon: ClockIcon,
          statusText: 'Pending',
          statusSubtext: 'Waiting...',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.statusIcon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border-2 ${config.borderColor} ${config.bgColor}`}>
        {/* Ticket Header */}
        <div className={`relative ${config.headerColor} text-white p-8 rounded-t-2xl`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIconSolid className="w-12 h-12 text-yellow-300" />
            </div>
            <h2 className="text-3xl font-bold mb-2">🎫 NFT Ticket</h2>
            <p className="text-xl opacity-90">Module Completion Certificate</p>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-8">
          {/* Status Section */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full ${config.statusBg} ${config.pulse ? 'animate-pulse' : ''}`}>
              <StatusIcon className={`w-6 h-6 ${config.statusColor}`} />
              <div>
                <h3 className={`text-lg font-bold ${config.statusColor}`}>
                  {config.statusText}
                </h3>
                <p className={`text-sm ${config.statusColor} opacity-80`}>
                  {config.statusSubtext}
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="bg-white bg-opacity-60 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Module</div>
                <div className="text-lg font-bold text-gray-900">{moduleTitle}</div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Course</div>
                <div className="text-lg font-bold text-gray-900">{courseTitle}</div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Type</div>
                <div className="flex items-center space-x-2">
                  <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-bold text-gray-900">Module Progress NFT</span>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Completed</div>
                <div className="text-lg font-bold text-gray-900">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Blockchain Details (only show if minted) */}
          {status === 'minted' && tokenId && (
            <div className="bg-white bg-opacity-60 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Blockchain Details</h4>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Token ID</div>
                  <div className="text-sm font-mono text-gray-900 break-all bg-gray-100 p-2 rounded">
                    {tokenId}
                  </div>
                </div>
                
                {transactionHash && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Transaction Hash</div>
                    <div className="text-sm font-mono text-gray-900 break-all bg-gray-100 p-2 rounded">
                      {transactionHash}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Minting Progress (only show if minting) */}
          {status === 'minting' && (
            <div className="bg-white bg-opacity-60 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Minting Progress</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg font-medium text-amber-700">Processing on blockchain...</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-3">
                  <div className="bg-amber-600 h-3 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  This may take a few minutes. You can close this popup and check your NFTs later.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {status === 'minted' && onViewNFT && (
              <button
                onClick={onViewNFT}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <TrophyIcon className="w-5 h-5" />
                <span>View My NFTs</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              {status === 'minting' ? 'Continue Learning' : 'Close'}
            </button>
          </div>
        </div>

        {/* Ticket Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-30"></div>
      </div>
    </div>
  );
};

export default NFTMintingTicketPopup;
