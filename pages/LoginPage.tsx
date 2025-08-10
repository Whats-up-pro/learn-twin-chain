import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '../types';
import { EyeIcon, EyeSlashIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
  const { updateLearnerProfile, setRole } = useAppContext();
  const [did, setDid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!did.trim() || !password.trim()) {
      setError('Please enter both DID/username and password!');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      let res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: did, password })
      });
      
      if (!res.ok) {
        // Handle known auth errors
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setError(errorData.detail || 'Invalid credentials');
          return;
        }
        if (res.status === 400 && (errorData.detail || '').toLowerCase().includes('email')) {
          setError(errorData.detail || 'Email not verified. Please check your inbox.');
          return;
        }
        // Fallback to legacy endpoint for local JSON users
        res = await fetch('http://localhost:8000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ did, password })
        });
        if (!res.ok) {
          const legacyError = await res.json().catch(() => ({}));
          setError(legacyError.detail || legacyError.message || 'Login failed!');
          return;
        }
      }
      
      const payload = await res.json();
      const user = payload.user || payload;
      const userRole: UserRole = user.role || UserRole.LEARNER;
      const profile = {
        did: user.did,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url || user.avatarUrl || '',
        institution: user.institution,
        program: user.program,
        birth_year: user.birth_year,
        enrollment_date: user.enrollment_date,
        createdAt: user.created_at || user.createdAt
      };
      updateLearnerProfile(profile, userRole);
      setRole(userRole);
      if (userRole === UserRole.TEACHER) {
        navigate('/teacher', { replace: true });
      } else if (userRole === UserRole.EMPLOYER) {
        navigate('/employer', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error! Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#005acd] via-[#0093cb] to-[#6dd7fd] p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#6dd7fd] rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-[#0093cb] rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#005acd] rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="hidden lg:block relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#005acd] via-[#0093cb] to-[#6dd7fd] p-10 text-white shadow-2xl transform hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent"></div>
          <div className="absolute top-4 right-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
          </div>
          
          <h1 className="text-4xl font-extrabold mb-4 animate-fade-in">Welcome back to LearnTwin</h1>
          <p className="text-[#bef0ff] mb-8 text-lg animate-fade-in animation-delay-500">Continue your learning journey with AI-powered education, blockchain verification, and NFT achievements.</p>
          
                      <div className="space-y-4 animate-fade-in animation-delay-1000">
            <div className="flex items-center space-x-3 group">
              <div className="w-3 h-3 bg-[#6dd7fd] rounded-full group-hover:scale-125 transition-transform"></div>
              <span className="text-[#bef0ff]">Interactive video learning modules</span>
            </div>
            <div className="flex items-center space-x-3 group">
              <div className="w-3 h-3 bg-[#0093cb] rounded-full group-hover:scale-125 transition-transform"></div>
              <span className="text-[#bef0ff]">Module Progress & Achievement NFTs</span>
            </div>
            <div className="flex items-center space-x-3 group">
              <div className="w-3 h-3 bg-[#005acd] rounded-full group-hover:scale-125 transition-transform"></div>
              <span className="text-[#bef0ff]">Steam-like achievement system</span>
            </div>
            <div className="flex items-center space-x-3 group">
              <div className="w-3 h-3 bg-[#bef0ff] rounded-full group-hover:scale-125 transition-transform"></div>
              <span className="text-[#bef0ff]">ZK-proof verified learning</span>
            </div>
          </div>
          
          <div className="mt-10 p-4 bg-white/10 rounded-2xl backdrop-blur-sm animate-fade-in animation-delay-1500">
            <div className="text-sm text-[#f5ffff] font-medium">Powered by blockchain technology</div>
            <div className="text-xs text-[#bef0ff] mt-1">Secure • Verifiable • Decentralized</div>
          </div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 lg:p-10 transform hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div className="animate-fade-in">
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#005acd] to-[#0093cb]">
                Sign in to your account
              </div>
              <div className="text-sm text-gray-500 mt-2">Welcome back! Please enter your details.</div>
            </div>
            <div className="animate-bounce">
              <ArrowRightOnRectangleIcon className="h-8 w-8 text-[#005acd]" />
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6 animate-fade-in animation-delay-300">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Email or DID</label>
              <input
                type="text"
                className="w-full p-4 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-[#005acd]/20 focus:border-[#005acd] hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                value={did}
                onChange={e => setDid(e.target.value)}
                placeholder="did:learntwin:student001 or your@email.com"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full p-4 pr-12 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-[#005acd]/20 focus:border-[#005acd] hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors hover:scale-110 transform duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
                <div className="text-red-700 text-sm font-medium">{error}</div>
              </div>
            )}
            
            <button 
              type="submit" 
              className={`w-full py-4 rounded-xl font-semibold text-white text-lg bg-gradient-to-r from-[#005acd] via-[#0093cb] to-[#6dd7fd] hover:from-[#0093cb] hover:via-[#005acd] hover:to-[#6dd7fd] shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${isLoading ? 'opacity-60 cursor-not-allowed scale-100' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
            
            <div className="text-center">
              <Link to="/register" className="text-sm text-gray-600 hover:text-[#005acd] transition-colors">
                Forgot your password?
              </Link>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              Don't have an account? 
              <Link to="/register" className="ml-1 font-semibold text-[#005acd] hover:text-[#0093cb] transition-colors hover:underline">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 