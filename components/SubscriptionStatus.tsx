import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionService, UserSubscription } from '../services/subscriptionService';
import { 
  ShieldCheckIcon, 
  UserIcon,
  SparklesIcon,
  StarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface SubscriptionStatusProps {
  className?: string;
  showUpgrade?: boolean;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  className = '', 
  showUpgrade = true 
}) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const subscriptionData = await subscriptionService.getCurrentSubscription();
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  if (!subscription?.has_subscription) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium flex items-center">
          <UserIcon className="w-4 h-4 mr-1" />
          Free Plan
        </div>
        {showUpgrade && (
          <Link
            to="/subscription"
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center"
          >
            <SparklesIcon className="w-4 h-4 mr-1" />
            Upgrade
          </Link>
        )}
      </div>
    );
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'basic':
        return <ShieldCheckIcon className="w-4 h-4" />;
      case 'premium':
        return <StarIcon className="w-4 h-4" />;
      default:
        return <ShieldCheckIcon className="w-4 h-4" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'premium':
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'Basic';
      case 'premium':
        return 'Premium';
      default:
        return 'Unknown';
    }
  };

  const daysRemaining = subscription.days_remaining;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center ${getPlanColor(subscription.plan || '')}`}>
        {getPlanIcon(subscription.plan || '')}
        <span className="ml-1">{getPlanBadge(subscription.plan || '')}</span>
        {subscription.plan === 'premium' && (
          <StarIcon className="w-3 h-3 ml-1" />
        )}
      </div>
      
      {isExpiringSoon && (
        <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
          Expires in {daysRemaining} days
        </div>
      )}
      
      {subscription.plan === 'basic' && showUpgrade && (
        <Link
          to="/subscription"
          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 flex items-center"
        >
          <SparklesIcon className="w-3 h-3 mr-1" />
          Upgrade
        </Link>
      )}
    </div>
  );
};

export default SubscriptionStatus;
