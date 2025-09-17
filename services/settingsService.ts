/**
 * Settings Service - Frontend API integration for user settings management
 */

const API_BASE = 'http://localhost:8000/api/v1';
import i18n from '../src/i18n';

export interface UserSettings {
  language: string;
  darkMode: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    nftEarned: boolean;
    courseUpdates: boolean;
    achievements: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showProgress: boolean;
    showAchievements: boolean;
  };
  account: {
    emailNotifications: boolean;
    twoFactorAuth: boolean;
    dataExport: boolean;
  };
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSetupResponse {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

import { jwtService } from './jwtService';

// Helper function for authenticated requests
async function makeAuthenticatedRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = jwtService.getAuthHeader();
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - try refresh token
    if (response.status === 401) {
      const refreshSuccess = await jwtService.handleUnauthorized();
      if (refreshSuccess) {
        // Retry the original request with new token
        const retryResponse = await fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...jwtService.getAuthHeader(),
            ...options.headers,
          },
          ...options,
        });
        
        if (!retryResponse.ok) {
          const retryErrorData = await retryResponse.json().catch(() => ({ detail: 'Network error' }));
          throw new Error(retryErrorData.detail || `HTTP ${retryResponse.status}`);
        }
        
        return await retryResponse.json();
      }
      
      // Refresh failed, clear tokens and redirect
      localStorage.removeItem('learnerProfile');
      localStorage.removeItem('userRole');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }
    
    const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }

  return await response.json();
}

class SettingsService {
  
  // Get user settings
  async getUserSettings(): Promise<UserSettings> {
    try {
      const response = await makeAuthenticatedRequest<{ settings: UserSettings }>(`${API_BASE}/user/settings`);
      return response.settings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      // Return default settings if API fails
      return this.getDefaultSettings();
    }
  }

  // Update user settings
  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const response = await makeAuthenticatedRequest<{ settings: UserSettings }>(`${API_BASE}/user/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      return response.settings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Update specific setting category
  async updateSettingCategory(category: keyof UserSettings, settings: any): Promise<UserSettings> {
    try {
      const response = await makeAuthenticatedRequest<{ settings: UserSettings }>(`${API_BASE}/user/settings/${category}`, {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      return response.settings;
    } catch (error) {
      console.error(`Error updating ${category} settings:`, error);
      throw error;
    }
  }

  // Change password
  async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/user/change-password`, {
        method: 'POST',
        body: JSON.stringify(passwordData)
      });
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Setup two-factor authentication
  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    try {
      const response = await makeAuthenticatedRequest<TwoFactorSetupResponse>(`${API_BASE}/user/2fa/setup`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw error;
    }
  }

  // Verify two-factor authentication
  async verifyTwoFactor(token: string): Promise<void> {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/user/2fa/verify`, {
        method: 'POST',
        body: JSON.stringify({ token })
      });
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      throw error;
    }
  }

  // Disable two-factor authentication
  async disableTwoFactor(): Promise<void> {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/user/2fa/disable`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  // Request data export
  async requestDataExport(): Promise<{ exportId: string; estimatedTime: string }> {
    try {
      const response = await makeAuthenticatedRequest<{ exportId: string; estimatedTime: string }>(`${API_BASE}/user/data-export`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error requesting data export:', error);
      throw error;
    }
  }

  // Get data export status
  async getDataExportStatus(exportId: string): Promise<{ status: string; downloadUrl?: string }> {
    try {
      const response = await makeAuthenticatedRequest<{ status: string; downloadUrl?: string }>(`${API_BASE}/user/data-export/${exportId}`);
      return response;
    } catch (error) {
      console.error('Error getting data export status:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(notifications: UserSettings['notifications']): Promise<void> {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/user/notifications`, {
        method: 'PUT',
        body: JSON.stringify(notifications)
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Update privacy settings
  async updatePrivacySettings(privacy: UserSettings['privacy']): Promise<void> {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/user/privacy`, {
        method: 'PUT',
        body: JSON.stringify(privacy)
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  // Get default settings
  getDefaultSettings(): UserSettings {
    return {
      language: 'en',
      darkMode: false,
      notifications: {
        email: true,
        push: true,
        nftEarned: true,
        courseUpdates: true,
        achievements: true,
      },
      privacy: {
        profileVisibility: 'public',
        showProgress: true,
        showAchievements: true,
      },
      account: {
        emailNotifications: true,
        twoFactorAuth: false,
        dataExport: false,
      },
    };
  }

  // Apply language setting
  applyLanguage(language: string): void {
    // Set HTML lang attribute
    document.documentElement.lang = language;
    
    // Store in localStorage for persistence
    localStorage.setItem('preferredLanguage', language);
    
    // Change i18n language
    i18n.changeLanguage(language);
    
    // Dispatch custom event for language change
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
  }

  // Apply dark mode setting
  applyDarkMode(darkMode: boolean): void {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Store in localStorage for persistence
    localStorage.setItem('darkMode', darkMode.toString());
    
    // Dispatch custom event for theme change
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { darkMode } }));
  }

  // Initialize settings from localStorage
  initializeSettings(): Partial<UserSettings> {
    const settings: Partial<UserSettings> = {};
    
    // Load language
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      settings.language = savedLanguage;
      this.applyLanguage(savedLanguage);
    }
    
    // Load dark mode
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      settings.darkMode = savedDarkMode === 'true';
      this.applyDarkMode(settings.darkMode);
    }
    
    return settings;
  }
}

export const settingsService = new SettingsService();
export default settingsService;
