import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  BookOpenIcon,
  AcademicCapIcon,
  PlayIcon,
  TrophyIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';
import { useTranslation } from '../src/hooks/useTranslation';

// Using SearchResult from searchService

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string, type: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  className = '', 
  placeholder = t('components.searchBar.searchPlaceholder'),
  onSearch 
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'course' | 'module' | 'lesson' | 'quiz' | 'achievement'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchType]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setIsOpen(true);

    try {
      const searchResponse = await searchService.search({
        q: query,
        type: searchType === 'all' ? undefined : searchType as any,
        limit: 10
      });

      setResults(searchResponse.results);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query, searchType);
    } else if (query.trim()) {
      // Navigate to search page with query
      navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${searchType}`);
    } else {
      performSearch();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpenIcon className="w-4 h-4" />;
      case 'module':
        return <AcademicCapIcon className="w-4 h-4" />;
      case 'lesson':
        return <PlayIcon className="w-4 h-4" />;
      case 'quiz':
        return <TrophyIcon className="w-4 h-4" />;
      case 'achievement':
        return <TrophyIcon className="w-4 h-4" />;
      default:
        return <BookOpenIcon className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    return searchService.getTypeColor(type);
  };

  const getTypeLabel = (type: string) => {
    return searchService.getTypeLabel(type);
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
            if (e.key === 'Escape') {
              setIsOpen(false);
              setShowDropdown(false);
            }
          }}
          className="block w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-lg 
                     bg-white text-sm placeholder-gray-500 focus:outline-none 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     hover:border-gray-400 transition-colors"
          placeholder={placeholder}
        />
        
        {/* Search Type Dropdown */}
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 
                       border-l border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <span className="capitalize">{searchType}</span>
            <ChevronDownIcon className="ml-1 h-4 w-4" />
          </button>
          
          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="px-2 py-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Type Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 
                        rounded-lg shadow-lg z-50">
          {['all', 'course', 'module', 'lesson', 'quiz', 'achievement'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setSearchType(type as any);
                setShowDropdown(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 
                         transition-colors ${searchType === type ? 'bg-blue-50 text-blue-700' : ''}`}
            >
              <span className="capitalize">{type}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && (query.trim().length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 
                        rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm">{t('components.searchBar.Searching...')}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                           border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-1.5 rounded-lg ${getTypeColor(result.type)}`}>
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(result.type)}`}>
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      {result.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                      {(result.course_name || result.module_name || result.achievement_type) && (
                        <div className="flex items-center space-x-2 mt-1">
                          {result.course_name && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {result.course_name}
                            </span>
                          )}
                          {result.module_name && (
                            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {result.module_name}
                            </span>
                          )}
                          {result.achievement_type && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              {result.achievement_type}
                            </span>
                          )}
                          {result.tier && (
                            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                              {result.tier}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">{t('components.searchBar.noResultsFound', {query: query})}</p>
              <p className="text-xs mt-1">{t('components.searchBar.TryDifferentKeywordsOrSearchType')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
