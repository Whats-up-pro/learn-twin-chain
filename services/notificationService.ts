/**
 * Notification Service - Handle browser notifications and push notifications
 */

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

class NotificationService {
  private permission: NotificationPermission = {
    granted: false,
    denied: false,
    default: false,
  };

  constructor() {
    this.checkPermission();
  }

  // Check current notification permission
  checkPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return this.permission;
    }

    switch (Notification.permission) {
      case 'granted':
        this.permission = { granted: true, denied: false, default: false };
        break;
      case 'denied':
        this.permission = { granted: false, denied: true, default: false };
        break;
      default:
        this.permission = { granted: false, denied: false, default: true };
    }

    return this.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    try {
      const permission = await Notification.requestPermission();
      
      switch (permission) {
        case 'granted':
          this.permission = { granted: true, denied: false, default: false };
          break;
        case 'denied':
          this.permission = { granted: false, denied: true, default: false };
          break;
        default:
          this.permission = { granted: false, denied: false, default: true };
      }

      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  // Show notification
  showNotification(title: string, options?: NotificationOptions): Notification | null {
    if (!this.permission.granted) {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // Show course update notification
  showCourseUpdateNotification(courseTitle: string): void {
    this.showNotification('Course Update', {
      body: `New content available in "${courseTitle}"`,
      tag: 'course-update',
      requireInteraction: false,
    });
  }

  // Show achievement notification
  showAchievementNotification(achievementTitle: string): void {
    this.showNotification('Achievement Unlocked!', {
      body: `You've earned: ${achievementTitle}`,
      tag: 'achievement',
      requireInteraction: true,
    });
  }

  // Show NFT earned notification
  showNFTEarnedNotification(nftTitle: string): void {
    this.showNotification('NFT Earned!', {
      body: `You've earned a new NFT: ${nftTitle}`,
      tag: 'nft-earned',
      requireInteraction: true,
    });
  }

  // Show quiz completion notification
  showQuizCompletionNotification(quizTitle: string, score: number): void {
    this.showNotification('Quiz Completed', {
      body: `"${quizTitle}" - Score: ${score}%`,
      tag: 'quiz-completion',
      requireInteraction: false,
    });
  }

  // Show lesson completion notification
  showLessonCompletionNotification(lessonTitle: string): void {
    this.showNotification('Lesson Completed', {
      body: `Great job completing "${lessonTitle}"!`,
      tag: 'lesson-completion',
      requireInteraction: false,
    });
  }

  // Show general learning notification
  showLearningNotification(message: string): void {
    this.showNotification('Learning Update', {
      body: message,
      tag: 'learning-update',
      requireInteraction: false,
    });
  }

  // Show certificate earned notification
  showCertificateNotification(certificateTitle: string, certificateType: string): void {
    this.showNotification('Certificate Earned!', {
      body: `Congratulations! You've earned a ${certificateType}: ${certificateTitle}`,
      tag: 'certificate-earned',
      requireInteraction: true,
    });
  }

  // Show course completion notification
  showCourseCompletionNotification(courseTitle: string): void {
    this.showNotification('Course Completed!', {
      body: `Congratulations! You've completed "${courseTitle}" and earned a certificate!`,
      tag: 'course-completion',
      requireInteraction: true,
    });
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window;
  }

  // Get current permission status
  getPermission(): NotificationPermission {
    return { ...this.permission };
  }

  // Check if permission is granted
  isPermissionGranted(): boolean {
    return this.permission.granted;
  }

  // Check if permission is denied
  isPermissionDenied(): boolean {
    return this.permission.denied;
  }

  // Check if permission is default (not requested yet)
  isPermissionDefault(): boolean {
    return this.permission.default;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
