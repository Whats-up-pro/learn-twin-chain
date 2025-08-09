/**
 * Enhanced Authentication Service with SIWE wallet connection
 * Uses HttpOnly cookies instead of localStorage for security
 */

const API_BASE = 'http://localhost:8000/api/v1';

class AuthService {
  constructor() {
    this.user = null;
    this.permissions = [];
    this.wallets = [];
  }

  // User Authentication
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include HttpOnly cookies
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(identifier, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include HttpOnly cookies
        body: JSON.stringify({
          identifier,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Store user data (non-sensitive)
      this.user = data.user;
      this.permissions = data.permissions || [];
      
      // Store in localStorage for persistence (non-sensitive data only)
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('permissions', JSON.stringify(data.permissions));

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data
      this.user = null;
      this.permissions = [];
      this.wallets = [];
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
    }
  }

  async getCurrentUser() {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          return null;
        }
        throw new Error('Failed to get current user');
      }

      const data = await response.json();
      this.user = data.user;
      this.permissions = data.permissions || [];
      this.wallets = data.wallets || [];

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('permissions', JSON.stringify(data.permissions));

      return data;
    } catch (error) {
      console.error('Get current user error:', error);
      this.logout();
      return null;
    }
  }

  // Email Verification
  async verifyEmail(token) {
    try {
      const response = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Email verification failed');
      }

      return data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  async resendVerification(email) {
    try {
      const response = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      return await response.json();
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  // Password Reset
  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${API_BASE}/auth/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      return await response.json();
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${API_BASE}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          new_password: newPassword 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Password reset failed');
      }

      return data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          current_password: currentPassword,
          new_password: newPassword 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Password change failed');
      }

      return data;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  // SIWE Wallet Connection
  async getSIWENonce(walletAddress) {
    try {
      const response = await fetch(`${API_BASE}/auth/siwe/nonce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          wallet_address: walletAddress 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to get SIWE nonce');
      }

      return data.nonce;
    } catch (error) {
      console.error('SIWE nonce error:', error);
      throw error;
    }
  }

  async verifySIWESignature(message, signature, walletAddress) {
    try {
      const response = await fetch(`${API_BASE}/auth/siwe/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message,
          signature,
          wallet_address: walletAddress
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'SIWE verification failed');
      }

      // Update wallets list
      await this.getCurrentUser();

      return data;
    } catch (error) {
      console.error('SIWE verification error:', error);
      throw error;
    }
  }

  async unlinkWallet(walletAddress) {
    try {
      const response = await fetch(`${API_BASE}/auth/wallets/${walletAddress}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Wallet unlinking failed');
      }

      // Update wallets list
      await this.getCurrentUser();

      return await response.json();
    } catch (error) {
      console.error('Wallet unlinking error:', error);
      throw error;
    }
  }

  async setPrimaryWallet(walletAddress) {
    try {
      const response = await fetch(`${API_BASE}/auth/wallets/${walletAddress}/primary`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Primary wallet update failed');
      }

      // Update wallets list
      await this.getCurrentUser();

      return await response.json();
    } catch (error) {
      console.error('Primary wallet update error:', error);
      throw error;
    }
  }

  // MetaMask Integration
  async connectWallet() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No MetaMask accounts found');
      }

      const walletAddress = accounts[0];

      // Get SIWE nonce
      const nonce = await this.getSIWENonce(walletAddress);

      // Create SIWE message
      const domain = window.location.host;
      const uri = window.location.origin;
      const message = `${domain} wants you to sign in with your Ethereum account:\n${walletAddress}\n\nSign in to LearnTwinChain with your Ethereum account.\n\nURI: ${uri}\nVersion: 1\nChain ID: 1\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;

      // Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });

      // Verify signature
      const result = await this.verifySIWESignature(message, signature, walletAddress);

      return {
        wallet: walletAddress,
        result
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  // Permission System
  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  hasRole(role) {
    return this.user && this.user.role === role;
  }

  canCreateCourse() {
    return this.hasPermission('create_course') || this.hasRole('teacher') || this.hasRole('admin');
  }

  canManageUsers() {
    return this.hasPermission('manage_users') || this.hasRole('admin');
  }

  canViewAnalytics() {
    return this.hasPermission('view_analytics') || this.hasRole('teacher') || this.hasRole('admin');
  }

  // Utility methods
  isAuthenticated() {
    return !!this.user;
  }

  isEmailVerified() {
    return this.user && this.user.is_email_verified;
  }

  hasConnectedWallet() {
    return this.wallets && this.wallets.length > 0;
  }

  getPrimaryWallet() {
    return this.wallets.find(wallet => wallet.is_primary);
  }

  // Session management
  async extendSession() {
    try {
      const response = await fetch(`${API_BASE}/auth/extend-session`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Session extension failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Session extension error:', error);
      throw error;
    }
  }

  async getSessionStatus() {
    try {
      const response = await fetch(`${API_BASE}/auth/session-status`, {
        credentials: 'include'
      });

      if (!response.ok) {
        return { authenticated: false };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Session status check error:', error);
      return { authenticated: false };
    }
  }

  // Initialize from localStorage on app start
  initializeFromStorage() {
    try {
      const userData = localStorage.getItem('user');
      const permissions = localStorage.getItem('permissions');

      if (userData) {
        this.user = JSON.parse(userData);
      }
      if (permissions) {
        this.permissions = JSON.parse(permissions);
      }

      // Verify with server
      this.getCurrentUser();
    } catch (error) {
      console.error('Initialize from storage error:', error);
      this.logout();
    }
  }
}

// Create singleton instance
export const authService = new AuthService();
export default authService;