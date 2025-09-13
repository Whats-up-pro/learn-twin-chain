import React, { useState, useEffect } from 'react';
import { settingsService, UserSettings, PasswordChangeRequest } from '../services/settingsService';
import { notificationService } from '../services/notificationService';
import { themeService } from '../services/themeService';
import { 
  LanguageIcon,
  SunIcon,
  BellIcon,
  ShieldCheckIcon,
  UserIcon,
  KeyIcon,
  CheckIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Use UserSettings from settingsService
type SettingsState = UserSettings;

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<SettingsState>(settingsService.getDefaultSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFAQRCode, setTwoFAQRCode] = useState('');
  const [twoFABackupCodes, setTwoFABackupCodes] = useState<string[]>([]);
  const [passwordData, setPasswordData] = useState<PasswordChangeRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFAToken, setTwoFAToken] = useState('');

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // Initialize local settings first
        const localSettings = settingsService.initializeSettings();
        setSettings(prev => ({ ...prev, ...localSettings }));
        
        // Load from backend
        const backendSettings = await settingsService.getUserSettings();
        setSettings(backendSettings);
        
        // Apply theme and language
        themeService.setDarkMode(backendSettings.darkMode);
        settingsService.applyLanguage(backendSettings.language);
        
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings. Using defaults.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to backend whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await settingsService.updateUserSettings(settings);
      } catch (error) {
        console.error('Error saving settings:', error);
        // Don't show error toast for every change, just log it
      }
    };

    // Debounce saves to avoid too many API calls
    const timeoutId = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timeoutId);
  }, [settings]);

  const handleLanguageChange = async (language: string) => {
    setSettings(prev => ({ ...prev, language }));
    settingsService.applyLanguage(language);
    toast.success(`Language changed to ${languages.find(l => l.code === language)?.name}`);
  };

  const handleDarkModeChange = async (darkMode: boolean) => {
    setSettings(prev => ({ ...prev, darkMode }));
    themeService.setDarkMode(darkMode);
    toast.success(`Switched to ${darkMode ? 'dark' : 'light'} mode`);
  };

  const handleNotificationChange = async (key: keyof SettingsState['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));

    // Handle push notifications specifically
    if (key === 'push' && value) {
      try {
        const permission = await notificationService.requestPermission();
        
        if (!permission.granted) {
          toast.error('Push notifications are blocked. Please enable them in your browser settings.');
          setSettings(prev => ({
            ...prev,
            notifications: {
              ...prev.notifications,
              push: false,
            },
          }));
        } else {
          toast.success('Push notifications enabled!');
        }
      } catch (error) {
        toast.error('Failed to enable push notifications');
        setSettings(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            push: false,
          },
        }));
      }
    }
  };

  const handlePrivacyChange = async (key: keyof SettingsState['privacy'], value: any) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }));
  };

  const handleAccountChange = async (key: keyof SettingsState['account'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      account: {
        ...prev.account,
        [key]: value,
      },
    }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await settingsService.changePassword(passwordData);
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataExport = async () => {
    setIsLoading(true);
    try {
      const result = await settingsService.requestDataExport();
      toast.success(`Data export started. Estimated completion: ${result.estimatedTime}. You'll receive an email when ready.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASetup = async () => {
    setIsLoading(true);
      try {
        const result = await settingsService.setupTwoFactor();
        setTwoFAQRCode(result.qrCode);
        setTwoFABackupCodes(result.backupCodes);
        setShow2FASetup(true);
        toast.success('2FA setup initiated. Please scan the QR code with your authenticator app.');
      } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to setup 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async () => {
    if (!twoFAToken) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      await settingsService.verifyTwoFactor(twoFAToken);
      setSettings(prev => ({
        ...prev,
        account: {
          ...prev.account,
          twoFactorAuth: true,
        },
      }));
      setShow2FASetup(false);
      setTwoFAToken('');
      toast.success('2FA enabled successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FADisable = async () => {
    setIsLoading(true);
    try {
      await settingsService.disableTwoFactor();
      setSettings(prev => ({
        ...prev,
        account: {
          ...prev.account,
          twoFactorAuth: false,
        },
      }));
      toast.success('2FA disabled successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  ];

  const SettingSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ 
    title, 
    icon, 
    children 
  }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );

  const ToggleSwitch: React.FC<{ 
    enabled: boolean; 
    onChange: (enabled: boolean) => void; 
    label: string;
    description?: string;
  }> = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Customize your learning experience and manage your account preferences</p>
        </div>

        <div className="space-y-6">
          {/* Language Settings */}
          <SettingSection
            title="Language & Region"
            icon={<LanguageIcon className="h-6 w-6 text-blue-600" />}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferred Language
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.language === lang.code
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{lang.flag}</div>
                      <div className="text-sm font-medium text-gray-900">{lang.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SettingSection>

          {/* Appearance Settings */}
          <SettingSection
            title="Appearance"
            icon={<SunIcon className="h-6 w-6 text-blue-600" />}
          >
            <div className="space-y-4">
              <ToggleSwitch
                enabled={settings.darkMode}
                onChange={handleDarkModeChange}
                label="Dark Mode"
                description="Switch between light and dark themes"
              />
            </div>
          </SettingSection>

          {/* Notification Settings */}
          <SettingSection
            title="Notifications"
            icon={<BellIcon className="h-6 w-6 text-blue-600" />}
          >
            <div className="space-y-4">
              <ToggleSwitch
                enabled={settings.notifications.email}
                onChange={(enabled) => handleNotificationChange('email', enabled)}
                label="Email Notifications"
                description="Receive notifications via email"
              />
              <ToggleSwitch
                enabled={settings.notifications.push}
                onChange={(enabled) => handleNotificationChange('push', enabled)}
                label="Push Notifications"
                description="Receive browser push notifications"
              />
              <ToggleSwitch
                enabled={settings.notifications.nftEarned}
                onChange={(enabled) => handleNotificationChange('nftEarned', enabled)}
                label="NFT Earned Notifications"
                description="Get notified when you earn new NFTs"
              />
              <ToggleSwitch
                enabled={settings.notifications.courseUpdates}
                onChange={(enabled) => handleNotificationChange('courseUpdates', enabled)}
                label="Course Updates"
                description="Notifications about course content updates"
              />
              <ToggleSwitch
                enabled={settings.notifications.achievements}
                onChange={(enabled) => handleNotificationChange('achievements', enabled)}
                label="Achievement Notifications"
                description="Get notified when you unlock new achievements"
              />
            </div>
          </SettingSection>

          {/* Privacy Settings */}
          <SettingSection
            title="Privacy & Security"
            icon={<ShieldCheckIcon className="h-6 w-6 text-blue-600" />}
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Profile Visibility
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: 'Public', description: 'Anyone can see your profile' },
                    { value: 'friends', label: 'Friends Only', description: 'Only your connections can see your profile' },
                    { value: 'private', label: 'Private', description: 'Only you can see your profile' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value={option.value}
                        checked={settings.privacy.profileVisibility === option.value}
                        onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <ToggleSwitch
                enabled={settings.privacy.showProgress}
                onChange={(enabled) => handlePrivacyChange('showProgress', enabled)}
                label="Show Learning Progress"
                description="Allow others to see your course progress"
              />

              <ToggleSwitch
                enabled={settings.privacy.showAchievements}
                onChange={(enabled) => handlePrivacyChange('showAchievements', enabled)}
                label="Show Achievements"
                description="Display your achievements on your profile"
              />
            </div>
          </SettingSection>

          {/* Account Settings */}
          <SettingSection
            title="Account"
            icon={<UserIcon className="h-6 w-6 text-blue-600" />}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Password & Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
                      {settings.account.twoFactorAuth && (
                        <p className="text-xs text-green-600 mt-1">✓ 2FA is currently enabled</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!settings.account.twoFactorAuth ? (
                        <button
                          onClick={handle2FASetup}
                          disabled={isLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? 'Setting up...' : 'Enable 2FA'}
                        </button>
                      ) : (
                        <button
                          onClick={handle2FADisable}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? 'Disabling...' : 'Disable 2FA'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <KeyIcon className="h-5 w-5" />
                      <span>Change Password</span>
                    </button>

                    {showPasswordForm && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={handlePasswordChange}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {isLoading ? 'Updating...' : 'Update Password'}
                          </button>
                          <button
                            onClick={() => setShowPasswordForm(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2FA Setup Modal */}
              {show2FASetup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                    <div className="text-center mb-6">
                      <QrCodeIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Setup Two-Factor Authentication</h3>
                      <p className="text-gray-600">Scan this QR code with your authenticator app</p>
                    </div>

                    {twoFAQRCode && (
                      <div className="text-center mb-6">
                        <img src={twoFAQRCode} alt="2FA QR Code" className="mx-auto border rounded-lg" />
                      </div>
                    )}

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter verification code
                      </label>
                      <input
                        type="text"
                        value={twoFAToken}
                        onChange={(e) => setTwoFAToken(e.target.value)}
                        placeholder="000000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={6}
                      />
                    </div>

                    {twoFABackupCodes.length > 0 && (
                      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800">Save your backup codes</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              Store these codes in a safe place. You can use them to access your account if you lose your device.
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {twoFABackupCodes.map((code, index) => (
                                <code key={index} className="text-xs bg-white px-2 py-1 rounded border">
                                  {code}
                                </code>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={handle2FAVerify}
                        disabled={isLoading || !twoFAToken}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isLoading ? 'Verifying...' : 'Verify & Enable'}
                      </button>
                      <button
                        onClick={() => {
                          setShow2FASetup(false);
                          setTwoFAToken('');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data & Privacy</h3>
                <div className="space-y-4">
                  <ToggleSwitch
                    enabled={settings.account.emailNotifications}
                    onChange={(enabled) => handleAccountChange('emailNotifications', enabled)}
                    label="Email Notifications"
                    description="Receive important updates via email"
                  />

                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Export My Data</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Download a copy of your learning data and progress
                      </p>
                    </div>
                    <button
                      onClick={handleDataExport}
                      disabled={isLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? 'Exporting...' : 'Export Data'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SettingSection>

          {/* Settings Status */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Settings Status</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your settings are automatically saved as you make changes
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>Auto-save enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
