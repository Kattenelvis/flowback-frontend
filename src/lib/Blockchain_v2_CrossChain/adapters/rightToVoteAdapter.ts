import { getPollsContract } from '../javascript/client';

// Helper to normalize group id
function normalizeGroupId(groupId: number | string): bigint {
  const n = typeof groupId === 'number' ? groupId : Number(groupId);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error('Invalid groupId');
  }
  return BigInt(n);
}

/**
 * Become member of a group (v2, on-chain)
 */
export async function becomeMemberOfGroup(groupId: number | string) {
  const contract = await getPollsContract();
  const group = normalizeGroupId(groupId);
  const tx = await contract.becomeMemberOfGroup(group);
  return tx.wait();
}

/**
 * Resign membership from a group (v2, on-chain)
 */
export async function removeGroupMembership(groupId: number | string) {
  const contract = await getPollsContract();
  const group = normalizeGroupId(groupId);
  const tx = await contract.removeGroupMembership(group);
  return tx.wait();
}

/**
 * Check if the connected address is member of a group
 */
export async function isUserMemberOfGroup(
  groupId: number | string
): Promise<boolean> {
  const contract = await getPollsContract();
  const group = normalizeGroupId(groupId);
  const result: boolean = await contract.isUserMemberOfGroup(group);
  return result;
}

/**
 * Get all groups where the connected address is a member
 */
export async function getGroupsUserIsMemberIn(): Promise<bigint[]> {
  const contract = await getPollsContract();
  const groups: bigint[] = await contract.getGroupsUserIsMemberIn();
  return groups;
}
