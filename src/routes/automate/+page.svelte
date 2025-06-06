<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { fetchRequest } from '$lib/FetchRequest';
	import Button from '$lib/Generic/Button.svelte';
	import Layout from '$lib/Generic/Layout.svelte';
	import type { poppup } from '$lib/Generic/Poppup';
	import Poppup from '$lib/Generic/Poppup.svelte';
	import Select from '$lib/Generic/Select.svelte';
	import Toggle from '$lib/Generic/Toggle.svelte';
	import type { Delegate } from '$lib/Group/Delegation/interfaces';
	import Delegations from '$lib/Group/Delegation/NewerDelegations.svelte';
	import StopBeingDelegate from '$lib/Group/Delegation/StopBeingDelegate.svelte';
	import type { Group } from '$lib/Group/interface';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	let group: Group,
		groups: Group[],
		userIsDelegate = false,
		autovote = false,
		loading = false,
		delegates: Delegate[] = [],
		selectedPage: 'become-delegate' | 'delegate' | 'none' = 'none',
		poppup: poppup;

	const getGroups = async () => {
		const { res, json } = await fetchRequest('GET', `group/list?limit=1000&joined=true`);

		if (!res.ok) {
			poppup = { message: 'Could not get groups', success: false };
			return;
		}
		groups = json.results;
		group = json.results[0];
	};

	const getUserInfo = async () => {
		const { res, json } = await fetchRequest(
			'GET',
			`group/${group.id}/users?user_id=${localStorage.getItem('userId')}&is_delegate=true`
		);

		if (!res.ok) {
			poppup = { message: 'Could not get user info', success: false };
			return;
		}

		if (json?.results?.length === 1) userIsDelegate = true;
		else userIsDelegate = false;
	};

	/*
	 	Makes the currently logged in user into a delegate(pool)
	 */
	const createDelegationPool = async () => {
		// let toSend: any = {};

		// if (env.PUBLIC_BLOCKCHAIN_INTEGRATION === 'TRUE')
		// 	try {
		// 		const blockchain_id = becomeDelegate($page.params.groupId);
		// 		if (isNumber(blockchain_id)) toSend.blockchain_id = blockchain_id;
		// 	} catch {
		// 		toSend.blockchain_id = 4;
		// 		console.warn('Error');
		// 	}

		const { res } = await fetchRequest('POST', `group/${group.id}/delegate/pool/create`, {});

		if (!res.ok) {
			poppup = { message: 'Could not create delegation pool', success: false };
			return;
		}
		userIsDelegate = true;
	};

	const removeAllDelegations = async (group: Group) => {
		const promises = delegates.map((delegate) =>
			fetchRequest('POST', `group/${group.id}/delegate/delete`, {
				delegate_pool_id: delegate.pool_id
			})
		);

		const results = await Promise.all(promises);

		poppup = { message: 'Removed delegations', success: true };
	};

	const getDelegatePools = async () => {
		const { json, res } = await fetchRequest('GET', `group/${group.id}/delegate/pools?limit=1000`);

		autovote = res.ok && json.results.length > 0;
	};

	onMount(async () => {
		await getGroups();
		await getUserInfo();
	});

	$: if (group) {
		getUserInfo();

		if (env.PUBLIC_ONE_GROUP_FLOWBACK === 'FALSE') {
			getDelegatePools();
			selectedPage = 'delegate';
		} else {
			const parsed = localStorage.getItem('autovote');
			autovote = parsed == 'delegate' ? true : false;
			
			selectedPage = autovote ? 'delegate' : 'none';
		}
	}
</script>

<Layout centered>
	<div class="bg-white dark:bg-darkobject dark:text-darkmodeText p-6 shadow w-full text-left">
		<h1 class="text-xl font-semibold text-primary dark:text-secondary text-left">
			{$_(env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE' ? 'Automate' : 'Manage Delegations')}
		</h1>
		<p>
			{$_(
				env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE'
					? `Sometimes we have limited time and cannot participate fully, but still want to contribute. Reforum has a number of functions to automate parts of your engagement when you cannot participate yourself.`
					: `Delegation means to copy the votings of a member that votes publicly (note that the member is not required to have voting rights themselves necessarily, and that such a voter is called a "delegated") automatically unless one overrides it oneself (this automatic copying is called "delegation"). One can at any time switch delegate or choose to have no delegate. Metadelegation means that a delegate can delegate their vote to another delegate. Metadelegation is not allowed in this group.`
			)}
		</p>
	</div>
	<div class="flex w-[80%] max-w-[1200px] my-6 gap-6">
		<div class="bg-white dark:bg-darkobject dark:text-darkmodeText p-6 shadow w-[50%]">
			{#if env.PUBLIC_ONE_GROUP_FLOWBACK !== 'TRUE'}
				<Select
					classInner="w-full bg-white dark:bg-darkobject dark:text-darkmodeText p-2 border-gray-300 rounded border"
					labels={groups?.map((group) => group.name)}
					bind:value={group}
					values={groups}
					innerLabelOn={true}
				/>
			{/if}

			<div class="flex flex-col gap-4 my-4">
				{#if env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE' && !userIsDelegate}
					<!-- <li><input type="checkbox" /> {$_('Auto-choose meeting times')}</li> -->
					<div class="mt-3">
						<div class="flex justify-between">
							{$_('Turn on auto-vote')}
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex flex-row gap-4 items-center">
							<Toggle
								onInput={(checked) => {
									selectedPage = checked ? 'delegate' : 'none';
									localStorage.setItem('autovote', selectedPage);
									if (!checked) removeAllDelegations(group);
								}}
								checked={autovote}
							/>
							{$_('Auto-vote')}
						</div>
						<p class="mt-2">
							{$_(
								'Auto-voting means that you automatically vote the same as someone you trust. You can auto-vote according to how public voters have voted in specific topics. You can always change your vote afterwards if you have time and want to.'
							)}
						</p>
					</div>
				{/if}
				<Button
					Class="w-full mt-3"
					onClick={() => (selectedPage = 'become-delegate')}
					buttonStyle="primary-light">{$_('Become delegate')}</Button
				>
				<!-- <li><input type="checkbox" /> {$_('Smart secretary')}</li> -->
			</div>
		</div>
		<div class="bg-white dark:bg-darkobject dark:text-darkmodeText p-6 shadow w-[50%]">
			{#if selectedPage === 'become-delegate'}
				{$_(
					'As a delegate, you choose to publicly show everyone how you vote. However, other users can delegate their vote to you, which means that you will vote for them. '
				)}
				<Button onClick={() => (selectedPage = 'delegate')}>{$_('Cancel')}</Button>

				{#if userIsDelegate}
					<StopBeingDelegate
						Class="w-full mt-3"
						bind:delegates
						bind:userIsDelegate
						groupId={group.id}
						bind:loading
					/>
				{:else}
					<Button Class="w-full mt-3" onClick={createDelegationPool} buttonStyle="primary-light"
						>{$_('Become delegate')}</Button
					>
				{/if}
			{:else if selectedPage === 'delegate'}
				{#if group?.id}
					<Delegations bind:group bind:delegates />
				{/if}
			{/if}
		</div>
	</div>
</Layout>

<Poppup bind:poppup />
