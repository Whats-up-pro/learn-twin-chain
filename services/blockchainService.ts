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

  // Ensure MetaMask is on the correct chain
  async ensureChain(chainIdDecimal: number): Promise<void> {
    const hexChainId = '0x' + chainIdDecimal.toString(16);
    const current = await window.ethereum.request({ method: 'eth_chainId' });
    if (current !== hexChainId) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }]
      });
    }
  }

  async getContractsMeta(): Promise<any> {
    const res = await fetch(`${API_BASE}/blockchain/contracts/meta`);
    return res.json();
  }

  // Build and send create learning session via MetaMask
  async createLearningSessionViaWallet(params: {
    module_id: string;
    learning_data_hash_hex: string; // bytes32 hex 0x...
    score: number;
    time_spent: number;
    attempts: number;
  }): Promise<string> {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];
    const meta = await this.getContractsMeta();
    if (!meta.success) throw new Error('Failed to load contracts meta');
    await this.ensureChain(meta.chain_id);
    const buildRes = await fetch(`${API_BASE}/blockchain/learning-session/build-create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const txDesc = await buildRes.json();
    if (!txDesc.success) throw new Error(txDesc.error || 'Failed to build transaction');
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: txDesc.to, data: txDesc.data }]
    });
    return txHash;
  }

  // Backend validator approves session
  async approveLearningSession(sessionHashHex: string, approved = true): Promise<any> {
    const url = `${API_BASE}/blockchain/learning-session/approve?session_hash_hex=${encodeURIComponent(sessionHashHex)}&approved=${approved}`;
    let lastErr: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, { method: 'POST' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Approve failed (attempt ${attempt})`);
        }
        return await res.json();
      } catch (e) {
        lastErr = e;
        // brief backoff: 1s, 2s
        if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 1000));
      }
    }
    throw new Error(`Transaction failed after 3 attempts: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
  }

  async getLearningSessionStatus(sessionHashHex: string): Promise<any> {
    const res = await fetch(`${API_BASE}/blockchain/learning-session/status?session_hash_hex=${encodeURIComponent(sessionHashHex)}`);
    return res.json();
  }

  // Prepare module mint tx data, then send via MetaMask
  async mintModuleViaWallet(args: {
    student_address: string;
    module_id: string;
    completion_data: any;
  }): Promise<string> {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];
    const meta = await this.getContractsMeta();
    if (!meta.success) throw new Error('Failed to load contracts meta');
    await this.ensureChain(meta.chain_id);
    const res = await fetch(`${API_BASE}/blockchain/mint/module/prepare-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to prepare mint');
    }
    const prep = await res.json();
    if (!prep.success) throw new Error(prep.error || 'Failed to prepare mint');
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: prep.to, data: prep.data }]
    });
    return txHash;
  }

  // Combined single-popup mint flow
  async mintModuleCombinedViaWallet(args: {
    student_address: string;
    module_id: string;
    learning_data_hash_hex: string;
    completion_data: any; // must include score, time_spent, attempts
  }): Promise<string> {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];
    const meta = await this.getContractsMeta();
    if (!meta.success) throw new Error('Failed to load contracts meta');
    await this.ensureChain(meta.chain_id);
    const res = await fetch(`${API_BASE}/blockchain/mint/module/prepare-tx-combined`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to prepare combined mint');
    }
    const prep = await res.json();
    if (!prep.success) throw new Error(prep.error || 'Failed to prepare combined mint');
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: prep.to, data: prep.data }]
    });
    return txHash;
  }

  // ---------- ERC-1155 On-chain Reads ----------
  private padTo32Bytes(hexNoPrefix: string): string {
    return hexNoPrefix.padStart(64, '0');
  }

  private toHexNoPrefix(value: string | number | bigint): string {
    const hex = BigInt(value).toString(16);
    return hex;
  }

  private encodeAddress(address: string): string {
    return this.padTo32Bytes(address.toLowerCase().replace('0x', ''));
  }

  private async ethCall(to: string, data: string): Promise<string> {
    const result = await window.ethereum.request({
      method: 'eth_call',
      params: [{ to, data }, 'latest']
    });
    return result as string; // 0x...
  }

  // balanceOf(address,uint256) -> selector 0x00fdd58e
  async erc1155BalanceOf(contract: string, account: string, tokenId: string | number | bigint): Promise<bigint> {
    const selector = '0x00fdd58e';
    const data = selector
      + this.encodeAddress(account)
      + this.padTo32Bytes(this.toHexNoPrefix(tokenId));
    const raw = await this.ethCall(contract, data);
    return BigInt(raw);
  }

  // uri(uint256) -> selector 0x0e89341c
  async erc1155TokenURI(contract: string, tokenId: string | number | bigint): Promise<string | null> {
    const selector = '0x0e89341c';
    const data = selector + this.padTo32Bytes(this.toHexNoPrefix(tokenId));
    const raw = await this.ethCall(contract, data);
    if (!raw || raw === '0x') return null;
    try {
      // decode string: ABI dynamic string encoding; simplest approach: skip offset and read length
      // raw layout: 0x + 64 offset + 64 length + data (padded)
      const hex = raw.replace(/^0x/, '');
      const lengthHex = hex.slice(64, 128);
      const length = parseInt(lengthHex, 16) * 2; // in hex chars
      const dataHex = hex.slice(128, 128 + length);
      const decoded = decodeURIComponent(dataHex.replace(/(..)/g, '%$1'));
      return decoded;
    } catch {
      return null;
    }
  }

  private async fetchJsonFromUri(uri: string): Promise<any | null> {
    try {
      let url = uri;
      if (uri.startsWith('ipfs://')) {
        url = `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
      }
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getErc1155BalancesAndMetadata(studentAddress: string, tokenIds: Array<string | number | bigint>): Promise<{
    tokenId: string;
    balance: bigint;
    uri: string | null;
    metadata: any | null;
  }[]> {
    const meta = await this.getContractsMeta();
    if (!meta.success) throw new Error('Failed to load contracts meta');
    await this.ensureChain(meta.chain_id);
    const contract = meta.addresses.MODULE_PROGRESS_NFT;
    const results: any[] = [];
    for (const id of tokenIds) {
      const bal = await this.erc1155BalanceOf(contract, studentAddress, id);
      let uri = await this.erc1155TokenURI(contract, id);
      if (uri && uri.includes('{id}')) {
        const idHex = this.toHexNoPrefix(id).padStart(64, '0');
        uri = uri.replace('{id}', idHex);
      }
      const metadata = uri ? await this.fetchJsonFromUri(uri) : null;
      results.push({ tokenId: String(id), balance: bal, uri, metadata });
    }
    return results;
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
  getDefaultStudentAddress(_did: string): string {
    // Use the real student address for testing
    return "0x7603d3159104dE72884273D14827D9BF07242B21";
  }

  // Automatically notify MetaMask about new NFTs (ERC-1155)
  async notifyMetaMaskAboutNFT(contractAddress: string, _tokenId: string | number, _metadata?: any): Promise<boolean> {
    try {
      if (typeof window.ethereum === 'undefined') {
        console.warn('MetaMask not available for NFT notification');
        return false;
      }

      // For ERC-1155, we can't use wallet_watchAsset directly, but we can trigger a refresh
      // MetaMask will automatically detect ERC-1155 tokens when the user visits the NFTs tab
      
      // Show a notification to the user
      toast.success(`NFT minted! Check your MetaMask NFTs tab or refresh the page.`, {
        duration: 8000
      });

      // Open Etherscan for the contract
      setTimeout(() => {
        window.open(`https://sepolia.etherscan.io/token/${contractAddress}`, '_blank');
      }, 1000);

      return true;
    } catch (error) {
      console.error('Failed to notify MetaMask about NFT:', error);
      return false;
    }
  }

  // Enhanced NFT detection with automatic refresh
  async detectAndRefreshNFTs(studentAddress: string): Promise<void> {
    try {
      const meta = await this.getContractsMeta();
      if (!meta.success) return;

      const contractAddress = meta.addresses.MODULE_PROGRESS_NFT;
      if (!contractAddress) return;

      // Get all possible token IDs (you might want to expand this range)
      const possibleTokenIds = Array.from({ length: 100 }, (_, i) => i + 1);
      
      const balances = await this.getErc1155BalancesAndMetadata(studentAddress, possibleTokenIds);
      const ownedTokens = balances.filter(b => b.balance > 0n);

      if (ownedTokens.length > 0) {
        console.log(`🎉 Detected ${ownedTokens.length} NFTs in wallet:`, ownedTokens);
        
        // Notify user about detected NFTs
        toast.success(`Found ${ownedTokens.length} NFT(s) in your wallet!`, {
          duration: 5000
        });
      }

      return;
    } catch (error) {
      console.error('Failed to detect NFTs:', error);
    }
  }

  // private simpleHash(input: string): string {
  //   let hash = 0;
  //   for (let i = 0; i < input.length; i++) {
  //     const char = input.charCodeAt(i);
  //     hash = ((hash << 5) - hash) + char;
  //     hash = hash & hash; // Convert to 32-bit integer
  //   }
  //   return Math.abs(hash).toString(16).padStart(40, '0');
  // }
}

// Export singleton instance
export const blockchainService = new BlockchainService();

// Add ethereum to window type
declare global {
  interface Window {
    ethereum?: any;
  }
}