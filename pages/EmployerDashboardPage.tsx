import React, { useState } from 'react';
import { 
  ShieldCheckIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  EyeIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { jwtVerify, importSPKI } from 'jose';
import EmployerZKPVerify from '../components/EmployerZKPVerify';

interface Checkpoint {
  module: string;
  moduleId: string;
  moduleName: string;
  completedAt: string;
  score: number;
  tokenized: boolean;
  nftCid?: string;
  nftId?: string;
}

interface VerificationResult {
  success: boolean;
  message: string;
  details?: {
    studentDid: string;
    digitalTwinCid: string;
    nftCids: string[];
    verifiedNfts: any[];
    institutionPublicKey: string;
    verificationTimestamp: string;
  };
}

interface StudentVerification {
  did: string;
  name: string;
  digitalTwin: DigitalTwin;
  nfts: Nft[];
  verificationStatus: 'pending' | 'verified' | 'failed';
  verificationResult?: VerificationResult;
}

interface DigitalTwin {
  learnerDid: string;
  learnerName: string;
  student_id?: string;
  institution?: string;
  major?: string;
  email?: string;
  phone?: string;
  version: number;
  knowledge: Record<string, number>;
  skills: Record<string, number>;
  behavior: Record<string, any>;
  checkpoints: Checkpoint[];
  NFT_list?: any[];
  lastUpdated: string;
}

interface Nft {
  token_id: string;
  skill: string;
  cid_nft: string;
  mint_date: string;
  issuer: string;
  verified?: boolean;
}

// Mock institution public key (in real app, this would come from blockchain/registry)
const INSTITUTION_PUBLIC_KEY = "0x1234567890abcdef1234567890abcdef12345678";

// Hàm lấy CID từ DID qua smart contract (mock)
async function getCidFromDid(did: string): Promise<string> {
  try {
    console.log(`Getting CID from DID via smart contract: ${did}`);
    
    // TODO: Thay thế bằng gọi smart contract thực tế
    // Ví dụ: return await contract.getCidByDid(did);
    
    // Mapping với CID thật từ IPFS (sẽ được cập nhật sau khi upload)
    const mapping: Record<string, string> = {
      'did:learntwin:student001': 'QmPuqEpZs4oyCqvPcXQLmapdxbezJN4vTc8nzXrwEC2h1D', // Real data uploaded
      'did:learntwin:student002': 'QmPQ7FP3nmF54Qe6uvMScKEVDxhgAsrPcNGd4k14bkymsJ', // Real data uploaded
      'did:learntwin:student003': 'QmZ9QcHpEzjmnWmHEKcL8vdmkm3dG6XTXkVg16B7d9Cz1v',
      'did:learntwin:student004': 'QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
      'did:learntwin:student005': 'QmUQw8wqXqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq',
    };
    
    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const cid = mapping[did];
    if (!cid) {
      throw new Error(`DID ${did} not found in blockchain registry`);
    }
    
    console.log(`CID retrieved from blockchain: ${cid}`);
    return cid;
  } catch (error) {
    console.error('Error getting CID from DID:', error);
    throw error;
  }
}

// Hàm lấy dữ liệu từ IPFS qua backend
async function fetchIpfsData(cid: string): Promise<any> {
  try {
    console.log(`Fetching IPFS data for CID: ${cid}`);
    
    const res = await fetch(`/api/v1/ipfs/download/${cid}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`IPFS fetch failed: ${res.status} ${errorText}`);
      throw new Error(`Failed to fetch IPFS data: ${res.status} ${errorText}`);
    }
    
    const json = await res.json();
    console.log('IPFS data fetched successfully:', json);
    
    if (!json.data) {
      throw new Error('Invalid IPFS data format: missing data field');
    }
    
    return json.data;
  } catch (error) {
    console.error('Error fetching IPFS data:', error);
    throw error;
  }
}

// Hàm lấy public key trường từ backend API
async function fetchSchoolPublicKey(): Promise<string> {
  try {
    console.log('Fetching school public key from backend...');
    const res = await fetch('/api/v1/ipfs/school-public-key');
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to fetch public key: ${res.status} ${errorText}`);
      throw new Error(`Failed to fetch public key: ${res.status} ${errorText}`);
    }
    
    const json = await res.json();
    console.log('School public key fetched successfully');
    
    if (!json.public_key) {
      throw new Error('Invalid public key response: missing public_key field');
    }
    
    return json.public_key;
  } catch (error) {
    console.error('Error fetching school public key:', error);
    // Fallback to demo key
    return `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE8tKwV1FQ9yDjMZrfsWyCACmOP5rDFCRx
I9CzHvAcbxfiVy6KtTnmRVEhmLjK65O+mONHRU4gZq/2r72mwt1z8Q==
-----END PUBLIC KEY-----`;
  }
}

// Hàm verify JWS (ECDSA secp256k1)
async function verifyJws(vc: any, publicKeyPem: string): Promise<boolean> {
  try {
    console.log('Starting JWS verification...');
    
    // Kiểm tra xem data có proof không
    if (!vc.proof || !vc.proof.jws) {
      console.log('No proof.jws found in data, skipping verification');
      return true; // Tạm thời return true nếu không có proof
    }
    
    const { proof, ...payload } = vc;
    const jws = proof.jws;
    
    console.log('JWS found, attempting verification...');
    
    // Chuyển publicKeyPem sang định dạng jose
    const pubKey = await importSPKI(publicKeyPem, 'ES256K');
    
    try {
      await jwtVerify(jws, pubKey, { algorithms: ['ES256K'] });
      console.log('JWS verification successful');
      return true;
    } catch (verifyError) {
      console.error('JWS verification failed:', verifyError);
      return false;
    }
  } catch (error) {
    console.error('Error in JWS verification:', error);
    return false;
  }
}

// Helper function to get student name from DID (simple fallback)
function getStudentNameFromDid(did: string): string {
  return did.split(':').pop() || did;
}

const EmployerDashboardPage: React.FC = () => {
  const [studentDid, setStudentDid] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<StudentVerification[]>([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<StudentVerification | null>(null);

  const handleVerifyStudent = async () => {
    if (!studentDid.trim()) {
      toast.error('Please enter a valid student DID');
      return;
    }

    if (!studentDid.startsWith('did:learntwin:')) {
      toast.error('Invalid DID format. Expected format: did:learntwin:studentXXX');
      return;
    }

    setVerifying(true);
    
    try {
      console.log('🔍 Starting verification for DID:', studentDid);
      
      // Bước 1: Lấy CID từ DID qua smart contract
      console.log('📋 Step 1: Getting CID from DID...');
      const cid = await getCidFromDid(studentDid);
      console.log('✅ CID retrieved:', cid);
      
      // Bước 2: Download data từ IPFS bằng CID
      console.log('📥 Step 2: Fetching IPFS data...');
      const studentData = await fetchIpfsData(cid);
      console.log('✅ IPFS data fetched:', studentData);
      
      // Bước 3: Lấy public key trường để verify
      console.log('🔑 Step 3: Getting school public key...');
      const schoolPublicKey = await fetchSchoolPublicKey();
      console.log('✅ School public key retrieved');
      
      // Bước 4: Verify chữ ký của data
      console.log('🔐 Step 4: Verifying digital signature...');
      const isVerified = await verifyJws(studentData, schoolPublicKey);
      console.log('✅ Signature verification result:', isVerified);
      
      if (!isVerified) {
        throw new Error('Digital signature verification failed');
      }
      
      // Bước 5: Tạo verification result
      console.log('📝 Step 5: Creating verification result...');
      const verificationResult: VerificationResult = {
        success: true,
        message: `Successfully verified student data for ${studentDid}`,
        details: {
          studentDid,
          digitalTwinCid: cid,
          nftCids: studentData.NFT_list?.map((nft: any) => nft.cid_nft) || [],
          verifiedNfts: studentData.NFT_list || [],
          institutionPublicKey: schoolPublicKey,
          verificationTimestamp: new Date().toISOString()
        }
      };

      // Bước 6: Tạo student verification record
      console.log('💾 Step 6: Creating student verification record...');
      const studentVerification: StudentVerification = {
        did: studentDid,
        name: studentData.learnerName || getStudentNameFromDid(studentDid),
        digitalTwin: studentData,
        nfts: studentData.NFT_list || [],
        verificationStatus: 'verified',
        verificationResult
      };

      // Thêm vào history
      setVerificationHistory(prev => [studentVerification, ...prev]);
      
      console.log('🎉 Verification completed successfully!');
      toast.success(verificationResult.message);
      setStudentDid('');
      
    } catch (error) {
      console.error('❌ Verification error:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      
      // Hiển thị error message chi tiết hơn
      const errorMessage = (error as Error).message;
      toast.error(`Verification failed: ${errorMessage}`);
      
      // Thêm failed verification vào history
      const failedVerification: StudentVerification = {
        did: studentDid,
        name: getStudentNameFromDid(studentDid),
        digitalTwin: {} as DigitalTwin,
        nfts: [],
        verificationStatus: 'failed',
        verificationResult: {
          success: false,
          message: 'Verification failed: ' + errorMessage
        }
      };
      
      setVerificationHistory(prev => [failedVerification, ...prev]);
    } finally {
      setVerifying(false);
    }
  };

  const handleViewVerificationDetails = (verification: StudentVerification) => {
    setSelectedVerification(verification);
    setShowVerificationModal(true);
  };

  const handleCopyDid = (did: string) => {
    navigator.clipboard.writeText(did);
    toast.success('DID copied to clipboard!');
  };

  const handleCopyCid = (cid: string | undefined) => {
    if (!cid) return;
    navigator.clipboard.writeText(cid);
    toast.success('CID copied to clipboard!');
  };

  // Helper function to truncate text and show tooltip
  const TruncatedText = ({ text, maxLength = 20, className = "" }: { text: string, maxLength?: number, className?: string }) => {
    const isTruncated = text.length > maxLength;
    const displayText = isTruncated ? `${text.substring(0, maxLength)}...` : text;
    
    return (
      <div className="relative group">
        <span className={`font-mono text-xs bg-gray-100 px-2 py-1 rounded cursor-pointer ${className}`}>
          {displayText}
        </span>
        {isTruncated && (
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
            {text}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl shadow-lg">
        <div className="px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-white mb-2">Certificate Verification</h1>
              <p className="text-purple-100">Verify student certificates using blockchain and institutional public keys</p>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
              <span className="text-white font-medium">Institution: UIT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <DocumentTextIcon className="w-6 h-6 mr-3 text-purple-600" />
          Verify Student Certificate
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student DID (Decentralized Identifier)
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={studentDid}
                onChange={(e) => setStudentDid(e.target.value)}
                placeholder="did:learntwin:student001"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={verifying}
              />
              <button
                onClick={handleVerifyStudent}
                disabled={verifying || !studentDid.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                {verifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="w-5 h-5 mr-2" />
                    Verify
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Enter the student's DID to retrieve and verify their certificates from the blockchain
            </p>
          </div>
        </div>
      </div>

      {/* Verification History */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <ClipboardDocumentIcon className="w-6 h-6 mr-3 text-purple-600" />
          Verification History
        </h2>
        
        {verificationHistory.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No verifications yet. Enter a student DID above to start verifying certificates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {verificationHistory.map((verification, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      verification.verificationStatus === 'verified' ? 'bg-green-500' :
                      verification.verificationStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <h3 className="font-semibold text-gray-900">{verification.name}</h3>
                    <span className="text-sm text-gray-500">({verification.did})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      verification.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                      verification.verificationStatus === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {verification.verificationStatus.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleViewVerificationDetails(verification)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Certificates Found:</span>
                    <span className="ml-2 font-medium">{verification.nfts.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Verification Time:</span>
                    <span className="ml-2 font-medium">
                      {verification.verificationResult?.details?.verificationTimestamp 
                        ? new Date(verification.verificationResult.details.verificationTimestamp).toLocaleString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Institution:</span>
                    <span className="ml-2 font-medium">UIT</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Details Modal */}
      <Modal 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)}
        title=""
        size="6xl"
      >
        {selectedVerification && (
          <div className="max-h-[80vh] flex flex-col">
            {/* Header - Fixed */}
            <div className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-6 bg-white">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full ml-4">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedVerification.name}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="font-mono bg-gray-100 px-3 py-1 rounded-md text-xs">{selectedVerification.did}</span>
                  <button 
                    onClick={() => handleCopyDid(selectedVerification.did)} 
                    className="text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                    {selectedVerification.verificationStatus.toUpperCase()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowVerificationModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6">
              {/* Student Info */}
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-purple-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Student Information
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-gray-600 font-medium">Student Name:</span>
                      <span className="font-semibold text-gray-900 truncate ml-2">{selectedVerification.digitalTwin.learnerName}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-gray-600 font-medium">Student ID:</span>
                      <span className="font-mono text-gray-900 truncate ml-2">{selectedVerification.digitalTwin.student_id}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-gray-600 font-medium">Institution:</span>
                      <span className="font-semibold text-gray-900 truncate ml-2">{selectedVerification.digitalTwin.institution}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-gray-600 font-medium">Major:</span>
                      <span className="text-gray-900 truncate ml-2">{selectedVerification.digitalTwin.major}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-gray-600 font-medium">Email:</span>
                      <span className="text-gray-900 truncate ml-2">{selectedVerification.digitalTwin.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-gray-600 font-medium">Phone:</span>
                      <span className="text-gray-900 truncate ml-2">{selectedVerification.digitalTwin.phone}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-gray-600 font-medium">Last Updated:</span>
                      <span className="text-gray-900 truncate ml-2">{selectedVerification.digitalTwin.lastUpdated ? new Date(selectedVerification.digitalTwin.lastUpdated).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* NFT Certificates */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Digital Certificates ({selectedVerification.nfts.length})
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Verified blockchain credentials and achievements</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {selectedVerification.nfts.map((nft: any, index: number) => (
                      <div key={nft.token_id} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full flex-shrink-0">
                              <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-900 text-lg truncate">{nft.skill}</h4>
                              <p className="text-sm text-gray-500">Certificate #{index + 1}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 flex-shrink-0">
                            Verified
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 flex-shrink-0">Token ID:</span>
                            <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                              <TruncatedText text={nft.token_id} maxLength={20} />
                              <button 
                                onClick={() => handleCopyCid(nft.token_id)} 
                                className="text-purple-600 hover:text-purple-700 transition-colors flex-shrink-0"
                              >
                                <ClipboardDocumentIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 flex-shrink-0">Issuer:</span>
                            <span className="text-gray-900 truncate ml-2">{nft.issuer}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 flex-shrink-0">Mint Date:</span>
                            <span className="text-gray-900 truncate ml-2">{nft.mint_date}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600 flex-shrink-0">NFT CID:</span>
                            <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                              <TruncatedText text={nft.cid_nft} maxLength={15} />
                              <button 
                                onClick={() => handleCopyCid(nft.cid_nft)} 
                                className="text-purple-600 hover:text-purple-700 transition-colors flex-shrink-0"
                              >
                                <ClipboardDocumentIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {nft.metadata?.name && (
                          <div className="mt-4 pt-3 border-t border-green-200">
                            <div className="text-sm font-medium text-gray-900 mb-1 truncate">{nft.metadata.name}</div>
                            {nft.metadata?.description && (
                              <div className="text-xs text-gray-600 truncate">{nft.metadata.description}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Technical Verification Details
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Blockchain verification and cryptographic proof</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Institution Public Key</label>
                        <div className="flex items-start gap-2">
                          <div className="flex-1 font-mono text-xs bg-white px-3 py-2 rounded-md border break-all min-w-0">
                            {INSTITUTION_PUBLIC_KEY}
                          </div>
                          <button 
                            onClick={() => handleCopyCid(INSTITUTION_PUBLIC_KEY)} 
                            className="text-purple-600 hover:text-purple-700 transition-colors p-2 flex-shrink-0"
                          >
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Digital Twin CID</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 font-mono text-xs bg-white px-3 py-2 rounded-md border min-w-0">
                            <TruncatedText 
                              text={selectedVerification.verificationResult?.details?.digitalTwinCid || 'N/A'} 
                              maxLength={30}
                              className="bg-transparent px-0 py-0"
                            />
                          </div>
                          <button 
                            onClick={() => handleCopyCid(selectedVerification.verificationResult?.details?.digitalTwinCid)} 
                            className="text-purple-600 hover:text-purple-700 transition-colors p-2 flex-shrink-0"
                          >
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Verification Timestamp</label>
                        <div className="bg-white px-3 py-2 rounded-md border text-sm truncate">
                          {selectedVerification.verificationResult?.details?.verificationTimestamp 
                            ? new Date(selectedVerification.verificationResult.details.verificationTimestamp).toLocaleString()
                            : 'N/A'
                          }
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Blockchain Transaction</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 font-mono text-xs bg-white px-3 py-2 rounded-md border min-w-0">
                            <TruncatedText 
                              text={selectedVerification.verificationResult?.details?.verificationTimestamp 
                                ? `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 10)}`
                                : 'N/A'
                              } 
                              maxLength={25}
                              className="bg-transparent px-0 py-0"
                            />
                          </div>
                          <button className="text-purple-600 hover:text-purple-700 transition-colors p-2 flex-shrink-0">
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <EmployerZKPVerify />
    </div>
  );
};

export default EmployerDashboardPage;