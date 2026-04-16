import { env } from '$env/dynamic/public';
import { Contract,
	type ContractTransactionReceipt,
	type InterfaceAbi } from 'ethers';

import { ensureChain, getSigner } from './wallet';
import PollsAbi from './abis/Polls.v2.abi.json';

type GroupIdLike = bigint | number | string;
type MembershipWriteAction = 'becomeMemberOfGroup' | 'removeGroupMembership';
type PollsMembershipContract = Contract & {
	becomeMemberOfGroup?: (
		groupId: bigint
	) => Promise<{ wait: () => Promise<ContractTransactionReceipt | null> }>;
	removeGroupMembership?: (
		groupId: bigint
	) => Promise<{ wait: () => Promise<ContractTransactionReceipt | null> }>;
	isUserMemberInGroup?: (groupId: bigint) => Promise<boolean>;
	isUserMemberOfGroup?: (groupId: bigint) => Promise<boolean>;
	isAddressMemberInGroup?: (
		address: string,
		groupId: bigint
	) => Promise<boolean>;
	isAddressMemberOfGroup?: (
		address: string,
		groupId: bigint
	) => Promise<boolean>;
	isUserMemberInGroupForAddress?: (
		address: string,
		groupId: bigint
	) => Promise<boolean>;
};

const toGroupId = (value: GroupIdLike): bigint => {
  if (typeof value === 'bigint') return value;

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new Error('groupBlockchainId must be a finite integer number');
    }
    if (value < 0) throw new Error('groupBlockchainId must be non-negative');
    return BigInt(value);
  }

  const trimmed = value.trim();
  if (!trimmed) throw new Error('groupBlockchainId must be a non-empty string');

  try {
    const asBigInt = BigInt(trimmed);
    if (asBigInt < 0n) throw new Error('groupBlockchainId must be non-negative');
    return asBigInt;
  } catch {
    throw new Error('groupBlockchainId must be a valid bigint string (decimal or 0x hex)');
  }
};

const requirePollsAddress = (): string => {
  const addr = env.PUBLIC_V2_POLLS_ADDRESS?.trim();
  if (!addr) {
    throw new Error('Missing PUBLIC_V2_POLLS_ADDRESS in public env');
  }
  return addr;
};

const getPollsContract = async (): Promise<PollsMembershipContract> => {
  await ensureChain();
  const signer = await getSigner();
  const address = requirePollsAddress();
  return new Contract(address, PollsAbi as InterfaceAbi, signer) as unknown as PollsMembershipContract;
};

const executeMembershipWrite = async (
	action: MembershipWriteAction,
	groupBlockchainId: GroupIdLike
): Promise<ContractTransactionReceipt | null> => {
	const contract = await getPollsContract();
	const id = toGroupId(groupBlockchainId);

	const fn = contract[action];
	if (typeof fn !== 'function') {
		throw new Error(`Polls ABI does not expose ${action}`);
	}

	const tx = await fn(id);
	return tx.wait();
};

/**
 * V2 Membership
 * Assumes Polls contract exposes functions similar to:
 * - becomeMemberOfGroup(uint256 groupId)
 * - removeGroupMembership(uint256 groupId)
 *
 * We keep runtime checks to fail fast with clear errors if ABI differs.
 */
export const becomeMemberOfGroup = async (groupBlockchainId: GroupIdLike) => {
  return executeMembershipWrite('becomeMemberOfGroup', groupBlockchainId);
};

export const removeGroupMembership = async (groupBlockchainId: GroupIdLike) => {
  return executeMembershipWrite('removeGroupMembership', groupBlockchainId);
};

/**
 * Optional helpers (only if available in ABI).
 * We expose them but they will throw a clear error if the function is missing.
 */
export const isUserMemberOfGroup = async (groupBlockchainId: GroupIdLike): Promise<boolean> => {
  const contract = await getPollsContract();
  const id = toGroupId(groupBlockchainId);

  const fn = contract.isUserMemberInGroup ?? contract.isUserMemberOfGroup;
  if (typeof fn !== 'function') {
    throw new Error('Polls ABI does not expose isUserMemberInGroup/isUserMemberOfGroup');
  }

  const result = await fn(id);
  return Boolean(result);
};

export const isAddressMemberOfGroup = async (address: string, groupBlockchainId: GroupIdLike): Promise<boolean> => {
  const contract = await getPollsContract();
  const id = toGroupId(groupBlockchainId);

  const fn =
    contract.isAddressMemberInGroup ??
		contract.isAddressMemberOfGroup ??
		contract.isUserMemberInGroupForAddress;

  if (typeof fn !== 'function') {
    throw new Error('Polls ABI does not expose an address-based membership check');
  }

  const result = await fn(address, id);
  return Boolean(result);
};