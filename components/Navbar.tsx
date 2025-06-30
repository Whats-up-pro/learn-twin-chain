import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '../types';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { learnerProfile, logout, role } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = Boolean(learnerProfile && learnerProfile.did);

  const avatarUrl = learnerProfile && learnerProfile.avatarUrl && learnerProfile.avatarUrl.trim() !== ''
    ? learnerProfile.avatarUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(learnerProfile?.name || 'User')}&background=0ea5e9&color=fff&size=40`;
  const displayName = learnerProfile && learnerProfile.name ? learnerProfile.name : 'User';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navLinkClasses = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
      location.pathname === path ? 'bg-sky-600 text-white' : 'text-sky-100 hover:bg-sky-500 hover:text-white'
    }`;

  return (
    <nav className="bg-sky-700 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="mr-2 text-sky-100 hover:text-white focus:outline-none md:hidden"
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
                <Link to="/profile" className="flex items-center text-sky-100 hover:text-white">
                  <img
                    src={avatarUrl}
                    alt={learnerProfile?.name || 'User'}
                    className="h-8 w-8 rounded-full mr-2 border-2 border-sky-500"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(learnerProfile?.name || 'User')}&background=0ea5e9&color=fff&size=40`;
                    }}
                  />
                  <span className="hidden sm:inline text-sm">{displayName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-4 px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 transition text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center text-sky-100">
                <img
                  src={'https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff&size=40'}
                  alt="Guest"
                  className="h-8 w-8 rounded-full mr-2 border-2 border-sky-500"
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
