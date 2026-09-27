<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

	// A message box with a round send button next to it, used by the chat and
	// the comment section. The box grows with its text up to maxHeight pixels.
	// The "before" and "after" slots put extra buttons inside the box.
	export let value = '',
		placeholder = '',
		onSend: () => void = () => {},
		// Enter sends and Shift+Enter starts a new line. Otherwise Enter starts a
		// new line. Ctrl/Cmd+Enter always sends.
		sendOnEnter = false,
		// Allow sending with no text, for example when files are attached
		allowEmpty = false,
		autofocus = false,
		max = 5000,
		maxHeight = 160,
		id = '',
		sendLabel = 'Send',
		textarea: HTMLTextAreaElement | null = null,
		Class = '';

	$: sendable = allowEmpty || value.trim() !== '';

	const send = () => {
		if (sendable) onSend();
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key !== 'Enter' || e.isComposing) return;
		if (e.ctrlKey || e.metaKey || (sendOnEnter && !e.shiftKey)) {
			e.preventDefault();
			send();
		}
	};

	const resize = async () => {
		await tick();
		if (!textarea) return;
		// A hidden box has no height to measure, and an empty one is one row
		textarea.style.height = '';
		if (!value || textarea.scrollHeight === 0) return;
		textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
	};

	$: value, resize();

	onMount(() => {
		if (autofocus) textarea?.focus();
	});
</script>

<form class="flex items-end gap-2 {Class}" on:submit|preventDefault={send}>
	<div
		class="flex-1 min-w-0 flex items-end rounded-[1.25rem] bg-gray-100 dark:bg-darkbackground transition-shadow focus-within:bg-white focus-within:ring-2 focus-within:ring-primary dark:focus-within:bg-darkbackground dark:focus-within:ring-secondary"
	>
		<slot name="before" />
		<textarea
			bind:this={textarea}
			bind:value
			id={id || undefined}
			rows="1"
			maxlength={max}
			placeholder={placeholder ? $_(placeholder) : ''}
			aria-label={placeholder ? $_(placeholder) : $_(sendLabel)}
			style:max-height={`${maxHeight}px`}
			class="flex-1 min-w-0 resize-none overflow-y-auto border-0 bg-transparent py-2 {$$slots.before ? 'pl-1.5' : 'pl-4'} {$$slots.after ? 'pr-1.5' : 'pr-4'} text-base md:text-sm leading-6 text-gray-900 placeholder-gray-500 outline-none dark:text-darkmodeText dark:placeholder-gray-400"
			on:keydown={onKeyDown}
		></textarea>
		<slot name="after" />
	</div>
	<button
		type="submit"
		disabled={!sendable}
		title={$_(sendLabel)}
		class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white shadow-sm transition hover:brightness-110 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed dark:bg-secondary dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
	>
		<Fa icon={faPaperPlane} />
		<span class="sr-only">{$_(sendLabel)}</span>
	</button>
</form>
