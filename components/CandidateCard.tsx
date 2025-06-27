import React from 'react';
import { StarIcon, ClockIcon, UserIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Candidate } from '../types';

interface CandidateCardProps {
  candidate: Candidate;
  onViewProfile: (candidate: Candidate) => void;
  onUpdateStatus: (candidateId: string, status: string) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onViewProfile, onUpdateStatus }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchScoreColor = (score: number) => {
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
              {candidate.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
            <p className="text-sm text-gray-600">DID: {candidate.learnerDid}</p>
            <div className="flex items-center mt-1">
              <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
              <span className={`text-sm font-semibold ${getMatchScoreColor(candidate.matchScore)}`}>
                {candidate.matchScore}% Match Score
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
            {candidate.status}
          </span>
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="w-4 h-4 mr-1" />
            {new Date(candidate.appliedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Skills Overview */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Overview</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {Math.round(candidate.digitalTwin.skills.problemSolving * 100)}%
            </div>
            <div className="text-xs text-gray-600">Problem Solving</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.round(candidate.digitalTwin.skills.logicalThinking * 100)}%
            </div>
            <div className="text-xs text-gray-600">Logical Thinking</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {Math.round(candidate.digitalTwin.skills.selfLearning * 100)}%
            </div>
            <div className="text-xs text-gray-600">Self Learning</div>
          </div>
        </div>
      </div>

      {/* Knowledge Areas */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Knowledge Areas</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(candidate.digitalTwin.knowledge).slice(0, 4).map(([topic, progress]) => (
            <span key={topic} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              {topic}: {Math.round(progress * 100)}%
            </span>
          ))}
          {Object.keys(candidate.digitalTwin.knowledge).length > 4 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              +{Object.keys(candidate.digitalTwin.knowledge).length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Learning Behavior */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Learning Behavior</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Time Spent:</span>
            <span className="font-medium">{candidate.digitalTwin.behavior.timeSpent}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Quiz Accuracy:</span>
            <span className="font-medium">{Math.round(candidate.digitalTwin.behavior.quizAccuracy * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Learning Style:</span>
            <span className="font-medium capitalize">{candidate.digitalTwin.behavior.preferredLearningStyle}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex gap-2">
          <select 
            value={candidate.status}
            onChange={(e) => onUpdateStatus(candidate.id, e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="hired">Hired</option>
          </select>
        </div>
        <button 
          onClick={() => onViewProfile(candidate)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          View Full Profile
        </button>
      </div>
    </div>
  );
};

export default CandidateCard; 