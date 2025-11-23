// ============================================================================
// src/lib/Blockchain_v2_CrossChain/adapters/delegationAdapter.ts
// Unified API for v1 (Ethereum Sepolia) and v2 (Base Sepolia)
// ============================================================================

import { env } from '$env/dynamic/public';

// v1 imports - will be removed later
import {
  becomeDelegate as becomeDelegateV1,
  delegate as delegateV1,
  removeDelegation as removeDelegationV1,
} from '$lib/Blockchain_v1_Ethereum/javascript/delegationsBlockchain';

// v2 imports - keep these
import {
  becomeDelegate as becomeDelegateV2,
  delegateToDelegate as delegateToDelegateV2,
  removeDelegation as removeDelegationV2,
  resignAsDelegate as resignAsDelegateV2,
  addressIsDelegate as addressIsDelegateV2,
  getDelegateVoteCount as getDelegateVoteCountV2,
} from '$lib/Blockchain_v2_CrossChain/javascript/delegationsBlockchain';

// Version detection
const BLOCKCHAIN_VERSION = env.PUBLIC_BLOCKCHAIN_VERSION || 'v1';
const isV2 = BLOCKCHAIN_VERSION === 'v2';

// Log version
if (typeof window !== 'undefined') {
  console.log(`🔗 Delegation: ${isV2 ? 'v2 (Base Sepolia)' : 'v1 (Ethereum Sepolia)'}`);
}

// ============================================================================
// Unified API Functions
// ============================================================================

/**
 * Become a delegate in a group
 * Available: v1 ✅ | v2 ✅
 */
/*export async function becomeDelegate(groupId: number | string): Promise<string | null> {
  const gid = Number(groupId);
  return isV2 ? becomeDelegateV2(gid) : becomeDelegateV1(gid);
}*/
// --------------------------------------------------------
// Unified return type for v1 + v2
// --------------------------------------------------------
export type BecomeDelegateUnified =
    | string
    | { delegate: string; groupId: number; delegateId: number | null }
    | null;

// --------------------------------------------------------
// FIXED: becomeDelegate now returns correct unified type
// --------------------------------------------------------
export async function becomeDelegate(
  groupId: number | string
): Promise<BecomeDelegateUnified> {

  const gid = Number(groupId);

  if (isV2) {
    // v2 returns: { delegate, groupId, delegateId } | null
    return await becomeDelegateV2(gid);
  }

  // v1 returns string | undefined → normalize to null
  const result = await becomeDelegateV1(gid);
  return result ?? null;
}
/**
 * Delegate your vote to another delegate
 * Available: v1 ✅ | v2 ✅
 * Note: Parameter order differs (v1: groupId, address | v2: address, groupId)
 */
export async function delegateToDelegate(
  delegateAddress: string,
  groupId: number | string
): Promise<boolean | null> {
  const gid = Number(groupId);
  
  if (isV2) {
    return delegateToDelegateV2(delegateAddress, gid);
  } else {
    // v1 has swapped parameter order
    const result = await delegateV1(gid, delegateAddress);
    return result !== undefined ? true : null;
  }
}

/**
 * Remove delegation from a delegate
 * Available: v1 ✅ | v2 ✅
 */
export async function removeDelegation(
  delegateAddress: string,
  groupId: number | string
): Promise<boolean | null> {
  const gid = Number(groupId);
  
  if (isV2) {
    return removeDelegationV2(delegateAddress, gid);
  } else {
    const result = await removeDelegationV1();
    return result !== undefined ? true : null;
  }
}

/**
 * Resign as a delegate
 * Available: v1 ❌ | v2 ✅ (v2 only)
 */
export async function resignAsDelegate(groupId: number | string): Promise<boolean | null> {
  const gid = Number(groupId);
  
  if (isV2) {
    return resignAsDelegateV2(gid);
  } else {
    console.warn('⚠️ resignAsDelegate is only available in v2');
    return null;
  }
}

/**
 * Check if address is a delegate (view function - no gas)
 * Available: v1 ❌ | v2 ✅ (v2 only)
 */
export async function addressIsDelegate(
  groupId: number | string,
  address: string
): Promise<boolean> {
  const gid = Number(groupId);
  
  if (isV2) {
    return addressIsDelegateV2(gid, address);
  } else {
    console.warn('⚠️ addressIsDelegate is only available in v2');
    return false;
  }
}

/**
 * Get delegate vote count (view function - no gas)
 * Available: v1 ❌ | v2 ✅ (v2 only)
 */
export async function getDelegateVoteCount(
  groupId: number | string,
  delegateAddress: string
): Promise<number | null> {
  const gid = Number(groupId);
  
  if (isV2) {
    return getDelegateVoteCountV2(gid, delegateAddress);
  } else {
    console.warn('⚠️ getDelegateVoteCount is only available in v2');
    return null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export const getBlockchainVersion = (): 'v1' | 'v2' => isV2 ? 'v2' : 'v1';

export const hasV2Features = (): boolean => isV2;

export const getVersionInfo = () => ({
  version: isV2 ? 'v2' : 'v1',
  network: isV2 ? 'Base Sepolia (L2)' : 'Ethereum Sepolia (L1)',
  chainId: isV2 ? 84532 : 11155111,
  contractAddress: isV2 
    ? '0x27013b43c40fB4fB0c23DD0E56f1fB90FA8a0276' 
    : env.PUBLIC_V1_POLLS_ADDRESS,
  features: {
    delegation: true,
    becomeDelegate: true,
    resignAsDelegate: isV2,
    addressIsDelegate: isV2,
    getDelegateVoteCount: isV2,
    crossChain: isV2,
  }
});

export { isV2 };