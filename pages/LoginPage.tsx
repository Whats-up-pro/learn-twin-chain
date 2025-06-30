import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '../types';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

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
      const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did, password })
      });
      
      if (res.status === 401) {
        const errorData = await res.json();
        setError(errorData.detail || 'Invalid credentials');
        return;
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.detail || 'Login failed!');
        return;
      }
      
      const user = await res.json();
      const userRole: UserRole = user.role || UserRole.LEARNER;
      const profile = {
        did: user.did,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || '',
        institution: user.institution,
        program: user.program,
        birth_year: user.birth_year,
        enrollment_date: user.enrollment_date,
        createdAt: user.createdAt
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-300">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <span className="text-3xl font-extrabold text-sky-600 tracking-wide drop-shadow-md">LearnTwinChain</span>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>
        <form onSubmit={handleLogin}>
          <label className="block mb-2 font-medium">DID or Username</label>
          <input
            type="text"
            className="w-full p-2 border rounded mb-4"
            value={did}
            onChange={e => setDid(e.target.value)}
            placeholder="did:learntwin:student001 or username"
            disabled={isLoading}
          />
          <label className="block mb-2 font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-2 pr-10 border rounded mb-4"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <button 
            type="submit" 
            className={`w-full py-2 rounded transition ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-sky-600 hover:bg-sky-700'
            } text-white`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-4 text-center">
          Don't have an account? <Link to="/register" className="text-sky-600 hover:underline">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 