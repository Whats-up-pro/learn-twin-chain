/**
 * MetaMask Connection Service
 * Handles MetaMask wallet connection and status
 */

export interface MetaMaskAccount {
  address: string;
  balance?: string;
  chainId?: number;
  networkName?: string;
}

export interface MetaMaskState {
  isInstalled: boolean;
  isConnected: boolean;
  account?: MetaMaskAccount;
  error?: string;
}

type MetaMaskEventCallback = (state: MetaMaskState) => void;
type AccountChangeCallback = (accounts: string[]) => void;
type ChainChangeCallback = (chainId: string) => void;

class MetaMaskService {
  private ethereum: any;
  private listeners: MetaMaskEventCallback[] = [];
  private currentState: MetaMaskState = {
    isInstalled: false,
    isConnected: false
  };

  constructor() {
    this.ethereum = (window as any).ethereum;
    this.checkInstallation();
    this.setupEventListeners();
  }

  // Check if MetaMask is installed
  private checkInstallation() {
    if (typeof window !== 'undefined' && this.ethereum) {
      this.currentState.isInstalled = true;
      this.checkConnection();
    } else {
      this.currentState.isInstalled = false;
      this.notifyListeners();
    }
  }

  // Setup MetaMask event listeners
  private setupEventListeners() {
    if (!this.ethereum) return;

    // Account changes
    this.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
    
    // Chain changes
    this.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
    
    // Connection/disconnection
    this.ethereum.on('connect', this.handleConnect.bind(this));
    this.ethereum.on('disconnect', this.handleDisconnect.bind(this));
  }

  // Event handlers
  private handleAccountsChanged(accounts: string[]) {
    console.log('🔄 MetaMask accounts changed:', accounts);
    if (accounts.length === 0) {
      this.currentState.isConnected = false;
      this.currentState.account = undefined;
    } else {
      this.updateAccountInfo(accounts[0]);
    }
    this.notifyListeners();
  }

  private handleChainChanged(chainId: string) {
    console.log('🔄 MetaMask chain changed:', chainId);
    if (this.currentState.account) {
      this.currentState.account.chainId = parseInt(chainId, 16);
      this.currentState.account.networkName = this.getNetworkName(this.currentState.account.chainId);
    }
    this.notifyListeners();
  }

  private handleConnect() {
    console.log('✅ MetaMask connected');
    this.checkConnection();
  }

  private handleDisconnect() {
    console.log('❌ MetaMask disconnected');
    this.currentState.isConnected = false;
    this.currentState.account = undefined;
    this.notifyListeners();
  }

  // Check current connection status
  private async checkConnection() {
    if (!this.ethereum) return;

    try {
      const accounts = await this.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        this.currentState.isConnected = true;
        await this.updateAccountInfo(accounts[0]);
      } else {
        this.currentState.isConnected = false;
        this.currentState.account = undefined;
      }
    } catch (error: any) {
      console.error('❌ Error checking MetaMask connection:', error);
      this.currentState.error = error.message;
    }
    this.notifyListeners();
  }

  // Update account information
  private async updateAccountInfo(address: string) {
    try {
      // Get balance using eth_getBalance
      const balance = await this.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // Get chain ID
      const chainId = await this.ethereum.request({
        method: 'eth_chainId'
      });

      this.currentState.account = {
        address,
        balance: this.formatBalance(balance),
        chainId: parseInt(chainId, 16),
        networkName: this.getNetworkName(parseInt(chainId, 16))
      };
    } catch (error: any) {
      console.error('❌ Error updating account info:', error);
      this.currentState.account = { address };
    }
  }

  // Format balance from wei to ETH
  private formatBalance(balanceWei: string): string {
    try {
      const balance = BigInt(balanceWei);
      const eth = Number(balance) / Math.pow(10, 18);
      return eth.toFixed(4);
    } catch (error) {
      return '0.0000';
    }
  }

  // Get network name from chain ID
  private getNetworkName(chainId: number): string {
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten',
      4: 'Rinkeby',
      5: 'Goerli',
      11155111: 'Sepolia',
      137: 'Polygon',
      80001: 'Mumbai',
      56: 'BSC Mainnet',
      97: 'BSC Testnet'
    };
    return networks[chainId] || `Chain ${chainId}`;
  }

  // Public methods
  async connect(): Promise<MetaMaskAccount | null> {
    if (!this.currentState.isInstalled) {
      throw new Error('MetaMask is not installed');
    }

    try {
      console.log('🔌 Connecting to MetaMask...');
      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        this.currentState.isConnected = true;
        await this.updateAccountInfo(accounts[0]);
        this.currentState.error = undefined;
        this.notifyListeners();
        return this.currentState.account!;
      }
      return null;
    } catch (error: any) {
      console.error('❌ Failed to connect MetaMask:', error);
      this.currentState.error = error.message;
      this.notifyListeners();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // MetaMask doesn't have a direct disconnect method
    // This is more of a UI state reset
    this.currentState.isConnected = false;
    this.currentState.account = undefined;
    this.currentState.error = undefined;
    this.notifyListeners();
  }

  // Utility methods
  async switchNetwork(chainId: number): Promise<void> {
    if (!this.ethereum) throw new Error('MetaMask not available');

    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      console.error('❌ Failed to switch network:', error);
      throw error;
    }
  }

  async addNetwork(network: {
    chainId: number;
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    blockExplorerUrls?: string[];
  }): Promise<void> {
    if (!this.ethereum) throw new Error('MetaMask not available');

    try {
      await this.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${network.chainId.toString(16)}`,
          chainName: network.chainName,
          rpcUrls: network.rpcUrls,
          nativeCurrency: network.nativeCurrency,
          blockExplorerUrls: network.blockExplorerUrls,
        }],
      });
    } catch (error: any) {
      console.error('❌ Failed to add network:', error);
      throw error;
    }
  }

  // State management
  getState(): MetaMaskState {
    return { ...this.currentState };
  }

  subscribe(callback: MetaMaskEventCallback): () => void {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getState());
      } catch (error) {
        console.error('❌ Error in MetaMask listener:', error);
      }
    });
  }

  // Install prompt
  openInstallPage() {
    window.open('https://metamask.io/download/', '_blank');
  }

  // Format address for display
  formatAddress(address: string, length = 8): string {
    if (address.length <= length) return address;
    return `${address.slice(0, length/2)}...${address.slice(-length/2)}`;
  }
}

// Export singleton instance
export const metamaskService = new MetaMaskService();
export default metamaskService;
