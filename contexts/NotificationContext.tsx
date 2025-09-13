import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'achievement' | 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  icon?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem('learntwin_notifications');
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        const validNotifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(validNotifications);
      }
    } catch (error) {
      console.warn('Failed to load notifications from storage:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('learntwin_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.warn('Failed to save notifications to storage:', error);
    }
  }, [notifications]);

  // Listen for achievement unlock events
  useEffect(() => {
    const handleAchievementUnlocked = (event: CustomEvent) => {
      const { title, description } = event.detail;
      addNotification({
        type: 'achievement',
        title: `🏆 Achievement Unlocked: ${title}`,
        message: description,
        icon: '🏆'
      });
    };

    window.addEventListener('achievementUnlocked', handleAchievementUnlocked as EventListener);
    return () => {
      window.removeEventListener('achievementUnlocked', handleAchievementUnlocked as EventListener);
    };
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove non-achievement notifications after 30 seconds
    if (notification.type !== 'achievement') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 30000);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
