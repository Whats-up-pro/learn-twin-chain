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
import { useTranslation } from '../src/hooks/useTranslation';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
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
          <h1 className="text-2xl font-bold text-gray-700 mb-4">{t('pages.profilePage.profileNotFound')}</h1>
          <p className="text-gray-600">{t('pages.profilePage.pleaseLogInToViewYourProfile')}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 text-center">
            <div className="relative inline-block">
              <img 
                src={avatarUrl}
                alt={learnerProfile.name || 'User'} 
                className="w-32 h-32 rounded-3xl border-4 border-white/20 shadow-xl mx-auto mb-6"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(learnerProfile.name || 'User')}&background=0ea5e9&color=fff&size=128`;
                }}
              />
            </div>
            <h1 className="text-4xl font-bold mb-2">{learnerProfile.name || 'User'}</h1>
            <div className="flex items-center justify-center space-x-2 text-blue-100 mb-4">
              <span className="font-mono text-sm break-all">{learnerProfile.did || 'DID not available'}</span>
              <button onClick={handleCopyDid} title="Copy DID" className="text-white hover:text-blue-200 transition-colors">
                <AcademicCapIcon className="h-5 w-5"/>
              </button>
            </div>
            
            {/* Role indicator */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
              {isStudent ? '🎓 ' + t('pages.profilePage.Student') : isTeacher ? '👨‍🏫 ' + t('pages.profilePage.Teacher') : isEmployer ? '💼 ' + t('pages.profilePage.Employer') : '❓ ' + t('pages.profilePage.Unknown Role')}
            </div>
            
            {digitalTwin && (
              <div className="mt-4 text-blue-100 text-sm">
                <span>{t('pages.profilePage.Version')} {digitalTwin.version || '1.0'}</span>
                <span className="mx-2">•</span>
                <span>{t('pages.profilePage.Update')} {new Date(digitalTwin.lastUpdated || Date.now()).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Management Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <CogIcon className="h-7 w-7 text-blue-500 mr-3" />
            {t('pages.profilePage.Profile & Data Management')}
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
                  <div className="text-xl font-bold">{t('pages.profilePage.UpdateLearningStyle')}</div>
                  <div className="text-sm opacity-90">{t('pages.profilePage.CustomizeYourPreferences')}</div>
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
                  <div className="text-xl font-bold">{t('pages.profilePage.VerifyTwinData')}</div>
                  <div className="text-sm opacity-90">{t('pages.profilePage.CheckDataAuthenticity')}</div>
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
                toast.error(t('pages.profilePage.YouNeedToComplete'));
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
                <div className="text-xl font-bold">{t('pages.profilePage.ShareProfile')}</div>
                <div className="text-sm opacity-90">{t('pages.profilePage.GenerateShareableCredentials')}</div>
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
                  <h3 className="text-lg font-semibold text-yellow-800">{t('pages.profilePage.StudentOnlyFeatures')}</h3>
                  <p className="text-yellow-700 mt-2">
                    {t('pages.profilePage.TheProfileManagementFeatures')}
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
          <h3 className="text-xl font-bold text-gray-800 mb-4">{t('pages.profilePage.UpdateLearningStyle')}</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('pages.profilePage.CustomizeYourPreferencesToImprove')}
            </p>
            
            {/* Learning Pace */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('pages.profilePage.LearningPace')}</label>
              <div className="grid grid-cols-3 gap-2">
                {[t('pages.profilePage.slow'), t('pages.profilePage.adaptive'), t('pages.profilePage.fast')].map((pace) => (
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
              <label className="block text-sm font-medium text-gray-700">{t('pages.profilePage.Content Type')}</label>
              <div className="grid grid-cols-2 gap-2">
                {[t('pages.profilePage.visual'), t('pages.profilePage.mixed'), t('pages.profilePage.textual'), t('pages.profilePage.interactive')].map((type) => (
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
              <label className="block text-sm font-medium text-gray-700">{t('pages.profilePage.Difficulty Level')}</label>
              <div className="grid grid-cols-3 gap-2">
                {[t('pages.profilePage.easy'), t('pages.profilePage.auto-adjust'), t('pages.profilePage.challenging')].map((level) => (
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
              <label className="block text-sm font-medium text-gray-700">{t('pages.profilePage.Study Time')}</label>
              <div className="grid grid-cols-2 gap-2">
                {[t('pages.profilePage.morning'), t('pages.profilePage.afternoon'), t('pages.profilePage.evening'), t('pages.profilePage.night')].map((time) => (
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
              <label className="block text-sm font-medium text-gray-700">{t('pages.profilePage.Session Duration')}</label>
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
                {t('pages.profilePage.Cancel')}
              </button>
              <button 
                onClick={handleSimulatedUpdate} 
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm"
              >
                {t('pages.profilePage.Update2')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Verification */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${isVerificationModalOpen ? '' : 'hidden'}`}>
        <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('pages.profilePage.DigitalTwinVerification')}</h3>
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-2xl">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-semibold text-green-800">{t('pages.profilePage.VerificationSuccessful')}</div>
                <div className="text-sm text-green-600">{t('pages.profilePage.YourDataIsAuthenticAndVerified')}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">{t('pages.profilePage.DataIntegrity')}</span>
                <span className="text-green-600 font-semibold">✓ {t('pages.profilePage.Verified')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">{t('pages.profilePage.BlockchainStatus')}</span>
                <span className="text-green-600 font-semibold">✓ {t('pages.profilePage.Confirmed')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">{t('pages.profilePage.LastVerified')}</span>
                <span className="text-gray-800 font-semibold">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsVerificationModalOpen(false)} 
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {t('pages.profilePage.Close')}
            </button>
          </div>
        </div>
      </div>

      <StudentZKPSection />
    </div>
  );
};


export default ProfilePage; 