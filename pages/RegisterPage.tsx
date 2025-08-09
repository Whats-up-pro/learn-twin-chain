import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);

  // Fetch available programs on component mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/programs');
        if (response.ok) {
          const data = await response.json();
          setAvailablePrograms(data.programs);
        } else {
          // Fallback programs if API fails
          setAvailablePrograms([
            'Computer Science',
            'Cybersecurity', 
            'Artificial Intelligence',
            'Data Science',
            'Networking',
            'Software Engineering',
            'Information Technology',
            'Digital Marketing',
            'Blockchain Technology',
            'Machine Learning'
          ]);
        }
      } catch (error) {
        // Fallback programs if network error
        setAvailablePrograms([
          'Computer Science',
          'Cybersecurity', 
          'Artificial Intelligence',
          'Data Science',
          'Networking',
          'Software Engineering',
          'Information Technology',
          'Digital Marketing',
          'Blockchain Technology',
          'Machine Learning'
        ]);
      }
    };
    
    fetchPrograms();
  }, []);


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim() || !password.trim() || !email.trim() || !program.trim() || !birthYear.trim()) {
      setError('Please fill in all required fields!');
      return;
    }
    
    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username must contain only letters, numbers, and underscores');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setSuccessMsg('');
      const payload = {
        username,
        name,
        email,
        password,
        avatar_url: avatarUrl,
        institution: 'UIT',
        program,
        birth_year: parseInt(birthYear),
        role: 'student'
      };
      
      const res = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        setError(data.detail || data.message || 'Registration failed!');
        return;
      }
      
      setSuccessMsg(data.message || 'Registration successful! Please check your email to verify your account before logging in.');
      
      // Show DID information to user
      if (data.did) {
        setTimeout(() => {
          setSuccessMsg(prev => prev + ` Your DID: ${data.did}`);
        }, 2000);
      }
      
    } catch (err) {
      setError('Network error! Please make sure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden fixed inset-0">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="hidden lg:block relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 via-blue-700 to-indigo-800 p-10 text-white shadow-2xl transform hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent"></div>
          <div className="absolute top-4 right-4">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
          </div>
          
          <h1 className="text-4xl font-extrabold mb-4 animate-fade-in">Join LearnTwinChain</h1>
          <p className="text-blue-100 mb-8 text-lg animate-fade-in animation-delay-500">Transform your learning journey with AI-powered education, digital twin tracking, and blockchain-verified achievements.</p>
          
          <div className="space-y-4 animate-fade-in animation-delay-1000">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <CheckCircleIcon className="h-6 w-6 text-emerald-300 group-hover:scale-125 transition-transform" />
              <span className="text-blue-100">Interactive video modules with real-time progress</span>
            </div>
            <div className="flex items-center space-x-3 group cursor-pointer">
              <CheckCircleIcon className="h-6 w-6 text-emerald-300 group-hover:scale-125 transition-transform" />
              <span className="text-blue-100">Steam-like achievement system with NFT rewards</span>
            </div>
            <div className="flex items-center space-x-3 group cursor-pointer">
              <CheckCircleIcon className="h-6 w-6 text-emerald-300 group-hover:scale-125 transition-transform" />
              <span className="text-blue-100">Email verification & secure authentication</span>
            </div>
            <div className="flex items-center space-x-3 group cursor-pointer">
              <CheckCircleIcon className="h-6 w-6 text-emerald-300 group-hover:scale-125 transition-transform" />
              <span className="text-blue-100">ZK-proof verified learning credentials</span>
            </div>
          </div>
          
          <div className="mt-10 p-4 bg-white/10 rounded-2xl backdrop-blur-sm animate-fade-in animation-delay-1500">
            <div className="text-sm text-blue-200 font-medium">🔗 Powered by blockchain technology</div>
            <div className="text-xs text-blue-300 mt-1">Secure • Verifiable • Decentralized • Future-ready</div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 lg:p-10 transform hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div className="animate-fade-in">
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
                Create your account
              </div>
              <div className="text-sm text-gray-500 mt-2">Start your learning journey today!</div>
            </div>
            <div className="animate-bounce">
              <img className="h-12 w-12 rounded-xl shadow-lg" alt="Logo" src="https://ui-avatars.com/api/?name=LTC&background=059669&color=fff&size=48" />
            </div>
          </div>
          <form onSubmit={handleRegister} className="space-y-5 animate-fade-in animation-delay-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Username</label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="student001"
                />
                <div className="text-xs text-gray-500">Will create DID: did:learntwin:{username || 'username'}</div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Display Name</label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                className="w-full p-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com (required for verification)"
              />
              <div className="text-xs text-gray-500">📧 We'll send you a verification email</div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <input
                type="password"
                className="w-full p-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a strong password"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Program</label>
                <select
                  className="w-full p-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                  value={program}
                  onChange={e => setProgram(e.target.value)}
                >
                  <option value="">Select a program</option>
                  {availablePrograms.map((prog) => (
                    <option key={prog} value={prog}>
                      {prog}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Birth Year</label>
                <input
                  type="number"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                  value={birthYear}
                  onChange={e => setBirthYear(e.target.value)}
                  placeholder="2004"
                  min="1900"
                  max="2010"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Avatar URL (optional)</label>
              <input
                type="text"
                className="w-full p-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
              <div className="text-xs text-gray-500">🎓 Enrollment date will be set automatically to today</div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
                <div className="text-red-700 text-sm font-medium">{error}</div>
              </div>
            )}
            
            {successMsg && (
              <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg animate-bounce">
                <div className="text-emerald-700 text-sm font-medium flex items-center space-x-2">
                  <span>✅</span>
                  <span>{successMsg}</span>
                </div>
              </div>
            )}

            <button 
              disabled={isLoading} 
              type="submit" 
              className={`w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 text-white py-4 rounded-xl hover:from-emerald-700 hover:via-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-300 font-semibold text-lg ${isLoading ? 'opacity-60 cursor-not-allowed scale-100' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              Already have an account? 
              <Link to="/login" className="ml-1 font-semibold text-blue-600 hover:text-blue-800 transition-colors hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 