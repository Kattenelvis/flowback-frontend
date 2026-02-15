import { BrowserProvider, Contract, ethers } from 'ethers';
import { env } from '$env/dynamic/public';
import abi from './contractABI.json';
//import abi from '$lib/Blockchain_v2_CrossChain/out/Polls.sol/Polls.json';

let provider: BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let listenersAttached = false;
type WalletEventProvider = {
    on?: (event: 'accountsChanged' | 'chainChanged', listener: (...args: unknown[]) => void) => void;
};

/**
 * Connect to MetaMask and return signer
 */
export async function getSigner() {
    if (!provider) {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask not found');
        }
        provider = new BrowserProvider(window.ethereum);
        attachWalletListeners();
    }

    // 1) Silent check first (no popup)
    let accounts = (await provider.send('eth_accounts', [])) as string[];

    // 2) Request connection only if no account is connected
    if (!accounts || accounts.length === 0) {
        try {
            accounts = (await provider.send('eth_requestAccounts', [])) as string[];
        } catch (error: unknown) {
            // MetaMask/EIP-1193 user rejected request
            if (
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                (error as { code: number }).code === 4001
            ) {
                throw new Error('Wallet connection was rejected by the user');
            }
            throw error;
        }
    }

    // 3) Safety check
    if (!accounts || accounts.length === 0) {
        throw new Error('No wallet account available');
    }

    // 4) Network check (chainId)
    const expectedChainId = Number(env.PUBLIC_V2_CHAIN_ID);
    if (!Number.isFinite(expectedChainId)) {
        throw new Error('PUBLIC_V2_CHAIN_ID is missing or invalid in env');
    }
    
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);
    
    if (currentChainId !== expectedChainId) {
        throw new Error(
            `Wrong network: expected chainId ${expectedChainId}, but got ${currentChainId}`
        );
    }

    signer = await provider.getSigner(accounts[0]);
    return signer;
}

/**
 * Get contract instance for Polls v2
 */
export async function getPollsContract() {
    if (!signer) {
        await getSigner();
    }

    const address = env.PUBLIC_V2_POLLS_ADDRESS;
    if (!address) throw new Error('PUBLIC_V2_POLLS_ADDRESS is missing in env');

    return new Contract(address, abi.abi, signer as ethers.Signer);
}

/**
 * Simple provider for read-only calls
 */
export function getReadProvider() {
    return new ethers.JsonRpcProvider(env.PUBLIC_V2_RPC_URL);
}

/**
 * Keep signer/provider in sync with wallet changes
 */
function attachWalletListeners() {
    if (listenersAttached) return;
    if (typeof window.ethereum === 'undefined') return;

    const resetConnection = () => {
        signer = null;
        provider = null;
    };

    const eventProvider = window.ethereum as unknown as WalletEventProvider;
    eventProvider.on?.('accountsChanged', resetConnection);
    eventProvider.on?.('chainChanged', resetConnection);

    listenersAttached = true;
}
