import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor_name: string;
  duration_minutes: number;
  difficulty_level: string;
  enrollment_count: number;
  rating: number;
  tags: string[];
  thumbnail_url?: string;
  is_enrolled?: boolean;
}

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load courses directly from /all endpoint
  useEffect(() => {
    loadAllCourses();
  }, []);

  const loadAllCourses = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAllCourses(0, 50) as any;
      console.log('✅ Single API call - All courses with enrollment loaded');
      
      if (response && response.items) {
        // Courses now include enrollment status from backend
        setAllCourses(response.items);
        console.log(`✅ Loaded ${response.items.length} courses with enrollment status in ONE API call`);
      } else if (response && Array.isArray(response)) {
        // Handle case where response is directly an array
        setAllCourses(response);
        console.log(`✅ Loaded ${response.length} courses in ONE API call`);
      } else {
        console.warn('No courses found in response:', response);
        setAllCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setAllCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterCourses();
  }, [allCourses, searchQuery, selectedDifficulty]);

  const filterCourses = () => {
    let filtered = allCourses;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty_level === selectedDifficulty);
    }

    setFilteredCourses(filtered);
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}/learn`);
  };

  const handleEnroll = async (courseId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const response = await apiService.enrollInCourse(courseId) as any;
      console.log('Enrollment response:', response);
      
      // Show success message
      const message = response?.message || 'Successfully enrolled in course';
      alert(message); // You can replace this with a toast notification
      
      // Refresh courses to update enrollment status
      await loadAllCourses();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course. Please try again.'); // You can replace this with a toast notification
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Courses</h1>
          <p className="text-gray-600">Discover and enroll in courses to enhance your skills</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, instructors, or topics..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                         bg-white text-gray-900 placeholder-gray-500 focus:outline-none 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 
                       bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing {filteredCourses.length} of {allCourses.length} courses
          </p>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => handleCourseClick(course.id)}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg 
                         transition-shadow cursor-pointer"
              >
                {/* Course Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 
                              flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpenIcon className="w-12 h-12 text-white" />
                  )}
                </div>

                {/* Course Content */}
                <div className="p-6">
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {course.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2 flex-shrink-0 ${getDifficultyColor(course.difficulty_level)}`}>
                      {course.difficulty_level}
                    </span>
                  </div>

                  {/* Course Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Course Meta */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      <span>{course.instructor_name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{formatDuration(course.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      <span>{course.enrollment_count} enrolled</span>
                    </div>
                    {course.rating > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <StarIcon className="h-4 w-4 mr-1 text-yellow-400" />
                        <span>{course.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Course Tags */}
                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {course.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {course.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs font-medium text-gray-500">
                          +{course.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={(e) => handleEnroll(course.id, e)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      course.is_enrolled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {course.is_enrolled ? (
                      <span className="flex items-center justify-center">
                        <PlayCircleIcon className="h-4 w-4 mr-2" />
                        Continue Learning
                      </span>
                    ) : (
                      'Enroll Now'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <BookOpenIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
