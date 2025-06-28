import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '../types';
import toast from 'react-hot-toast';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { learnerProfile, logout } = useAppContext();
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.LEARNER);
  
  const isLoggedIn = Boolean(learnerProfile && learnerProfile.did);

  const avatarUrl = learnerProfile && learnerProfile.avatarUrl && learnerProfile.avatarUrl.trim() !== ''
    ? learnerProfile.avatarUrl
    : 'https://ui-avatars.com/api/?background=fff&color=888&name=U';
  
  const displayName = learnerProfile && learnerProfile.name ? learnerProfile.name : 'User';

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
      isActive ? 'bg-sky-600 text-white' : 'text-sky-100 hover:bg-sky-500 hover:text-white'
    }`;

  const handleLogout = () => {
    console.log('Logout button clicked');
    logout();
    console.log('Logout function called, navigating to login');
    navigate('/login', { replace: true });
  };

  const handleCopyAddress = () => {
    if (learnerProfile?.address) {
      navigator.clipboard.writeText(learnerProfile.address);
      toast.success('Address copied to clipboard!');
    }
  };

  const getRoleBasedNavLinks = () => {
    switch (currentRole) {
      case UserRole.EMPLOYER:
        return (
          <>
            <NavLink to="/employer" className={navLinkClasses}>Employer Dashboard</NavLink>
            <NavLink to="/employer/jobs" className={navLinkClasses}>Job Postings</NavLink>
            <NavLink to="/employer/candidates" className={navLinkClasses}>Candidates</NavLink>
          </>
        );
      case UserRole.TEACHER:
        return (
          <>
            <NavLink to="/teacher" className={navLinkClasses}>Teacher Dashboard</NavLink>
            <NavLink to="/teacher/courses" className={navLinkClasses}>My Courses</NavLink>
            <NavLink to="/teacher/learners" className={navLinkClasses}>Learners</NavLink>
          </>
        );
      default:
        return (
          <>
            <NavLink to="/dashboard" className={navLinkClasses}>Dashboard</NavLink>
            <NavLink to="/tutor" className={navLinkClasses}>AI Tutor</NavLink>
            <NavLink to="/modules" className={navLinkClasses}>Modules</NavLink>
          </>
        );
    }
  };

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
          </div>
          
          {/* Role Selector - chỉ hiển thị khi đã login */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center space-x-2 mr-4">
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="bg-sky-600 text-white text-sm rounded px-2 py-1 border border-sky-500"
              >
                <option value={UserRole.LEARNER}>Learner</option>
                <option value={UserRole.TEACHER}>Teacher</option>
                <option value={UserRole.EMPLOYER}>Employer</option>
              </select>
            </div>
          )}

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {isLoggedIn ? getRoleBasedNavLinks() : (
                <>
                  <NavLink to="/login" className={navLinkClasses}>Login</NavLink>
                  <NavLink to="/register" className={navLinkClasses}>Register</NavLink>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            {isLoggedIn ? (
              <>
                {/* User Profile Section */}
                <div className="flex items-center text-sky-100 hover:text-white">
                  <Link to="/profile" className="flex items-center">
                    <img 
                      src={avatarUrl}
                      alt={displayName}
                      className="h-8 w-8 rounded-full mr-2 border-2 border-sky-500"
                    />
                    <div className="hidden sm:block text-sm">
                      <div>{displayName}</div>
                      {learnerProfile?.address && (
                        <div 
                          className="text-xs text-sky-200 cursor-pointer hover:text-white"
                          onClick={handleCopyAddress}
                          title="Click to copy address"
                        >
                          {learnerProfile.address.substring(0, 6)}...{learnerProfile.address.substring(38)}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
                
                {/* Logout Button */}
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
                  src={'https://picsum.photos/seed/defaultuser/40/40'} 
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