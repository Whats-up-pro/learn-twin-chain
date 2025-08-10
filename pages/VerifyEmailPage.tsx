import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying'|'success'|'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }
    (async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.message || 'Verification failed');
        setStatus('success');
        setMessage('Email verified successfully! You can now sign in.');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || 'Verification failed');
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#005acd] via-[#0093cb] to-[#6dd7fd] p-4">
      <div className={`w-full max-w-md rounded-3xl shadow-2xl p-8 text-center ${status==='success' ? 'bg-white' : 'bg-white'}`}>
        <div className="text-5xl mb-4">{status==='verifying' ? '⏳' : status==='success' ? '✅' : '❌'}</div>
        <div className="text-2xl font-bold mb-2 text-gray-800">{status==='success' ? 'Verified' : status==='error' ? 'Verification Failed' : 'Verifying...'}</div>
        <p className="text-gray-600 mb-6">{message}</p>
        {status!=='verifying' && (
          <Link to="/login" className="inline-block px-6 py-3 rounded-xl text-white bg-gradient-to-r from-[#005acd] to-[#0093cb] hover:from-[#0047a3] hover:to-[#0077a3] shadow">Go to Sign In</Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;

