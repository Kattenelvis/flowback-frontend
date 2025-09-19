/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

declare module '@shopify/draggable'

declare namespace App {
	interface Locals {
		userid: string;
	}

	interface Platform {
		env: {
			COUNTER: DurableObjectNamespace;
		};
		context: {
			waitUntil(promise: Promise<any>): void;
		};
		caches: CacheStorage & { default: Cache }
	}
	
	// interface Platform {}
	
	// interface Session {}
	
	// interface Stuff {}
}