<script lang="ts">
	import Button from './Button.svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faXmark } from '@fortawesome/free-solid-svg-icons';
	import type { ModalButton } from './interfaces';
	//TODO: Make it draggable, add more options

	let {
		open = $bindable(false),
		Class = '',
		onOpen = () => {},
		onClose = () => {},
		onSubmit = () => {},
		buttons = [] as ModalButton[],
		id = 'popup-modal',
		stopAtPropagation = true
	} = $props();

	let modal: HTMLDivElement | undefined;

	const closeModal = (event: MouseEvent | KeyboardEvent) => {
		event.stopPropagation();
		open = false;
		hideScrollbar(false);
	};

	const handleInnerClick = (event: MouseEvent) => {
		event.stopPropagation();
		if (stopAtPropagation) onCloseModal();
	};

	const hideScrollbar = (hide: boolean) => {
		// document.body.style.overflowY = hide ? 'hidden' : 'scroll';
	};

	const onOpenModal = () => {
		hideScrollbar(true);
		onOpen();
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				closeModal(e);
			}
		});
	};

	const onCloseModal = () => {
		hideScrollbar(false);
		onClose();
	};

	$effect(() => {
		if (open) onOpenModal();
	});

	$effect(() => {
		if (!open) onClose();
	});
</script>

<div
	id="overlay"
	class="overlay"
	class:hidden={!open}
	onclick={closeModal}
	tabindex="-1"
	onkeydown={() => {}}
	role="button"
>
	<div
		{id}
		class={`modal-panel w-[calc(100%-2rem)] !cursor-default max-h-[80dvh] mt-10 bg-white dark:bg-darkobject overflow-y-auto overflow-x-hidden
		border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-2xl fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-[121] max-w-[400px] ${Class}`}
		onclick={handleInnerClick}
		tabindex="0"
		onkeydown={() => {}}
		role="button"
		bind:this={modal}
	>
		<div class="dark:text-darkmodeText relative p-5 w-full h-full bg-inherit">
			<!-- Sticky so the close button stays reachable in long, scrolled modals -->
			<div class="sticky top-0 z-10 -mx-5 -mt-5 px-5 pt-5 pb-1 flex items-start justify-between gap-3 bg-inherit">
				<div class="flex-1 min-w-0 text-lg font-semibold leading-snug pt-1 break-word">
					<slot name="header" />
				</div>
				<button
					type="button"
					onclick={() => (open = false)}
					class="shrink-0 -mr-1.5 -mt-1 rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
					data-modal-toggle="popup-modal"
				>
					<Fa icon={faXmark} class="w-4 h-4" />
					<span class="sr-only">{$_('Close modal')}</span>
				</button>
			</div>
			{#if onSubmit !== (() => {})}
				<form onsubmit={(e) => { e.preventDefault(); onSubmit(); }}>
					<div class="py-4 text-center break-word">
						<slot name="body" />
					</div>
					<slot name="footer" />
				</form>
			{:else}
				<div class="py-4 text-center">
					<slot name="body" />
				</div>
				<slot name="footer" />
			{/if}
			{#if buttons.length > 0}
				<div class="flex justify-center gap-2 pt-1">
					{#each buttons as button}
						<!-- Closed modals stay in the DOM, so only claim the id while open to avoid duplicates -->
						<Button
							id={open ? button.label : undefined}
							buttonStyle={button.type}
							Class={`flex-1 !rounded-full py-2.5 font-medium ${button.class || ''}`}
							onClick={button.onClick}
						>
							{$_(button.label)}
						</Button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed; /* Positioning and size */
		top: 0;
		left: 0;
		width: 100%;
		height: 100dvh;
		background-color: rgba(17, 24, 39, 0.45);
		backdrop-filter: blur(2px);
		/* Above the header (z-110) and chat button (z-105) */
		z-index: 120;
		animation: overlay-in 150ms ease-out;
	}

	/* Animations restart each time the overlay goes from display:none to visible */
	.modal-panel {
		animation: panel-in 180ms ease-out;
	}

	@keyframes overlay-in {
		from {
			opacity: 0;
		}
	}

	@keyframes panel-in {
		from {
			opacity: 0;
			scale: 0.96;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.overlay,
		.modal-panel {
			animation: none;
		}
	}
</style>
