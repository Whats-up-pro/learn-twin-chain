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
  };
}

export interface SignatureRequest {
  student_address: string;
  module_id: string;
  metadata_uri: string;
  amount: number;
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

  // Get signature from backend for minting
  async getMintSignature(request: SignatureRequest): Promise<string> {
    try {
      const response = await fetch(`${API_BASE}/blockchain/signature/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to get signature');
      }

      const result = await response.json();
      return result.signature;
    } catch (error) {
      console.error('Error getting signature:', error);
      throw error;
    }
  }

  // Mint NFT using student's wallet
  async mintModuleCompletionNFT(request: NFTMintRequest): Promise<any> {
    try {
      // Check wallet connection
      const isConnected = await this.checkWalletConnection();
      if (!isConnected) {
        throw new Error('Please connect your wallet first');
      }

      toast.loading('Preparing NFT mint...', { id: 'nft-mint' });

      // Get signature from backend
      const signatureRequest: SignatureRequest = {
        student_address: request.student_address,
        module_id: request.module_id,
        metadata_uri: `ipfs://${request.module_id}_${request.student_address}_${Date.now()}`,
        amount: 1
      };

      const signature = await this.getMintSignature(signatureRequest);

      // Call smart contract with signature
      const contractAddress = '0xD120b09D173B7dB80fa733CcCe68cfdd17031A41'; // Your contract address
      
      // This would require Web3.js or ethers.js to interact with contract
      // For now, we'll use the backend as a fallback
      const response = await fetch(`${API_BASE}/blockchain/mint/module-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          signature: signature,
          use_student_wallet: true
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to mint NFT');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`NFT minted successfully! Tx: ${result.tx_hash?.substring(0, 10)}...`, { 
          id: 'nft-mint',
          duration: 5000 
        });
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

  // Fallback method for backend minting (for testing)
  async mintModuleCompletionNFTBackend(request: NFTMintRequest): Promise<any> {
    try {
      toast.loading('Minting NFT on blockchain...', { id: 'nft-mint' });
      
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
        toast.success(`NFT minted successfully! Tx: ${result.tx_hash?.substring(0, 10)}...`, { 
          id: 'nft-mint',
          duration: 5000 
        });
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

  // Other methods remain the same...
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

  async checkBlockchainConnection(): Promise<boolean> {
    try {
      const status = await this.getBlockchainStatus();
      return status.available;
    } catch (error) {
      console.error('Blockchain connection check failed:', error);
      return false;
    }
  }

  // Helper method to get student address from connected wallet
  getStudentAddress(): string | null {
    if (typeof window.ethereum !== 'undefined') {
      // This would get the connected account
      return null; // Implement based on your wallet connection
    }
    return null;
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