import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';
import { 
  LockClosedIcon, 
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  StarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface FeatureAccessGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredPlan?: 'basic' | 'premium';
}

const FeatureAccessGate: React.FC<FeatureAccessGateProps> = ({
  feature,
  children,
  fallback,
  requiredPlan
}) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [feature]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const canAccess = await subscriptionService.hasFeatureAccess(feature);
      setHasAccess(canAccess);
    } catch (error) {
      console.error('Failed to check feature access:', error);
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

  const getFeatureInfo = () => {
    const featureMap: Record<string, { title: string; description: string; icon: React.ReactNode; plan: string }> = {
      'advanced_ai_tutor': {
        title: 'Advanced AI Tutor Access',
        description: 'Access to GPT-4o and Gemini 2.0 Pro with advanced features.',
        icon: <BoltIcon className="w-8 h-8 text-purple-600" />,
        plan: 'Premium'
      },
      'ai_queries': {
        title: 'AI Query Limit Reached',
        description: 'You have reached your daily AI query limit.',
        icon: <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />,
        plan: 'Basic'
      },
      '4k_video': {
        title: '4K Video Quality',
        description: 'Premium video quality requires a Premium subscription.',
        icon: <StarIcon className="w-8 h-8 text-yellow-600" />,
        plan: 'Premium'
      },
      'mentoring_sessions': {
        title: 'Private Mentoring Sessions',
        description: 'One-on-one mentoring with Web3 experts requires Premium.',
        icon: <AcademicCapIcon className="w-8 h-8 text-yellow-600" />,
        plan: 'Premium'
      },
      'lab_access': {
        title: 'Advanced Sandbox Lab',
        description: 'Access to advanced development environments requires Premium.',
        icon: <BoltIcon className="w-8 h-8 text-blue-600" />,
        plan: 'Premium'
      },
      'early_access': {
        title: 'Early Access Features',
        description: 'Get early access to new courses and features with Premium.',
        icon: <SparklesIcon className="w-8 h-8 text-purple-600" />,
        plan: 'Premium'
      }
    };

    return featureMap[feature] || {
      title: 'Feature Access Required',
      description: 'This feature requires a subscription.',
      icon: <AcademicCapIcon className="w-8 h-8 text-gray-600" />,
      plan: requiredPlan || 'Basic'
    };
  };

  const featureInfo = getFeatureInfo();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {featureInfo.icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {featureInfo.title}
          </h2>
          <p className="text-gray-600 mb-6">
            {featureInfo.description}
          </p>
        </div>

        <div className={`border rounded-lg p-4 mb-6 ${
          featureInfo.plan === 'Premium' 
            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className={`flex items-center justify-center ${
            featureInfo.plan === 'Premium' ? 'text-orange-700' : 'text-blue-700'
          } mb-2`}>
            <SparklesIcon className="w-5 h-5 mr-2" />
            <span className="font-medium">Upgrade to {featureInfo.plan}</span>
          </div>
          <div className={`text-sm ${
            featureInfo.plan === 'Premium' ? 'text-orange-600' : 'text-blue-600'
          }`}>
            {featureInfo.plan === 'Basic' && 'Access to AI tutors, beginner courses, and basic features'}
            {featureInfo.plan === 'Premium' && 'Access to ALL features, advanced AI, 4K videos, and mentoring'}
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/subscription"
            className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center ${
              featureInfo.plan === 'Premium'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Upgrade to {featureInfo.plan}
          </Link>
          
          <Link
            to="/dashboard"
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            Back to Dashboard
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

export default FeatureAccessGate;
