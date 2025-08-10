import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { 
  AcademicCapIcon, 
  BriefcaseIcon, 
  UserIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: UserRole.LEARNER,
      title: 'Learner',
      description: 'Access personalized learning modules, AI tutor, and track your progress with digital twin technology.',
      icon: UserIcon,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      features: [
        'Personalized learning paths',
        'AI-powered tutoring',
        'Progress tracking',
        'Digital twin insights'
      ],
      route: '/dashboard'
    },
    {
      id: UserRole.TEACHER,
      title: 'Teacher',
      description: 'Create courses, manage learners, and monitor their progress with detailed analytics.',
      icon: AcademicCapIcon,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      features: [
        'Course creation & management',
        'Learner progress tracking',
        'Analytics & insights',
        'Digital twin verification'
      ],
      route: '/teacher'
    },
    {
      id: UserRole.EMPLOYER,
      title: 'Employer',
      description: 'Find qualified candidates, post job opportunities, and verify skills through digital twin technology.',
      icon: BriefcaseIcon,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      features: [
        'Job posting management',
        'Candidate matching',
        'Skill verification',
        'Digital twin assessment'
      ],
      route: '/employer'
    }
  ];

  const handleRoleSelection = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5ffff] to-[#bef0ff]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#005acd] mb-4">
            Welcome to LearnTwinChain
          </h1>
          <p className="text-xl text-[#0093cb] max-w-2xl mx-auto">
            Choose your role to access personalized features and start your journey with AI-powered learning and digital twin technology.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <div
                key={role.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                onClick={() => handleRoleSelection(role.route)}
              >
                {/* Card Header */}
                <div className={`${role.color} ${role.hoverColor} rounded-t-xl p-8 text-white text-center transition-colors`}>
                  <IconComponent className="w-16 h-16 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">{role.title}</h2>
                  <p className="text-white/90">{role.description}</p>
                </div>

                {/* Card Body */}
                <div className="p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features:</h3>
                  <ul className="space-y-3">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <div className={`w-2 h-2 ${role.color} rounded-full mr-3`}></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    className={`w-full mt-6 ${role.color} ${role.hoverColor} text-white font-semibold py-3 px-6 rounded-lg transition-colors`}
                  >
                    Continue as {role.title}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Choose LearnTwinChain?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Learning</h3>
                <p className="text-gray-600 text-sm">
                  Personalized learning experiences powered by advanced AI technology
                </p>
              </div>
              <div className="text-center">
                <UserGroupIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Digital Twin Technology</h3>
                <p className="text-gray-600 text-sm">
                  Comprehensive skill and knowledge tracking with blockchain verification
                </p>
              </div>
              <div className="text-center">
                <BuildingOfficeIcon className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Trusted Ecosystem</h3>
                <p className="text-gray-600 text-sm">
                  Connect learners, teachers, and employers in a secure, verified environment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage; 