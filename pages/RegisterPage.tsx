import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

const RegisterPage: React.FC = () => {
  const { learnerProfile } = useAppContext();
  const [did, setDid] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!did.trim() || !name.trim() || !password.trim()) {
      setError('Please enter DID, name and password!');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did, name, password, avatarUrl })
      });
      if (res.status === 409) {
        setError('User already exists!');
        return;
      }
      if (!res.ok) {
        setError('Registration failed!');
        return;
      }
      // Success
      window.location.href = '/#/login';
    } catch (err) {
      setError('Network error!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-300">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <span className="text-3xl font-extrabold text-sky-600 tracking-wide drop-shadow-md">LearnTwinChain</span>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
        <form onSubmit={handleRegister}>
          <label className="block mb-2 font-medium">DID or Username</label>
          <input
            type="text"
            className="w-full p-2 border rounded mb-4"
            value={did}
            onChange={e => setDid(e.target.value)}
            placeholder="did:learntwin:student001 or username"
          />
          <label className="block mb-2 font-medium">Display Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded mb-4"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />
          <label className="block mb-2 font-medium">Password</label>
          <input
            type="password"
            className="w-full p-2 border rounded mb-4"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          <label className="block mb-2 font-medium">Avatar URL (optional)</label>
          <input
            type="text"
            className="w-full p-2 border rounded mb-4"
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <button type="submit" className="w-full bg-sky-600 text-white py-2 rounded hover:bg-sky-700 transition">Sign Up</button>
        </form>
        <div className="mt-4 text-center">
          Already have an account? <Link to="/login" className="text-sky-600 hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 