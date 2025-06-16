
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { LearnerProfile, DigitalTwin, Nft, LearningModule, UpdateTwinPayload, LearningCheckpoint, KnowledgeArea } from '../types';
import { DEFAULT_LEARNER_PROFILE, INITIAL_DIGITAL_TWIN, LEARNING_MODULES } from '../constants';
import toast from 'react-hot-toast';

interface AppContextType {
  learnerProfile: LearnerProfile;
  digitalTwin: DigitalTwin;
  nfts: Nft[];
  learningModules: LearningModule[];
  updateDigitalTwin: (payload: Partial<UpdateTwinPayload>, description: string) => Promise<void>;
  mintNftForModule: (moduleId: string, moduleName: string) => void;
  getModuleById: (moduleId: string) => LearningModule | undefined;
  completeCheckpoint: (checkpoint: Omit<LearningCheckpoint, 'tokenized' | 'nftCid' | 'nftId'>) => void;
  updateKnowledge: (updates: KnowledgeArea) => void;
  updateSkills: (problemSolving: number, logicalThinking: number, selfLearning: number) => void;
  updateBehavior: (updates: Partial<DigitalTwin['behavior']>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>(() => {
    const savedProfile = localStorage.getItem('learnerProfile');
    return savedProfile ? JSON.parse(savedProfile) : DEFAULT_LEARNER_PROFILE;
  });
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwin>(() => {
    const savedTwin = localStorage.getItem('digitalTwin');
    return savedTwin ? JSON.parse(savedTwin) : INITIAL_DIGITAL_TWIN;
  });
  const [nfts, setNfts] = useState<Nft[]>(() => {
    const savedNfts = localStorage.getItem('nfts');
    return savedNfts ? JSON.parse(savedNfts) : [];
  });
  const [learningModules] = useState<LearningModule[]>(LEARNING_MODULES);

  useEffect(() => {
    localStorage.setItem('learnerProfile', JSON.stringify(learnerProfile));
  }, [learnerProfile]);

  useEffect(() => {
    localStorage.setItem('digitalTwin', JSON.stringify(digitalTwin));
  }, [digitalTwin]);

  useEffect(() => {
    localStorage.setItem('nfts', JSON.stringify(nfts));
  }, [nfts]);

  const updateDigitalTwinState = useCallback((updater: (prevTwin: DigitalTwin) => DigitalTwin) => {
    setDigitalTwin(prevTwin => {
      const newTwin = updater(prevTwin);
      return { ...newTwin, version: newTwin.version + 1, lastUpdated: new Date().toISOString() };
    });
  }, []);

  const updateDigitalTwin = useCallback(async (payload: Partial<UpdateTwinPayload>, description: string): Promise<void> => {
    // Simulate API call and DID verification
    toast.loading(`Updating Digital Twin: ${description}...`, { id: 'dt-update' });
    
    // Simulate a delay for API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (payload.twin_id !== digitalTwin.learnerDid || payload.owner_did !== digitalTwin.learnerDid) {
      toast.error('Unauthorized: DID mismatch for twin update.', { id: 'dt-update' });
      throw new Error('DID mismatch');
    }
    
    updateDigitalTwinState(prevTwin => {
      let newTwin = { ...prevTwin };
      if (payload.learning_state?.progress) {
        newTwin.knowledge = { ...newTwin.knowledge, ...payload.learning_state.progress };
      }
      if (payload.learning_state?.checkpoint_history) {
         // More robust merging might be needed if order or uniqueness is critical
        newTwin.checkpoints = payload.learning_state.checkpoint_history;
      }
      if (payload.interaction_logs) {
        newTwin.behavior = { ...newTwin.behavior, ...payload.interaction_logs };
      }
      return newTwin;
    });

    toast.success(`Digital Twin updated: ${description}`, { id: 'dt-update' });
  }, [digitalTwin.learnerDid, updateDigitalTwinState]);

  const mintNftForModule = useCallback((moduleId: string, moduleName: string) => {
    const existingNft = nfts.find(nft => nft.moduleId === moduleId);
    if (existingNft) {
      toast.error(`NFT for ${moduleName} already minted!`);
      return;
    }

    const newNftId = `nft-${moduleId}-${Date.now()}`;
    const newNft: Nft = {
      id: newNftId,
      name: `Completion: ${moduleName}`,
      description: `Certificate of completion for the learning module: ${moduleName}.`,
      imageUrl: `https://picsum.photos/seed/${moduleId}/300/200`,
      moduleId: moduleId,
      issuedDate: new Date().toISOString(),
      cid: `QmSimulatedNFT${moduleId}${Date.now().toString(36)}` // Simulated IPFS CID
    };
    setNfts(prevNfts => [...prevNfts, newNft]);
    
    updateDigitalTwinState(prevTwin => ({
      ...prevTwin,
      checkpoints: prevTwin.checkpoints.map(cp => 
        cp.moduleId === moduleId ? { ...cp, tokenized: true, nftCid: newNft.cid, nftId: newNft.id } : cp
      )
    }));
    toast.success(`NFT for "${moduleName}" minted successfully!`);
  }, [nfts, updateDigitalTwinState]);

  const getModuleById = useCallback((moduleId: string): LearningModule | undefined => {
    return learningModules.find(module => module.id === moduleId);
  }, [learningModules]);

  const completeCheckpoint = useCallback((checkpointData: Omit<LearningCheckpoint, 'tokenized'|'nftCid'|'nftId'>) => {
    updateDigitalTwinState(prevTwin => {
      const existingCheckpoint = prevTwin.checkpoints.find(cp => cp.moduleId === checkpointData.moduleId);
      if (existingCheckpoint) {
        // Update existing if necessary, or simply ensure it's marked as complete
        return {
          ...prevTwin,
          checkpoints: prevTwin.checkpoints.map(cp => 
            cp.moduleId === checkpointData.moduleId ? { ...cp, ...checkpointData, completedAt: new Date().toISOString() } : cp
          )
        };
      }
      // Add new checkpoint
      const newCheckpoint: LearningCheckpoint = {
        ...checkpointData,
        completedAt: new Date().toISOString(),
        tokenized: false, 
      };
      return { ...prevTwin, checkpoints: [...prevTwin.checkpoints, newCheckpoint] };
    });
  }, [updateDigitalTwinState]);

  const updateKnowledge = useCallback((updates: KnowledgeArea) => {
    updateDigitalTwinState(prevTwin => ({
      ...prevTwin,
      knowledge: { ...prevTwin.knowledge, ...updates }
    }));
  }, [updateDigitalTwinState]);
  
  const updateSkills = useCallback((problemSolving: number, logicalThinking: number, selfLearning: number) => {
    updateDigitalTwinState(prevTwin => ({
      ...prevTwin,
      skills: { problemSolving, logicalThinking, selfLearning }
    }));
  }, [updateDigitalTwinState]);

  const updateBehavior = useCallback((updates: Partial<DigitalTwin['behavior']>) => {
     updateDigitalTwinState(prevTwin => ({
      ...prevTwin,
      behavior: { ...prevTwin.behavior, ...updates }
    }));
  }, [updateDigitalTwinState]);


  return (
    <AppContext.Provider value={{ 
      learnerProfile, 
      digitalTwin, 
      nfts, 
      learningModules, 
      updateDigitalTwin, 
      mintNftForModule,
      getModuleById,
      completeCheckpoint,
      updateKnowledge,
      updateSkills,
      updateBehavior
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
