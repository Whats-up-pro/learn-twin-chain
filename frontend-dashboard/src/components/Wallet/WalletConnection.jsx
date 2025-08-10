/**
 * SIWE Wallet Connection Component
 */
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function WalletConnection({ onSuccess, required = false }) {
  const { connectWallet, unlinkWallet, setPrimaryWallet, wallets, loading, user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const result = await connectWallet();
      console.log('Wallet connected:', result);
      onSuccess?.(result);
    } catch (error) {
      setError(error.message);
      console.error('Wallet connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUnlinkWallet = async (walletAddress) => {
    if (window.confirm('Are you sure you want to unlink this wallet?')) {
      try {
        setError(null);
        await unlinkWallet(walletAddress);
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleSetPrimary = async (walletAddress) => {
    try {
      setError(null);
      await setPrimaryWallet(walletAddress);
    } catch (error) {
      setError(error.message);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Please sign in to connect your wallet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Wallet Connection
        </h3>
        {required && wallets.length === 0 && (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
            Required
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {wallets.length === 0 ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No Wallet Connected
          </h4>
          <p className="text-gray-500 mb-6">
            Connect your MetaMask wallet to access blockchain features like NFT certificates
          </p>
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting || loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isConnecting || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-400 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400'
            }`}
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Connect MetaMask
              </>
            )}
          </button>
          
          {typeof window !== 'undefined' && typeof window.ethereum === 'undefined' && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <p className="text-sm">
                MetaMask not detected.{' '}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-yellow-800 hover:text-yellow-900"
                >
                  Install MetaMask
                </a>{' '}
                to connect your wallet.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Connected Wallets ({wallets.length})
            </h4>
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting || loading}
              className="text-sm text-primary-400 hover:text-primary-300 font-medium"
            >
              + Add Another
            </button>
          </div>

          <div className="space-y-3">
            {wallets.map((wallet, index) => (
              <div
                key={wallet.address}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {formatAddress(wallet.address)}
                      </p>
                      {wallet.is_primary && (
                        <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Connected on {new Date(wallet.linked_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!wallet.is_primary && wallets.length > 1 && (
                    <button
                      onClick={() => handleSetPrimary(wallet.address)}
                      className="text-xs text-primary-400 hover:text-primary-300"
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    onClick={() => handleUnlinkWallet(wallet.address)}
                    className="text-xs text-red-600 hover:text-red-500"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-sm text-gray-700">
                  <strong>Wallet Connected!</strong> You can now:
                </p>
                <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                  <li>Earn NFT certificates for course completion</li>
                  <li>Verify your learning achievements on-chain</li>
                  <li>Access blockchain-based features</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {required && wallets.length === 0 && (
        <div className="mt-4 p-3 bg-orange-100 border border-orange-400 text-orange-700 rounded">
          <p className="text-sm">
            <strong>Wallet Required:</strong> You need to connect a wallet to access learning modules and earn NFT certificates.
          </p>
        </div>
      )}
    </div>
  );
}