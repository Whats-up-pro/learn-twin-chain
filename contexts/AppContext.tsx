import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { LearnerProfile, DigitalTwin, Nft, LearningModule, UpdateTwinPayload, LearningCheckpoint, KnowledgeArea, UserRole } from '../types';
import { INITIAL_DIGITAL_TWIN, LEARNING_MODULES } from '../constants';
import toast from 'react-hot-toast';
import { getCurrentVietnamTimeISO } from '../utils/dateUtils';

interface AppContextType {
  learnerProfile: LearnerProfile | null;
  digitalTwin: DigitalTwin;
  nfts: Nft[];
  learningModules: LearningModule[];
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  updateLearnerProfile: (profile: LearnerProfile, userRole?: UserRole) => void;
  logout: () => void;
  updateDigitalTwin: (payload: Partial<UpdateTwinPayload>, description: string) => Promise<void>;
  mintNftForModule: (moduleId: string, moduleName: string, score?: number) => Promise<void>;
  getModuleById: (moduleId: string) => LearningModule | undefined;
  completeCheckpoint: (checkpoint: Omit<LearningCheckpoint, 'tokenized' | 'nftCid' | 'nftId'>) => void;
  updateKnowledge: (updates: KnowledgeArea) => void;
  updateSkills: (problemSolving: number, logicalThinking: number, selfLearning: number) => void;
  updateBehavior: (updates: Partial<DigitalTwin['behavior']>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(() => {
    const savedProfile = localStorage.getItem('learnerProfile');
    return savedProfile ? JSON.parse(savedProfile) : null;
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
  const [role, setRole] = useState<UserRole | null>(() => {
    const savedRole = localStorage.getItem('userRole');
    return savedRole ? (savedRole as UserRole) : null;
  });

  useEffect(() => {
    if (learnerProfile) {
      localStorage.setItem('learnerProfile', JSON.stringify(learnerProfile));
    } else {
      localStorage.removeItem('learnerProfile');
    }
  }, [learnerProfile]);

  useEffect(() => {
    localStorage.setItem('digitalTwin', JSON.stringify(digitalTwin));
  }, [digitalTwin]);

  useEffect(() => {
    localStorage.setItem('nfts', JSON.stringify(nfts));
  }, [nfts]);

  useEffect(() => {
    if (role) {
      localStorage.setItem('userRole', role);
    } else {
      localStorage.removeItem('userRole');
    }
  }, [role]);

  // Sync learnerProfile with localStorage changes (e.g., after login)
  useEffect(() => {
    const syncProfile = () => {
      const savedProfile = localStorage.getItem('learnerProfile');
      setLearnerProfile(savedProfile ? JSON.parse(savedProfile) : null);
    };
    window.addEventListener('storage', syncProfile);
    return () => window.removeEventListener('storage', syncProfile);
  }, []);

  const updateDigitalTwinState = useCallback((updater: (prevTwin: DigitalTwin) => DigitalTwin) => {
    setDigitalTwin(prevTwin => {
      const newTwin = updater(prevTwin);
      return { ...newTwin, version: newTwin.version + 1, lastUpdated: getCurrentVietnamTimeISO() };
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

  const mintNftForModule = useCallback(async (moduleId: string, moduleName: string, score: number = 100) => {
    const existingNft = nfts.find(nft => nft.moduleId === moduleId);
    if (existingNft) {
      toast.error(`NFT for ${moduleName} already minted!`);
      return;
    }

    try {
      // Import blockchain service dynamically to avoid circular dependencies
      const { blockchainService } = await import('../services/blockchainService');
      
      // Check if blockchain is available
      const isBlockchainAvailable = await blockchainService.checkBlockchainConnection();
      
      if (isBlockchainAvailable) {
        // Require wallet connection
        const isWalletConnected = await blockchainService.checkWalletConnection();
        if (!isWalletConnected) {
          toast.error('Please connect your MetaMask wallet before minting.');
          return;
        }
        const studentAddress = await blockchainService.getStudentAddress();
        if (!studentAddress) {
          toast.error('Failed to get wallet address.');
          return;
        }
        
        const nftRequest = {
          student_address: studentAddress,
          student_did: digitalTwin.learnerDid,
          module_id: moduleId,
          module_title: moduleName,
          completion_data: {
            score: score,
            time_spent: 3600, // Default 1 hour
            attempts: 1,
            completed_at: getCurrentVietnamTimeISO(),
            use_student_wallet: true
          }
        };

        // Mark checkpoint as minting
        updateDigitalTwinState(prevTwin => ({
          ...prevTwin,
          checkpoints: prevTwin.checkpoints.map(cp => 
            cp.moduleId === moduleId ? { ...cp, minting: true } : cp
          )
        }));

        const result = await blockchainService.mintModuleCompletionNFT(nftRequest);
        
        if (result.success) {
          // Create NFT object with real blockchain data
          const newNft: Nft = {
            id: `nft-${moduleId}-${result.tx_hash || result.txHash || Date.now()}`,
            name: `Completion: ${moduleName}`,
            description: `Certificate of completion for the learning module: ${moduleName}. Minted on blockchain.`,
            imageUrl: `https://via.placeholder.com/300x200/0ea5e9/ffffff?text=${encodeURIComponent(moduleName)}`,
            moduleId: moduleId,
            issuedDate: getCurrentVietnamTimeISO(),
            cid: result.metadata_uri || result.metadataUri,
            txHash: result.tx_hash || result.txHash,
            tokenId: result.token_id || result.nft_token_id,
            contractAddress: result.contract_address
          };
          
          setNfts(prevNfts => [...prevNfts, newNft]);
          
          updateDigitalTwinState(prevTwin => ({
            ...prevTwin,
            checkpoints: prevTwin.checkpoints.map(cp => 
              cp.moduleId === moduleId ? { 
                ...cp, 
                tokenized: true, 
                nftCid: newNft.cid, 
                nftId: newNft.id,
                txHash: result.tx_hash,
                blockchainMinted: true,
                minting: false
              } : cp
            )
          }));
        }
      } else {
        // Fallback to simulation if blockchain not available
        console.warn('Blockchain not available, using simulation mode');
        const newNftId = `nft-${moduleId}-${Date.now()}`;
        const newNft: Nft = {
          id: newNftId,
          name: `Completion: ${moduleName}`,
          description: `Certificate of completion for the learning module: ${moduleName}. (Simulated)`,
          imageUrl: `https://via.placeholder.com/300x200/0ea5e9/ffffff?text=${encodeURIComponent(moduleName)}`,
          moduleId: moduleId,
          issuedDate: getCurrentVietnamTimeISO(),
          cid: `QmSimulatedNFT${moduleId}${Date.now().toString(36)}` // Simulated IPFS CID
        };
        setNfts(prevNfts => [...prevNfts, newNft]);
        
        updateDigitalTwinState(prevTwin => ({
          ...prevTwin,
          checkpoints: prevTwin.checkpoints.map(cp => 
            cp.moduleId === moduleId ? { ...cp, tokenized: true, nftCid: newNft.cid, nftId: newNft.id } : cp
          )
        }));
        toast.success(`NFT for "${moduleName}" minted successfully! (Simulated)`);
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast.error(`Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [nfts, updateDigitalTwinState, digitalTwin.learnerDid]);

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
            cp.moduleId === checkpointData.moduleId ? { ...cp, ...checkpointData, completedAt: getCurrentVietnamTimeISO() } : cp
          )
        };
      }
      // Add new checkpoint
      const newCheckpoint: LearningCheckpoint = {
        ...checkpointData,
        completedAt: getCurrentVietnamTimeISO(),
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

  const updateLearnerProfile = useCallback((profile: LearnerProfile, userRole?: UserRole) => {
    console.log('AppContext: updateLearnerProfile called with:', { profile, userRole });
    setLearnerProfile(profile);
    
    // Cập nhật digitalTwin với DID mới
    setDigitalTwin(prevTwin => ({
      ...prevTwin,
      learnerDid: profile.did
    }));
    
    if (userRole) {
      console.log('AppContext: Setting role to:', userRole);
      setRole(userRole);
    }
  }, []);

  const logout = useCallback(() => {
    // Clear all state
    setLearnerProfile(null);
    setDigitalTwin(INITIAL_DIGITAL_TWIN);
    setNfts([]);
    setRole(null);
    // Clear localStorage
    localStorage.removeItem('learnerProfile');
    localStorage.removeItem('digitalTwin');
    localStorage.removeItem('nfts');
    localStorage.removeItem('userRole');
    console.log('Logout successful - all data cleared');
  }, []);

  return (
    <AppContext.Provider value={{ 
      learnerProfile,
      digitalTwin, 
      nfts, 
      learningModules,
      role,
      setRole,
      updateLearnerProfile,
      logout,
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
