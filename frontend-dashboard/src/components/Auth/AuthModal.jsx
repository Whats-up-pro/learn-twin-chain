/**
 * Authentication Modal with Login/Register switching
 */
import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
  };

  const handleSwitchToRegister = () => {
    setActiveTab('register');
  };

  const handleSwitchToLogin = () => {
    setActiveTab('login');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-primary-400 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Close button */}
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                {activeTab === 'login' ? (
                  <LoginForm
                    onSuccess={handleSuccess}
                    onSwitchToRegister={handleSwitchToRegister}
                  />
                ) : (
                  <RegisterForm
                    onSuccess={handleSuccess}
                    onSwitchToLogin={handleSwitchToLogin}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}