import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const VerifyEmailSentPage: React.FC = () => {
  const location = useLocation();
  const { email, message, did } = location.state || {};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 p-4">
      <div className="w-full max-w-md rounded-3xl shadow-2xl p-8 text-center bg-white">
        <div className="text-6xl mb-6">
          <EnvelopeIcon className="w-16 h-16 mx-auto text-blue-600" />
        </div>
        
        <div className="text-2xl font-bold mb-4 text-gray-800">
          Check Your Email
        </div>
        
        <p className="text-gray-600 mb-4">
          {message || 'We have sent a verification link to your email address.'}
        </p>
        
        {email && (
          <p className="text-sm text-gray-500 mb-4">
            Verification email sent to: <strong>{email}</strong>
          </p>
        )}
        
        {did && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500 mb-1">Your Digital Identity (DID):</p>
            <p className="text-sm font-mono text-blue-700 break-all">{did}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">Please check your email and click the verification link to activate your account.</p>
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <Link 
              to="/login" 
              className="inline-flex items-center px-6 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Return to Login Page
            </Link>
          </div>
          
          <div className="text-xs text-gray-400">
            <p>After verifying your email, you can sign in with your credentials.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailSentPage;
