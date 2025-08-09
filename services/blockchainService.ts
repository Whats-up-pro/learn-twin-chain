import { toast } from 'react-hot-toast';

export interface NFTMintRequest {
  student_address: string;
  student_did: string;
  module_id: string;
  module_title: string;
  completion_data: {
    score: number;
    time_spent: number;
    attempts: number;
    completed_at: string;
    use_student_wallet?: boolean; // New field for student minting
    student_signature?: string; // New field for ZKP challenge
    challenge_nonce?: string; // New field for ZKP challenge
  };
}

export interface SignatureRequest {
  student_address: string;
  module_id: string;
  metadata_uri: string;
  amount: number;
}

export interface AchievementMintRequest {
  student_address: string;
  student_did: string;
  achievement_type: string;
  title: string;
  description: string;
  achievement_data: any;
  expires_at?: number;
}

export interface BlockchainStatus {
  status: string;
  available: boolean;
  chain_id?: number;
  connected_accounts?: number;
}

export interface StudentBlockchainData {
  module_progress: {
    total_modules: number;
    current_level: number;
    token_ids: number[];
    amounts: number[];
  };
  achievements: any[];
  zkp_certificates: any[];
}

const API_BASE = 'http://localhost:8000/api/v1';

export class BlockchainService {
  
  // Check if user has connected wallet
  async checkWalletConnection(): Promise<boolean> {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts.length > 0;
    }
    return false;
  }

  // Connect wallet
  async connectWallet(): Promise<string | null> {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        return accounts[0];
      }
      throw new Error('MetaMask not installed');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
      return null;
    }
  }

  // Get student address from connected wallet
  async getStudentAddress(): Promise<string | null> {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts[0] || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting student address:', error);
      return null;
    }
  }

  async getBlockchainStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/blockchain/status`);
      if (!response.ok) {
        throw new Error('Failed to get blockchain status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting blockchain status:', error);
      throw error;
    }
  }

  // Generate signature for ZKP challenge
  async signZKPChallenge(challengeNonce: string): Promise<string | null> {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          throw new Error('No wallet connected');
        }

        const message = `LearnTwin Module Completion Challenge: ${challengeNonce}`;
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, accounts[0]]
        });

        return signature;
      }
      throw new Error('MetaMask not installed');
    } catch (error) {
      console.error('Error signing ZKP challenge:', error);
      toast.error('Failed to sign challenge');
      return null;
    }
  }

  // Get ZKP challenge from backend
  async getZKPChallenge(moduleId: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE}/zkp/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module_id: moduleId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get ZKP challenge');
      }

      const result = await response.json();
      return result.challenge_nonce;
    } catch (error) {
      console.error('Error getting ZKP challenge:', error);
      return null;
    }
  }

  async mintModuleCompletionNFT(request: NFTMintRequest): Promise<any> {
    try {
      // Check if student wants to mint themselves
      const useStudentWallet = request.completion_data.use_student_wallet;
      
      if (useStudentWallet) {
        // Student minting flow with ZKP
        const isConnected = await this.checkWalletConnection();
        if (!isConnected) {
          throw new Error('Please connect your wallet first');
        }

        const studentAddress = await this.getStudentAddress();
        if (!studentAddress) {
          throw new Error('Failed to get student address');
        }

        // Update request with student's actual address
        request.student_address = studentAddress;
        
        // Get ZKP challenge and sign it
        const challengeNonce = await this.getZKPChallenge(request.module_id);
        if (!challengeNonce) {
          throw new Error('Failed to get ZKP challenge');
        }

        const signature = await this.signZKPChallenge(challengeNonce);
        if (!signature) {
          throw new Error('Failed to sign ZKP challenge');
        }

        // Add signature and challenge to request
        request.completion_data.student_signature = signature;
        request.completion_data.challenge_nonce = challengeNonce;
        
        toast.loading('Preparing NFT mint with ZKP proof...', { id: 'nft-mint' });
      } else {
        // Backend minting flow (current)
        toast.loading('Minting NFT on blockchain...', { id: 'nft-mint' });
      }
      
      const response = await fetch(`${API_BASE}/blockchain/mint/module-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to mint NFT');
      }

      const result = await response.json();
      
      if (result.success) {
        if (useStudentWallet && result.signature) {
          // Student needs to mint using signature
          toast.success('ZKP proof generated! Please mint using your wallet.', { 
            id: 'nft-mint',
            duration: 5000 
          });
          return {
            ...result,
            message: 'Student should mint using ZKP proof and their wallet'
          };
        } else {
          // Backend minted successfully
          toast.success(`NFT minted successfully! Tx: ${result.tx_hash?.substring(0, 10)}...`, { 
            id: 'nft-mint',
            duration: 5000 
          });
        }
        return result;
      } else {
        throw new Error(result.error || 'NFT minting failed');
      }
    } catch (error) {
      console.error('Error minting module completion NFT:', error);
      toast.error(`NFT minting failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
        id: 'nft-mint' 
      });
      throw error;
    }
  }

  async mintLearningAchievementNFT(request: any): Promise<any> {
    try {
      toast.loading('Minting achievement NFT on blockchain...', { id: 'achievement-mint' });
      
      const response = await fetch(`${API_BASE}/blockchain/mint/achievement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to mint achievement NFT');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Achievement NFT minted successfully! Tx: ${result.tx_hash?.substring(0, 10)}...`, { 
          id: 'achievement-mint',
          duration: 5000 
        });
        return result;
      } else {
        throw new Error(result.error || 'Achievement NFT minting failed');
      }
    } catch (error) {
      console.error('Error minting achievement NFT:', error);
      toast.error(`Achievement minting failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
        id: 'achievement-mint' 
      });
      throw error;
    }
  }

  async getStudentBlockchainData(studentAddress: string, studentDid: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/blockchain/student/${studentAddress}/data?student_did=${studentDid}`);
      if (!response.ok) {
        throw new Error('Failed to get student blockchain data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting student blockchain data:', error);
      throw error;
    }
  }

  async generateEmployerVerification(studentAddress: string, achievements: string[]): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/blockchain/verification/employer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_address: studentAddress,
          achievements: achievements,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate employer verification');
      }
      return await response.json();
    } catch (error) {
      console.error('Error generating employer verification:', error);
      throw error;
    }
  }

  async createZKPCertificate(studentDid: string, studentAddress: string, twinData: any): Promise<any> {
    try {
      toast.loading('Creating ZKP certificate...', { id: 'zkp-create' });
      
      const response = await fetch(`${API_BASE}/zkp/certificate/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_did: studentDid,
          student_address: studentAddress,
          twin_data: twinData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create ZKP certificate');
      }

      const result = await response.json();
      toast.success('ZKP certificate created successfully!', { id: 'zkp-create' });
      return result;
    } catch (error) {
      console.error('Error creating ZKP certificate:', error);
      toast.error(`ZKP creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
        id: 'zkp-create' 
      });
      throw error;
    }
  }

  async checkBlockchainConnection(): Promise<boolean> {
    try {
      const status = await this.getBlockchainStatus();
      return status.available;
    } catch (error) {
      console.error('Blockchain connection check failed:', error);
      return false;
    }
  }

  // Helper method to get default student address (fallback)
  getDefaultStudentAddress(did: string): string {
    // Use the real student address for testing
    return "0x7603d3159104dE72884273D14827D9BF07242B21";
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(40, '0');
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();

// Add ethereum to window type
declare global {
  interface Window {
    ethereum?: any;
  }
}