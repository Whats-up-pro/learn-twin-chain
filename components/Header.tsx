import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { useNotifications } from '../contexts/NotificationContext';
import { UserRole } from '../types';
import SearchBar from './SearchBar';
import MetaMaskStatus from './MetaMaskStatus';
import { 
  BellIcon, 
  UserCircleIcon,
  Bars3Icon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { AcademicCapIcon } from '@heroicons/react/24/solid';

interface HeaderProps {
  onMenuToggle?: () => void;
  showSidebar?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, showSidebar = false }) => {
  const { learnerProfile, logout, role } = useAppContext();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
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
                    location.pathname === '/verify-email-sent' ||
                    location.pathname === '/welcome';

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

          {/* Center - Search Bar and MetaMask */}
          <div className="flex-1 max-w-3xl mx-4 hidden md:flex items-center space-x-3">
            <div className="flex-1">
              <SearchBar 
                placeholder="Search courses, modules, lessons, achievements..."
                className="w-full"
              />
            </div>
            <MetaMaskStatus />
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
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No notifications yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Complete lessons and earn achievements to see them here!
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  {notification.icon && (
                                    <span className="text-lg">{notification.icon}</span>
                                  )}
                                  <p className={`text-sm font-medium ${
                                    !notification.read ? 'text-gray-900' : 'text-gray-700'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {notification.timestamp.toLocaleTimeString()} • {' '}
                                  {notification.timestamp.toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="ml-2 text-gray-400 hover:text-gray-600 p-1"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {notifications.length > 10 && (
                          <div className="p-3 text-center border-t">
                            <Link
                              to="/notifications"
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View all {notifications.length} notifications
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
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
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate" title={displayName}>{displayName}</p>
                      <p 
                        className="text-sm text-gray-500 break-all leading-tight" 
                        title={learnerProfile?.email}
                      >
                        {learnerProfile?.email}
                      </p>
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
