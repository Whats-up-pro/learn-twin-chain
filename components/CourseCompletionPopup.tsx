import React from 'react';
import { XMarkIcon, AcademicCapIcon, TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface CourseCompletionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  onViewCertificate?: () => void;
  onContinueLearning?: () => void;
}

const CourseCompletionPopup: React.FC<CourseCompletionPopupProps> = ({
  isOpen,
  onClose,
  courseTitle,
  onViewCertificate,
  onContinueLearning
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrophyIcon className="w-12 h-12 text-yellow-300" />
            </div>
            <h2 className="text-3xl font-bold mb-2">🎉 Congratulations!</h2>
            <p className="text-xl opacity-90">You've successfully completed the course!</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {courseTitle}
            </h3>
            <div className="flex items-center justify-center space-x-2 text-green-600 mb-6">
              <CheckCircleIcon className="w-8 h-8" />
              <span className="text-lg font-semibold">Course Completed</span>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <AcademicCapIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-900">Certificate Earned</h4>
              <p className="text-sm text-blue-700">Your certificate is ready!</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <SparklesIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-900">Skills Mastered</h4>
              <p className="text-sm text-green-700">All lessons completed</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <TrophyIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-purple-900">Achievement Unlocked</h4>
              <p className="text-sm text-purple-700">Course completion badge</p>
            </div>
          </div>

          {/* Completion Stats */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h4 className="font-semibold text-gray-900 mb-4 text-center">Course Completion Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-gray-600">Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">✓</div>
                <div className="text-sm text-gray-600">All Quizzes Passed</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {onViewCertificate && (
              <button
                onClick={onViewCertificate}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <AcademicCapIcon className="w-5 h-5" />
                <span>View Certificate</span>
              </button>
            )}
            {onContinueLearning && (
              <button
                onClick={onContinueLearning}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <SparklesIcon className="w-5 h-5" />
                <span>Continue Learning</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCompletionPopup;
