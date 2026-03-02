import { env } from '$env/dynamic/public';
import { Contract } from 'ethers';

import { ensureChain, getSigner } from './wallet';
import PollsAbi from './abis/Polls.v2.abi.json';

type GroupIdLike = bigint | number | string;

function toGroupId(value: GroupIdLike): bigint {
  // Enforce integer-like values only
  if (typeof value === 'bigint') return value;

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new Error('groupBlockchainId must be a finite integer number');
    }
    if (value < 0) throw new Error('groupBlockchainId must be non-negative');
    return BigInt(value);
  }

  // string
  const trimmed = value.trim();
  if (!trimmed) throw new Error('groupBlockchainId must be a non-empty string');

  // Allow decimal or hex string (0x...)
  try {
    const asBigInt = BigInt(trimmed);
    if (asBigInt < 0n) throw new Error('groupBlockchainId must be non-negative');
    return asBigInt;
  } catch {
    throw new Error('groupBlockchainId must be a valid bigint string (decimal or 0x hex)');
  }
}

function requirePollsAddress(): string {
  const addr = env.PUBLIC_V2_POLLS_ADDRESS?.trim();
  if (!addr) {
    throw new Error('Missing PUBLIC_V2_POLLS_ADDRESS in public env');
  }
  return addr;
}

async function getPollsContract(): Promise<Contract> {
  await ensureChain();
  const signer = await getSigner();
  const address = requirePollsAddress();
  return new Contract(address, PollsAbi as any, signer);
}

/**
 * V2 Membership
 * Assumes Polls contract exposes functions similar to:
 * - becomeMemberOfGroup(uint256 groupId)
 * - removeGroupMembership(uint256 groupId)
 *
 * We keep runtime checks to fail fast with clear errors if ABI differs.
 */
export async function becomeMemberOfGroup(groupBlockchainId: GroupIdLike) {
  const contract = await getPollsContract();
  const id = toGroupId(groupBlockchainId);

  const fn = (contract as any).becomeMemberOfGroup;
  if (typeof fn !== 'function') {
    throw new Error('Polls ABI does not expose becomeMemberOfGroup');
  }

  const tx = await fn(id);
  return await tx.wait();
}

export async function removeGroupMembership(groupBlockchainId: GroupIdLike) {
  const contract = await getPollsContract();
  const id = toGroupId(groupBlockchainId);

  const fn = (contract as any).removeGroupMembership;
  if (typeof fn !== 'function') {
    throw new Error('Polls ABI does not expose removeGroupMembership');
  }

  const tx = await fn(id);
  return await tx.wait();
}

/**
 * Optional helpers (only if available in ABI).
 * We expose them but they will throw a clear error if the function is missing.
 */
export async function isUserMemberOfGroup(groupBlockchainId: GroupIdLike): Promise<boolean> {
  const contract = await getPollsContract();
  const id = toGroupId(groupBlockchainId);

  const fn = (contract as any).isUserMemberInGroup ?? (contract as any).isUserMemberOfGroup;
  if (typeof fn !== 'function') {
    throw new Error('Polls ABI does not expose isUserMemberInGroup/isUserMemberOfGroup');
  }

  const result = await fn(id);
  return Boolean(result);
}

export async function isAddressMemberOfGroup(address: string, groupBlockchainId: GroupIdLike): Promise<boolean> {
  const contract = await getPollsContract();
  const id = toGroupId(groupBlockchainId);

  const fn =
    (contract as any).isAddressMemberInGroup ??
    (contract as any).isAddressMemberOfGroup ??
    (contract as any).isUserMemberInGroupForAddress;

  if (typeof fn !== 'function') {
    throw new Error('Polls ABI does not expose an address-based membership check');
  }

  const result = await fn(address, id);
  return Boolean(result);
}