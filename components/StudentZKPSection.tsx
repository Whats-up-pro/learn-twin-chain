import React, { useState } from 'react';

const StudentZKPSection: React.FC = () => {
  const [score, setScore] = useState('');
  const [minScore, setMinScore] = useState('');
  const [zkpResult, setZkpResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateProof = async () => {
    setLoading(true);
    setZkpResult(null);
    try {
      const res = await fetch('/api/v1/zkp/generate-learning-proof', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          student_address: '0x0000000000000000000000000000000000000000',
          module_id: 'demo-module',
          score: Number(score),
          time_spent: 3600,
          attempts: 1,
          study_materials: ['notes']
        })
      });
      const data = await res.json();
      setZkpResult(data);
    } catch (e) {
      setZkpResult({error: 'Failed to generate proof'});
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
      <h3 className="text-lg font-bold mb-2">Zero Knowledge Proof: Prove Your Score</h3>
      <div className="flex gap-2 mb-2">
        <input type="number" placeholder="Your score" value={score} onChange={e => setScore(e.target.value)} className="border px-2 py-1 rounded"/>
        <input type="number" placeholder="Min score" value={minScore} onChange={e => setMinScore(e.target.value)} className="border px-2 py-1 rounded"/>
        <button onClick={handleGenerateProof} className="bg-purple-600 text-white px-4 py-1 rounded" disabled={loading}>
          {loading ? 'Generating...' : 'Generate ZKP'}
        </button>
      </div>
      {zkpResult && (
        <div className="mt-2">
          <div className="font-bold">Proof:</div>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(zkpResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default StudentZKPSection; 