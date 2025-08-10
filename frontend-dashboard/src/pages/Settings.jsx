/**
 * Settings Page - User Profile and Preferences
 */
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import WalletConnection from '../components/Wallet/WalletConnection';

export default function Settings() {
  const { user, isAuthenticated, isEmailVerified } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-[#005acd] mb-4">
          Sign in to access settings
        </h2>
        <p className="text-[#0093cb]">
          Manage your profile, preferences, and wallet connections
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'wallet', name: 'Wallet', icon: '🔗' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-[#005acd] mb-2">
          Settings
        </h1>
        <p className="text-[#0093cb]">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white shadow rounded-lg p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-[#bef0ff] text-[#005acd]'
                      : 'text-[#0093cb] hover:bg-[#f5ffff]'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white shadow rounded-lg">
            {activeTab === 'profile' && <ProfileSettings user={user} />}
            {activeTab === 'wallet' && <WalletSettings />}
            {activeTab === 'security' && <SecuritySettings user={user} isEmailVerified={isEmailVerified} />}
            {activeTab === 'preferences' && <PreferencesSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ user }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    institution: user?.institution || '',
    program: user?.program || '',
    department: user?.department || '',
    bio: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle profile update
    console.log('Update profile:', formData);
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-[#005acd] mb-6">
        Profile Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#005acd] mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#005acd] mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md bg-[#f5ffff] text-[#0093cb]"
            />
            <p className="mt-1 text-xs text-[#0093cb]">
              Email cannot be changed after registration
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#005acd] mb-1">
              Institution
            </label>
            <input
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#005acd] mb-1">
              Program
            </label>
            <input
              type="text"
              name="program"
              value={formData.program}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#005acd] mb-1">
            Bio
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#005acd] hover:bg-[#0093cb] text-white px-6 py-2 rounded-md font-medium"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

function WalletSettings() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-[#005acd] mb-6">
        Wallet Management
      </h2>
      <WalletConnection />
    </div>
  );
}

function SecuritySettings({ user, isEmailVerified }) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Handle password change
    console.log('Change password:', passwordData);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold text-[#005acd]">
        Security Settings
      </h2>

      {/* Email Verification Status */}
      <div className="border border-[#6dd7fd] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[#005acd]">Email Verification</h3>
            <p className="text-sm text-[#0093cb]">
              {isEmailVerified ? 'Your email is verified' : 'Please verify your email address'}
            </p>
          </div>
          <div className="flex items-center">
            {isEmailVerified ? (
              <span className="px-3 py-1 bg-[#bef0ff] text-[#005acd] text-sm font-medium rounded-full">
                ✅ Verified
              </span>
            ) : (
              <div className="space-x-2">
                <span className="px-3 py-1 bg-[#f5ffff] text-[#005acd] text-sm font-medium rounded-full">
                  ⚠️ Unverified
                </span>
                <button className="text-[#005acd] hover:text-[#0093cb] text-sm font-medium">
                  Resend Email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="border border-[#6dd7fd] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-[#005acd]">Password</h3>
            <p className="text-sm text-[#0093cb]">
              Update your password to keep your account secure
            </p>
          </div>
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="text-[#005acd] hover:text-[#0093cb] text-sm font-medium"
          >
            {showChangePassword ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showChangePassword && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#005acd] mb-1">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#005acd] mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#005acd] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
                minLength={8}
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-[#005acd] hover:bg-[#0093cb] text-white px-4 py-2 rounded-md font-medium"
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Information */}
      <div className="border border-[#6dd7fd] rounded-lg p-4">
        <h3 className="font-medium text-[#005acd] mb-3">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#0093cb]">Account Type:</span>
            <span className="font-medium">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#0093cb]">Member Since:</span>
            <span className="font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#0093cb]">DID:</span>
            <span className="font-mono text-xs">{user?.did}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferencesSettings() {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    progressReminders: true,
    achievementAlerts: true,
    marketingEmails: false,
    theme: 'light',
    language: 'en'
  });

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Handle save preferences
    console.log('Save preferences:', preferences);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold text-[#005acd]">
        Preferences
      </h2>

      {/* Notifications */}
      <div className="border border-[#6dd7fd] rounded-lg p-4">
        <h3 className="font-medium text-[#005acd] mb-4">Notifications</h3>
        <div className="space-y-3">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive important updates via email' },
            { key: 'progressReminders', label: 'Progress Reminders', description: 'Get reminded about your learning goals' },
            { key: 'achievementAlerts', label: 'Achievement Alerts', description: 'Notifications when you earn new certificates' },
            { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional content and newsletters' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#005acd]">{item.label}</div>
                <div className="text-sm text-[#0093cb]">{item.description}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences[item.key]}
                  onChange={(e) => handlePreferenceChange(item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#bef0ff] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6dd7fd] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#6dd7fd] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005acd]"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Display Settings */}
      <div className="border border-[#6dd7fd] rounded-lg p-4">
        <h3 className="font-medium text-[#005acd] mb-4">Display</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#005acd] mb-2">
              Theme
            </label>
            <select
              value={preferences.theme}
              onChange={(e) => handlePreferenceChange('theme', e.target.value)}
              className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#005acd] mb-2">
              Language
            </label>
            <select
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-[#6dd7fd] rounded-md focus:outline-none focus:ring-2 focus:ring-[#005acd]"
            >
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-[#005acd] hover:bg-[#0093cb] text-white px-6 py-2 rounded-md font-medium"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}