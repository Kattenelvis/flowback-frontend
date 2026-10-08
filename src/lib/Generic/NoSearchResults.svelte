<script lang="ts">
	import { _ } from 'svelte-i18n';

	// Empty state shown when a search query yields nothing.
	let {
		query = '',
		onClear,
		Class = ''
	}: { query?: string; onClear?: () => void; Class?: string } = $props();
</script>

<div
	id="no-search-results"
	role="status"
	class="no-results relative overflow-hidden bg-white dark:bg-darkobject dark:text-darkmodeText rounded shadow px-6 py-10 flex flex-col items-center text-center {Class}"
>
	<div class="halo" aria-hidden="true"></div>

	<svg
		class="illustration relative w-52 h-40 mb-2"
		viewBox="0 0 160 128"
		fill="none"
		aria-hidden="true"
	>
		<!-- Stack of blank ballot cards -->
		<g class="cards">
			<rect x="34" y="30" width="78" height="56" rx="8" transform="rotate(-8 73 58)" class="card card-back" />
			<rect x="40" y="26" width="78" height="56" rx="8" transform="rotate(5 79 54)" class="card card-mid" />
			<rect x="38" y="30" width="80" height="58" rx="8" class="card card-front" />
			<rect x="50" y="44" width="40" height="6" rx="3" class="line" />
			<rect x="50" y="56" width="56" height="5" rx="2.5" class="line faint" />
			<rect x="50" y="66" width="32" height="5" rx="2.5" class="line faint" />
		</g>

		<!-- Magnifying glass sweeping across the cards -->
		<g class="glass">
			<circle cx="100" cy="74" r="20" class="lens" />
			<circle cx="100" cy="74" r="20" class="rim" />
			<path d="M91 66 a12 12 0 0 1 10 -4" class="glint" />
			<line x1="114.5" y1="88.5" x2="130" y2="104" class="handle" />
		</g>

		<!-- Sparkles -->
		<circle cx="26" cy="24" r="2.5" class="spark s1" />
		<circle cx="138" cy="28" r="2" class="spark s2" />
		<circle cx="20" cy="96" r="1.75" class="spark s3" />
	</svg>

	<h2 class="relative text-xl font-semibold text-gray-800 dark:text-darkmodeText">
		{$_('No search results found')}
	</h2>

	{#if query}
		<p class="relative mt-2 text-gray-600 dark:text-gray-300 max-w-full">
			{$_('Nothing matches')}
			<span
				class="query inline-block align-bottom max-w-[16rem] truncate px-2 py-0.5 rounded-md text-sm text-primary dark:text-secondary"
				>{query}</span
			>
		</p>
	{/if}

	<p class="relative mt-1 text-sm text-gray-500 dark:text-gray-400">
		{$_('Check the spelling or try a broader search term')}
	</p>

	{#if onClear}
		<button
			type="button"
			class="clear relative mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors"
			onclick={onClear}
		>
			<svg viewBox="0 0 16 16" class="w-3.5 h-3.5" aria-hidden="true">
				<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			{$_('Clear search')}
		</button>
	{/if}
</div>

<style>
	.no-results {
		animation: rise 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}

	.halo {
		position: absolute;
		top: -40%;
		left: 50%;
		width: 26rem;
		height: 18rem;
		transform: translateX(-50%);
		background:
			radial-gradient(closest-side, rgb(1 91 192 / 0.12), transparent 70%),
			radial-gradient(closest-side at 70% 60%, rgb(160 34 239 / 0.08), transparent 70%);
		pointer-events: none;
	}

	.query {
		font-family: var(--font-mono);
		background: rgb(1 91 192 / 0.08);
	}
	:global(.dark) .query {
		background: rgb(65 158 218 / 0.15);
	}

	.clear {
		color: var(--primary);
		border: 1px solid rgb(1 91 192 / 0.3);
	}
	.clear:hover {
		color: #fff;
		background: var(--primary);
		border-color: var(--primary);
	}
	.clear:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	:global(.dark) .clear {
		color: var(--secondary);
		border-color: rgb(65 158 218 / 0.4);
	}
	:global(.dark) .clear:hover {
		color: var(--darkmode-object-color);
		background: var(--secondary);
	}

	/* Illustration */
	.card {
		stroke-width: 1.5;
		stroke-dasharray: 4 4;
	}
	.card-back {
		fill: var(--accent-tertiary);
		stroke: var(--accent-secondary);
		opacity: 0.45;
	}
	.card-mid {
		fill: #eef4fc;
		stroke: var(--secondary);
		opacity: 0.6;
	}
	.card-front {
		fill: #fff;
		stroke: var(--secondary);
	}
	.line {
		fill: var(--secondary);
		opacity: 0.35;
	}
	.line.faint {
		opacity: 0.18;
	}
	:global(.dark) .card-front {
		fill: rgb(48 48 56);
	}
	:global(.dark) .card-mid {
		fill: rgb(40 44 56);
	}
	:global(.dark) .card-back {
		fill: rgb(46 36 58);
	}

	.glass {
		transform-origin: 100px 74px;
		animation: sweep 4.5s ease-in-out infinite;
	}
	.lens {
		fill: rgb(65 158 218 / 0.12);
	}
	.rim {
		stroke: var(--primary);
		stroke-width: 5;
	}
	.glint {
		stroke: #fff;
		stroke-width: 3;
		stroke-linecap: round;
		opacity: 0.9;
	}
	.handle {
		stroke: var(--primary);
		stroke-width: 8;
		stroke-linecap: round;
	}
	:global(.dark) .rim,
	:global(.dark) .handle {
		stroke: var(--secondary);
	}

	.spark {
		fill: var(--accent-secondary);
		animation: twinkle 3s ease-in-out infinite;
	}
	.s2 {
		fill: var(--secondary);
		animation-delay: 0.8s;
	}
	.s3 {
		animation-delay: 1.6s;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes sweep {
		0%,
		100% {
			transform: translate(0, 0) rotate(0deg);
		}
		30% {
			transform: translate(-34px, -14px) rotate(-6deg);
		}
		60% {
			transform: translate(-12px, -30px) rotate(4deg);
		}
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.25;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1.1);
		}
	}
	.spark {
		transform-box: fill-box;
		transform-origin: center;
	}

	@media (prefers-reduced-motion: reduce) {
		.no-results,
		.glass,
		.spark {
			animation: none;
		}
	}
</style>
