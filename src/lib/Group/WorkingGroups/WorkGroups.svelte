<script lang="ts">
	import { fetchRequest } from '$lib/FetchRequest';
	import Button from '$lib/Generic/Button.svelte';
	import {
		workGroupsStore,
		type WorkGroupInvite,
		type WorkGroup as WorkingGroupType
	} from './interface';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Poppup from '$lib/Generic/Poppup.svelte';
	import type { poppup } from '$lib/Generic/Poppup';
	import WorkingGroup from './WorkGroup.svelte';
	import Modal from '$lib/Generic/Modal.svelte';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import RadioButtons2 from '$lib/Generic/RadioButtons2.svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faPlus } from '@fortawesome/free-solid-svg-icons';
	import { groupUserStore } from '$lib/Group/interface';
	import Loader from '$lib/Generic/Loader.svelte';

	let workGroups: WorkingGroupType[] = [],
		workGroupEdit: WorkingGroupType = {
			direct_join: false,
			members: null,
			name: '',
			id: 0,
			work_group_id: 0,
			member_count: 0,
			next: '',
			previous: '',
			total_page: 0,
			joined: false,
			chat: 1,
			requested_access: false
		},
		poppup: poppup,
		open = false,
		search: string,
		invites: WorkGroupInvite[] = [],
		loading = true;

	const getWorkingGroupList = async () => {
		const { res, json } = await fetchRequest(
			'GET',
			`group/${$page.params.groupId}/list?limit=100&name__icontains=${search}&order_by=name_asc`
		);

		if (!res.ok) {
			poppup = { message: 'Could not fetch work groups', success: false };
			return;
		}

		workGroups = json.results;
	};

	const createWorkingGroup = async () => {
		workGroupEdit.chat = 1;
		const { res, json } = await fetchRequest(
			'POST',
			`group/${$page.params.groupId}/workgroup/create`,
			workGroupEdit
		);

		if (!res.ok) {
			poppup = { message: 'Failed to create work group', success: false };
			return;
		}

		await getWorkingGroupList();

		workGroupEdit = {
			direct_join: true,
			members: null,
			name: '',
			id: 0,
			work_group_id: 0,
			member_count: 0,
			next: '',
			previous: '',
			total_page: 0,
			joined: false,
			chat: 1,
			requested_access: false
		};

		open = false;
	};

	const getWorkGroupInvite = async () => {
		invites = [];
		workGroups.forEach(async (workGroup) => {
			const { res, json } = await fetchRequest(
				'GET',
				`group/workgroup/${workGroup.id}/joinrequest/list`
			);

			if (!res.ok) return;

			if (json.results[0]) invites.push(json.results[0]);
			invites = invites;
		});
	};

	const addUserToGroup = async (groupUserId: number, workGroupId: number) => {
		const { res, json } = await fetchRequest('POST', `group/workgroup/${workGroupId}/user/add`, {
			is_moderator: false,
			target_group_user_id: groupUserId
		});

		if (!res.ok) {
			poppup = { message: 'Failed to add user to group', success: false };
			return;
		}

		invites = invites.filter((invite) => invite.work_group_id !== workGroupId);
		workGroups.forEach((workGroup) => {
			if (workGroup.id === workGroupId && groupUserId === Number(localStorage.getItem('userId')))
				workGroup.joined = true;
			workGroup.member_count++;
		});
		workGroups = workGroups;
	};

	const handleRemoveGroup = (id: number) => {
		workGroups = workGroups.filter((group) => group.id !== id);
		getWorkGroupInvite();
	};

	onMount(async () => {
		loading = true;
		workGroupsStore.subscribe((_workGroups) => (workGroups = _workGroups));
		await getWorkingGroupList();

		getWorkGroupInvite();
		loading = false;
	});
</script>

<div class="flex items-center gap-3 mb-4">
	<div class="bg-white dark:bg-darkobject p-4 shadow rounded flex-1 flex flex-col gap-2">
		<span class="text-sm"
			>{$_(
				`Being a part of a work group means that you will join that work group's chat, have access to viewing and creating tasks, events, and posts assigned to that work group. Work groups have no individual pages.`
			)}</span
		>
		<TextInput
			label=""
			max={null}
			search={true}
			placeholder={$_('Search work groups')}
			bind:value={search}
			onInput={getWorkingGroupList}
		/>
	</div>

	{#if $groupUserStore?.is_admin}
		<Button onClick={() => (open = true)} Class="w-10 h-10 flex items-center justify-center">
			<Fa icon={faPlus} class="text-lg" />
		</Button>
	{/if}
</div>

<Loader bind:loading>
	{#if $groupUserStore?.is_admin && invites?.length > 0}
		<div class="flex flex-col gap-4 mt-4">
			{#each invites as invite}
				<div
					class="bg-white w-full px-4 py-2 flex gap-2 shadow rounded dark:bg-darkobject min-h-14"
				>
					<div class="flex justify-between w-full">
						<div>
							<b class="font-semibold">{invite.group_user.user.username}</b>
							{$_('wants to join')} <b class="font-semibold">{invite.work_group_name}</b>
						</div>
						<Button
							buttonStyle="primary-light"
							onClick={() => addUserToGroup(invite.group_user.id, invite.work_group_id)}
							>{$_('Add User')}</Button
						>
					</div>
				</div>
			{/each}
		</div>
	{/if}
	<div class="flex flex-col gap-4 mt-4">
		{#each workGroups as workingGroup}
			<WorkingGroup
				{getWorkGroupInvite}
				bind:workGroup={workingGroup}
				{workGroups}
				{handleRemoveGroup}
			/>
		{/each}
	</div>
</Loader>

<Poppup bind:poppup />

<Modal bind:open Class="max-w-[500px]">
	<div slot="header" class="w-full"><span>{$_('Create work group')}</span></div>
	<form slot="body" class="w-full" on:submit|preventDefault={createWorkingGroup}>
		<TextInput label="Name" required bind:value={workGroupEdit.name} />

		<RadioButtons2
			bind:value={workGroupEdit.direct_join}
			values={[true, false]}
			labels={['Yes', 'No']}
			label="Direct Join?"
			name="direct_join"
		/>
		<Button Class="px-2" type="submit">{$_('Create')}</Button>
	</form>
</Modal>
