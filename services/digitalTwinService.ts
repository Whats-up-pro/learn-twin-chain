
import { DigitalTwin, UpdateTwinPayload, VerificationResult } from '../types';
import toast from 'react-hot-toast';

// This service simulates backend operations for the Digital Twin.
// In a real application, these would be API calls.

/**
 * Simulates updating the Digital Twin data.
 * Corresponds to the `POST /update-twin` endpoint.
 * In a real scenario, this would involve cryptographic signature verification of the DID.
 */
export const simulateUpdateTwin = async (
  currentTwin: DigitalTwin,
  payload: UpdateTwinPayload
): Promise<DigitalTwin> => {
  toast.loading('Simulating Digital Twin update...', { id: 'sim-dt-update' });

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 1. Basic DID-based authorization check (simulated)
  if (payload.twin_id !== currentTwin.learnerDid || payload.owner_did !== currentTwin.learnerDid) {
    toast.error('Simulated Update Failed: DID mismatch. Unauthorized.', { id: 'sim-dt-update' });
    throw new Error('Simulated Unauthorized: DID mismatch for twin update.');
  }
  
  let updatedTwin = { ...currentTwin };

  if (payload.learning_state) {
    if (payload.learning_state.progress) {
      updatedTwin.knowledge = { ...updatedTwin.knowledge, ...payload.learning_state.progress };
    }
    if (payload.learning_state.checkpoint_history) {
      // A more robust merge strategy might be needed depending on requirements
      updatedTwin.checkpoints = payload.learning_state.checkpoint_history;
    }
  }

  if (payload.interaction_logs) {
    updatedTwin.behavior = { ...updatedTwin.behavior, ...payload.interaction_logs };
  }

  updatedTwin.version += 1;
  updatedTwin.lastUpdated = new Date().toISOString();

  toast.success('Digital Twin update simulated successfully!', { id: 'sim-dt-update' });
  return updatedTwin;
};

/**
 * Simulates the verification of Digital Twin data supposedly fetched from IPFS.
 * This function would conceptually perform:
 * 1. Integrity Check: Compare content hash with IPFS CID.
 * 2. Authenticity Check: Verify digital signature using owner's DID.
 * 3. Provenance Check: Look up CID + timestamp on a (simulated) blockchain.
 */
export const simulateVerifyTwinData = async (
  twinData: DigitalTwin, // The data itself (as if fetched from IPFS)
  expectedCid: string, // The IPFS CID it's supposed to match
  ownerDid: string // The DID of the owner for signature verification
): Promise<VerificationResult> => {
  toast.loading(`Simulating verification for CID: ${expectedCid.substring(0,10)}...`, { id: 'sim-verify' });
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simulate Integrity Check (e.g., hash the twinData and compare to a part of CID)
  // For simulation, let's assume if CID contains 'Simulated' it's fine.
  const integrity = expectedCid.startsWith('QmSimulated'); 

  // Simulate Authenticity Check (e.g., check if ownerDid matches twinData.learnerDid)
  const authenticity = ownerDid === twinData.learnerDid;

  // Simulate Provenance Check (e.g., check if lastUpdated is recent and version > 0)
  const provenance = new Date(twinData.lastUpdated) <= new Date() && twinData.version > 0;
  
  let message = '';
  if (integrity && authenticity && provenance) {
    message = 'Digital Twin data verified successfully (Simulated).';
    toast.success(message, { id: 'sim-verify' });
  } else {
    message = 'Digital Twin data verification failed (Simulated).';
    if (!integrity) message += ' Integrity check failed.';
    if (!authenticity) message += ' Authenticity check failed.';
    if (!provenance) message += ' Provenance check failed.';
    toast.error(message, { id: 'sim-verify' });
  }

  return {
    integrity,
    authenticity,
    provenance,
    message,
    details: {
      checkedCid: expectedCid,
      ownerDid: twinData.learnerDid,
      timestamp: twinData.lastUpdated,
    },
  };
};

// Simulate fetching a Digital Twin by DID (e.g., for a verifier)
export const simulateFetchTwinByDid = async (did: string, expectedTwinData: DigitalTwin): Promise<DigitalTwin | null> => {
  toast.loading(`Simulating fetch for DID: ${did}...`, { id: 'sim-fetch-did' });
  await new Promise(resolve => setTimeout(resolve, 800));

  if (did === expectedTwinData.learnerDid) {
    toast.success(`Digital Twin for ${did} fetched (Simulated).`, { id: 'sim-fetch-did' });
    return { ...expectedTwinData }; // Return a copy
  }
  toast.error(`No Digital Twin found for DID: ${did} (Simulated).`, { id: 'sim-fetch-did' });
  return null;
}
