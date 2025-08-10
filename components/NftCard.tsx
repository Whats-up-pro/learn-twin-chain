import React from 'react';
import { Nft } from '../types';

interface NftCardProps {
  nft: Nft;
  onVerify?: (nftCid: string) => void;
}

const NftCard: React.FC<NftCardProps> = ({ nft, onVerify }) => {
  const imageUrl = nft.imageUrl && nft.imageUrl.trim() !== '' 
    ? nft.imageUrl 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(nft.name)}&background=0ea5e9&color=fff&size=200`;

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-blue-100 overflow-hidden transform hover:-translate-y-2 transition-all duration-300 ease-in-out">
      {/* NFT Image with gradient overlay */}
      <div className="relative overflow-hidden">
        <img 
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" 
          src={imageUrl} 
          alt={nft.name}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nft.name)}&background=0ea5e9&color=fff&size=200`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* NFT Badge */}
        <div className="absolute top-3 right-3">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-200">
            <span className="text-xs font-medium text-blue-700">NFT</span>
          </div>
        </div>

        {/* Verified Badge if verified */}
        {nft.verified && (
          <div className="absolute top-3 left-3">
            <div className="bg-emerald-100 backdrop-blur-sm px-2 py-1 rounded-full border border-emerald-300">
              <span className="text-xs font-medium text-emerald-700">✓ Verified</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6 bg-gradient-to-br from-white to-blue-50/30">
        {/* Title */}
        <h3 className="text-lg font-bold text-blue-900 mb-2 truncate group-hover:text-blue-700 transition-colors" title={nft.name}>
          {nft.name}
        </h3>
        
        {/* Description */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-2 leading-relaxed" title={nft.description}>
          {nft.description}
        </p>

        {/* NFT Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Issued:</span>
            <span className="text-blue-800 font-semibold">
              {new Date(nft.issuedDate).toLocaleDateString()}
            </span>
          </div>
          
          {nft.tokenId && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Token ID:</span>
              <span className="text-blue-800 font-mono text-xs bg-blue-50 px-2 py-1 rounded">
                #{nft.tokenId}
              </span>
            </div>
          )}

          {nft.cid && (
            <div className="flex items-start justify-between text-sm">
              <span className="text-gray-600 font-medium">IPFS:</span>
              <span className="text-blue-800 font-mono text-xs bg-blue-50 px-2 py-1 rounded truncate ml-2 max-w-24" title={nft.cid}>
                {nft.cid.substring(0, 8)}...
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {onVerify && nft.cid && (
          <button 
            onClick={() => onVerify(nft.cid!)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                     text-white text-sm font-semibold py-3 px-4 rounded-xl 
                     shadow-lg hover:shadow-xl transform hover:scale-105 
                     transition-all duration-200 ease-in-out
                     border border-blue-600 hover:border-blue-700"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Verify Authenticity</span>
            </div>
          </button>
        )}

        {/* Blockchain Link if available */}
        {nft.txHash && (
          <a 
            href={`https://etherscan.io/tx/${nft.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-xs text-blue-600 hover:text-blue-800 font-medium underline-offset-2 hover:underline transition-colors"
          >
            View on Blockchain ↗
          </a>
        )}
      </div>

      {/* Subtle bottom border accent */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

export default NftCard;
