import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const InteractiveDemo: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <InformationCircleIcon className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-blue-900">Interactive Features Demo</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start">
          <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Employer Features:</p>
            <ul className="text-sm text-blue-800 ml-4 mt-1 space-y-1">
              <li>• Create, edit, and delete job postings</li>
              <li>• Update candidate application status</li>
              <li>• View candidate profiles and match scores</li>
              <li>• Real-time form validation and feedback</li>
            </ul>
          </div>
        </div>
        
        <div className="flex items-start">
          <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Teacher Features:</p>
            <ul className="text-sm text-blue-800 ml-4 mt-1 space-y-1">
              <li>• Create, edit, and delete courses</li>
              <li>• Publish/unpublish courses</li>
              <li>• View detailed learner progress</li>
              <li>• Send messages to learners</li>
              <li>• Track skills and knowledge areas</li>
            </ul>
          </div>
        </div>
        
        <div className="flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Note:</p>
            <p className="text-sm text-blue-800 ml-4 mt-1">
              This is a demo with mock data. All interactions are simulated and will show toast notifications.
              In a real application, these would connect to backend APIs and databases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDemo; 