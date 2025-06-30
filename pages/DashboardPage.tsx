import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  TrophyIcon, 
  CheckCircleIcon,
  EyeIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon,
  SparklesIcon,
  PlayIcon,
  ClockIcon,
  ChartBarIcon,
  BookOpenIcon,
  UserIcon,
  CogIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Nft } from '../types';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const { learnerProfile, digitalTwin, nfts, learningModules } = useAppContext();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const navigate = useNavigate();

  console.log('DashboardPage: learnerProfile:', learnerProfile);
  console.log('DashboardPage: digitalTwin:', digitalTwin);
  console.log('DashboardPage: nfts:', nfts);
  console.log('DashboardPage: learningModules:', learningModules);

  const totalModules = learningModules.length;
  const completedModulesCount = digitalTwin.checkpoints.filter((cp: any) => 
      (digitalTwin.knowledge[cp.module] ?? 0) >= 1 
  ).length;
  
  const overallProgress = totalModules > 0 ? (completedModulesCount / totalModules) * 100 : 0;

  const avatarUrl = learnerProfile && learnerProfile.avatarUrl && learnerProfile.avatarUrl.trim() !== ''
    ? learnerProfile.avatarUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(learnerProfile?.name || 'User')}&background=0ea5e9&color=fff&size=80`;

  const displayName = learnerProfile && learnerProfile.name ? learnerProfile.name : 'User';
  const displayDid = learnerProfile && learnerProfile.did ? learnerProfile.did : '';

  const handleVerifyNft = (nft: Nft) => {
    setIsVerificationModalOpen(true);
    toast.success(`Verifying NFT: ${nft.name}`);
  };

  const handleStartLearning = (moduleId: string) => {
    navigate(`/module/${moduleId}`);
  };

  const handleContinueLearning = () => {
    const incompleteModule = learningModules.find(module => 
      (digitalTwin.knowledge[module.title] ?? 0) < 1
    );
    if (incompleteModule) {
      navigate(`/module/${incompleteModule.id}`);
    } else {
      toast.success('All modules completed! 🎉');
    }
  };

  const handleOpenTutor = () => {
    navigate('/tutor');
  };

  const handleOpenProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center space-x-6">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-24 w-24 rounded-2xl border-4 border-white/20 shadow-xl"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(learnerProfile?.name || 'User')}&background=0ea5e9&color=fff&size=96`;
                }}
              />
              <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                <div className="h-3 w-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">Welcome back, {displayName}! 👋</h1>
              <p className="text-blue-100 text-lg">Ready to continue your learning journey?</p>
              <p className="text-blue-200 text-sm mt-1">DID: <span className="font-mono">{displayDid}</span></p>
            </div>
            <div className="hidden lg:block">
              <div className="text-right">
                <div className="text-3xl font-bold">{overallProgress.toFixed(0)}%</div>
                <div className="text-blue-200">Overall Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={handleContinueLearning}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <PlayIcon className="h-8 w-8" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold">Continue Learning</div>
                <div className="text-blue-100">Resume your progress</div>
              </div>
            </div>
          </button>

          <button
            onClick={handleOpenTutor}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <CogIcon className="h-8 w-8" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold">AI Tutor</div>
                <div className="text-emerald-100">Get help anytime</div>
              </div>
            </div>
          </button>

          <button
            onClick={handleOpenProfile}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <UserIcon className="h-8 w-8" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold">Profile</div>
                <div className="text-purple-100">Manage your data</div>
              </div>
            </div>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Overall Progress" 
            value={`${overallProgress.toFixed(0)}%`} 
            icon={<ArrowTrendingUpIcon className="h-8 w-8 text-blue-500"/>}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard 
            title="Modules Completed" 
            value={`${completedModulesCount}/${totalModules}`} 
            icon={<AcademicCapIcon className="h-8 w-8 text-green-500"/>}
            gradient="from-green-500 to-green-600"
          />
          <StatCard 
            title="NFTs Earned" 
            value={`${nfts.length}`} 
            icon={<SparklesIcon className="h-8 w-8 text-yellow-500"/>}
            gradient="from-yellow-500 to-yellow-600"
          />
          <StatCard 
            title="Learning Streak" 
            value="7 days" 
            icon={<FireIcon className="h-8 w-8 text-orange-500"/>}
            gradient="from-orange-500 to-red-500"
          />
        </div>

        {/* Learning Modules */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <FireIcon className="h-8 w-8 text-orange-500 mr-3" />
              Your Learning Path
            </h2>
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              Python for Beginners
            </div>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {learningModules.map(module => {
            const moduleKnowledge = digitalTwin.knowledge[module.title] ?? 0;
            const isCompleted = moduleKnowledge >= 1;
              const isStarted = moduleKnowledge > 0;
            return (
                <div key={module.id} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">{module.title}</h3>
                    {isCompleted && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Complete</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mb-6 line-clamp-2">{module.description}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-bold text-gray-800">{Math.round(moduleKnowledge * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-gradient-to-r from-green-400 to-green-600' :
                            isStarted ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                            'bg-gradient-to-r from-gray-400 to-gray-600'
                          }`}
                          style={{ width: `${moduleKnowledge * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {module.estimatedTime}
                      </span>
                      {isStarted && (
                        <span className="flex items-center text-blue-600">
                          <StarIcon className="h-4 w-4 mr-1" />
                          {Math.round(moduleKnowledge * 100)}% done
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleStartLearning(module.id)}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : isStarted
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                          : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isCompleted ? '✓ Completed' : isStarted ? 'Continue Learning' : 'Start Learning'}
                    </button>
                  </div>
                </div>
            );
          })}
          </div>
        </div>

        {/* Skills & Knowledge Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skills Development */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <ChartBarIcon className="h-7 w-7 text-green-500 mr-3" />
              Skills Development
            </h2>
            <div className="space-y-6">
              <SkillBar 
                name="Problem Solving" 
                value={digitalTwin.skills.problemSolving} 
                color="from-green-400 to-green-600"
                icon="🧩"
              />
              <SkillBar 
                name="Logical Thinking" 
                value={digitalTwin.skills.logicalThinking} 
                color="from-blue-400 to-blue-600"
                icon="🧠"
              />
              <SkillBar 
                name="Self Learning" 
                value={digitalTwin.skills.selfLearning} 
                color="from-purple-400 to-purple-600"
                icon="📚"
              />
            </div>
          </div>

          {/* Knowledge Areas */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <BookOpenIcon className="h-7 w-7 text-blue-500 mr-3" />
              Knowledge Areas
            </h2>
            <div className="space-y-4">
              {Object.entries(digitalTwin.knowledge).map(([topic, progress]) => (
                <KnowledgeBar 
                  key={topic}
                  name={topic} 
                  value={progress} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <ClockIcon className="h-7 w-7 text-orange-500 mr-3" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            {digitalTwin.checkpoints.slice(-3).reverse().map((checkpoint: any, index: number) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-white/50 rounded-2xl border border-white/20 hover:bg-white/70 transition-all duration-300">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Completed {checkpoint.moduleName || checkpoint.module}</p>
                  <p className="text-sm text-gray-600">Score: {checkpoint.score}% • {new Date(checkpoint.completedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{checkpoint.score}%</div>
                </div>
              </div>
            ))}
            {digitalTwin.checkpoints.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚀</div>
                <p className="text-gray-600 text-lg">No recent activity. Start learning to see your progress!</p>
              </div>
            )}
          </div>
        </div>

        {/* NFT Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <TrophyIcon className="h-7 w-7 text-yellow-500 mr-3" />
            Your Achievements
          </h2>
          {digitalTwin.checkpoints.filter((cp: any) => cp.tokenized).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-gray-600 text-lg">Complete modules to earn NFTs!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {digitalTwin.checkpoints
                .filter((cp: any) => cp.tokenized)
                .map((checkpoint: any) => {
                  const nftCid = checkpoint.nftCid;
                  if (!nftCid) return null;
                  
                  const nft: Nft = {
                    id: checkpoint.nftId || `nft-${checkpoint.moduleId}`,
                    name: `${checkpoint.moduleName || checkpoint.module} Completion`,
                    description: `Certificate for completing ${checkpoint.moduleName || checkpoint.module}`,
                    imageUrl: `https://via.placeholder.com/300x200/0ea5e9/ffffff?text=${encodeURIComponent(checkpoint.moduleName || checkpoint.module)}`,
                    moduleId: checkpoint.moduleId,
                    issuedDate: checkpoint.completedAt,
                    cid: nftCid
                  };
                  
                  return (
                    <div key={nft.id} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">{nft.name}</h3>
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{nft.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {new Date(nft.issuedDate).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleVerifyNft(nft)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>Verify</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Recommended Courses */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <SparklesIcon className="h-8 w-8 text-purple-500 mr-3" />
              Recommended for You
            </h2>
            <div className="text-sm text-gray-600 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full border border-purple-200">
              Based on your progress
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* JavaScript Fundamentals */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl text-white">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Popular</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">JavaScript Fundamentals</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">Master the basics of JavaScript programming with hands-on exercises and real-world projects.</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">8 hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Level</span>
                    <span className="font-medium text-blue-600">Beginner</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Modules</span>
                    <span className="font-medium">6 modules</span>
                  </div>
                </div>
                
                <button className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Start Learning
                </button>
              </div>
            </div>

            {/* Data Science Basics */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl text-white">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Trending</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Data Science Basics</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">Learn data analysis, visualization, and basic machine learning concepts with Python.</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">12 hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Level</span>
                    <span className="font-medium text-green-600">Intermediate</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Modules</span>
                    <span className="font-medium">8 modules</span>
                  </div>
                </div>
                
                <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Start Learning
                </button>
              </div>
            </div>

            {/* Web Development */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-teal-500 opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl text-white">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-teal-600 bg-teal-100 px-2 py-1 rounded-full">New</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Full-Stack Web Development</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">Build complete web applications with React, Node.js, and modern development tools.</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">20 hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Level</span>
                    <span className="font-medium text-orange-600">Advanced</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Modules</span>
                    <span className="font-medium">10 modules</span>
                  </div>
                </div>
                
                <button className="w-full py-3 px-4 bg-gradient-to-r from-green-400 to-teal-500 text-white rounded-xl font-semibold hover:from-green-500 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Start Learning
                </button>
              </div>
            </div>

            {/* Blockchain Development */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400 to-pink-500 opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-400 to-pink-500 rounded-xl text-white">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-pink-600 bg-pink-100 px-2 py-1 rounded-full">Hot</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Blockchain & Smart Contracts</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">Learn Solidity, Ethereum development, and build decentralized applications (DApps).</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">15 hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Level</span>
                    <span className="font-medium text-red-600">Expert</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Modules</span>
                    <span className="font-medium">12 modules</span>
                  </div>
                </div>
                
                <button className="w-full py-3 px-4 bg-gradient-to-r from-indigo-400 to-pink-500 text-white rounded-xl font-semibold hover:from-indigo-500 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Start Learning
                </button>
              </div>
            </div>

            {/* AI & Machine Learning */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400 to-pink-500 opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl text-white">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">Featured</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">AI & Machine Learning</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">Explore artificial intelligence, neural networks, and practical ML applications.</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">18 hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Level</span>
                    <span className="font-medium text-purple-600">Advanced</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Modules</span>
                    <span className="font-medium">14 modules</span>
                  </div>
                </div>
                
                <button className="w-full py-3 px-4 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-xl font-semibold hover:from-red-500 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Start Learning
                </button>
              </div>
            </div>

            {/* Mobile App Development */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400 to-cyan-500 opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl text-white">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Updated</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Mobile App Development</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">Create iOS and Android apps with React Native and modern mobile development practices.</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">16 hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Level</span>
                    <span className="font-medium text-cyan-600">Intermediate</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Modules</span>
                    <span className="font-medium">9 modules</span>
                  </div>
                </div>
                
                <button className="w-full py-3 px-4 bg-gradient-to-r from-emerald-400 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Start Learning
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${isVerificationModalOpen ? '' : 'hidden'}`}>
        <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">NFT Verification</h3>
          <div className="space-y-6">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-2xl">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-semibold text-green-800">Verification Successful</div>
                <div className="text-sm text-green-600">This NFT is authentic</div>
              </div>
            </div>
            <p className="text-gray-600">
              This NFT has been verified on the blockchain and is authentic.
            </p>
            <button
              onClick={() => setIsVerificationModalOpen(false)}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient }) => (
  <div className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/20">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`p-4 bg-gradient-to-br ${gradient} rounded-2xl text-white shadow-lg`}>
      {icon}
      </div>
    </div>
  </div>
);

interface SkillBarProps {
  name: string;
  value: number;
  color: string;
  icon: string;
}

const SkillBar: React.FC<SkillBarProps> = ({ name, value, color, icon }) => (
  <div>
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">{icon}</span>
        <span className="font-semibold text-gray-800">{name}</span>
      </div>
      <span className="font-bold text-gray-800">{Math.round(value * 100)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div 
        className={`h-3 rounded-full bg-gradient-to-r ${color} transition-all duration-1000`}
        style={{ width: `${value * 100}%` }}
      ></div>
    </div>
  </div>
);

interface KnowledgeBarProps {
  name: string;
  value: number;
}

const KnowledgeBar: React.FC<KnowledgeBarProps> = ({ name, value }) => (
    <div>
    <div className="flex justify-between items-center mb-2">
      <span className="font-medium text-gray-800">{name}</span>
      <span className="font-bold text-gray-800">{Math.round(value * 100)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div 
        className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
        style={{ width: `${value * 100}%` }}
      ></div>
    </div>
  </div>
);

export default DashboardPage;
