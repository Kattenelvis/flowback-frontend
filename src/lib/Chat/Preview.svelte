<script lang="ts">
	import {
		type GroupMembers,
		type invite,
		type PreviewMessage
	} from './interfaces';
	import { fetchRequest } from '$lib/FetchRequest';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';
	import { onMount } from 'svelte';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import {
		chatOpenStore,
		chatPartnerStore,
		fixDirectMessageChannelName,
		getUserChannelId,
		previewStore
	} from './functions';
	import { userStore } from '$lib/User/interfaces';
	import Button from '$lib/Generic/Button.svelte';
	import { _ } from 'svelte-i18n';
	import UserSearch from '$lib/Generic/UserSearch.svelte';
	import Fa from 'svelte-fa';
	import {
		faArrowRightFromBracket,
		faPaperPlane,
		faPenToSquare,
		faUserGroup
	} from '@fortawesome/free-solid-svg-icons';
	import Modal from '$lib/Generic/Modal.svelte';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';

	let chatSearch = $state(''),
		openUserSearch = $state(false),
		leaveGroupModal = $state(false),
		leaveGroupChannelId: number | null = $state(null),
		next: string | undefined | null = $state(undefined);

	let previewContainer: HTMLDivElement;

	const startButtonClass =
		'flex items-center justify-center gap-2 min-w-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors bg-blue-50 text-primary hover:bg-blue-100 active:bg-blue-200 dark:bg-gray-700 dark:text-secondary dark:hover:bg-gray-600';

	const rowClass = (selected: boolean) =>
		`flex items-center mt-1 rounded-xl transition-colors duration-150 cursor-pointer ${
			selected
				? 'bg-gray-100 dark:bg-gray-700 border-l-[3px] border-primary rounded-l-none'
				: 'hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600'
		}`;

	// Lazy Loading
	const getPreviews = async () => {
		if (next === null) return;

		if (next === undefined) {
			const { res, json } = await fetchRequest(
				'GET',
				`chat/message/channel/preview/list?order_by=-timestamp&limit=20`
			);
			if (!res.ok) return;

			let previews = json?.results.map((preview: PreviewMessage) => ({
				...preview,
				recent_message: {
					...preview.recent_message,
					notified:
						preview.recent_message === null ||
						new Date(preview.timestamp) >
							new Date(preview.recent_message?.created_at) ||
						preview.recent_message?.user.id === $userStore?.id
				}
			}));

			fixDirectMessageChannelName(previews, $userStore?.id);
			previewStore.set(previews);
			next = json.next;
		} else {
			const { res, json } = await fetchRequest('GET', next);
			if (!res.ok) return;

			let morePreviews = json?.results.map((preview: PreviewMessage) => ({
				...preview,
				recent_message: {
					...preview.recent_message,
					notified:
						preview.recent_message === null ||
						new Date(preview.timestamp) >
							new Date(preview.recent_message?.created_at) ||
						preview.recent_message?.user.id === $userStore?.id
				}
			}));

			fixDirectMessageChannelName(morePreviews, $userStore?.id);
			previewStore.update((store) => [...(store || []), ...morePreviews]);
			next = json.next;
		}
	};

	const handleScroll = () => {
		if (!previewContainer) return;
		const { scrollTop, clientHeight, scrollHeight } = previewContainer;
		if (scrollTop + clientHeight >= scrollHeight - 1) {
			getPreviews();
		}
	};

	type Props = {
		creatingGroup: boolean;
		groupMembers?: GroupMembers[];
		// Called when the user picks a chat, so the parent can show it
		onSelect?: () => void;
	};

	let {
		creatingGroup = $bindable(),
		groupMembers = $bindable([]),
		onSelect = () => {}
	}: Props = $props();

	// Local reactive state (a prop with a fallback value is not reactive when
	// reassigned, which left invites stale after accepting/denying them).
	let inviteList: invite[] = $state([]);

	let pendingInvites = $derived(
		inviteList.filter(
			(g) => g.rejected === null && g.message_channel_origin === 'user_group'
		)
	);
	let acceptedInvites = $derived(
		inviteList.filter(
			(g) => g.rejected === false && g.message_channel_origin === 'user_group'
		)
	);
	const isShown = (chatter: PreviewMessage) =>
		chatter.channel_title
			?.toUpperCase()
			?.includes(chatSearch.toUpperCase()) &&
		(!creatingGroup || chatter?.channel_origin_name === 'user');

	let hasShownPreviews = $derived(($previewStore ?? []).some(isShown));

	// Handle chat selection and clear notifications
	const clickedChatter = async (chatterId: any) => {
		if (!chatterId) return;

		// Open the chat right away; marking it as read can happen afterwards.
		chatPartnerStore.set(chatterId);

		let preview = $previewStore?.find(
			(_preview) => _preview.channel_id === chatterId
		);

		const { res, json } = await fetchRequest(
			'POST',
			`chat/message/channel/userdata/update`,
			{
				channel_id: chatterId,
				timestamp: new Date()
			}
		);

		if (!res.ok) return;

		// Whenever the user clicks a chatter, remove notification
		if (preview && preview.recent_message) {
			preview.timestamp = new Date().toString();
			preview.recent_message = {
				...preview.recent_message,
				notified: true
			};

			previewStore.update((store) =>
				store ? store?.map((p) => (p.id === preview?.id ? preview : p)) : []
			);
		}
	};

	const selectChatter = (chatterId: number) => {
		clickedChatter(chatterId);
		onSelect();
	};

	const startDirectMessage = async (userId: number) => {
		const channelId = await getUserChannelId(userId);
		if (!channelId) {
			ErrorHandlerStore.set({
				message: 'Could not start the conversation',
				success: false
			});
			return;
		}

		openUserSearch = false;
		chatOpenStore.set(true);
		selectChatter(channelId);
	};

	// Fetch chat invites
	const UserChatInviteList = async () => {
		const { res, json } = await fetchRequest('GET', `user/chat/invite/list`);
		if (!res.ok) return;
		inviteList = json?.results;
	};

	// Accept or reject chat invites
	const UserChatInvite = async (accept: boolean, invite_id: number) => {
		const { res, json } = await fetchRequest('POST', `user/chat/invite`, {
			invite_id,
			accept
		});

		if (!res.ok) return;
		inviteList = inviteList.map((invitee) => {
			if (invitee.id === invite_id) invitee.rejected = !accept;
			return invitee;
		});
	};

	// Leaving user created group chats (scuffed way)
	const leaveGroupScuffed = async (id: number | string) => {
		id = Number(id);

		// TODO: Fix this endpoint to properly leave a group chat
		const { res, json } = await fetchRequest(
			'POST',
			`chat/message/channel/userdata/update`,
			{
				channel_id: id,
				timestamp: '2999-12-31T23:59:59Z',
				closed_at: '2999-12-31T23:59:59Z'
			}
		);

		if (!res.ok) return;

		// Remove the chat from previewStore
		previewStore.update((store) =>
			store ? store?.filter((p) => p.channel_id !== id) : []
		);

		// Clear chatPartnerStore if the user is currently in the left group
		if ($chatPartnerStore === id) {
			chatPartnerStore.set(0);
		}
	};

	onMount(async () => {
		await UserChatInviteList();
		await getPreviews();
		if ($chatPartnerStore) clickedChatter($chatPartnerStore);
	});
</script>

<div class="flex flex-col h-full min-h-0">
	<div
		class="p-3 flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700"
	>
		<div class="grid grid-cols-2 gap-2">
			<button
				type="button"
				class={startButtonClass}
				onclick={() => (openUserSearch = true)}
			>
				<Fa icon={faPenToSquare} />
				<span class="truncate">{$_('New message')}</span>
			</button>
			<button
				type="button"
				class={startButtonClass}
				onclick={() => {
					creatingGroup = true;
					groupMembers = [];
				}}
			>
				<Fa icon={faUserGroup} />
				<span class="truncate">{$_('New group')}</span>
			</button>
		</div>

		<TextInput
			search
			placeholder={'Search chatters'}
			label=""
			max={null}
			bind:value={chatSearch}
			inputClass="py-2 rounded-full border-0 bg-gray-100 placeholder-gray-500 dark:bg-darkbackground"
		/>
	</div>

	<div
		bind:this={previewContainer}
		class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2"
		onscroll={handleScroll}
	>
		{#if pendingInvites.length > 0}
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400 px-3 pt-1 pb-2">
				{$_('Invites')}
			</p>
			{#each pendingInvites as groupChat}
				<div
					class="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl border border-gray-200 dark:border-gray-700"
				>
					<ProfilePicture
						username={groupChat.message_channel_name}
						profilePicture={null}
					/>
					<div class="min-w-0 flex-1">
						<p class="font-medium text-sm truncate">
							{groupChat.message_channel_name}
						</p>
						<p class="text-xs text-gray-400 truncate">
							{$_('Group chat invite')}
						</p>
					</div>
					<button
						type="button"
						class="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-white bg-primary hover:brightness-90"
						onclick={() => UserChatInvite(true, groupChat.id)}
					>
						{$_('Accept')}
					</button>
					<button
						type="button"
						class="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
						onclick={() => UserChatInvite(false, groupChat.id)}
					>
						{$_('Deny')}
					</button>
				</div>
			{/each}
		{/if}

		{#each acceptedInvites as groupChat}
			{@const selected = $chatPartnerStore === groupChat.message_channel_id}
			<button
				type="button"
				class={`${rowClass(selected)} w-full px-3 py-2.5 gap-3`}
				onclick={() => selectChatter(groupChat.message_channel_id)}
			>
				<ProfilePicture
					username={groupChat.message_channel_name}
					profilePicture={null}
				/>
				<span class="min-w-0 flex-1 font-medium text-sm truncate text-left">
					{groupChat.message_channel_name}
				</span>
			</button>
		{/each}

		<!-- Iterate the store itself: the socket updates previews in place, and only
		     store-backed each blocks re-render mutated items. -->
		{#each $previewStore as chatter}
			{#if isShown(chatter)}
				{@const selected = $chatPartnerStore === chatter.channel_id}
				<div class={rowClass(selected)}>
					<button
						type="button"
						class="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 text-left"
						onclick={() => selectChatter(chatter.channel_id)}
					>
						<ProfilePicture
							profilePicture={chatter?.recent_message?.profile_image}
						/>
						<div class="min-w-0 flex-1">
							<div class="font-medium text-sm truncate">
								{chatter.channel_title ??
									chatter.recent_message?.channel_title ??
									'Name not found'}
							</div>
							<div class="text-gray-400 text-xs truncate mt-0.5">
								{chatter?.recent_message?.message || ''}
							</div>
						</div>
						<!-- Purple dot on Chat indicating notification -->
						{#if chatter?.recent_message?.notified === false}
							<div class="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0"></div>
						{/if}
					</button>
					{#if chatter?.channel_origin_name === 'user_group'}
						<button
							type="button"
							class="shrink-0 mr-2 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-600"
							title={$_('Leave Group')}
							aria-label={$_('Leave Group')}
							onclick={() => {
								leaveGroupChannelId = chatter.channel_id;
								leaveGroupModal = true;
							}}
						>
							<Fa icon={faArrowRightFromBracket} />
						</button>
					{/if}
				</div>
			{/if}
		{/each}

		{#if !hasShownPreviews && acceptedInvites.length === 0 && pendingInvites.length === 0}
			<div class="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
				{#if chatSearch}
					{$_('No chats match your search')}
				{:else}
					<p class="font-medium text-gray-700 dark:text-darkmodeText">
						{$_('No conversations yet')}
					</p>
					<p class="mt-1">{$_('Start one with New message or New group.')}</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<UserSearch
	bind:showUsers={openUserSearch}
	showTrigger={false}
	title="New message"
	label="Find a user"
>
	<div slot="action" let:item>
		<Button
			Class="flex items-center gap-2 !rounded-full px-4"
			onClick={() => startDirectMessage(item.id)}
		>
			<Fa icon={faPaperPlane} />
			{$_('Message')}
		</Button>
	</div>
</UserSearch>

<Modal
	bind:open={leaveGroupModal}
	onClose={() => {
		leaveGroupChannelId = null;
	}}
	buttons={[
		{
			label: 'Cancel',
			type: 'default',
			onClick: () => {
				leaveGroupModal = false;
			}
		},
		{
			label: 'Leave',
			type: 'warning',
			onClick: async () => {
				if (leaveGroupChannelId) {
					await leaveGroupScuffed(leaveGroupChannelId);
				}
				leaveGroupModal = false;
			}
		}
	]}
>
	<span slot="header">{$_('Leave Group')}</span>
	<span slot="body"
		>{$_('Are you sure you want to leave this group chat?')}</span
	>
</Modal>
