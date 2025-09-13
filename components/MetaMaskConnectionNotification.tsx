/**
 * MetaMask Connection Notification
 * Shows after user login to encourage MetaMask connection for full experience
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';
import metamaskService, { MetaMaskState } from '../services/metamaskService';
import { useAppContext } from '../contexts/AppContext';

const MetaMaskConnectionNotification: React.FC = () => {
  const { learnerProfile } = useAppContext();
  const [metamaskState, setMetamaskState] = useState<MetaMaskState>(metamaskService.getState());
  const [isVisible, setIsVisible] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Storage keys for persistence
  const DISMISS_KEY = 'metamask_notification_dismissed';
  const DISMISS_TIMESTAMP_KEY = 'metamask_notification_dismiss_time';
  const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  useEffect(() => {
    // Subscribe to MetaMask state changes
    const unsubscribe = metamaskService.subscribe(setMetamaskState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Check if notification should be shown
    const checkNotificationStatus = () => {
      // Don't show if user not logged in
      if (!learnerProfile?.did) {
        setIsVisible(false);
        return;
      }

      // Don't show if MetaMask is connected
      if (metamaskState.isConnected) {
        setIsVisible(false);
        return;
      }

      // Check if notification was dismissed recently
      const dismissedTime = localStorage.getItem(DISMISS_TIMESTAMP_KEY);
      if (dismissedTime) {
        const timeSinceDismiss = Date.now() - parseInt(dismissedTime);
        if (timeSinceDismiss < DISMISS_DURATION) {
          setIsVisible(false);
          return;
        }
      }

      // Show notification if all conditions met
      setIsVisible(true);
    };

    // Small delay to ensure UI is ready
    const timeoutId = setTimeout(checkNotificationStatus, 2000);
    return () => clearTimeout(timeoutId);
  }, [learnerProfile, metamaskState.isConnected]);

  const handleConnect = async () => {
    if (!metamaskState.isInstalled) {
      metamaskService.openInstallPage();
      return;
    }

    setIsConnecting(true);
    try {
      await metamaskService.connect();
      setIsVisible(false); // Hide notification after successful connection
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    
    // Store dismiss timestamp
    localStorage.setItem(DISMISS_TIMESTAMP_KEY, Date.now().toString());
  };

  const handleNotNow = () => {
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 max-w-sm w-full z-50 animate-slide-in-right">
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg shadow-xl border border-blue-500/20 p-5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative">
          {/* Icon */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Connect MetaMask</h3>
          </div>

          {/* Message */}
          <p className="text-white/90 text-sm mb-4 leading-relaxed">
            Unlock the full learning experience! Connect your MetaMask wallet to:
          </p>

          {/* Features list */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2 text-white/90 text-sm">
              <TrophyIcon className="w-4 h-4 text-yellow-400" />
              <span>Earn NFT certificates for completed courses</span>
            </div>
            <div className="flex items-center space-x-2 text-white/90 text-sm">
              <SparklesIcon className="w-4 h-4 text-purple-300" />
              <span>Unlock blockchain-verified achievements</span>
            </div>
            <div className="flex items-center space-x-2 text-white/90 text-sm">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure, decentralized learning records</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1 bg-white hover:bg-gray-100 text-blue-700 font-semibold py-2 px-4 rounded-lg 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isConnecting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : !metamaskState.isInstalled ? (
                'Install MetaMask'
              ) : (
                '🦊 Connect Now'
              )}
            </button>
            <button
              onClick={handleNotNow}
              className="px-3 py-2 text-white/80 hover:text-white text-sm font-medium 
                       hover:bg-white/10 rounded-lg transition-colors"
            >
              Not Now
            </button>
          </div>

          {/* Small disclaimer */}
          <p className="text-white/60 text-xs mt-3 text-center">
            You can always connect later from the header
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetaMaskConnectionNotification;
