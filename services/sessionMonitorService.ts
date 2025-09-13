/**
 * Session monitoring service to handle 15-second session timeouts
 * Monitors session expiration and triggers timeout popup
 */

import { API_BASE_URL } from '../constants';

export interface SessionStatus {
  authenticated: boolean;
  session_id: string | null;
  user_id?: string;
  roles?: string[];
  expires_at?: string;
  time_remaining_seconds?: number;
  expires_soon?: boolean;
  csrf_token?: string;
}

export type SessionTimeoutCallback = (timeRemaining: number) => void;
export type SessionExpiredCallback = () => void;
export type SessionRefreshedCallback = () => void;

class SessionMonitorService {
  private checkInterval: NodeJS.Timeout | null = null;
  private timeoutCallback: SessionTimeoutCallback | null = null;
  private expiredCallback: SessionExpiredCallback | null = null;
  private refreshedCallback: SessionRefreshedCallback | null = null;
  private isMonitoring = false;
  private lastStatus: SessionStatus | null = null;

  /**
   * Start monitoring session status every second
   */
  startMonitoring(
    onTimeout: SessionTimeoutCallback,
    onExpired: SessionExpiredCallback,
    onRefreshed?: SessionRefreshedCallback
  ) {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }

    this.timeoutCallback = onTimeout;
    this.expiredCallback = onExpired;
    this.refreshedCallback = onRefreshed;
    this.isMonitoring = true;

    console.log('🔍 Starting session monitoring (15-second sessions)...');

    // Check immediately
    this.checkSessionStatus();

    // Check every second
    this.checkInterval = setInterval(() => {
      this.checkSessionStatus();
    }, 1000);
  }

  /**
   * Stop monitoring session
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    this.timeoutCallback = null;
    this.expiredCallback = null;
    this.refreshedCallback = null;
    console.log('⏹️ Session monitoring stopped');
  }

  /**
   * Check current session status
   */
  private async checkSessionStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session-status`, {
        method: 'GET',
        credentials: 'include', // Important: include session cookie
      });

      const status: SessionStatus = await response.json();

      // If session is expired/invalid
      if (!status.authenticated || !status.time_remaining_seconds) {
        if (this.lastStatus?.authenticated && this.expiredCallback) {
          console.log('❌ Session expired!');
          this.expiredCallback();
        }
        this.lastStatus = status;
        return;
      }

      const timeRemaining = status.time_remaining_seconds;
      const wasPreviouslyTimingOut = this.lastStatus?.expires_soon;

      // Trigger timeout warning when 5 seconds or less remaining
      if (timeRemaining <= 5 && !wasPreviouslyTimingOut && this.timeoutCallback) {
        console.log(`⏰ Session expiring in ${timeRemaining} seconds!`);
        this.timeoutCallback(timeRemaining);
      }

      // Check if session was refreshed (time increased)
      if (
        this.lastStatus?.time_remaining_seconds &&
        timeRemaining > this.lastStatus.time_remaining_seconds &&
        this.refreshedCallback
      ) {
        console.log('✅ Session refreshed!');
        this.refreshedCallback();
      }

      this.lastStatus = status;

    } catch (error) {
      console.error('Session status check failed:', error);
      // If we can't check status, assume session expired
      if (this.lastStatus?.authenticated && this.expiredCallback) {
        this.expiredCallback();
      }
    }
  }

  /**
   * Refresh/extend current session (for "Stay Learning" option)
   */
  async refreshSession(): Promise<boolean> {
    try {
      console.log('🔄 Refreshing session...');
      const response = await fetch(`${API_BASE_URL}/auth/refresh-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Session refreshed successfully:', result.expires_in_seconds, 'seconds');
        return true;
      } else {
        console.error('❌ Failed to refresh session:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Session refresh error:', error);
      return false;
    }
  }

  /**
   * Logout user (revoke session)
   */
  async logout(): Promise<boolean> {
    try {
      console.log('🚪 Logging out...');
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        console.log('✅ Logout successful');
        this.stopMonitoring(); // Stop monitoring after logout
        return true;
      } else {
        console.error('❌ Logout failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      return false;
    }
  }

  /**
   * Get current session status (one-time check)
   */
  async getCurrentStatus(): Promise<SessionStatus | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session-status`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get session status:', error);
      return null;
    }
  }

  /**
   * Check if currently monitoring
   */
  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }
}

// Export singleton instance
export const sessionMonitor = new SessionMonitorService();
export default sessionMonitor;
