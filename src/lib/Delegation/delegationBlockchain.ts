import {
	becomeDelegate as becomeDelegateV2,
	addressIsDelegate as addressIsDelegateV2
} from '$lib/web3/frontend/delegations';
import { isUserMemberOfGroup as isUserMemberOfGroupV2 } from '$lib/web3/frontend/membership';

type BlockchainError = {
	shortMessage?: string;
	message?: string;
};

const getReadableErrorMessage = (
	error: unknown,
	fallbackMessage: string
): string => {
	if (typeof error === 'object' && error !== null) {
		const candidate = error as BlockchainError;

		if (
			typeof candidate.shortMessage === 'string' &&
			candidate.shortMessage.trim().length > 0
		) {
			return candidate.shortMessage;
		}

		if (
			typeof candidate.message === 'string' &&
			candidate.message.trim().length > 0
		) {
			return candidate.message;
		}
	}

	return fallbackMessage;
};

export const becomeDelegateOnChain = async (
	groupBlockchainId: number
): Promise<void> => {
	let isMember = false;

	try {
		isMember = await isUserMemberOfGroupV2(groupBlockchainId);
	} catch (error) {
		throw new Error(
			getReadableErrorMessage(error, 'Failed to check membership on-chain')
		);
	}

	if (!isMember) {
		throw new Error(
			'You must be a member of this group first. Join the group, then try again.'
		);
	}

	const accountsResponse = await window.ethereum?.request?.({
		method: 'eth_accounts'
	});
	const walletAddress = Array.isArray(accountsResponse)
		? accountsResponse[0]
		: null;

	if (typeof walletAddress !== 'string' || walletAddress.length === 0) {
		throw new Error('Wallet not connected. Please connect your wallet first.');
	}

	let alreadyDelegate = false;

	try {
		alreadyDelegate = await addressIsDelegateV2(
			groupBlockchainId,
			walletAddress
		);
	} catch (error) {
		throw new Error(
			getReadableErrorMessage(error, 'Failed to check delegate status on-chain')
		);
	}

	if (alreadyDelegate) {
		return;
	}

	try {
		await becomeDelegateV2(groupBlockchainId);
	} catch (error) {
		const errorMessage = getReadableErrorMessage(
			error,
			'On-chain becomeDelegate failed'
		);
		const normalizedMessage = errorMessage.toLowerCase();

		if (
			normalizedMessage.includes('alreadydelegate') ||
			normalizedMessage.includes('d_alreadydelegate')
		) {
			return;
		}

		throw new Error(errorMessage);
	}
};