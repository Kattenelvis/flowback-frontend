import { ethers } from 'ethers';
import { env } from '$env/dynamic/public';

type Eip1193Provider = {
	request: (args: {
		method: string;
		params?: unknown[] | Record<string, unknown>;
	}) => Promise<unknown>;
};

const CHAIN_ID = Number(env.PUBLIC_V2_CHAIN_ID);
const RPC_URL = env.PUBLIC_V2_RPC_URL as string | undefined;
const EXPLORER_URL = (env.PUBLIC_V2_EXPLORER_URL as string | undefined) ?? '';
const CHAIN_NAME =
	(env.PUBLIC_V2_CHAIN_NAME as string | undefined) ?? 'Target Network';

const getEthereum = (): Eip1193Provider => {
	if (typeof window === 'undefined')
		throw new Error('Wallet not available (SSR).');
	const eth = window.ethereum as Eip1193Provider | undefined;
	if (!eth) throw new Error('No injected wallet found (window.ethereum).');
	return eth;
};

const toHex = (chainId: number): string => {
	return '0x' + chainId.toString(16);
};

export const connectWallet = async (): Promise<string> => {
	const eth = getEthereum();
	const accounts = (await eth.request({
		method: 'eth_requestAccounts'
	})) as string[];
	if (!accounts?.[0]) throw new Error('Wallet returned no accounts.');
	return accounts[0];
};

export const ensureChain = async (): Promise<void> => {
	if (!Number.isFinite(CHAIN_ID))
		throw new Error('PUBLIC_V2_CHAIN_ID is missing/invalid.');

	const eth = getEthereum();
	const chainIdHex = (await eth.request({ method: 'eth_chainId' })) as string;
	const current = parseInt(chainIdHex, 16);
	if (current === CHAIN_ID) return;

	try {
		await eth.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: toHex(CHAIN_ID) }]
		});
	} catch (err: unknown) {
		const code =
			err && typeof err === 'object' && 'code' in err
				? (err as any).code
				: undefined;

		if (code === 4001)
			throw new Error('Network switch was rejected by the user.');

		if (code === 4902) {
			if (!RPC_URL)
				throw new Error('PUBLIC_V2_RPC_URL is required to add the network.');
			await eth.request({
				method: 'wallet_addEthereumChain',
				params: [
					{
						chainId: toHex(CHAIN_ID),
						chainName: CHAIN_NAME,
						nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
						rpcUrls: [RPC_URL],
						blockExplorerUrls: EXPLORER_URL ? [EXPLORER_URL] : []
					}
				]
			});
			return;
		}

		throw new Error(`Wrong network. Please switch to chainId ${CHAIN_ID}.`);
	}
};

export const getSigner = async (): Promise<ethers.Signer> => {
	await connectWallet();
	await ensureChain();

	const eth = getEthereum();
	const provider = new ethers.BrowserProvider(eth as any);
	return provider.getSigner();
};
