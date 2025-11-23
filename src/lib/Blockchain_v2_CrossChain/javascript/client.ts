import { BrowserProvider, Contract, ethers } from 'ethers';
import { env } from '$env/dynamic/public';
import abi from './contractABI.json';
//import abi from '$lib/Blockchain_v2_CrossChain/out/Polls.sol/Polls.json';

let provider: BrowserProvider | null = null;
let signer: ethers.Signer | null = null;

/**
 * Connect to MetaMask and return signer
 */
export async function getSigner() {
    if (!provider) {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask not found');
        }
        provider = new BrowserProvider(window.ethereum);
    }

    const accounts = await provider.send('eth_requestAccounts', []);
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
