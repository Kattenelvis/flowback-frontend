<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import { onMount } from 'svelte';
	import type { Group, Tag } from '$lib/Group/interface';
	import type { Delegate, DelegateRelation } from './interfaces';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import ProfilePicture from '$lib/Generic/ProfilePicture.svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faClockRotateLeft, faLock } from '@fortawesome/free-solid-svg-icons';
	import { userStore } from '$lib/User/interfaces';
	import Loader from '$lib/Generic/Loader.svelte';

	export let group: Group,
		delegates: Delegate[] = [];

	let tags: Tag[] = [],
		expandedSection: any = true,
		delegateRelations: DelegateRelation[] = [],
		loading = false,
		// Saving a choice is shown on the row itself, so the list never dims or blinks
		saving = false,
		pendingCheck: Record<string, number | null> = {};

	onMount(async () => {
		groupDelegationSetup();
	});

	$: if (group) {
		groupDelegationSetup();
	}

	const groupDelegationSetup = async () => {
		loading = true;
		await getGroupTags();
		await getDelegates();
		await getDelegateRelations();
		loading = false;
	};

	const updateDelgation = async (delegate: Delegate, tag: Tag) => {
		// The old relation one might want to be changing who one is delegating to within a tag
		const oldRelation = delegateRelations.find((relation) =>
			relation.tags.find((_tag) => _tag.id === tag.id)
		)?.delegate_pool_id;

		// If we find such an old delegation, remove it and add the new one
		if (oldRelation) await saveDelegation(oldRelation, tag.id, 'remove', false);
		await saveDelegation(delegate.pool_id, tag.id);
	};

	const getGroupTags = async () => {
		// TODO: What happends when limit has been reached?
		// Potential fix here and at other places: Max number of tags per group?
		const { res, json } = await fetchRequest(
			'GET',
			`group/${group.id}/tags?limit=1000`
		);
		if (!res.ok) return;
		tags = json?.results;
	};

	const getDelegates = async () => {
		const { json, res } = await fetchRequest(
			'GET',
			`group/${group.id}/delegate/pools?limit=1000`
		);
		if (!res.ok) return;

		// Temporary fix to make each delegate pool be associated with one user.
		// TODO: Remove pools in the backend
		delegates = json?.results.map((delegatePool: any) => {
			return {
				...delegatePool.delegates[0].group_user,
				pool_id: delegatePool.id
			};
		});
	};

	const getDelegateRelations = async () => {
		const { json, res } = await fetchRequest(
			'GET',
			`group/${group.id}/delegates?limit=1000`
		);

		if (!res.ok) return;

		delegateRelations = json?.results;
	};

	const createDelegateRelation = async (delegate_pool_id: number) => {
		const { json, res } = await fetchRequest(
			'POST',
			`group/${group.id}/delegate/create`,
			{
				delegate_pool_id
			}
		);
	};

	// When a user clicks on a tag they want to delegate to, delegate to that tag
	const saveDelegation = async (
		delegate: number,
		tag: number,
		action: 'add' | 'remove' = 'add',
		successMessage = true
	) => {
		let relation: DelegateRelation | undefined = delegateRelations.find(
			(relation) => relation.delegate_pool_id === delegate
		);

		if (relation === undefined) return;

		const payload = {
			delegate_pool_id: relation.delegate_pool_id,
			tags:
				action === 'add'
					? [...relation.tags.map((_tag) => _tag.id), tag]
					: // If remove, filter it away
						[
							...relation.tags
								.filter((_tag) => _tag.id !== tag)
								.map((_tag) => _tag.id)
						]
		};

		const { res } = await fetchRequest(
			'POST',
			`group/${group.id}/delegate/update`,
			payload
		);

		if (!res.ok) {
			ErrorHandlerStore.set({
				message: 'Failed to save new delegation',
				success: false
			});
			return;
		}

		// Because of scuffness in the code, saveDelegation is called twice, once to remove an earlier delegation and once more to add the new one.
		// As such, two messages appear if we don't do this.
		if (successMessage)
			ErrorHandlerStore.set({
				message: 'Successfully saved delegation',
				success: true
			});
	};

	const notificationSubscribe = async (pool_id: number) => {
		//TODO Unsubscribe when removing delegation
		const { json, res } = await fetchRequest(
			'POST',
			`group/delegate/pool/${pool_id}/notification/subscribe`,
			{
				tags: ['poll_vote_update']
			}
		);
	};

	const clearChoice = async (tag: Tag) => {
		const delegateRelationToRemove = delegateRelations.find((relation) =>
			relation.tags.find((_tag) => _tag.id === tag.id)
		);

		if (delegateRelationToRemove) {
			pendingCheck[tag.name] = null;
			pendingCheck = pendingCheck;
			await saveDelegation(
				delegateRelationToRemove.delegate_pool_id,
				tag.id,
				'remove'
			);
			await getDelegateRelations();
			delete pendingCheck[tag.name];
			pendingCheck = pendingCheck;
		}
	};

	const selectDelegate = async (delegate: Delegate, tag: Tag) => {
		if (saving) return;
		saving = true;
		pendingCheck[tag.name] = delegate.pool_id;
		pendingCheck = pendingCheck;
		await createDelegateRelation(delegate.pool_id);
		await getDelegateRelations();
		await updateDelgation(delegate, tag);
		await notificationSubscribe(delegate.pool_id);
		await getDelegateRelations();
		delete pendingCheck[tag.name];
		pendingCheck = pendingCheck;
		saving = false;
	};
</script>

<Loader bind:loading>
	<div>
		{#if delegates.length > 0 && tags.length > 0}
			{@const tag = tags[0]}
			{@const isDelegate = delegates.some((d) => d.user.id === $userStore?.id)}
			<div class="flex items-center justify-between mb-3">
				<span
					class="text-lg font-semibold text-primary dark:text-secondary"
				>
					{$_('Delegates')}
				</span>
				<span class="text-xs text-gray-400">{delegates.length}</span>
			</div>

			{#if isDelegate}
				<div
					class="flex items-start gap-3 p-3 mb-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-sm text-amber-800 dark:text-amber-300"
				>
					<Fa icon={faLock} class="mt-0.5 shrink-0" />
					<p>
						{$_(
							'You are a delegate, so you can only delegate to yourself. Stop being a delegate to choose someone else.'
						)}
					</p>
				</div>
			{/if}

			<div class="flex flex-col gap-2">
				{#each delegates as delegate (delegate.pool_id)}
					{@const isChecked = tag.name in pendingCheck
						? pendingCheck[tag.name] === delegate.pool_id
						: delegateRelations
								.find((r) => r.delegate_pool_id === delegate.pool_id)
								?.tags.find((_tag) => _tag.id === tag.id) !== undefined}
					{@const isSelf = delegate.user.id === $userStore?.id}
					{@const locked = isDelegate && !isSelf}

					<label
						class="flex items-center justify-between gap-2 p-3 rounded-xl border transition-colors duration-150
							{locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
							{isChecked
							? 'bg-primary/5 border-primary/40 dark:bg-primary/10 dark:border-primary/50'
							: 'border-gray-100 dark:border-gray-700'}
							{!isChecked && !locked ? 'hover:bg-gray-50 dark:hover:bg-darkbackground' : ''}"
					>
						<div class="min-w-0 flex items-center gap-2">
							<div class="min-w-0 truncate">
								<ProfilePicture
									displayName
									username={delegate.user.username}
									userId={delegate.user.id}
									profilePicture={delegate.user.profile_image}
									href={`/user?id=${delegate.user.id}`}
									Class="hover:opacity-80 hover:text-primary dark:hover:text-secondary transition-all duration-150"
								/>
							</div>
							{#if isSelf}
								<span
									class="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary dark:text-secondary"
								>
									{$_('You')}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-3 shrink-0">
							<a
								href={`/user?id=${delegate.user.id}&delegate_id=${delegate.id}&group_id=${group.id}&is_admin=${delegate.is_admin}`}
								class="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary dark:hover:text-secondary transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
								on:click|stopPropagation
							>
								<Fa icon={faClockRotateLeft} />
								<span class="hidden sm:inline">{$_('History')}</span>
							</a>
							{#if locked}
								<Fa icon={faLock} class="w-5 sm:w-4 text-gray-400" />
							{:else}
								<input
									on:input={() => selectDelegate(delegate, tag)}
									type="radio"
									name={tag.name}
									checked={isChecked}
									class="accent-primary w-5 h-5 sm:w-4 sm:h-4"
								/>
							{/if}
						</div>
					</label>
				{/each}
			</div>
			<button
				class="text-xs text-red-400 hover:text-red-600 hover:underline transition-colors mt-3 py-1"
				on:click={() => clearChoice(tag)}
			>
				{$_('Clear Choice')}
			</button>
		{:else}
			<span>{$_('There are currently no delegates for this group')}</span>
		{/if}
	</div>
</Loader>
