<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { fetchRequest } from '$lib/FetchRequest';
	import Button from '$lib/Generic/Button.svelte';
	import { _ } from 'svelte-i18n';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import type { Delegate } from './interfaces';
	import type { GroupUser } from '$lib/Group/interface';
	// V2 on-chain
	import { resignAsDelegate as resignAsDelegateV2 } from '$lib/web3/frontend/delegations';

	export let groupUser: GroupUser,
		loading: boolean,
		groupId: number,
		groupBlockchainId: number | null = null,
		delegates: Delegate[],
		Class = '',
		tags: number[] = [];

	const canUseBlockchain = () => env.PUBLIC_BLOCKCHAIN_INTEGRATION === 'TRUE';

	const deleteDelegation = async () => {
		await deleteDelegationPool();
		await getDelegatePools();
		groupUser.delegate_pool_id = null;
	};

	/*
		Makes the currently logged in user no longer a delegate(pool)
	*/
	const deleteDelegationPool = async () => {
		loading = true;

		// 1) V2 on-chain first (optional)
		if (canUseBlockchain()) {
		  if (groupBlockchainId === null || groupBlockchainId === undefined) {
		    ErrorHandlerStore.set({
		      message: 'Missing group blockchain id. Cannot perform on-chain resign.',
		      success: false
		    });
		    loading = false;
		    return;
		  }
	  
		  try {
		    await resignAsDelegateV2(groupBlockchainId);
		  } catch (e: any) {
		    ErrorHandlerStore.set({
		      message: e?.shortMessage || e?.message || 'On-chain resignAsDelegate failed',
		      success: false
		    });
		    loading = false;
		    return;
		  }
		}

		// 2) Backend sync
		const { res } = await fetchRequest('POST', `group/${groupId}/delegate/pool/delete`);
		loading = false;

		if (!res.ok) {
			ErrorHandlerStore.set({
				message: canUseBlockchain()
					? 'On-chain succeeded but backend failed (possible desync).'
					: 'Failed to stop being delegate',
				success: false
			});
			 return;
		}

		groupUser.delegate_pool_id = null;
		// userIsDelegateStore.update((value) => (value = false));
	};

	const selfDelegate = async () => {
		loading = true;

		// Create delegation relation to oneself
		{
			const { res } = await fetchRequest('POST', `group/${groupId}/delegate/create`, {
				delegate_pool_id: groupUser.delegate_pool_id
			});

			if (!res.ok) loading = false;
		}

		// Get Group Tags
		{
			const { res, json } = await fetchRequest('GET', `group/${groupId}/tags?limit=1000`);

			if (!res.ok) {
				ErrorHandlerStore.set({ message: "Couldn't create self-delegation", success: false });
				loading = false;
				return;
			}

			tags = json?.results.map((tag: any) => tag.id);
		}

		// Update delegation to self with all tags
		{
			const { res } = await fetchRequest('POST', `group/${groupId}/delegate/update`, {
				tags,
				delegate_pool_id: groupUser.delegate_pool_id
			});

			if (!res.ok) {
				ErrorHandlerStore.set({ message: "Couldn't create self-delegation", success: false });
				loading = false;
				return;
			}
		}

		ErrorHandlerStore.set({ message: 'Successfully self-delegated', success: true });
		loading = false;
	};

	/*
		Temporary fix to make each delegate pool be associated with one user.
		TODO: Implement delegate pool feature in the front end (Figma design first)
	*/
	const getDelegatePools = async () => {
		loading = true;
		const { json, res } = await fetchRequest('GET', `group/${groupId}/delegate/pools?limit=1000`);

		if (!res.ok) {
			ErrorHandlerStore.set({ message: "Couldn't get delegation pools", success: false });
			return;
		}

		delegates = json?.results.map((delegatePool: any) => {
			return { ...delegatePool.delegates[0].group_user, pool_id: delegatePool.id };
		});

		loading = false;
	};
</script>

<Button Class={`bg-red-500 ${Class}`} onClick={deleteDelegation}>{$_('Stop being delegate')}</Button
>
<Button onClick={selfDelegate}>{'Self-Delegate'}</Button>
