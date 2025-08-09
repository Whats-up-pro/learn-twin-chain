/**
 * Authentication Hook for React Components
 */
import { useState, useEffect, createContext, useContext } from 'react';
import authService from '../services/authService';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Initialize from localStorage first (faster UI)
      authService.initializeFromStorage();
      setUser(authService.user);
      setPermissions(authService.permissions);
      
      // Then verify with server
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser.user);
        setPermissions(currentUser.permissions || []);
        setWallets(currentUser.wallets || []);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.login(identifier, password);
      setUser(result.user);
      setPermissions(result.permissions || []);
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.register(userData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setPermissions([]);
      setWallets([]);
      setError(null);
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.connectWallet();
      
      // Refresh user data to get updated wallets
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setWallets(currentUser.wallets || []);
      }
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unlinkWallet = async (walletAddress) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.unlinkWallet(walletAddress);
      
      // Refresh wallets
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setWallets(currentUser.wallets || []);
      }
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setPrimaryWallet = async (walletAddress) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.setPrimaryWallet(walletAddress);
      
      // Refresh wallets
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setWallets(currentUser.wallets || []);
      }
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    return authService.hasPermission(permission);
  };

  const hasRole = (role) => {
    return authService.hasRole(role);
  };

  const value = {
    // State
    user,
    permissions,
    wallets,
    loading,
    error,
    
    // Actions
    login,
    register,
    logout,
    connectWallet,
    unlinkWallet,
    setPrimaryWallet,
    
    // Utilities
    isAuthenticated: !!user,
    isEmailVerified: user?.is_email_verified || false,
    hasConnectedWallet: wallets.length > 0,
    primaryWallet: wallets.find(w => w.is_primary),
    hasPermission,
    hasRole,
    
    // Permission helpers
    canCreateCourse: hasPermission('create_course') || hasRole('teacher') || hasRole('admin'),
    canManageUsers: hasPermission('manage_users') || hasRole('admin'),
    canViewAnalytics: hasPermission('view_analytics') || hasRole('teacher') || hasRole('admin'),
    
    // Refresh
    refreshUser: initializeAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      // Redirect to login or show login modal
      console.warn('Authentication required');
    }
  }, [auth.loading, auth.isAuthenticated]);
  
  return auth;
}

// Hook for wallet requirement
export function useRequireWallet() {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.loading && auth.isAuthenticated && !auth.hasConnectedWallet) {
      // Show wallet connection prompt
      console.warn('Wallet connection required');
    }
  }, [auth.loading, auth.isAuthenticated, auth.hasConnectedWallet]);
  
  return auth;
}

export default useAuth;