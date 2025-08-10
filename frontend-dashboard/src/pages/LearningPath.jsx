/**
 * Learning Path Page - Course Browser and Progress Tracking
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { courseService } from '../services/courseService';

export default function LearningPath() {
  const { isAuthenticated, hasConnectedWallet, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    difficulty_level: '',
    institution: '',
    tags: []
  });

  useEffect(() => {
    loadCourses();
  }, [searchQuery, filters]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.searchCourses(searchQuery, filters);
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    if (!isAuthenticated) {
      alert('Please sign in to enroll in courses');
      return;
    }

    if (!hasConnectedWallet) {
      alert('Please connect your wallet to enroll in courses');
      return;
    }

    try {
      await courseService.enrollInCourse(courseId);
      alert('Successfully enrolled!');
      // Refresh courses to update enrollment status
      loadCourses();
    } catch (error) {
      alert('Enrollment failed: ' + error.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-[#005acd] mb-4">
          Sign in to access learning paths
        </h2>
        <p className="text-[#0093cb]">
          Create an account to browse courses and track your progress
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-[#005acd] mb-2">
          Learning Paths
        </h1>
        <p className="text-[#0093cb]">
          Discover courses and build your skills with blockchain-verified certificates
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
            />
          </div>
          <div>
            <select
              value={filters.difficulty_level}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty_level: e.target.value }))}
              className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Institution"
              value={filters.institution}
              onChange={(e) => setFilters(prev => ({ ...prev, institution: e.target.value }))}
              className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
            />
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white shadow rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-[#bef0ff] rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-[#bef0ff] rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-[#bef0ff] rounded mb-4"></div>
              <div className="h-8 bg-[#bef0ff] rounded"></div>
            </div>
          ))
        ) : courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard
              key={course.course_id}
              course={course}
              onEnroll={() => handleEnroll(course.course_id)}
              canEnroll={hasConnectedWallet}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-[#0093cb]">No courses found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, onEnroll, canEnroll }) {
  const getDifficultyColor = (level) => {
    const colors = {
      'beginner': 'bg-[#bef0ff] text-[#005acd]',
      'intermediate': 'bg-[#6dd7fd] text-[#005acd]',
      'advanced': 'bg-[#0093cb] text-white'
    };
    return colors[level] || 'bg-[#f5ffff] text-[#005acd]';
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-[#005acd]">
            {course.title}
          </h3>
          {course.completion_nft_enabled && (
            <span className="text-[#005acd]" title="NFT Certificate Available">
              🏆
            </span>
          )}
        </div>
        
        <p className="text-[#0093cb] text-sm mb-4 line-clamp-3">
          {course.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#0093cb]">Institution:</span>
            <span className="font-medium">{course.institution}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#0093cb]">Duration:</span>
            <span className="font-medium">
              {course.metadata?.estimated_hours || 'N/A'} hours
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#0093cb]">Level:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.metadata?.difficulty_level)}`}>
              {course.metadata?.difficulty_level || 'Not specified'}
            </span>
          </div>
        </div>

        {course.metadata?.tags && course.metadata.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {course.metadata.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-[#bef0ff] text-[#005acd] text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {course.metadata.tags.length > 3 && (
                <span className="px-2 py-1 bg-[#f5ffff] text-[#005acd] text-xs rounded-full">
                  +{course.metadata.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onEnroll}
          disabled={!canEnroll}
          className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
            canEnroll
              ? 'bg-[#005acd] hover:bg-[#0093cb] text-white'
              : 'bg-[#bef0ff] text-[#0093cb] cursor-not-allowed'
          }`}
        >
          {canEnroll ? 'Enroll Now' : 'Connect Wallet to Enroll'}
        </button>
      </div>
    </div>
  );
}