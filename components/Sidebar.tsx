import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { 
  HomeIcon,
  BookOpenIcon,
  TrophyIcon,
  CreditCardIcon,
  UserIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeSolid,
  BookOpenIcon as BookSolid,
  TrophyIcon as TrophySolid,
  CreditCardIcon as CreditSolid,
  UserIcon as UserSolid,
  CogIcon as CogSolid,
  AcademicCapIcon as AcademicSolid,
  SparklesIcon as SparklesSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  DocumentTextIcon as DocumentSolid,
  MagnifyingGlassIcon as MagnifyingGlassSolid
} from '@heroicons/react/24/solid';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

interface SidebarItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconSolid: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string | number;
  color?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, className = '' }) => {
  const { learnerProfile, logout, nfts } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      iconSolid: HomeSolid,
      color: 'blue'
    },
    {
      id: 'search',
      name: 'Search',
      href: '/search',
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassSolid,
      color: 'gray'
    },
    {
      id: 'courses',
      name: 'Courses',
      href: '/courses',
      icon: BookOpenIcon,
      iconSolid: BookSolid,
      color: 'indigo'
    },
    {
      id: 'ai-tutor',
      name: 'AI Tutor',
      href: '/tutor',
      icon: ChatBubbleLeftRightIcon,
      iconSolid: ChatSolid,
      color: 'purple'
    },
    {
      id: 'achievements',
      name: 'Achievements',
      href: '/achievements',
      icon: TrophyIcon,
      iconSolid: TrophySolid,
      color: 'amber'
    },
    {
      id: 'nfts',
      name: 'NFTs',
      href: '/nfts',
      icon: CreditCardIcon,
      iconSolid: CreditSolid,
      badge: nfts?.length || 0,
      color: 'emerald'
    },
    {
      id: 'certificates',
      name: 'Certificates',
      href: '/certificates',
      icon: DocumentTextIcon,
      iconSolid: DocumentSolid,
      color: 'blue'
    },
    {
      id: 'profile',
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
      iconSolid: UserSolid,
      color: 'slate'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const getItemColorClasses = (item: SidebarItem, active: boolean) => {
    if (active) {
      return {
        bg: 'bg-blue-600',
        text: 'text-white',
        icon: 'text-white',
        border: 'border-blue-600'
      };
    }
    
    return {
      bg: 'bg-transparent hover:bg-blue-50',
      text: 'text-slate-700 hover:text-blue-700',
      icon: 'text-slate-500 hover:text-blue-600',
      border: 'border-transparent hover:border-blue-200'
    };
  };

  const displayName = learnerProfile?.name || 'User';
  const avatarUrl = learnerProfile?.avatarUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e40af&color=fff&size=40`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen bg-white shadow-2xl z-50 transition-all duration-300 ease-in-out
        ${isOpen ? 'w-72' : 'w-20'}
        md:sticky md:top-0 md:h-screen md:shadow-lg border-r border-slate-200
        flex flex-col
        ${className}
      `}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
          {isOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">LearnTwin</h1>
                <p className="text-blue-100 text-xs">Learning Platform</p>
              </div>
            </div>
          )}
          
          <button
            onClick={onToggle}
            className={`
              p-2 rounded-lg text-white hover:bg-blue-500 transition-colors
              ${!isOpen && 'mx-auto'}
            `}
          >
            {isOpen ? (
              <ChevronLeftIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* User Profile Section */}
        <div className="flex-shrink-0 p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full border-2 border-blue-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e40af&color=fff&size=40`;
              }}
            />
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {learnerProfile?.email || 'Student'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {sidebarItems.map((item) => {
            const active = isActive(item.href);
            const colorClasses = getItemColorClasses(item, active);
            const IconComponent = active ? item.iconSolid : item.icon;

            return (
              <Link
                key={item.id}
                to={item.href}
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-xl
                  transition-all duration-200 border
                  ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}
                  ${isOpen ? 'justify-start' : 'justify-center'}
                `}
                title={!isOpen ? item.name : undefined}
              >
                <IconComponent className={`
                  w-5 h-5 ${colorClasses.icon} transition-colors
                  ${isOpen ? 'mr-3' : ''}
                `} />
                
                {isOpen && (
                  <>
                    <span className="truncate">{item.name}</span>
                    {item.badge !== undefined && (
                      <span className={`
                        ml-auto px-2 py-0.5 text-xs font-medium rounded-full
                        ${active 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-slate-200 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                        }
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="flex-shrink-0 p-2 border-t border-slate-200 space-y-1 bg-white">
          <Link
            to="/settings"
            className={`
              group flex items-center px-3 py-3 text-sm font-medium rounded-xl
              transition-all duration-200 border border-transparent
              bg-transparent hover:bg-slate-50 text-slate-700 hover:text-slate-900
              ${isOpen ? 'justify-start' : 'justify-center'}
            `}
            title={!isOpen ? 'Settings' : undefined}
          >
            <CogIcon className={`
              w-5 h-5 text-slate-500 hover:text-slate-700 transition-colors
              ${isOpen ? 'mr-3' : ''}
            `} />
            {isOpen && <span>Settings</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={`
              w-full group flex items-center px-3 py-3 text-sm font-medium rounded-xl
              transition-all duration-200 border border-transparent
              bg-transparent hover:bg-red-50 text-slate-700 hover:text-red-700
              ${isOpen ? 'justify-start' : 'justify-center'}
            `}
            title={!isOpen ? 'Logout' : undefined}
          >
            <ArrowLeftOnRectangleIcon className={`
              w-5 h-5 text-slate-500 group-hover:text-red-600 transition-colors
              ${isOpen ? 'mr-3' : ''}
            `} />
            {isOpen && <span>Logout</span>}
          </button>
        </div>

        {/* Footer */}
        {isOpen && (
          <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500 text-center">
              © 2025 LearnTwinChain
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
