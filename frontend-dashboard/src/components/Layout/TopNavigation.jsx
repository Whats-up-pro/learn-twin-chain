/**
 * Top Navigation with Authentication and Wallet Status
 */
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthModal from '../Auth/AuthModal';
import WalletConnection from '../Wallet/WalletConnection';

export default function TopNavigation() {
  const { 
    user, 
    isAuthenticated, 
    isEmailVerified, 
    hasConnectedWallet, 
    primaryWallet, 
    logout, 
    loading 
  } = useAuth();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleLogin = () => {
    setAuthModalTab('login');
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthModalTab('register');
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  🎓 LearnTwinChain
                </h1>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <>
                  {/* Email Verification Status */}
                  {!isEmailVerified && (
                    <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Email Unverified
                    </div>
                  )}

                  {/* Wallet Status */}
                  <button
                    onClick={() => setShowWalletModal(true)}
                    className={`flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                      hasConnectedWallet
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {hasConnectedWallet ? (
                      <>
                        <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {primaryWallet ? formatAddress(primaryWallet.address) : 'Wallet Connected'}
                      </>
                    ) : (
                      <>
                        <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Connect Wallet
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Authentication Section */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="ml-2 text-gray-700 hidden sm:block">
                      {user?.name || 'User'}
                    </span>
                    <svg className="ml-1 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 text-sm text-gray-900 border-b">
                        <div className="font-medium">{user?.name}</div>
                        <div className="text-gray-500">{user?.email}</div>
                        <div className="text-xs text-primary-400 mt-1">{user?.role}</div>
                      </div>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile Settings
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setShowWalletModal(true);
                          setShowUserMenu(false);
                        }}
                      >
                        Wallet Settings
                      </a>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleLogin}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                    disabled={loading}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleRegister}
                    className="bg-primary-400 hover:bg-primary-500 text-white px-4 py-2 rounded-md text-sm font-medium"
                    disabled={loading}
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile User Menu */}
        {showUserMenu && isAuthenticated && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <a
                href="#"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Profile Settings
              </a>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authModalTab}
      />

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowWalletModal(false)}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Wallet Settings
                  </h3>
                  <button
                    onClick={() => setShowWalletModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <WalletConnection
                  onSuccess={() => setShowWalletModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}