import React, { useState } from 'react';
import { useTranslation } from '../src/hooks/useTranslation';

const EmployerZKPVerify: React.FC = () => {
  const { t } = useTranslation();
  const [proof, setProof] = useState('');
  const [publicSignals, setPublicSignals] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    setVerifyResult(null);
    try {
      const res = await fetch('/api/v1/zkp/verify-score', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({proof: JSON.parse(proof), public: JSON.parse(publicSignals)})
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch (e) {
      setVerifyResult({error: 'Failed to verify proof'});
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
      <h3 className="text-lg font-bold mb-2">{t('components.employerZKPVerify.ZKP')}</h3>
      <textarea placeholder="Paste proof JSON" value={proof} onChange={e => setProof(e.target.value)} className="border w-full p-2 mb-2 rounded" rows={4}/>
      <textarea placeholder="Paste public signals JSON" value={publicSignals} onChange={e => setPublicSignals(e.target.value)} className="border w-full p-2 mb-2 rounded" rows={2}/>
      <button onClick={handleVerify} className="bg-green-600 text-white px-4 py-1 rounded" disabled={loading}>
        {loading ? t('components.employerZKPVerify.Verifying') : t('components.employerZKPVerify.VerifyZKP')}
      </button>
      {verifyResult && (
        <div className="mt-2">
          <div className="font-bold">{t('components.employerZKPVerify.VerificationResult')}</div>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(verifyResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default EmployerZKPVerify; 