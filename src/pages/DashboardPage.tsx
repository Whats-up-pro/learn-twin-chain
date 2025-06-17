import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import ModuleItem from '../components/ModuleItem';
import NftCard from '../components/NftCard';
import ProgressBar from '../components/ProgressBar';
import { ArrowTrendingUpIcon, AcademicCapIcon, SparklesIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import { simulateVerifyTwinData } from '../../services/digitalTwinService';
import type { VerificationResult, LearningModule } from '../../types';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const { user, digitalTwin, modules } = useAppContext();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<VerificationResult | null>(null);

  if (!digitalTwin || !user) {
    return <div>Loading...</div>;
  }

  const totalModules = modules.length;
  const completedModulesCount = digitalTwin.checkpoints.filter(cp => 
      (digitalTwin.knowledge[cp.module] ?? 0) >= 1 
  ).length;
  
  const overallProgress = totalModules > 0 ? (completedModulesCount / totalModules) * 100 : 0;

  const handleVerifyNft = async (nftCid: string) => {
    const checkpoint = digitalTwin.checkpoints.find(cp => cp.nftCid === nftCid);
    if (!checkpoint) {
      toast.error("Could not find corresponding checkpoint for this NFT (Simulated).");
      return;
    }

    const result = await simulateVerifyTwinData(digitalTwin, checkpoint.nftCid!, digitalTwin.learnerDid);
    setVerificationDetails(result);
    setIsVerificationModalOpen(true);
  };
  
  const knowledgeEntries = Object.entries(digitalTwin.knowledge);

  return (
    <div className="space-y-8">
      <header className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <img src={user.avatarUrl} alt={user.name} className="h-20 w-20 rounded-full border-4 border-sky-500" />
          <div>
            <h1 className="text-3xl font-bold text-sky-700">Welcome back, {user.name}!</h1>
            <p className="text-gray-600">Your learning journey continues here. DID: <span className="font-mono text-xs">{user.did}</span></p>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Overall Progress" value={`${overallProgress.toFixed(0)}%`} icon={<ArrowTrendingUpIcon className="h-8 w-8 text-sky-500"/>} />
        <StatCard title="Modules Completed" value={`${completedModulesCount}/${totalModules}`} icon={<AcademicCapIcon className="h-8 w-8 text-green-500"/>} />
        <StatCard title="NFTs Earned" value={`${digitalTwin.checkpoints.length}`} icon={<SparklesIcon className="h-8 w-8 text-yellow-500"/>} />
        <StatCard title="Avg. Quiz Accuracy" value={`${(digitalTwin.behavior.quizAccuracy * 100).toFixed(0)}%`} icon={<PuzzlePieceIcon className="h-8 w-8 text-indigo-500"/>} />
      </section>

      {/* Learning Modules Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Learning Path: Python for Beginners</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module: LearningModule) => {
            const moduleKnowledge = digitalTwin.knowledge[module.title] ?? 0;
            const isCompleted = moduleKnowledge >= 1;
            return (
              <ModuleItem 
                key={module.id} 
                module={module} 
                isCompleted={isCompleted} 
                isLocked={false}
                progress={moduleKnowledge}
              />
            );
          })}
        </div>
      </section>

      {/* Digital Twin Snapshot Section */}
      <section className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Digital Twin Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-sky-700 mb-2">Knowledge Areas</h3>
            {knowledgeEntries.length > 0 ? knowledgeEntries.map(([topic, progress]) => (
              <ProgressBar key={topic} label={topic} progress={progress * 100} />
            )) : <p className="text-sm text-gray-500">No knowledge areas tracked yet.</p>}
          </div>
          <div>
            <h3 className="text-lg font-medium text-sky-700 mb-2">Skills Development</h3>
            <div className="space-y-4">
              <ProgressBar 
                progress={digitalTwin.skills.problemSolving * 100} 
                label="Problem Solving" 
                color="blue"
              />
              <ProgressBar 
                progress={digitalTwin.skills.logicalThinking * 100} 
                label="Logical Thinking" 
                color="green"
              />
              <ProgressBar 
                progress={digitalTwin.skills.selfLearning * 100} 
                label="Self Learning" 
                color="purple"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">Last Updated: {new Date(digitalTwin.lastUpdated).toLocaleString()} (Version: {digitalTwin.version})</p>
      </section>

      {/* NFTs Earned Section */}
      {digitalTwin.checkpoints.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Achievements (NFTs)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {digitalTwin.checkpoints.map((checkpoint) => (
              <NftCard 
                key={checkpoint.nftId} 
                nft={{
                  id: checkpoint.nftId!,
                  title: checkpoint.module,
                  description: `Completed ${checkpoint.module} module`,
                  imageUrl: '/nft-placeholder.png',
                  tokenId: checkpoint.nftId!,
                  earnedAt: checkpoint.completedAt,
                  userId: digitalTwin.learnerDid
                }} 
                onVerify={handleVerifyNft} 
              />
            ))}
          </div>
        </section>
      )}

      <Modal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)} title="NFT/Data Verification (Simulated)">
        {verificationDetails && (
          <div className="space-y-3">
            <p className={`font-semibold ${verificationDetails.integrity && verificationDetails.authenticity && verificationDetails.provenance ? 'text-green-600' : 'text-red-600'}`}>
              {verificationDetails.message}
            </p>
            <p className="text-sm text-gray-700"><strong>Checked CID:</strong> <span className="font-mono text-xs">{verificationDetails.details?.checkedCid}</span></p>
            <p className="text-sm text-gray-700"><strong>Owner DID:</strong> <span className="font-mono text-xs">{verificationDetails.details?.ownerDid}</span></p>
            <p className="text-sm text-gray-700"><strong>Data Timestamp:</strong> {verificationDetails.details?.timestamp ? new Date(verificationDetails.details.timestamp).toLocaleString() : 'N/A'}</p>
            <ul className="text-xs list-disc list-inside text-gray-600">
              <li>Integrity Check: {verificationDetails.integrity ? 'Passed ✅' : 'Failed ❌'}</li>
              <li>Authenticity Check: {verificationDetails.authenticity ? 'Passed ✅' : 'Failed ❌'}</li>
              <li>Provenance Check: {verificationDetails.provenance ? 'Passed ✅' : 'Failed ❌'}</li>
            </ul>
            <p className="text-xs italic text-gray-500 mt-2">This is a simulated verification process for demonstration.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
  <div className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4 hover:shadow-xl transition-shadow duration-300">
    <div className="p-3 bg-sky-100 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

export default DashboardPage;
