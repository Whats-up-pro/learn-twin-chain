
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { useAppContext } from '../contexts/AppContext';

interface NavbarProps {
  onToggleSidebar?: () => void; // Optional: if you add a sidebar later
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { learnerProfile } = useAppContext();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
      isActive ? 'bg-sky-600 text-white' : 'text-sky-100 hover:bg-sky-500 hover:text-white'
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
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink to="/dashboard" className={navLinkClasses}>Dashboard</NavLink>
              <NavLink to="/tutor" className={navLinkClasses}>AI Tutor</NavLink>
              {/* <NavLink to="/modules" className={navLinkClasses}>Modules</NavLink> */}
            </div>
          </div>
          <div className="flex items-center">
             <Link to="/profile" className="flex items-center text-sky-100 hover:text-white">
                <img 
                  src={learnerProfile.avatarUrl || 'https://picsum.photos/seed/defaultuser/40/40'} 
                  alt={learnerProfile.name} 
                  className="h-8 w-8 rounded-full mr-2 border-2 border-sky-500"
                />
                <span className="hidden sm:inline text-sm">{learnerProfile.name}</span>
              </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
