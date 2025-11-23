// ============================================================================
// delegationsBlockchain.ts — v2 (Base Sepolia)
// ============================================================================
// Handles all delegation-related blockchain interactions for v2 cross-chain
// smart contracts deployed on Base Sepolia.
//
// The Polls v2 contract inherits from Delegations.sol, so all delegation
// functions are accessible through the Polls contract address.
//
// Contract Address: 0x27013b43c40fB4fB0c23DD0E56f1fB90FA8a0276
// Network: Base Sepolia (Chain ID: 84532)
// ============================================================================

import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers';
import pollsAbi from './contractABI.json';

// Contract address on Base Sepolia (Polls v2 with Delegations)
const DEFAULT_CONTRACT_ADDRESS = '0x27013b43c40fB4fB0c23DD0E56f1fB90FA8a0276';

// Optional: use environment variable if needed
// import { env } from '$env/dynamic/public';
// const CONTRACT_ADDRESS = env.PUBLIC_POLLS_V2_ADDRESS ?? DEFAULT_CONTRACT_ADDRESS;
const CONTRACT_ADDRESS = DEFAULT_CONTRACT_ADDRESS;

   export type BecomeDelegateResult = {
     delegate: string;
     groupId: number;
     delegateId: number | null;
   };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get connected signer from MetaMask (ethers v6)
 * @returns {Promise<JsonRpcSigner>} The signer for transactions
 * @throws {Error} If MetaMask is not available
 */
async function getSigner(): Promise<JsonRpcSigner> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask (window.ethereum) is not available');
  }
  
  const provider = new BrowserProvider((window as any).ethereum);
  await provider.send('eth_requestAccounts', []); // Request wallet connection
  const signer = await provider.getSigner();
  
  // Optional: log connected address for debugging
  // console.log('Connected address:', await signer.getAddress());
  
  return signer;
}

/**
 * Get contract instance (Polls v2 that includes Delegations)
 * @returns {Promise<Contract>} Contract instance for blockchain interaction
 * @throws {Error} If contract address is missing
 */
async function getContract(): Promise<Contract> {
  const signer = await getSigner();
  
  if (!CONTRACT_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS is missing');
  }
  
  // Return contract instance with ABI and signer
  return new Contract(CONTRACT_ADDRESS, pollsAbi as any, signer);
}

async function getReadOnlyContract(): Promise<Contract> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask (window.ethereum) is not available');
  }
  const provider = new BrowserProvider((window as any).ethereum);
  if (!CONTRACT_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS is missing');
  }
  return new Contract(CONTRACT_ADDRESS, pollsAbi as any, provider);
}
// ============================================================================
// Write Functions (require transactions and gas)
// ============================================================================

/**
 * Register caller as a delegate in a specific group
 * 
 * Requirements:
 * - Caller must be a member of the group
 * - Caller must not already be a delegate
 * 
 * @param {number | string} groupId - The group ID to become delegate in
 * @returns {Promise<string | null>} Delegate address on success, null on failure
 */
   export const becomeDelegate = async (
     groupId: number | string
   ): Promise<BecomeDelegateResult | null> => {
     const gid = Number(groupId);

     try {
       const signer = await getSigner();
       const contract = new Contract(CONTRACT_ADDRESS, pollsAbi as any, signer);
       const tx = await contract.becomeDelegate(gid);
       const receipt = await tx.wait();

       if (receipt?.status === 1n) {
         let delegateId: number | null = null;

         for (const log of receipt.logs ?? []) {
           try {
             const parsed = contract.interface.parseLog(log);
             if (parsed?.name === 'NewDelegate') {
               const raw = parsed.args?.groupDelegateId;
               delegateId = raw !== undefined ? Number(raw) : null;
               break;
             }
           } catch {
              // Ignore logs that don't parse
           }
         }

         const delegateAddress = await signer.getAddress();

         return {
           delegate: delegateAddress,
           groupId: gid,
           delegateId: Number.isFinite(delegateId ?? NaN) ? delegateId : null
         };
       }

       return null;
     } catch (err: any) {
       console.error('becomeDelegate error:', err?.message || err);
       return null;
     }
   };

/**
 * Delegate your vote to another delegate in a group
 * 
 * ⚠️ Important: Parameter order in v2 is (delegateAddress, groupId)
 * This is different from v1!
 * 
 * Requirements:
 * - delegateAddress must be a registered delegate in the group
 * - Caller must be a member of the group
 * - Cannot delegate to yourself
 * - Cannot delegate multiple times to same delegate
 * 
 * @param {string} delegateAddress - Ethereum address of the delegate
 * @param {number | string} groupId - The group ID
 * @returns {Promise<boolean | null>} true on success, null on failure
 */
export const delegateToDelegate = async (
  delegateAddress: string,
  groupId: number | string
): Promise<boolean | null> => {
  const gid = Number(groupId);
  
  try {
    const c = await getContract();
    const tx = await c.delegateToDelegate(delegateAddress, gid);
    const receipt = await tx.wait();
    
    return receipt?.status === 1n ? true : null;
  } catch (err: any) {
    console.error('delegateToDelegate error:', err?.message || err);
    return null;
  }
};

/**
 * Remove your delegation from a specific delegate
 * 
 * Requirements:
 * - Must have an active delegation to this delegate
 * 
 * @param {string} delegateAddress - Address of delegate to remove delegation from
 * @param {number | string} groupId - The group ID
 * @returns {Promise<boolean | null>} true on success, null on failure
 */
export const removeDelegation = async (
  delegateAddress: string,
  groupId: number | string
): Promise<boolean | null> => {
  const gid = Number(groupId);
  
  try {
    const c = await getContract();
    const tx = await c.removeDelegation(delegateAddress, gid);
    const receipt = await tx.wait();
    
    return receipt?.status === 1n ? true : null;
  } catch (err: any) {
    console.error('removeDelegation error:', err?.message || err);
    return null;
  }
};

/**
 * Resign as a delegate in a group
 * 
 * ⚠️ Warning: All users who delegated to you will lose their delegations
 * 
 * Requirements:
 * - Must be an active delegate in the group
 * 
 * @param {number | string} groupId - The group ID to resign from
 * @returns {Promise<boolean | null>} true on success, null on failure
 */
export const resignAsDelegate = async (groupId: number | string): Promise<boolean | null> => {
  const gid = Number(groupId);
  
  try {
    const c = await getContract();
    const tx = await c.resignAsDelegate(gid);
    const receipt = await tx.wait();
    
    return receipt?.status === 1n ? true : null;
  } catch (err: any) {
    console.error('resignAsDelegate error:', err?.message || err);
    return null;
  }
};

// ============================================================================
// Read Functions (view only - no gas required)
// ============================================================================

/**
 * Check if an address is a delegate in a group
 * 
 * This is a view function (no transaction, no gas cost)
 * Useful for validation before delegating or showing UI status
 * 
 * @param {number | string} groupId - The group ID to check
 * @param {string} address - Ethereum address to verify
 * @returns {Promise<boolean>} true if address is a delegate, false otherwise
 */
export const addressIsDelegate = async (
  groupId: number | string,
  address: string
): Promise<boolean> => {
  const gid = Number(groupId);
  
  try {
    const c = await getContract();
    return await c.addressIsDelegate(gid, address);
  } catch (err: any) {
    console.error('addressIsDelegate error:', err?.message || err);
    return false;
  }
};

/**
 * Get the number of votes delegated to a specific delegate
 * 
 * This is a view function (no gas cost)
 * Returns how many users have delegated to this delegate (not including delegate's own vote)
 * 
 * @param {number | string} groupId - The group ID
 * @param {string} delegateAddress - Address of the delegate
 * @returns {Promise<number | null>} Vote count on success, null on error
 */
export const getDelegateVoteCount = async (
  groupId: number | string,
  delegateAddress: string
): Promise<number | null> => {
  const gid = Number(groupId);
  
  try {
    const c = await getContract();
    const raw = await c.getDelegateVoteCount(gid, delegateAddress);
    
    // ethers v6 returns BigInt - convert to number safely
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch (err: any) {
    console.error('getDelegateVoteCount error:', err?.message || err);
    return null;
  }
};

// ============================================================================
// Optional: Export helper functions for use in other files
// ============================================================================

/**
 * Export low-level helpers if needed elsewhere
 * Prefix with underscore to indicate "internal use"
 */
export const _getSigner = getSigner;
export const _getContract = getContract;