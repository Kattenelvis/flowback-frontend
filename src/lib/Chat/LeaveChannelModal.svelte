<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Modal from '$lib/Generic/Modal.svelte';
	import { leaveChannel } from './store';
	import type { Channel } from './types';

	// The chat to confirm leaving, or null when the modal is closed
	let { channel = $bindable() }: { channel: Channel | null } = $props();

	let open = $state(false);

	$effect(() => {
		open = !!channel;
	});
</script>

<!-- stopAtPropagation off: clicking the dialog's text shouldn't dismiss it -->
<Modal
	bind:open
	stopAtPropagation={false}
	onClose={() => (channel = null)}
	buttons={[
		{
			label: 'Cancel',
			type: 'default',
			onClick: () => (channel = null)
		},
		{
			label: 'Leave',
			type: 'warning',
			onClick: async () => {
				if (channel) await leaveChannel(channel.id);
				channel = null;
			}
		}
	]}
>
	<span slot="header">{$_('Leave Group')}</span>
	<span slot="body">{$_('Are you sure you want to leave this group chat?')}</span>
</Modal>
