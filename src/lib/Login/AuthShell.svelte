<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { _ } from 'svelte-i18n';
	import Logo from '$lib/assets/Logo.png';
	import Reforum from '$lib/assets/ReforumTransparent.png';

	export let title = '',
		subtitle = '',
		id = '';

	const isReforum = env.PUBLIC_LOGO === 'REFORUM';
</script>

<div
	{id}
	class="auth min-h-[100svh] w-full flex bg-[#f6f7fb] dark:bg-darkbackground dark:text-darkmodeText"
	class:reforum={isReforum}
>
	<main class="flex-1 flex flex-col items-center justify-center px-5 py-12">
		<div class="w-full max-w-[420px]">
			<img
				src={isReforum ? Reforum : Logo}
				alt={isReforum ? 'Reforum Logo' : 'Flowback Logo'}
				class="h-12 w-auto mb-10 dark:brightness-125 rise"
			/>

			{#if title}
				<h1 class="text-left text-3xl font-semibold tracking-tight text-gray-900 dark:text-darkmodeText rise [animation-delay:60ms]">
					{$_(title)}
				</h1>
			{/if}
			{#if subtitle}
				<p class="mt-2 text-gray-500 dark:text-gray-400 rise [animation-delay:120ms]">
					{$_(subtitle)}
				</p>
			{/if}

			<div class="mt-8 rise [animation-delay:180ms]">
				<slot />
			</div>
		</div>
	</main>
</div>

<style>
	.auth {
		--brand: var(--primary);
	}

	.auth.reforum {
		--brand: #d4402f;
	}

	:global(.dark) .auth :global(.auth-button:disabled) {
		background: #374151;
		color: #9ca3af;
	}

	.rise {
		animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rise {
			animation: none;
		}
	}

	/* Shared form styling for everything rendered inside the shell */
	.auth :global(.auth-button) {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.6rem;
		font-weight: 600;
		color: white;
		background: var(--brand);
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.08), 0 6px 16px -6px color-mix(in srgb, var(--brand) 70%, transparent);
		transition: filter 0.15s, transform 0.15s, box-shadow 0.15s;
	}

	.auth :global(.auth-button:hover:not(:disabled)) {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	.auth :global(.auth-button:active:not(:disabled)) {
		transform: translateY(0);
	}

	.auth :global(.auth-button:disabled) {
		background: #d1d5db;
		color: #6b7280;
		cursor: not-allowed;
		box-shadow: none;
	}

	.auth :global(.auth-link) {
		color: var(--brand);
		font-weight: 500;
	}

	.auth :global(.auth-link:hover) {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.auth :global(.auth-check) {
		accent-color: var(--brand);
		width: 1rem;
		height: 1rem;
		cursor: pointer;
	}
</style>
