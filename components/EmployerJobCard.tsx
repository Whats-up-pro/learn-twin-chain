import React from 'react';
import { EyeIcon, PencilIcon, TrashIcon, MapPinIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { JobPosting } from '../types';

interface EmployerJobCardProps {
  job: JobPosting;
  onView: (job: JobPosting) => void;
  onEdit: (job: JobPosting) => void;
  onDelete: (jobId: string) => void;
}

const EmployerJobCard: React.FC<EmployerJobCardProps> = ({ job, onView, onEdit, onDelete }) => {
  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-blue-100 text-blue-800';
      case 'part-time': return 'bg-green-100 text-green-800';
      case 'contract': return 'bg-purple-100 text-purple-800';
      case 'internship': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
          <p className="text-gray-600 mb-3">{job.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center">
              <MapPinIcon className="w-4 h-4 mr-1" />
              {job.location}
            </div>
            {job.salary && (
              <div className="flex items-center">
                <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                {job.salary}
              </div>
            )}
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" />
              {job.type}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {job.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Posted {new Date(job.postedAt).toLocaleDateString()}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getJobTypeColor(job.type)}`}>
              {job.type.replace('-', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onView(job)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          <EyeIcon className="w-4 h-4" />
          View
        </button>
        <button
          onClick={() => onEdit(job)}
          className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium"
        >
          <PencilIcon className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onDelete(job.id)}
          className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
        >
          <TrashIcon className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default EmployerJobCard; 