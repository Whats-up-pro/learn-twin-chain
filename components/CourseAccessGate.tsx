import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';
import { 
  LockClosedIcon, 
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  StarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface CourseAccessGateProps {
  courseId: string;
  difficultyLevel: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const CourseAccessGate: React.FC<CourseAccessGateProps> = ({
  courseId,
  difficultyLevel,
  children,
  fallback
}) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [courseId, difficultyLevel]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const canAccess = await subscriptionService.canAccessCourse(difficultyLevel);
      setHasAccess(canAccess);
    } catch (error) {
      console.error('Failed to check course access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const getUpgradeMessage = () => {
    switch (difficultyLevel) {
      case 'intermediate':
        return {
          title: 'Intermediate Course Access Required',
          message: 'This course requires a Basic or Premium subscription.',
          requiredPlan: 'Basic',
          icon: <StarIcon className="w-8 h-8 text-blue-600" />
        };
      case 'advanced':
        return {
          title: 'Advanced Course Access Required',
          message: 'This course requires a Premium subscription for advanced features.',
          requiredPlan: 'Premium',
          icon: <StarIcon className="w-8 h-8 text-yellow-600" />
        };
      default:
        return {
          title: 'Subscription Required',
          message: 'This course requires a subscription to access.',
          requiredPlan: 'Basic',
          icon: <AcademicCapIcon className="w-8 h-8 text-gray-600" />
        };
    }
  };

  const upgradeInfo = getUpgradeMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {upgradeInfo.icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {upgradeInfo.title}
          </h2>
          <p className="text-gray-600 mb-6">
            {upgradeInfo.message}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center text-blue-700 mb-2">
            <SparklesIcon className="w-5 h-5 mr-2" />
            <span className="font-medium">Upgrade to {upgradeInfo.requiredPlan}</span>
          </div>
          <div className="text-sm text-blue-600">
            {upgradeInfo.requiredPlan === 'Basic' && 'Access to beginner & intermediate courses + AI tutors'}
            {upgradeInfo.requiredPlan === 'Premium' && 'Access to ALL courses + advanced features + mentoring'}
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/subscription"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Upgrade Now
          </Link>
          
          <Link
            to="/courses"
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            Browse Other Courses
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
            <span>30-day money-back guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseAccessGate;
