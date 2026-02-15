/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

declare module '@shopify/draggable'

declare namespace App {
	interface Locals {
		userid: string;
	}
	
	// interface Platform {}
	
	// interface Session {}
	
	// interface Stuff {}
}

import type { Eip1193Provider } from 'ethers';
// We augment the global Window type to include the EIP-1193 provider injected by wallet extensions (e.g. MetaMask).
// This improves type safety in client-side web3 code (BrowserProvider(window.ethereum)) and avoids relying on implicit `any`.
type Eip1193EventName = 'accountsChanged' | 'chainChanged';

type WalletProvider = Eip1193Provider & {
	on?: (event: Eip1193EventName, listener: (...args: unknown[]) => void) => void;
	removeListener?: (event: Eip1193EventName, listener: (...args: unknown[]) => void) => void;
};

declare global {
	interface Window {
		ethereum?: WalletProvider;
	}
}

export {};

