import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '../types';
import SearchBar from './SearchBar';
import { 
  BellIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { AcademicCapIcon } from '@heroicons/react/24/solid';

interface HeaderProps {
  onMenuToggle?: () => void;
  showSidebar?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, showSidebar = false }) => {
  const { learnerProfile, logout, role } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isLoggedIn = Boolean(learnerProfile && learnerProfile.did);
  const hideHeader = location.pathname === '/login' || 
                    location.pathname === '/register' || 
                    location.pathname === '/verify-email' || 
                    location.pathname === '/verify-email-sent';

  if (hideHeader) {
    return null;
  }

  const displayName = learnerProfile?.name || 'User';
  const avatarUrl = learnerProfile?.avatarUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e40af&color=fff&size=40`;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Menu Toggle */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            {showSidebar && (
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
                         md:hidden"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            )}

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                LearnTwin
              </span>
            </Link>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <SearchBar 
              placeholder="Search courses, modules, lessons, achievements..."
              className="w-full"
            />
          </div>

          {/* Right side - User Menu and Notifications */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search Button */}
            <button
              onClick={() => {
                // TODO: Implement mobile search modal
                console.log('Mobile search clicked');
              }}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
                       md:hidden"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
                         relative"
              >
                <BellIcon className="h-6 w-6" />
                {/* Notification badge */}
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No new notifications</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-md text-gray-600 hover:text-gray-900 
                         hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full border-2 border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e40af&color=fff&size=32`;
                  }}
                />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {displayName}
                </span>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <p className="text-sm text-gray-500">{learnerProfile?.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 
                               transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserCircleIcon className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 
                               transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <CogIcon className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 
                               transition-colors"
                    >
                      <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <SearchBar 
            placeholder="Search..."
            className="w-full"
          />
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
