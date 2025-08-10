
import React from 'react';
import { Link } from 'react-router-dom';
import { LearningModule } from '../types';
import { CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/solid'; // Using Heroicons

interface ModuleItemProps {
  module: LearningModule;
  isCompleted: boolean;
  isLocked: boolean; // For future prerequisite logic
  progress: number; // 0-1
}

const ModuleItem: React.FC<ModuleItemProps> = ({ module, isCompleted, isLocked, progress }) => {
  return (
    <Link
      to={isLocked ? '#' : `/module/${module.id}`}
      className={`
        block p-6 rounded-lg shadow-md transition-all duration-300 ease-in-out
        ${isLocked 
            ? 'bg-gray-200 cursor-not-allowed opacity-60' 
            : 'bg-white hover:shadow-xl hover:scale-[1.02]'}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-xl font-semibold ${isLocked ? 'text-gray-500' : 'text-[#005acd]'}`}>{module.title}</h3>
        {isCompleted && <CheckCircleIcon className="h-7 w-7 text-green-500" />}
        {isLocked && !isCompleted && <LockClosedIcon className="h-7 w-7 text-gray-400" />}
      </div>
      <p className={`text-sm mb-3 ${isLocked ? 'text-gray-500' : 'text-gray-600'}`}>{module.description}</p>
      <div className="flex justify-between items-center text-xs mb-3">
        <span className={isLocked ? 'text-gray-400' : 'text-gray-500'}>Est. Time: {module.estimatedTime}</span>
      </div>
      {!isLocked && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
          <div 
            className={`h-1.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-[#0093cb]'}`} 
            style={{ width: `${progress * 100}%` }}
          ></div>
        </div>
      )}
    </Link>
  );
};

export default ModuleItem;
