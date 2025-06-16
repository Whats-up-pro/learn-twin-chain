
import React from 'react';
import { Nft } from '../types';

interface NftCardProps {
  nft: Nft;
  onVerify?: (nftCid: string) => void;
}

const NftCard: React.FC<NftCardProps> = ({ nft, onVerify }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
      <img className="w-full h-48 object-cover" src={nft.imageUrl} alt={nft.name} />
      <div className="p-5">
        <h3 className="text-lg font-semibold text-sky-700 mb-1 truncate" title={nft.name}>{nft.name}</h3>
        <p className="text-gray-600 text-xs mb-3 truncate" title={nft.description}>{nft.description}</p>
        <p className="text-xs text-gray-500 mb-1">Issued: {new Date(nft.issuedDate).toLocaleDateString()}</p>
        {nft.cid && <p className="text-xs text-gray-500 mb-3 truncate" title={nft.cid}>CID: {nft.cid}</p>}
        {onVerify && nft.cid && (
           <button 
             onClick={() => onVerify(nft.cid!)}
             className="w-full mt-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors duration-150"
           >
            Verify NFT (Simulated)
           </button>
        )}
      </div>
    </div>
  );
};

export default NftCard;
