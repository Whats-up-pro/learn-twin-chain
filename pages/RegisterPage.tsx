import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [did, setDid] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!did.trim() || !name.trim() || !password.trim() || !email.trim() || !program.trim() || !birthYear.trim() || !enrollmentDate.trim()) {
      setError('Please fill in all required fields!');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did,
          name,
          email,
          password,
          avatarUrl,
          institution: 'UIT',
          program,
          birth_year: parseInt(birthYear),
          enrollment_date: enrollmentDate,
          role: 'student'
        })
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
          <label className="block mb-2 font-medium">Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded mb-4"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
          <label className="block mb-2 font-medium">Password</label>
          <input
            type="password"
            className="w-full p-2 border rounded mb-4"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          <label className="block mb-2 font-medium">Program</label>
          <input
            type="text"
            className="w-full p-2 border rounded mb-4"
            value={program}
            onChange={e => setProgram(e.target.value)}
            placeholder="e.g. Computer Science, Cybersecurity"
          />
          <label className="block mb-2 font-medium">Birth Year</label>
          <input
            type="number"
            className="w-full p-2 border rounded mb-4"
            value={birthYear}
            onChange={e => setBirthYear(e.target.value)}
            placeholder="e.g. 2004"
          />
          <label className="block mb-2 font-medium">Enrollment Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded mb-4"
            value={enrollmentDate}
            onChange={e => setEnrollmentDate(e.target.value)}
            placeholder="YYYY-MM-DD"
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