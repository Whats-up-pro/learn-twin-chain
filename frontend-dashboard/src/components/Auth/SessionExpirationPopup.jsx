/**
 * Session Expiration Warning Popup
 * Shows when session is about to expire with options to extend or logout
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/authService';

export default function SessionExpirationPopup() {
  const { logout, user, isAuthenticated } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let intervalId;

    const checkSessionStatus = async () => {
      try {
        const status = await authService.getSessionStatus();
        
        if (!status.authenticated) {
          // Session has expired, logout
          await logout();
          return;
        }

        const timeLeft = status.time_remaining_seconds;
        setTimeRemaining(timeLeft);

        // Show popup when less than 5 minutes remaining
        if (status.expires_soon && !showPopup) {
          setShowPopup(true);
        }

        // Auto logout when session expires
        if (timeLeft <= 0) {
          await logout();
          setShowPopup(false);
        }
      } catch (error) {
        console.error('Error checking session status:', error);
      }
    };

    // Check immediately
    checkSessionStatus();

    // Then check every 30 seconds
    intervalId = setInterval(checkSessionStatus, 30000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, logout, showPopup]);

  const handleExtendSession = async () => {
    try {
      setExtending(true);
      await authService.extendSession();
      setShowPopup(false);
      
      // Show success message briefly
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Session extended successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
      
    } catch (error) {
      console.error('Error extending session:', error);
      // If extension fails, logout
      await logout();
    } finally {
      setExtending(false);
    }
  };

  const handleLogout = async () => {
    setShowPopup(false);
    await logout();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!showPopup || !isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Warning Icon */}
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg 
                  className="h-6 w-6 text-yellow-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>

              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Session Expiring Soon
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Your session will expire in{' '}
                    <span className="font-bold text-red-600">
                      {formatTime(timeRemaining)}
                    </span>
                    {'. '}
                    Would you like to extend your session or logout?
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    For your security, you'll be automatically logged out when the session expires.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              onClick={handleExtendSession}
              disabled={extending}
            >
              {extending ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Extending...
                </div>
              ) : (
                'Extend Session'
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleLogout}
              disabled={extending}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}