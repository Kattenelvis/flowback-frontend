<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import {
		faArrowUpRightFromSquare,
		faChevronLeft,
		faChevronRight,
		faDownload,
		faFile,
		faFileAudio,
		faFileExcel,
		faFileLines,
		faFilePdf,
		faFilePowerpoint,
		faFileVideo,
		faFileWord,
		faFileZipper,
		faPaperclip,
		faXmark,
		type IconDefinition
	} from '@fortawesome/free-solid-svg-icons';

	interface Attachment {
		file: string;
		file_name?: string;
	}

	let {
		attachments = [],
		Class = ''
	}: { attachments?: Attachment[] | null; Class?: string } = $props();

	const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'svg'];
	// Images past this many tiles are still reachable through the lightbox
	const MAX_TILES = 4;

	const FILE_TYPES: { extensions: string[]; icon: IconDefinition; tint: string }[] = [
		{
			extensions: ['pdf'],
			icon: faFilePdf,
			tint: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
		},
		{
			extensions: ['doc', 'docx', 'odt', 'rtf'],
			icon: faFileWord,
			tint: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
		},
		{
			extensions: ['xls', 'xlsx', 'ods', 'csv'],
			icon: faFileExcel,
			tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
		},
		{
			extensions: ['ppt', 'pptx', 'odp'],
			icon: faFilePowerpoint,
			tint: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
		},
		{
			extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
			icon: faFileZipper,
			tint: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
		},
		{
			extensions: ['mp4', 'mov', 'webm', 'mkv'],
			icon: faFileVideo,
			tint: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
		},
		{
			extensions: ['mp3', 'wav', 'ogg', 'm4a'],
			icon: faFileAudio,
			tint: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400'
		},
		{
			extensions: ['txt', 'md'],
			icon: faFileLines,
			tint: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
		}
	];
	const DEFAULT_FILE_TYPE = {
		icon: faFile,
		tint: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
	};

	const fileType = (extension: string) =>
		FILE_TYPES.find((type) => type.extensions.includes(extension)) ?? DEFAULT_FILE_TYPE;

	const items = $derived(
		(attachments ?? []).map((attachment) => ({
			name: attachment.file_name || attachment.file.split('/').pop() || attachment.file,
			url: `${env.PUBLIC_API_URL}/media/${attachment.file}`,
			extension: attachment.file.split('.').pop()?.toLowerCase() ?? ''
		}))
	);
	const images = $derived(items.filter((item) => IMAGE_EXTENSIONS.includes(item.extension)));
	const files = $derived(items.filter((item) => !IMAGE_EXTENSIONS.includes(item.extension)));

	// One image fills the width, two sit side by side, three or more form a mosaic
	const galleryLayout = $derived(
		images.length === 1
			? 'grid-cols-1'
			: images.length === 2
				? 'grid-cols-2'
				: 'h-72 grid-cols-2 grid-rows-2 sm:h-96'
	);

	const iconButton =
		'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white';

	let current: number | null = $state(null),
		closeButton: HTMLButtonElement | undefined = $state(),
		opener: HTMLElement | null = null,
		touchStartX = 0;

	const isOpen = $derived(current !== null);

	const open = (index: number, event: MouseEvent) => {
		// Modified clicks keep their normal behaviour, e.g. ctrl-click opens a new tab
		if (event.metaKey || event.ctrlKey || event.shiftKey) return;
		event.preventDefault();
		opener = event.currentTarget as HTMLElement;
		current = index;
	};

	const close = () => {
		current = null;
		opener?.focus();
	};

	const step = (direction: 1 | -1) => {
		if (current === null) return;
		current = (current + direction + images.length) % images.length;
	};

	const onKeydown = (event: KeyboardEvent) => {
		if (current === null) return;
		if (event.key === 'Escape') close();
		else if (event.key === 'ArrowRight') step(1);
		else if (event.key === 'ArrowLeft') step(-1);
	};

	const onTouchEnd = (event: TouchEvent) => {
		const distance = event.changedTouches[0].clientX - touchStartX;
		if (Math.abs(distance) > 50) step(distance < 0 ? 1 : -1);
	};

	// Render the lightbox on <body> so a transformed or clipped ancestor can't trap it
	const portal = (node: HTMLElement) => {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	};

	// Keep the page behind the lightbox from scrolling while it is open
	$effect(() => {
		if (!isOpen) return;
		const overflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		closeButton?.focus();
		return () => (document.body.style.overflow = overflow);
	});
</script>

<svelte:window onkeydown={onKeydown} />

{#if items.length > 0}
	<section class="flex w-full max-w-2xl flex-col gap-3 {Class}" aria-label={$_('Attachments')}>
		<h2
			class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
		>
			<Fa icon={faPaperclip} />
			{$_('Attachments')}
			<span
				class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal tabular-nums text-gray-600 dark:bg-darkbackground dark:text-gray-300"
			>
				{items.length}
			</span>
		</h2>

		{#if images.length > 0}
			<div class="grid gap-1.5 overflow-hidden rounded-2xl {galleryLayout}">
				{#each images.slice(0, MAX_TILES) as image, i}
					{@const hidden = images.length - MAX_TILES}
					<a
						href={image.url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={image.name}
						onclick={(event) => open(i, event)}
						class="group relative block overflow-hidden bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:bg-darkbackground dark:focus-visible:ring-secondary
							{images.length === 2 ? 'aspect-[4/3]' : ''}
							{images.length === 3 && i === 0 ? 'row-span-2' : ''}"
					>
						<img
							src={image.url}
							alt={image.name}
							loading="lazy"
							class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]
								{images.length === 1 ? 'max-h-[28rem]' : ''}"
						/>
						<span
							class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-8 text-left text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
						>
							<span class="line-clamp-1">{image.name}</span>
						</span>
						{#if i === MAX_TILES - 1 && hidden > 0}
							<span
								class="absolute inset-0 flex items-center justify-center bg-gray-900/55 text-2xl font-semibold text-white backdrop-blur-[2px]"
							>
								+{hidden}
							</span>
						{/if}
					</a>
				{/each}
			</div>
		{/if}

		{#if files.length > 0}
			<ul class="grid gap-2 sm:grid-cols-2">
				{#each files as file}
					{@const type = fileType(file.extension)}
					<li
						class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-darkobject dark:hover:border-gray-600 dark:hover:bg-darkbackground"
					>
						<a
							href={file.url}
							target="_blank"
							rel="noopener noreferrer"
							class="flex min-w-0 flex-1 items-center gap-3 text-gray-800 hover:no-underline dark:text-darkmodeText"
						>
							<span
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg {type.tint}"
							>
								<Fa icon={type.icon} />
							</span>
							<span class="flex min-w-0 flex-col text-left">
								<span class="truncate text-sm font-medium">{file.name}</span>
								<span class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
									{file.extension || $_('File')}
								</span>
							</span>
						</a>
						<a
							href={file.url}
							download={file.name}
							aria-label="{$_('Download')} {file.name}"
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
						>
							<Fa icon={faDownload} />
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

{#if current !== null}
	{@const image = images[current]}
	<div
		use:portal
		class="lightbox fixed inset-0 z-[125] flex flex-col bg-gray-950/95 text-white backdrop-blur-md"
		role="dialog"
		aria-modal="true"
		aria-label={image.name}
		ontouchstart={(event) => (touchStartX = event.touches[0].clientX)}
		ontouchend={onTouchEnd}
	>
		<div class="flex items-center gap-1 px-4 py-3">
			<div class="mr-2 min-w-0 flex-1 text-left">
				<p class="truncate text-sm font-medium">{image.name}</p>
				{#if images.length > 1}
					<p class="text-xs tabular-nums text-white/60">{current + 1} / {images.length}</p>
				{/if}
			</div>
			<a
				href={image.url}
				target="_blank"
				rel="noopener noreferrer"
				class={iconButton}
				aria-label={$_('Open in new tab')}
			>
				<Fa icon={faArrowUpRightFromSquare} />
			</a>
			<a href={image.url} download={image.name} class={iconButton} aria-label={$_('Download')}>
				<Fa icon={faDownload} />
			</a>
			<button
				bind:this={closeButton}
				type="button"
				class={iconButton}
				aria-label={$_('Close')}
				onclick={close}
			>
				<Fa icon={faXmark} class="text-lg" />
			</button>
		</div>

		<!-- Clicking the backdrop around the image closes the lightbox -->
		<div
			role="presentation"
			class="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20"
			onclick={(event) => event.target === event.currentTarget && close()}
		>
			{#key current}
				<img
					src={image.url}
					alt={image.name}
					class="lightbox-image max-h-full max-w-full rounded-lg object-contain shadow-2xl"
				/>
			{/key}

			{#if images.length > 1}
				<button
					type="button"
					class="{iconButton} absolute left-2 top-1/2 h-12 w-12 -translate-y-1/2 bg-white/10 sm:left-5"
					aria-label={$_('Previous')}
					onclick={() => step(-1)}
				>
					<Fa icon={faChevronLeft} />
				</button>
				<button
					type="button"
					class="{iconButton} absolute right-2 top-1/2 h-12 w-12 -translate-y-1/2 bg-white/10 sm:right-5"
					aria-label={$_('Next')}
					onclick={() => step(1)}
				>
					<Fa icon={faChevronRight} />
				</button>
			{/if}
		</div>

		{#if images.length > 1}
			<div class="flex justify-center gap-2 overflow-x-auto px-4 py-4">
				{#each images as thumbnail, i}
					<button
						type="button"
						aria-label={thumbnail.name}
						aria-current={i === current ? 'true' : undefined}
						onclick={() => (current = i)}
						class="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/10 ring-2 transition {i === current
							? 'opacity-100 ring-white'
							: 'opacity-50 ring-transparent hover:opacity-80'}"
					>
						<img src={thumbnail.url} alt="" class="h-full w-full object-cover" />
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.lightbox {
		animation: fade-in 150ms ease-out;
	}

	.lightbox-image {
		animation: zoom-in 200ms ease-out;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes zoom-in {
		from {
			opacity: 0;
			scale: 0.97;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.lightbox,
		.lightbox-image {
			animation: none;
		}
	}
</style>
