import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  AcademicCapIcon,
  PlayCircleIcon,
  TrophyIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { searchService, SearchResult } from '../services/searchService';

// Using SearchResult from searchService

interface SearchFilters {
  type: 'all' | 'course' | 'module' | 'lesson' | 'quiz' | 'achievement';
  difficulty_level?: string;
  achievement_type?: string;
  tier?: string;
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({
    type: (searchParams.get('type') as any) || 'all'
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    courses: 0,
    modules: 0,
    lessons: 0,
    quizzes: 0,
    achievements: 0
  });

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.difficulty_level) params.set('difficulty_level', filters.difficulty_level);
    if (filters.achievement_type) params.set('achievement_type', filters.achievement_type);
    if (filters.tier) params.set('tier', filters.tier);
    
    setSearchParams(params);
  }, [query, filters, setSearchParams]);

  // Perform search when query or filters change
  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch();
    } else {
      setResults([]);
      setStats({ courses: 0, modules: 0, lessons: 0, quizzes: 0, achievements: 0 });
    }
  }, [query, filters]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);

    try {
      const searchResponse = await searchService.search({
        q: query,
        type: filters.type === 'all' ? undefined : filters.type as any,
        difficulty_level: filters.difficulty_level,
        limit: 50
      });

      setResults(searchResponse.results);
      setStats({
        courses: searchResponse.type_counts.course || 0,
        modules: searchResponse.type_counts.module || 0,
        lessons: searchResponse.type_counts.lesson || 0,
        quizzes: searchResponse.type_counts.quiz || 0,
        achievements: searchResponse.type_counts.achievement || 0
      });
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setStats({ courses: 0, modules: 0, lessons: 0, quizzes: 0, achievements: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  const clearFilters = () => {
    setFilters({
      type: 'all'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpenIcon className="w-5 h-5" />;
      case 'module':
        return <AcademicCapIcon className="w-5 h-5" />;
      case 'lesson':
        return <PlayCircleIcon className="w-5 h-5" />;
      case 'achievement':
        return <TrophyIcon className="w-5 h-5" />;
      default:
        return <BookOpenIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'module':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'lesson':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'achievement':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'course':
        return 'Course';
      case 'module':
        return 'Module';
      case 'lesson':
        return 'Lesson';
      case 'achievement':
        return 'Achievement';
      default:
        return 'Item';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Results</h1>
          
          {/* Search Input */}
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                         bg-white text-gray-900 placeholder-gray-500 focus:outline-none 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search courses, modules, lessons, quizzes, achievements..."
            />
          </div>
        </div>

        {/* Search Stats */}
        {query && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Found {results.length} results for "{query}"
                </span>
                <div className="flex items-center space-x-2">
                  {stats.courses > 0 && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      {stats.courses} courses
                    </span>
                  )}
                  {stats.modules > 0 && (
                    <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                      {stats.modules} modules
                    </span>
                  )}
                  {stats.lessons > 0 && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      {stats.lessons} lessons
                    </span>
                  )}
                  {stats.achievements > 0 && (
                    <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                      {stats.achievements} achievements
                    </span>
                  )}
                </div>
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 
                         bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="course">Courses</option>
                  <option value="module">Modules</option>
                  <option value="lesson">Lessons</option>
                  <option value="quiz">Quizzes</option>
                  <option value="achievement">Achievements</option>
                </select>
              </div>

              {/* Difficulty Level Filter */}
              {filters.type === 'all' || filters.type === 'course' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={filters.difficulty_level || ''}
                    onChange={(e) => setFilters({ ...filters, difficulty_level: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              ) : null}

              {/* Achievement Type Filter */}
              {filters.type === 'all' || filters.type === 'achievement' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achievement Type</label>
                  <select
                    value={filters.achievement_type || ''}
                    onChange={(e) => setFilters({ ...filters, achievement_type: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="completion">Completion</option>
                    <option value="performance">Performance</option>
                    <option value="participation">Participation</option>
                    <option value="mastery">Mastery</option>
                  </select>
                </div>
              ) : null}

              {/* Tier Filter */}
              {filters.type === 'all' || filters.type === 'achievement' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tier</label>
                  <select
                    value={filters.tier || ''}
                    onChange={(e) => setFilters({ ...filters, tier: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Tiers</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
              ) : null}
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 
                         hover:text-gray-800 focus:outline-none"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <div
                key={`${result.type}-${result.id}-${index}`}
                onClick={() => handleResultClick(result)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md 
                         transition-shadow cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg border ${getTypeColor(result.type)}`}>
                    {getTypeIcon(result.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {result.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    
                    {result.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {result.course_name && (
                        <span className="flex items-center space-x-1">
                          <BookOpenIcon className="h-4 w-4" />
                          <span>{result.course_name}</span>
                        </span>
                      )}
                      {result.module_name && (
                        <span className="flex items-center space-x-1">
                          <AcademicCapIcon className="h-4 w-4" />
                          <span>{result.module_name}</span>
                        </span>
                      )}
                      {result.duration_minutes && (
                        <span className="flex items-center space-x-1">
                          <PlayCircleIcon className="h-4 w-4" />
                          <span>{result.duration_minutes} min</span>
                        </span>
                      )}
                      {result.difficulty_level && (
                        <span className="capitalize">{result.difficulty_level}</span>
                      )}
                      {result.achievement_type && (
                        <span className="capitalize">{result.achievement_type}</span>
                      )}
                      {result.tier && (
                        <span className="capitalize">{result.tier}</span>
                      )}
                    </div>
                    
                    {result.tags && result.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {result.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {result.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs font-medium text-gray-500">
                            +{result.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : query ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <MagnifyingGlassIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
              <p className="text-gray-600">
                Enter keywords to search for courses, modules, lessons, quizzes, and achievements.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
