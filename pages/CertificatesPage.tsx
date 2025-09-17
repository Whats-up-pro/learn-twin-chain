import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { 
  DocumentTextIcon, 
  ShareIcon, 
  ArrowDownTrayIcon, 
  EyeIcon,
  TrophyIcon,
  CalendarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  DocumentTextIcon as DocumentSolid,
  TrophyIcon as TrophySolid
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface Certificate {
  id: string;
  title: string;
  description: string;
  type: 'course_completion' | 'skill_mastery' | 'achievement' | 'certification';
  course_name?: string;
  course_id?: string;
  earned_at: string;
  issuer: string;
  score?: number;
  nft_token_id?: string;
  nft_contract_address?: string;
  metadata_uri?: string;
  is_verified: boolean;
  expires_at?: string;
  share_url?: string;
}

interface CertificateStats {
  total_certificates: number;
  course_completions: number;
  skill_masteries: number;
  achievements: number;
  certifications: number;
  verified_certificates: number;
}

const CertificatesPage: React.FC = () => {
  const { learnerProfile } = useAppContext();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'course_completion' | 'skill_mastery' | 'achievement' | 'certification'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'score'>('date');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      
      // Fetch certificates from blockchain data
      const blockchainResponse = await apiService.getMyBlockchainData();
      
      // Process blockchain data to extract certificates
      const nftCertificates: Certificate[] = [];
      
      if (blockchainResponse?.success) {
        // Process certificates from blockchain data
        if (blockchainResponse.certificates && Array.isArray(blockchainResponse.certificates)) {
          blockchainResponse.certificates.forEach((cert: any) => {
            nftCertificates.push({
              id: cert.id || cert.token_id || `cert_${Date.now()}`,
              title: cert.title || 'Course Completion Certificate',
              description: cert.description || 'Learning achievement certificate',
              type: cert.achievement_type || 'course_completion',
              course_name: cert.course_name,
              course_id: cert.course_id,
              earned_at: cert.minted_at || cert.created_at || new Date().toISOString(),
              issuer: cert.issuer || 'LearnTwinChain',
              score: cert.score,
              nft_token_id: cert.token_id,
              nft_contract_address: cert.contract_address,
              metadata_uri: cert.metadata_uri,
              is_verified: cert.is_verified || true,
              expires_at: cert.expires_at,
              share_url: cert.metadata_uri
            });
          });
        }

        // Process module completions as certificates
        if (blockchainResponse.module_completions && Array.isArray(blockchainResponse.module_completions)) {
          blockchainResponse.module_completions.forEach((module: any) => {
            nftCertificates.push({
              id: `module_${module.module_id}`,
              title: `Module Completion: ${module.module_title || module.module_id}`,
              description: 'Module completion certificate',
              type: 'skill_mastery',
              course_name: module.course_name,
              course_id: module.course_id,
              earned_at: module.completed_at || module.timestamp || new Date().toISOString(),
              issuer: 'LearnTwinChain',
              score: module.score,
              nft_token_id: module.token_id,
              nft_contract_address: module.contract_address,
              metadata_uri: module.metadata_uri,
              is_verified: true,
              share_url: module.metadata_uri
            });
          });
        }
      }

      setCertificates(nftCertificates);

      // Calculate stats
      const certificateStats: CertificateStats = {
        total_certificates: nftCertificates.length,
        course_completions: nftCertificates.filter(c => c.type === 'course_completion').length,
        skill_masteries: nftCertificates.filter(c => c.type === 'skill_mastery').length,
        achievements: nftCertificates.filter(c => c.type === 'achievement').length,
        certifications: nftCertificates.filter(c => c.type === 'certification').length,
        verified_certificates: nftCertificates.filter(c => c.is_verified).length
      };

      setStats(certificateStats);

    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const getCertificateIcon = (type: string) => {
    switch (type) {
      case 'course_completion':
        return AcademicCapIcon;
      case 'skill_mastery':
        return TrophyIcon;
      case 'achievement':
        return TrophyIcon;
      case 'certification':
        return DocumentTextIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getCertificateColor = (type: string) => {
    switch (type) {
      case 'course_completion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'skill_mastery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'achievement':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'certification':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCertificateTypeLabel = (type: string) => {
    switch (type) {
      case 'course_completion':
        return 'Course Completion';
      case 'skill_mastery':
        return 'Skill Mastery';
      case 'achievement':
        return 'Achievement';
      case 'certification':
        return 'Certification';
      default:
        return 'Certificate';
    }
  };

  const handleShareCertificate = async (certificate: Certificate) => {
    try {
      setSelectedCertificate(certificate);
      setShowShareModal(true);
      
      // Generate share URL if not exists
      if (!certificate.share_url) {
        const shareUrl = `${window.location.origin}/certificates/${certificate.id}`;
        // Update certificate with share URL
        // This would typically be saved to backend
      }
    } catch (error) {
      console.error('Error sharing certificate:', error);
      toast.error('Failed to share certificate');
    }
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      if (certificate.metadata_uri) {
        // Download certificate from IPFS
        const response = await fetch(certificate.metadata_uri);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${certificate.title.replace(/\s+/g, '_')}_certificate.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Certificate downloaded successfully');
      } else {
        toast.error('Certificate file not available');
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  const copyShareLink = async (certificate: Certificate) => {
    try {
      const shareUrl = certificate.share_url || `${window.location.origin}/certificates/${certificate.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      console.error('Error copying share link:', error);
      toast.error('Failed to copy share link');
    }
  };

  const filteredAndSortedCertificates = certificates
    .filter(cert => filter === 'all' || cert.type === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        case 'score':
          return (b.score || 0) - (a.score || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <DocumentSolid className="h-8 w-8 text-blue-600 mr-3" />
                My Certificates
              </h1>
              <p className="text-slate-600 mt-2">
                View and manage your learning achievements and certificates
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchCertificates}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DocumentSolid className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Certificates</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total_certificates}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Course Completions</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.course_completions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrophySolid className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Skill Masteries</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.skill_masteries}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Verified</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.verified_certificates}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Sort */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-wrap items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Filter by type:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Certificates</option>
                  <option value="course_completion">Course Completions</option>
                  <option value="skill_mastery">Skill Masteries</option>
                  <option value="achievement">Achievements</option>
                  <option value="certification">Certifications</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date">Date Earned</option>
                  <option value="type">Type</option>
                  <option value="score">Score</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-slate-600">
              Showing {filteredAndSortedCertificates.length} of {certificates.length} certificates
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {filteredAndSortedCertificates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No certificates found</h3>
            <p className="text-slate-600 mb-6">
              {filter === 'all' 
                ? "You haven't earned any certificates yet. Complete courses to start earning certificates!"
                : `No ${getCertificateTypeLabel(filter).toLowerCase()} certificates found.`
              }
            </p>
            <button
              onClick={() => window.location.href = '/courses'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCertificates.map((certificate) => {
              const Icon = getCertificateIcon(certificate.type);
              const colorClasses = getCertificateColor(certificate.type);
              
              return (
                <div
                  key={certificate.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${colorClasses}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex items-center space-x-2">
                        {certificate.is_verified && (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" title="Verified" />
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses}`}>
                          {getCertificateTypeLabel(certificate.type)}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                      {certificate.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      {certificate.description}
                    </p>

                    {certificate.course_name && (
                      <p className="text-sm text-slate-500 mb-2">
                        <span className="font-medium">Course:</span> {certificate.course_name}
                      </p>
                    )}

                    {certificate.score && (
                      <p className="text-sm text-slate-500 mb-2">
                        <span className="font-medium">Score:</span> {certificate.score}%
                      </p>
                    )}

                    <div className="flex items-center text-sm text-slate-500 mb-4">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(certificate.earned_at).toLocaleDateString()}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleShareCertificate(certificate)}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Share certificate"
                        >
                          <ShareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadCertificate(certificate)}
                          className="p-2 text-slate-400 hover:text-green-600 transition-colors"
                          title="Download certificate"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => setSelectedCertificate(certificate)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Certificate Detail Modal */}
        {selectedCertificate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Certificate Details</h2>
                  <button
                    onClick={() => setSelectedCertificate(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-4 rounded-lg ${getCertificateColor(selectedCertificate.type)}`}>
                      {React.createElement(getCertificateIcon(selectedCertificate.type), { className: "h-8 w-8" })}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        {selectedCertificate.title}
                      </h3>
                      <p className="text-slate-600 mb-2">
                        {selectedCertificate.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(selectedCertificate.earned_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          {selectedCertificate.is_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedCertificate.course_name && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Course Information</h4>
                      <p className="text-slate-600">{selectedCertificate.course_name}</p>
                    </div>
                  )}

                  {selectedCertificate.score && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Score</h4>
                      <p className="text-slate-600">{selectedCertificate.score}%</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Issuer</h4>
                    <p className="text-slate-600">{selectedCertificate.issuer}</p>
                  </div>

                  {selectedCertificate.nft_token_id && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Blockchain Information</h4>
                      <p className="text-slate-600">
                        <span className="font-medium">Token ID:</span> {selectedCertificate.nft_token_id}
                      </p>
                      {selectedCertificate.nft_contract_address && (
                        <p className="text-slate-600">
                          <span className="font-medium">Contract:</span> {selectedCertificate.nft_contract_address}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleShareCertificate(selectedCertificate)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ShareIcon className="h-5 w-5 mr-2" />
                        Share
                      </button>
                      <button
                        onClick={() => handleDownloadCertificate(selectedCertificate)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && selectedCertificate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Share Certificate</h2>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Share Link
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={selectedCertificate.share_url || `${window.location.origin}/certificates/${selectedCertificate.id}`}
                        readOnly
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => copyShareLink(selectedCertificate)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setShowShareModal(false)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        copyShareLink(selectedCertificate);
                        setShowShareModal(false);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Copy & Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;
