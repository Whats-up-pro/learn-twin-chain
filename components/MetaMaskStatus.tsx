/**
 * MetaMask Status Component
 * Shows MetaMask connection status and balance in header
 */

import React, { useState, useEffect } from 'react';
import metamaskService, { MetaMaskState } from '../services/metamaskService';

const MetaMaskStatus: React.FC = () => {
  const [metamaskState, setMetamaskState] = useState<MetaMaskState>(metamaskService.getState());
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Subscribe to MetaMask state changes
    const unsubscribe = metamaskService.subscribe(setMetamaskState);
    return unsubscribe;
  }, []);

  const handleConnect = async () => {
    if (!metamaskState.isInstalled) {
      metamaskService.openInstallPage();
      return;
    }

    setIsConnecting(true);
    try {
      await metamaskService.connect();
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await metamaskService.disconnect();
    setShowDropdown(false);
  };

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      await metamaskService.switchNetwork(chainId);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  // If MetaMask is not installed
  if (!metamaskState.isInstalled) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-orange-100 hover:bg-orange-200 
                   text-orange-800 rounded-lg border border-orange-300 transition-colors"
        >
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="hidden sm:block">Install MetaMask</span>
        </button>
      </div>
    );
  }

  // If not connected
  if (!metamaskState.isConnected) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 
                   text-gray-700 rounded-lg border border-gray-300 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span className="hidden sm:block">
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </span>
        </button>
      </div>
    );
  }

  // If connected
  const { account } = metamaskState;
  if (!account) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 
                 text-green-800 rounded-lg border border-green-300 transition-colors"
      >
        {/* Status indicator */}
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        
        {/* Address */}
        <span className="font-mono text-xs">
          {metamaskService.formatAddress(account.address, 8)}
        </span>
        
        {/* Balance */}
        {account.balance && (
          <span className="hidden md:block text-xs">
            {parseFloat(account.balance).toFixed(3)} ETH
          </span>
        )}
        
        {/* Dropdown arrow */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-30"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">MetaMask Wallet</p>
                  <p className="text-xs text-gray-500">Connected</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-3 space-y-2">
                {/* Account info */}
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-mono text-sm text-gray-900 break-all">
                    {account.address}
                  </p>
                </div>
                
                {/* Balance */}
                {account.balance && (
                  <div>
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className="text-sm text-gray-900">
                      {account.balance} ETH
                    </p>
                  </div>
                )}
                
                {/* Network */}
                {account.networkName && (
                  <div>
                    <p className="text-xs text-gray-500">Network</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-900">{account.networkName}</p>
                      {account.chainId !== 1 && account.chainId !== 137 && (
                        <button
                          onClick={() => handleSwitchNetwork(1)}
                          className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                        >
                          Switch to Mainnet
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MetaMaskStatus;
