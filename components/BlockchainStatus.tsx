import React, { useState, useEffect } from 'react';
import { blockchainService } from '../services/blockchainService';

interface BlockchainStatusProps {
  className?: string;
}

export const BlockchainStatus: React.FC<BlockchainStatusProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkBlockchainStatus();
  }, []);

  const checkBlockchainStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await blockchainService.getBlockchainStatus();
      setIsConnected(status.available);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) return '⏳';
    if (isConnected) return '🟢';
    return '🔴';
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    if (isConnected) return 'Blockchain Connected';
    return 'Blockchain Offline';
  };

  const getStatusColor = () => {
    if (isLoading) return 'text-yellow-600';
    if (isConnected) return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-lg">{getStatusIcon()}</span>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {!isConnected && !isLoading && (
          <span className="text-xs text-gray-500">
            NFTs will be simulated
          </span>
        )}
        {error && (
          <span className="text-xs text-red-500" title={error}>
            Connection failed
          </span>
        )}
      </div>
      <button
        onClick={checkBlockchainStatus}
        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
        title="Refresh blockchain status"
      >
        🔄
      </button>
    </div>
  );
};

export default BlockchainStatus;