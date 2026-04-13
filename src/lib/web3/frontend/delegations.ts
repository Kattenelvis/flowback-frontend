import { env } from '$env/dynamic/public';
import { Contract } from 'ethers';

import { ensureChain, getSigner } from './wallet';
import PollsAbi from './abis/Polls.v2.abi.json';

type GroupIdLike = bigint | number | string;

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
	if (!addr) throw new Error('Missing PUBLIC_V2_POLLS_ADDRESS in public env');
	return addr;
};

const getPollsContract = async (): Promise<Contract> => {
	await ensureChain();
	const signer = await getSigner();
	return new Contract(requirePollsAddress(), PollsAbi as any, signer);
};

/**
 * V2 Delegations
 * Signatures confirmed from ABI:
 * - becomeDelegate(uint256 groupId)
 * - resignAsDelegate(uint256 groupId)
 * - delegateToDelegate(address delegate, uint256 groupId)
 * - removeDelegation(address delegate, uint256 groupId)
 * - addressIsDelegate(uint256 groupId, address user)
 * - hasDelegatedInGroup(uint256 groupId)
 * - hasDelegatedToDelegateInGroup(uint256 groupId, address delegate)
 * - getDelegateCount(uint256 groupId)
 * - getDelegateVoteCount(uint256 groupId, address delegate)
 * - groupDelegates(uint256 groupId, uint256 index)
 */

export const becomeDelegate = async (groupBlockchainId: GroupIdLike) => {
	const c = await getPollsContract();
	const id = toGroupId(groupBlockchainId);

	const fn = (c as any).becomeDelegate;
	if (typeof fn !== 'function') throw new Error('Polls ABI missing becomeDelegate(uint256)');

	const tx = await fn(id);
	return await tx.wait();
};

export const resignAsDelegate = async (groupBlockchainId: GroupIdLike) => {
	const c = await getPollsContract();
	const id = toGroupId(groupBlockchainId);

	const fn = (c as any).resignAsDelegate;
	if (typeof fn !== 'function') throw new Error('Polls ABI missing resignAsDelegate(uint256)');

	const tx = await fn(id);
	return await tx.wait();
};

export const delegateTo = async (delegateAddress: string, groupBlockchainId: GroupIdLike) => {
	const c = await getPollsContract();
	const id = toGroupId(groupBlockchainId);

	const fn = (c as any).delegateToDelegate;
	if (typeof fn !== 'function') throw new Error('Polls ABI missing delegateToDelegate(address,uint256)');

	const tx = await fn(delegateAddress, id);
	return await tx.wait();
};

export const removeDelegation = async (delegateAddress: string, groupBlockchainId: GroupIdLike) => {
	const c = await getPollsContract();
	const id = toGroupId(groupBlockchainId);

	const fn = (c as any).removeDelegation;
	if (typeof fn !== 'function') throw new Error('Polls ABI missing removeDelegation(address,uint256)');

	const tx = await fn(delegateAddress, id);
	return await tx.wait();
};

// ---- Read-only helpers ----

export const addressIsDelegate = async (groupBlockchainId: GroupIdLike, userAddress: string): Promise<boolean> => {
	const c = await getPollsContract();
	const id = toGroupId(groupBlockchainId);

	const fn = (c as any).addressIsDelegate;
	if (typeof fn !== 'function') throw new Error('Polls ABI missing addressIsDelegate(uint256,address)');

	return Boolean(await fn(id, userAddress));
};

export const hasDelegatedInGroup = async (groupBlockchainId: GroupIdLike): Promise<boolean> => {
	const c = await getPollsContract();
	const id = toGroupId(groupBlockchainId);

	const fn = (c as any).hasDelegatedInGroup;
	if (typeof fn !== 'function') throw new Error('Polls ABI missing hasDelegatedInGroup(uint256)');

	return Boolean(await fn(id));
};

export const hasDelegatedToDelegateInGroup = async (
	groupBlockchainId: GroupIdLike,
	delegateAddress: string
): Promise<boolean> => {
	const c = await getPollsContract();
	const id = toGroupId(groupBlockchainId);

	const fn = (c as any).hasDelegatedToDelegateInGroup;
	if (typeof fn !== 'function') {
		throw new Error('Polls ABI missing hasDelegatedToDelegateInGroup(uint256,address)');
	}

	return Boolean(await fn(id, delegateAddress));
};

export const getDelegateCount = async (groupBlockchainId: GroupIdLike): Promise<bigint> => {
	const c = await getPollsContract();
	const id = toGroupId(groupBlockchainId);

	const fn = (c as any).getDelegateCount;
	if (typeof fn !== 'function') throw new Error('Polls ABI missing getDelegateCount(uint256)');

	return (await fn(id)) as bigint;
};

export const getDelegateVoteCount = async (groupBlockchainId: GroupIdLike, delegateAddress: string): Promise<bigint> => {
	const c = await getPollsContract();
	const id = toGroupId(groupBlockchainId);

	const fn = (c as any).getDelegateVoteCount;
	if (typeof fn !== 'function') throw new Error('Polls ABI missing getDelegateVoteCount(uint256,address)');

	return (await fn(id, delegateAddress)) as bigint;
};

export type GroupDelegateEntry = {
	delegate: string;
	groupId: bigint;
	a: bigint;
	b: bigint;
};

export const groupDelegates = async (
	groupBlockchainId: GroupIdLike,
	index: GroupIdLike
): Promise<GroupDelegateEntry> => {
	const c = await getPollsContract();
	const id = toGroupId(groupBlockchainId);
	const i = toGroupId(index);

	const fn = (c as any).groupDelegates;
	if (typeof fn !== 'function') throw new Error('Polls ABI missing groupDelegates(uint256,uint256)');

	const r = await fn(id, i);

	return {
		delegate: r[0] as string,
		groupId: r[1] as bigint,
		a: r[2] as bigint,
		b: r[3] as bigint
	};
};

export const isAddressInGroupDelegates = async (
	groupBlockchainId: GroupIdLike,
	userAddress: string
): Promise<boolean> => {
	const target = userAddress.toLowerCase();
	const count = await getDelegateCount(groupBlockchainId);

	if (count > 10_000n) throw new Error('Delegate count too large to scan safely');

	for (let i = 0n; i < count; i++) {
		const entry = await groupDelegates(groupBlockchainId, i);
		if (entry.delegate.toLowerCase() === target) return true;
	}

	return false;
};