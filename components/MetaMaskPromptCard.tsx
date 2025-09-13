/**
 * Alternative smaller MetaMask prompt for dashboard
 * Shows as a card in dashboard when MetaMask not connected
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';
import metamaskService, { MetaMaskState } from '../services/metamaskService';

interface MetaMaskPromptCardProps {
  onDismiss?: () => void;
}

const MetaMaskPromptCard: React.FC<MetaMaskPromptCardProps> = ({ onDismiss }) => {
  const [metamaskState, setMetamaskState] = useState<MetaMaskState>(metamaskService.getState());
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const unsubscribe = metamaskService.subscribe(setMetamaskState);
    return unsubscribe;
  }, []);

  // Don't show if already connected
  if (metamaskState.isConnected) return null;

  const handleConnect = async () => {
    if (!metamaskState.isInstalled) {
      metamaskService.openInstallPage();
      return;
    }

    setIsConnecting(true);
    try {
      await metamaskService.connect();
      onDismiss?.();
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 relative">
      {/* Close button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}

      {/* Content */}
      <div className="flex items-start space-x-4">
        {/* MetaMask Icon */}
        <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>

        {/* Text Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🚀 Unlock Full Learning Experience
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Connect your MetaMask wallet to earn NFT certificates and unlock blockchain-verified achievements!
          </p>

          {/* Benefits */}
          <div className="flex items-center space-x-4 mb-4 text-xs">
            <div className="flex items-center space-x-1 text-yellow-600">
              <TrophyIcon className="w-3 h-3" />
              <span>NFT Rewards</span>
            </div>
            <div className="flex items-center space-x-1 text-purple-600">
              <SparklesIcon className="w-3 h-3" />
              <span>Verified Certificates</span>
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Blockchain Proof</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg 
                     font-medium text-sm transition-colors disabled:cursor-not-allowed inline-flex items-center space-x-2"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span>🦊</span>
                <span>{!metamaskState.isInstalled ? 'Install MetaMask' : 'Connect Wallet'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetaMaskPromptCard;
