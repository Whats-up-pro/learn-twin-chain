
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { UpdateTwinPayload, VerificationResult, KnowledgeArea, LearningCheckpoint, DigitalTwin } from '../types';
import { simulateUpdateTwin, simulateVerifyTwinData, simulateFetchTwinByDid } from '../services/digitalTwinService';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { DocumentDuplicateIcon, CheckBadgeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const ProfilePage: React.FC = () => {
  const { learnerProfile, digitalTwin, updateDigitalTwin: contextUpdateDigitalTwin } = useAppContext();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<VerificationResult | null>(null);
  
  // Example update payload structure - simplified for demo
  const [mockProgressUpdate, setMockProgressUpdate] = useState<KnowledgeArea>({ 'Functions': 0.8 });
  const [mockLogUpdate, setMockLogUpdate] = useState({ last_llm_session: new Date().toISOString(), preferred_learning_style: 'hands-on' });


  const handleCopyDid = () => {
    navigator.clipboard.writeText(learnerProfile.did);
    toast.success('DID copied to clipboard!');
  };

  const handleSimulatedUpdate = async () => {
    const payload: UpdateTwinPayload = {
      twin_id: learnerProfile.did,
      owner_did: learnerProfile.did, // In real app, this would be part of signed request
      learning_state: {
        progress: mockProgressUpdate,
        // checkpoint_history: digitalTwin.checkpoints // or provide a new history
      },
      interaction_logs: mockLogUpdate
    };

    try {
      // Use the service directly for simulation, then update context
      const updatedTwinFromService = await simulateUpdateTwin(digitalTwin, payload);
      // Now update the context with the result from the simulated service
      // This is a bit redundant for the current setup but mimics a real API flow
      await contextUpdateDigitalTwin(payload, "Simulated profile update");

      // For more complex state changes not covered by contextUpdateDigitalTwin, update manually:
      // setDigitalTwin(updatedTwinFromService); // If context doesn't handle all aspects
      toast.success("Profile data and Digital Twin updated (Simulated).");
      setIsUpdateModalOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Simulated Update Failed: ${error.message}`);
      } else {
        toast.error("Simulated Update Failed: An unknown error occurred.");
      }
    }
  };
  
  const handleSimulatedVerification = async () => {
    // Simulate fetching data from IPFS (using current DT state as the "fetched" data)
    // and a mock CID. In a real app, this CID would come from an NFT or a blockchain record.
    const mockCid = digitalTwin.checkpoints.length > 0 
      ? digitalTwin.checkpoints[digitalTwin.checkpoints.length - 1].nftCid || `QmSimulatedTwinData${Date.now().toString(36)}`
      : `QmSimulatedTwinData${Date.now().toString(36)}`;

    const result = await simulateVerifyTwinData(digitalTwin, mockCid, learnerProfile.did);
    setVerificationDetails(result);
    setIsVerificationModalOpen(true);
  };
  
  const handleShareProfile = () => {
    // Simulate ZKP or selective disclosure by just showing a message
    // A real implementation would involve generating a proof or a verifiable credential
    const shareableLink = `${window.location.origin}${window.location.pathname}#/profile/verify/${learnerProfile.did}`; // Mock link
    navigator.clipboard.writeText(shareableLink);
    toast.success("Mock 'Shareable Profile Link' copied! (Simulated ZKP/VC)", {duration: 4000});
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="bg-white shadow-lg rounded-xl p-8 text-center">
        <img 
          src={learnerProfile.avatarUrl} 
          alt={learnerProfile.name} 
          className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-sky-500 shadow-md"
        />
        <h1 className="text-3xl font-bold text-sky-700">{learnerProfile.name}</h1>
        <div className="mt-2 flex items-center justify-center space-x-2 text-gray-600">
          <span className="font-mono text-sm break-all">{learnerProfile.did}</span>
          <button onClick={handleCopyDid} title="Copy DID" className="text-sky-500 hover:text-sky-700">
            <DocumentDuplicateIcon className="h-5 w-5"/>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">Version: {digitalTwin.version}, Last Updated: {new Date(digitalTwin.lastUpdated).toLocaleString()}</p>
      </header>

      <section className="bg-white shadow-lg rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Profile & Data Management</h2>
        
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <button 
            onClick={() => setIsUpdateModalOpen(true)}
            className="w-full sm:w-auto flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <CheckBadgeIcon className="h-5 w-5"/>
            <span>Update Twin Data (Simulated)</span>
          </button>
          <button 
            onClick={handleSimulatedVerification}
            className="w-full sm:w-auto flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ShieldCheckIcon className="h-5 w-5"/>
            <span>Verify Twin Data (Simulated)</span>
          </button>
        </div>
         <button 
            onClick={handleShareProfile}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0 0H7.126c-.092 0-.181.015-.26.042A2.253 2.253 0 0 1 5.126 13.5V17.25a2.25 2.25 0 0 0 2.25 2.25h1.5a2.25 2.25 0 0 0 2.25-2.25V13.5A2.25 2.25 0 0 0 9.375 11.25H7.217Z M12.75 10.907a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0 0h-.092c-.092 0-.181.015-.26.042a2.252 2.252 0 0 1-1.606 2.51H12.75c.995 0 1.8.776 1.8 1.729V17.25a2.25 2.25 0 0 1-2.25 2.25h-1.5a2.25 2.25 0 0 1-2.25-2.25V13.5A2.25 2.25 0 0 1 9.375 11.25h.217" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.072 10.907a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0 0h.092c.092 0 .181.015.26.042a2.253 2.253 0 0 0 1.606 2.51H16.072c-.995 0-1.8.776-1.8 1.729V17.25a2.25 2.25 0 0 0 2.25 2.25h1.5a2.25 2.25 0 0 0 2.25-2.25V13.5a2.25 2.25 0 0 0-2.25-2.25h-.217Z" />
            </svg>
            <span>Share Profile (Simulated ZKP/VC)</span>
          </button>
      </section>

      {/* Modal for Simulated Update */}
      <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Simulate Digital Twin Update">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">This simulates sending an update to your Digital Twin. In a real system, this would be a cryptographically signed request.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mock Progress (Functions):</label>
            <input 
              type="number" 
              step="0.1" min="0" max="1" 
              value={mockProgressUpdate['Functions'] || 0}
              onChange={(e) => setMockProgressUpdate({'Functions': parseFloat(e.target.value)})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mock Preferred Learning Style:</label>
            <input 
              type="text" 
              value={mockLogUpdate.preferred_learning_style}
              onChange={(e) => setMockLogUpdate(prev => ({...prev, preferred_learning_style: e.target.value}))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
            />
          </div>
          <button 
            onClick={handleSimulatedUpdate}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Confirm Simulated Update
          </button>
        </div>
      </Modal>

      {/* Modal for Simulated Verification */}
      <Modal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)} title="Digital Twin Data Verification (Simulated)">
        {verificationDetails ? (
          <div className="space-y-3">
            <p className={`font-semibold ${verificationDetails.integrity && verificationDetails.authenticity && verificationDetails.provenance ? 'text-green-600' : 'text-red-600'}`}>
              {verificationDetails.message}
            </p>
            <p className="text-sm text-gray-700"><strong>Checked CID:</strong> <span className="font-mono text-xs break-all">{verificationDetails.details?.checkedCid}</span></p>
            <p className="text-sm text-gray-700"><strong>Owner DID:</strong> <span className="font-mono text-xs break-all">{verificationDetails.details?.ownerDid}</span></p>
            <p className="text-sm text-gray-700"><strong>Data Timestamp:</strong> {verificationDetails.details?.timestamp ? new Date(verificationDetails.details.timestamp).toLocaleString() : 'N/A'}</p>
            <ul className="text-xs list-disc list-inside text-gray-600">
              <li>Integrity Check (Content Hash vs CID): {verificationDetails.integrity ? 'Passed ✅' : 'Failed ❌'}</li>
              <li>Authenticity Check (DID/Signature): {verificationDetails.authenticity ? 'Passed ✅' : 'Failed ❌'}</li>
              <li>Provenance Check (Blockchain/Timestamp): {verificationDetails.provenance ? 'Passed ✅' : 'Failed ❌'}</li>
            </ul>
            <p className="text-xs italic text-gray-500 mt-2">This is a simulated verification process. It checks against current local Digital Twin data.</p>
          </div>
        ) : <p>No verification data.</p>}
      </Modal>
    </div>
  );
};

export default ProfilePage;
