import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  PlayIcon, 
  SpeakerWaveIcon, 
  EyeIcon, 
  BellIcon,
  ClockIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { videoSettingsService, VideoSettings, VideoSettingsUpdateRequest } from '../services/videoSettingsService';
import toast from 'react-hot-toast';

interface VideoSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const VideoSettingsPanel: React.FC<VideoSettingsPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<VideoSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'playback' | 'quality' | 'accessibility' | 'notifications' | 'privacy'>('playback');
  const [hasChanges, setHasChanges] = useState(false);
  const [tempSettings, setTempSettings] = useState<VideoSettingsUpdateRequest>({});

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    // Check if there are unsaved changes
    const hasUnsavedChanges = Object.keys(tempSettings).length > 0;
    setHasChanges(hasUnsavedChanges);
  }, [tempSettings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await videoSettingsService.getVideoSettings();
      setSettings(userSettings);
      setTempSettings({});
    } catch (error) {
      console.error('Failed to load video settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      const updatedSettings = await videoSettingsService.updateVideoSettings(tempSettings);
      setSettings(updatedSettings);
      setTempSettings({});
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        setSaving(true);
        await videoSettingsService.resetVideoSettings();
        await loadSettings();
        toast.success('Settings reset to defaults!');
      } catch (error) {
        console.error('Failed to reset settings:', error);
        toast.error('Failed to reset settings');
      } finally {
        setSaving(false);
      }
    }
  };

  const updateSetting = (key: keyof VideoSettingsUpdateRequest, value: any) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
  };

  const getCurrentValue = (key: keyof VideoSettings) => {
    return tempSettings[key as keyof VideoSettingsUpdateRequest] ?? settings?.[key];
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'playback', name: 'Playback', icon: PlayIcon },
    { id: 'quality', name: 'Quality', icon: ComputerDesktopIcon },
    { id: 'accessibility', name: 'Accessibility', icon: EyeIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Video Learning Settings</h2>
          </div>
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                <span>Save Changes</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 bg-gray-50">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleResetSettings}
                disabled={saving}
                className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="p-6">
                {/* Playback Settings */}
                {activeTab === 'playback' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Playback Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Playback Speed
                        </label>
                        <select
                          value={getCurrentValue('default_playback_speed') || '1.0'}
                          onChange={(e) => updateSetting('default_playback_speed', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="0.25">0.25x (Very Slow)</option>
                          <option value="0.5">0.5x (Slow)</option>
                          <option value="1.0">1.0x (Normal)</option>
                          <option value="1.25">1.25x (Fast)</option>
                          <option value="1.5">1.5x (Faster)</option>
                          <option value="1.75">1.75x (Very Fast)</option>
                          <option value="2.0">2.0x (Maximum)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Remember Playback Speed</label>
                          <p className="text-xs text-gray-500">Remember the last used playback speed</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getCurrentValue('remember_playback_speed') ?? true}
                            onChange={(e) => updateSetting('remember_playback_speed', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Auto Play</label>
                          <p className="text-xs text-gray-500">Automatically start playing videos</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getCurrentValue('auto_play') ?? false}
                            onChange={(e) => updateSetting('auto_play', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Auto Advance</label>
                          <p className="text-xs text-gray-500">Automatically advance to next lesson when current is complete</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getCurrentValue('auto_advance') ?? true}
                            onChange={(e) => updateSetting('auto_advance', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Volume
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={getCurrentValue('volume') ?? 1.0}
                          onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>{Math.round((getCurrentValue('volume') ?? 1.0) * 100)}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quality Settings */}
                {activeTab === 'quality' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Video Quality Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Quality
                        </label>
                        <select
                          value={getCurrentValue('preferred_quality') || 'auto'}
                          onChange={(e) => updateSetting('preferred_quality', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="auto">Auto (Recommended)</option>
                          <option value="240p">240p (Low)</option>
                          <option value="480p">480p (Medium)</option>
                          <option value="720p">720p (High)</option>
                          <option value="1080p">1080p (HD)</option>
                          <option value="2160p">2160p (4K)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bandwidth Limit (kbps)
                        </label>
                        <input
                          type="number"
                          value={getCurrentValue('bandwidth_limit') || ''}
                          onChange={(e) => updateSetting('bandwidth_limit', e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="No limit"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty for no limit</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Data Saver Mode</label>
                          <p className="text-xs text-gray-500">Reduce data usage by limiting quality</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getCurrentValue('data_saver_mode') ?? false}
                            onChange={(e) => updateSetting('data_saver_mode', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accessibility Settings */}
                {activeTab === 'accessibility' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Accessibility Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Enable Captions</label>
                          <p className="text-xs text-gray-500">Show captions by default</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getCurrentValue('captions_enabled') ?? true}
                            onChange={(e) => updateSetting('captions_enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Caption Language
                        </label>
                        <select
                          value={getCurrentValue('caption_language') || 'en'}
                          onChange={(e) => updateSetting('caption_language', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="zh">Chinese</option>
                          <option value="ja">Japanese</option>
                          <option value="ko">Korean</option>
                          <option value="vi">Vietnamese</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Caption Size
                        </label>
                        <select
                          value={getCurrentValue('caption_size') || 'medium'}
                          onChange={(e) => updateSetting('caption_size', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Caption Color
                        </label>
                        <select
                          value={getCurrentValue('caption_color') || 'white'}
                          onChange={(e) => updateSetting('caption_color', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="white">White</option>
                          <option value="yellow">Yellow</option>
                          <option value="green">Green</option>
                          <option value="blue">Blue</option>
                          <option value="red">Red</option>
                          <option value="black">Black</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Caption Background</label>
                          <p className="text-xs text-gray-500">Show background behind captions</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getCurrentValue('caption_background') ?? true}
                            onChange={(e) => updateSetting('caption_background', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                    
                    <div className="space-y-4">
                      {Object.entries(getCurrentValue('notifications') || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 capitalize">
                              {key.replace(/_/g, ' ')}
                            </label>
                            <p className="text-xs text-gray-500">
                              {key === 'lesson_complete' && 'Notify when a lesson is completed'}
                              {key === 'module_complete' && 'Notify when a module is completed'}
                              {key === 'quiz_available' && 'Notify when a quiz becomes available'}
                              {key === 'achievement_earned' && 'Notify when an achievement is earned'}
                              {key === 'discussion_reply' && 'Notify when someone replies to your discussion'}
                              {key === 'course_update' && 'Notify about course updates'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value as boolean}
                              onChange={(e) => {
                                const notifications = { ...getCurrentValue('notifications') };
                                notifications[key as keyof typeof notifications] = e.target.checked;
                                updateSetting('notifications', notifications);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Study Reminders</label>
                            <p className="text-xs text-gray-500">Get reminded to continue studying</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={getCurrentValue('study_reminders') ?? true}
                              onChange={(e) => updateSetting('study_reminders', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reminder Frequency (hours)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={getCurrentValue('reminder_frequency') || 24}
                          onChange={(e) => updateSetting('reminder_frequency', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Share Progress</label>
                          <p className="text-xs text-gray-500">Share your learning progress with instructors</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getCurrentValue('share_progress') ?? true}
                            onChange={(e) => updateSetting('share_progress', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Share Learning Analytics</label>
                          <p className="text-xs text-gray-500">Share analytics data to improve the platform</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getCurrentValue('share_learning_analytics') ?? true}
                            onChange={(e) => updateSetting('share_learning_analytics', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Anonymous Analytics</label>
                          <p className="text-xs text-gray-500">Allow anonymous usage analytics</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getCurrentValue('anonymous_analytics') ?? true}
                            onChange={(e) => updateSetting('anonymous_analytics', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Data Tracking</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Track Watch Time</label>
                              <p className="text-xs text-gray-500">Track how long you watch videos</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={getCurrentValue('track_watch_time') ?? true}
                                onChange={(e) => updateSetting('track_watch_time', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Track Pause Events</label>
                              <p className="text-xs text-gray-500">Track when you pause videos</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={getCurrentValue('track_pause_events') ?? true}
                                onChange={(e) => updateSetting('track_pause_events', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Track Seek Events</label>
                              <p className="text-xs text-gray-500">Track when you skip or rewind</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={getCurrentValue('track_seek_events') ?? true}
                                onChange={(e) => updateSetting('track_seek_events', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSettingsPanel;
