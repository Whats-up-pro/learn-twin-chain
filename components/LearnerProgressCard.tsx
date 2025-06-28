import React from 'react';
import { ClockIcon, ChartBarIcon, UserIcon } from '@heroicons/react/24/outline';
import { LearnerProgress } from '../types';

interface LearnerProgressCardProps {
  learner: LearnerProgress;
  onViewDetails: (learner: LearnerProgress) => void;
}

const LearnerProgressCard: React.FC<LearnerProgressCardProps> = ({ learner, onViewDetails }) => {
  const progressPercentage = (learner.courseProgress.completedModules / learner.courseProgress.totalModules) * 100;
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {learner.learnerName.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{learner.learnerName}</h3>
            <p className="text-sm text-gray-600">Learner ID: {learner.learnerId}</p>
            <div className="flex items-center mt-1">
              <ChartBarIcon className="w-4 h-4 text-gray-400 mr-1" />
              <span className={`text-sm font-semibold ${getScoreColor(learner.courseProgress.averageScore)}`}>
                {learner.courseProgress.averageScore}% Average Score
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="w-4 h-4 mr-1" />
            {new Date(learner.courseProgress.lastActivity).toLocaleDateString()}
          </div>
          <button 
            onClick={() => onViewDetails(learner)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Course Progress</span>
          <span className={`text-sm font-semibold ${getProgressColor(progressPercentage)}`}>
            {Math.round(progressPercentage)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(progressPercentage)}`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>{learner.courseProgress.completedModules} of {learner.courseProgress.totalModules} modules completed</span>
        </div>
      </div>

      {/* Skills Overview */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Overview</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {Math.round(learner.digitalTwin.skills.problemSolving * 100)}%
            </div>
            <div className="text-xs text-gray-600">Problem Solving</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.round(learner.digitalTwin.skills.logicalThinking * 100)}%
            </div>
            <div className="text-xs text-gray-600">Logical Thinking</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {Math.round(learner.digitalTwin.skills.selfLearning * 100)}%
            </div>
            <div className="text-xs text-gray-600">Self Learning</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerProgressCard; 