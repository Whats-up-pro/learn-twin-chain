/**
 * Session Timeout Popup Component
 * Shows when session is about to expire (≤5 seconds remaining)
 * Gives user choice: "Stay Learning" (refresh) or "Logout"
 */

import React, { useState, useEffect } from 'react';

interface SessionTimeoutPopupProps {
  isVisible: boolean;
  timeRemaining: number;
  onStayLearning: () => Promise<void>;
  onLogout: () => Promise<void>;
  onClose: () => void;
}

const SessionTimeoutPopup: React.FC<SessionTimeoutPopupProps> = ({
  isVisible,
  timeRemaining,
  onStayLearning,
  onLogout,
  onClose,
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setCountdown(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-logout when countdown reaches 0
          try {
            handleLogout();
          } catch (error) {
            console.error('Auto-logout error:', error);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleStayLearning = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await onStayLearning();
    } catch (error) {
      console.error('Stay learning failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Safety check - don't render if essential props are missing
  if (!isVisible || typeof timeRemaining !== 'number') {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        {/* Popup */}
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
          {/* Warning Icon */}
          <div className="text-center mb-4">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-8 h-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Session Expiring Soon!
            </h3>
            <p className="text-gray-600 text-sm">
              Your learning session will expire in{' '}
              <span className="font-bold text-red-600">{countdown}</span> seconds
            </p>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-gray-700">
              Would you like to continue learning or log out?
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            {/* Stay Learning Button */}
            <button
              onClick={handleStayLearning}
              disabled={isProcessing}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </span>
              ) : (
                '📚 Stay Learning'
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isProcessing}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging out...
                </span>
              ) : (
                '🚪 Logout'
              )}
            </button>
          </div>

          {/* Timer Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.max(0, (countdown / 5) * 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-1">
              Auto-logout in {countdown} seconds if no action is taken
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionTimeoutPopup;
