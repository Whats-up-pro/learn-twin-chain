import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { 
  AcademicCapIcon, 
  CheckCircleIcon, 
  ShareIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  CogIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { UserRole } from '../types';
import toast from 'react-hot-toast';
import StudentZKPSection from '../components/StudentZKPSection';

const ProfilePage: React.FC = () => {
  const { learnerProfile, digitalTwin, role } = useAppContext();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [learningPreferences, setLearningPreferences] = useState({
    pace: 'adaptive',
    contentType: 'mixed',
    difficultyLevel: 'auto-adjust',
    preferredTime: 'morning',
    studyDuration: '30min'
  });

  console.log('ProfilePage: learnerProfile:', learnerProfile);
  console.log('ProfilePage: digitalTwin:', digitalTwin);
  console.log('ProfilePage: role:', role);

  // Kiểm tra nếu learnerProfile null
  if (!learnerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl p-8 text-center max-w-md mx-4">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Kiểm tra role để xác định các tính năng có sẵn
  const isStudent = role === UserRole.LEARNER;
  const isTeacher = role === UserRole.TEACHER;
  const isEmployer = role === UserRole.EMPLOYER;

  const avatarUrl = learnerProfile.avatarUrl && learnerProfile.avatarUrl.trim() !== ''
    ? learnerProfile.avatarUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(learnerProfile.name || 'User')}&background=0ea5e9&color=fff&size=128`;

  const handleCopyDid = () => {
    if (learnerProfile.did) {
      navigator.clipboard.writeText(learnerProfile.did);
      toast.success('DID copied to clipboard!');
    }
  };

  const handleSimulatedUpdate = async () => {
    try {
      // Simulate API call to update learning preferences
      console.log('Updating learning preferences:', learningPreferences);
      
      // In a real app, you would send this to your backend
      // await fetch('/api/update-learning-preferences', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(learningPreferences)
      // });
      
      toast.success("Learning style preferences updated successfully!");
      setIsUpdateModalOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Update Failed: ${error.message}`);
      } else {
        toast.error("Update Failed: An unknown error occurred.");
      }
    }
  };

  const handlePreferenceChange = (key: string, value: string) => {
    setLearningPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSimulatedVerification = async () => {
    setIsVerificationModalOpen(true);
  };
  
  const handleShareProfile = () => {
    const shareableLink = `${window.location.origin}/profile/verify/${learnerProfile.did}`;
    navigator.clipboard.writeText(shareableLink);
    toast.success("Shareable profile link copied to clipboard!", {duration: 4000});
  }

  const handleStudentOnlyFeature = () => {
    toast.error('This feature is only available for students.', {
      duration: 3000,
      icon: '⚠️'
    });
  };

  // Đếm số module đã hoàn thành
  const completedModules = digitalTwin?.knowledge ? Object.values(digitalTwin.knowledge).filter(v => v >= 1).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5ffff] via-[#bef0ff] to-[#6dd7fd]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#005acd] via-[#0093cb] to-[#6dd7fd] p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 text-center">
            <div className="relative inline-block">
              <img 
                src={avatarUrl}
                alt={learnerProfile.name || 'User'} 
                className="w-32 h-32 rounded-3xl border-4 border-white/20 shadow-xl mx-auto mb-6"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(learnerProfile.name || 'User')}&background=005acd&color=fff&size=128`;
                }}
              />
            </div>
            <h1 className="text-4xl font-bold mb-2">{learnerProfile.name || 'User'}</h1>
            <div className="flex items-center justify-center space-x-2 text-[#bef0ff] mb-4">
              <span className="font-mono text-sm break-all">{learnerProfile.did || 'DID not available'}</span>
              <button onClick={handleCopyDid} title="Copy DID" className="text-white hover:text-[#6dd7fd] transition-colors">
                <AcademicCapIcon className="h-5 w-5"/>
              </button>
            </div>
            
            {/* Role indicator */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
              {isStudent ? '🎓 Student' : isTeacher ? '👨‍🏫 Teacher' : isEmployer ? '💼 Employer' : '❓ Unknown Role'}
            </div>
            
            {digitalTwin && (
              <div className="mt-4 text-blue-100 text-sm">
                <span>Version: {digitalTwin.version || '1.0'}</span>
                <span className="mx-2">•</span>
                <span>Updated: {new Date(digitalTwin.lastUpdated || Date.now()).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Management Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <CogIcon className="h-7 w-7 text-blue-500 mr-3" />
            Profile & Data Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={isStudent ? () => setIsUpdateModalOpen(true) : handleStudentOnlyFeature}
              className={`group relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                isStudent 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!isStudent}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <UserIcon className="h-8 w-8" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold">Update Learning Style</div>
                  <div className="text-sm opacity-90">Customize your preferences</div>
                </div>
              </div>
            </button>

            <button 
              onClick={isStudent ? handleSimulatedVerification : handleStudentOnlyFeature}
              className={`group relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                isStudent 
                  ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!isStudent}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <ShieldCheckIcon className="h-8 w-8" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold">Verify Twin Data</div>
                  <div className="text-sm opacity-90">Check data authenticity</div>
                </div>
              </div>
            </button>
          </div>

          <button 
            onClick={() => {
              if (!isStudent) {
                handleStudentOnlyFeature();
                return;
              }
              if (completedModules < 1) {
                toast.error('You need to complete at least 1 module to share your profile!');
                return;
              }
              handleShareProfile();
            }}
            className={`w-full mt-6 group relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
              isStudent 
                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isStudent}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <ShareIcon className="h-8 w-8" />
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">Share Profile</div>
                <div className="text-sm opacity-90">Generate shareable credentials</div>
              </div>
            </div>
          </button>

          {/* Warning message for non-students */}
          {!isStudent && (
            <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">Student-Only Features</h3>
                  <p className="text-yellow-700 mt-2">
                    The profile management features above are only available for students. Teachers and employers have access to different functionality through their respective dashboards.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Update Learning Style */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${isUpdateModalOpen ? '' : 'hidden'}`}>
        <div 
          className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" 
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #f3f4f6;
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #d1d5db;
                border-radius: 3px;
                transition: background 0.2s ease;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #9ca3af;
              }
            `
          }} />
          <h3 className="text-xl font-bold text-gray-800 mb-4">Update Learning Style</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Customize your learning preferences to improve your educational experience.
            </p>
            
            {/* Learning Pace */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Learning Pace</label>
              <div className="grid grid-cols-3 gap-2">
                {['slow', 'adaptive', 'fast'].map((pace) => (
                  <button
                    key={pace}
                    onClick={() => handlePreferenceChange('pace', pace)}
                    className={`p-2 rounded-lg border-2 transition-all duration-200 text-xs ${
                      learningPreferences.pace === pace
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium capitalize">{pace}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Content Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['visual', 'mixed', 'textual', 'interactive'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handlePreferenceChange('contentType', type)}
                    className={`p-2 rounded-lg border-2 transition-all duration-200 text-xs ${
                      learningPreferences.contentType === type
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium capitalize">{type}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'auto-adjust', 'challenging'].map((level) => (
                  <button
                    key={level}
                    onClick={() => handlePreferenceChange('difficultyLevel', level)}
                    className={`p-2 rounded-lg border-2 transition-all duration-200 text-xs ${
                      learningPreferences.difficultyLevel === level
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium capitalize">{level.replace('-', ' ')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Time */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Study Time</label>
              <div className="grid grid-cols-2 gap-2">
                {['morning', 'afternoon', 'evening', 'night'].map((time) => (
                  <button
                    key={time}
                    onClick={() => handlePreferenceChange('preferredTime', time)}
                    className={`p-2 rounded-lg border-2 transition-all duration-200 text-xs ${
                      learningPreferences.preferredTime === time
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium capitalize">{time}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Study Duration */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Session Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {['15min', '30min', '45min', '60min', '90min', '120min'].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => handlePreferenceChange('studyDuration', duration)}
                    className={`p-2 rounded-lg border-2 transition-all duration-200 text-xs ${
                      learningPreferences.studyDuration === duration
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{duration}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button 
                onClick={() => setIsUpdateModalOpen(false)} 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSimulatedUpdate} 
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Verification */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${isVerificationModalOpen ? '' : 'hidden'}`}>
        <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Digital Twin Verification</h3>
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-2xl">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-semibold text-green-800">Verification Successful</div>
                <div className="text-sm text-green-600">Your data is authentic and verified</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Data Integrity</span>
                <span className="text-green-600 font-semibold">✓ Verified</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Blockchain Status</span>
                <span className="text-green-600 font-semibold">✓ Confirmed</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Last Verified</span>
                <span className="text-gray-800 font-semibold">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsVerificationModalOpen(false)} 
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <StudentZKPSection />
    </div>
  );
};


export default ProfilePage; 