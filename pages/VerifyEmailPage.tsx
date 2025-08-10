import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading'|'verifying'|'success'|'error'>('loading');
  const [message, setMessage] = useState('Checking verification link...');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      // Validate token exists
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      // Validate token format (basic check)
      if (token.length < 10) {
        setStatus('error');
        setMessage('Invalid verification token format.');
        return;
      }

      try {
        setStatus('verifying');
        setMessage('Verifying your email address...');

        const response = await fetch('http://localhost:8000/api/v1/auth/verify-email', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ token })
        });

        const data = await response.json();
        
        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 400) {
            const errorMessage = data.detail || 'Verification failed';
            if (errorMessage.includes('expired')) {
              setMessage('This verification link has expired. Please request a new verification email.');
            } else if (errorMessage.includes('invalid')) {
              setMessage('This verification link is invalid. Please check your email for the correct link.');
            } else {
              setMessage(errorMessage);
            }
          } else if (response.status === 404) {
            setMessage('Verification service not found. Please try again later.');
          } else if (response.status >= 500) {
            setMessage('Server error occurred. Please try again later.');
          } else {
            setMessage(data.detail || data.message || 'Email verification failed. Please try again.');
          }
          setStatus('error');
          return;
        }

        // Success case
        setStatus('success');
        setMessage(data.message || 'Email verified successfully! You can now sign in.');
        
        // Auto redirect after successful verification
        setIsRedirecting(true);
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              message: 'Email verified successfully! You can now sign in.',
              type: 'success'
            }
          });
        }, 3000);

      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          setMessage('Unable to connect to verification service. Please check your internet connection and try again.');
        } else {
          setMessage(error?.message || 'An unexpected error occurred during verification. Please try again.');
        }
      }
    };

    // Small delay to prevent flash of content
    const timer = setTimeout(verifyEmail, 100);
    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading': return '🔍';
      case 'verifying': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading': return 'Loading...';
      case 'verifying': return 'Verifying...';
      case 'success': return 'Email Verified!';
      case 'error': return 'Verification Failed';
      default: return 'Verifying...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'success': return 'from-green-50 to-emerald-50 border-green-200';
      case 'error': return 'from-red-50 to-rose-50 border-red-200';
      default: return 'from-blue-50 to-indigo-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 p-4">
      <div className="w-full max-w-md rounded-3xl shadow-2xl p-8 text-center bg-white">
        <div className="text-6xl mb-6">{getStatusIcon()}</div>
        
        <div className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {getStatusTitle()}
        </div>
        
        <div className={`rounded-2xl p-4 mb-6 border-2 bg-gradient-to-br ${getBackgroundColor()}`}>
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Show loading spinner for verifying state */}
        {(status === 'loading' || status === 'verifying') && (
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Success state with auto-redirect countdown */}
        {status === 'success' && isRedirecting && (
          <div className="mb-6 p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-700 text-sm">
              🎉 Redirecting to login page in a few seconds...
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {status === 'success' && (
            <Link 
              to="/login" 
              className="block w-full px-6 py-3 rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-200 font-medium"
            >
              Continue to Sign In
            </Link>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <Link 
                to="/register" 
                className="block w-full px-6 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-200 font-medium"
              >
                Request New Verification
              </Link>
              <Link 
                to="/login" 
                className="block w-full px-6 py-3 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          )}
          
          {(status === 'loading' || status === 'verifying') && (
            <p className="text-gray-500 text-sm">
              Please wait while we verify your email...
            </p>
          )}
        </div>

        {/* Help text */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {status === 'error' 
              ? 'If you continue to have issues, please contact support.'
              : 'This process should only take a few seconds.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

