import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import { blockchainService } from '../services/blockchainService';
import { UserRole } from '../types';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { learnerProfile, logout, role } = useAppContext();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [checkingWallet, setCheckingWallet] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = Boolean(learnerProfile && learnerProfile.did);

  const avatarUrl = learnerProfile && learnerProfile.avatarUrl && learnerProfile.avatarUrl.trim() !== ''
    ? learnerProfile.avatarUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(learnerProfile?.name || 'User')}&background=005acd&color=fff&size=40`;
  const displayName = learnerProfile && learnerProfile.name ? learnerProfile.name : 'User';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const init = async () => {
      try {
        setCheckingWallet(true);
        const isConnected = await blockchainService.checkWalletConnection();
        if (isConnected) {
          const addr = await blockchainService.getStudentAddress();
          setWalletAddress(addr);
        } else {
          setWalletAddress(null);
        }
      } finally {
        setCheckingWallet(false);
      }
    };
    init();
  }, []);

  const handleConnectWallet = async () => {
    const addr = await blockchainService.connectWallet();
    if (addr) setWalletAddress(addr);
  };

  const navLinkClasses = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
      location.pathname === path ? 'bg-[#005acd] text-white' : 'text-[#f5ffff] hover:bg-[#0093cb] hover:text-white'
    }`;

  return (
    <nav className="bg-gradient-to-r from-[#005acd] to-[#0093cb] shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="mr-2 text-[#f5ffff] hover:text-white focus:outline-none md:hidden"
                aria-label="Toggle sidebar"
              >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <Link to="/dashboard" className="flex-shrink-0 text-white text-xl font-bold">
              {APP_NAME}
            </Link>
            {/* Student navigation */}
            {role === UserRole.LEARNER && isLoggedIn && (
              <div className="ml-8 flex items-center space-x-2">
                <Link to="/dashboard" className={navLinkClasses('/dashboard')}>Main Dashboard</Link>
                <Link to="/tutor" className={navLinkClasses('/tutor')}>AI Tutor</Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {isLoggedIn ? (
              <>
                {/* Wallet status / connect */}
                <div className="hidden md:flex items-center mr-3">
                  {checkingWallet ? (
                    <span className="text-xs text-[#f5ffff]">Checking wallet...</span>
                  ) : walletAddress ? (
                    <span className="px-2 py-1 text-xs bg-[#6dd7fd]/20 text-[#005acd] rounded">
                      {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                    </span>
                  ) : (
                    <button
                      onClick={handleConnectWallet}
                      className="px-2 py-1 text-xs bg-[#6dd7fd] text-[#005acd] rounded hover:bg-[#0093cb] hover:text-white transition"
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
                <Link to="/profile" className="flex items-center text-[#f5ffff] hover:text-white">
                  <img
                    src={avatarUrl}
                    alt={learnerProfile?.name || 'User'}
                    className="h-8 w-8 rounded-full mr-2 border-2 border-[#6dd7fd]"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(learnerProfile?.name || 'User')}&background=005acd&color=fff&size=40`;
                    }}
                  />
                  <span className="hidden sm:inline text-sm">{displayName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-4 px-3 py-1 bg-[#005acd] text-white rounded hover:bg-[#0093cb] transition text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center text-[#f5ffff]">
                <img
                  src={'https://ui-avatars.com/api/?name=User&background=005acd&color=fff&size=40'}
                  alt="Guest"
                  className="h-8 w-8 rounded-full mr-2 border-2 border-[#6dd7fd]"
                />
                <span className="hidden sm:inline text-sm">Guest</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
