<script lang="ts">
	import { goto } from '$app/navigation';
	import Layout from '$lib/Generic/Layout.svelte';
	import EditGroup from '$lib/Group/Creation/CreateEditGroup.svelte';
	import Permissions from '$lib/Group/Permissions/Permissions.svelte';
	import Tags from '$lib/Group/Tags.svelte';
	import GroupKPIs from '$lib/Poll/KPI/GroupKPIs.svelte';
	import Reports from '$lib/Group/Reports.svelte';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import {
		faArrowLeft,
		faCog,
		faTags,
		faShieldAlt,
		faChartLine,
		faWarning
	} from '@fortawesome/free-solid-svg-icons';
	import { groupUserStore } from '$lib/Group/interface';
	import { env } from '$env/dynamic/public';

	type AdminPage = 'group' | 'areas' | 'perms' | 'blockchain' | 'kpis' | 'reports';
	const adminPages: AdminPage[] = ['group', 'areas', 'perms', 'blockchain', 'kpis', 'reports'];

	// The selected page is kept in the url (?page=reports) so admin pages can be linked to directly
	const pageFromUrl = page.url.searchParams.get('page') as AdminPage | null;

	let selectedPage: AdminPage =
			pageFromUrl && adminPages.includes(pageFromUrl) ? pageFromUrl : 'group',
		optionsDesign =
			'flex items-center gap-3 w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 transition-all';

	const selectPage = (newPage: AdminPage) => {
		selectedPage = newPage;
		goto(`?page=${newPage}`, { noScroll: true, replaceState: true, keepFocus: true });
	};

	// Fixes bug where users who are not admin may navigate and see the admin page.
	// Waits for the layout to load this group's user, so direct links to the admin page work
	$: groupUserLoaded = $groupUserStore?.group_id === Number(page.params.groupId);
	$: isAdmin = groupUserLoaded && !!$groupUserStore?.is_admin;
	$: if (groupUserLoaded && !isAdmin) goto(`/groups/${page.params.groupId}`);
</script>

<Layout centered>
	{#if isAdmin}
		<div class="flex mt-6 gap-6 max-w-[90%]">
			<div
				class="bg-white dark:bg-darkobject dark:text-darkmodeText w-[350px] p-6 rounded border shadow"
			>
				<div class="flex items-center mb-4 gap-4">
					<button
						class="text-gray-600 hover:text-primary dark:text-secondary transition-colors"
						on:click={() => goto(`/groups/${page.params.groupId}`)}
					>
						<Fa icon={faArrowLeft} />
					</button>
					<h1
						class="text-xl font-semibold text-primary dark:text-secondary text-left break-word"
					>
						{$_('Admin Settings')}
					</h1>
				</div>
				<div class="mt-4">
					<button
						on:click={() => selectPage('group')}
						class={`${optionsDesign}`}
						class:bg-gray-100={selectedPage === 'group'}
						class:dark:bg-gray-700={selectedPage === 'group'}
						class:border-l-2={selectedPage === 'group'}
						class:border-primary={selectedPage === 'group'}
					>
						<Fa icon={faCog} class="w-5 h-5" />{$_('Edit Group')}
					</button>
	
					{#if env.PUBLIC_POLL_VERSION === '1'}
						<button
							on:click={() => selectPage('areas')}
							class={`${optionsDesign}`}
							class:bg-gray-100={selectedPage === 'areas'}
							class:dark:bg-gray-700={selectedPage === 'areas'}
							class:border-l-2={selectedPage === 'areas'}
							class:border-primary={selectedPage === 'areas'}
						>
							<Fa icon={faTags} class="w-5 h-5" />{$_('Areas')}
						</button>
					{/if}
					<button
						on:click={() => selectPage('perms')}
						class={`${optionsDesign}`}
						class:bg-gray-100={selectedPage === 'perms'}
						class:dark:bg-gray-700={selectedPage === 'perms'}
						class:border-l-2={selectedPage === 'perms'}
						class:border-primary={selectedPage === 'perms'}
					>
						<Fa icon={faShieldAlt} class="w-5 h-5" />{$_('Permissions')}
					</button>
					<button
						on:click={() => selectPage('kpis')}
						class={`${optionsDesign}`}
						class:bg-gray-100={selectedPage === 'kpis'}
						class:dark:bg-gray-700={selectedPage === 'kpis'}
						class:border-l-2={selectedPage === 'kpis'}
						class:border-primary={selectedPage === 'kpis'}
					>
						<Fa icon={faChartLine} class="w-5 h-5" />{$_('KPIs')}
					</button>
					<button
						on:click={() => selectPage('reports')}
						class={`${optionsDesign}`}
						class:bg-gray-100={selectedPage === 'reports'}
						class:dark:bg-gray-700={selectedPage === 'reports'}
						class:border-l-2={selectedPage === 'reports'}
						class:border-primary={selectedPage === 'reports'}
					>
						<Fa icon={faWarning} class="w-5 h-5" />{$_('Reports')}
					</button>
					<!-- <ul>
					<li
						class={`cursor-pointer ${
							selectedPage === 'blockchain' && 'bg-gray-100 border-l-2 border-primary transition-all'
						}`}
					>
						<button class="w-full text-left" on:click={() => selectPage('blockchain')}
							>{$_('Blockhain')}</button
						>
					</li>
				</ul> -->
				</div>
			</div>
			<div
				class="bg-white dark:text-darkmodeText dark:bg-darkobject p-6 shadow rounded w-[600px] border"
			>
				{#if selectedPage === 'group'}
					<EditGroup />
				{:else if selectedPage === 'areas'}
					<Tags />
				{:else if selectedPage === 'perms'}
					<Permissions />
				{:else if selectedPage === 'kpis'}
					<GroupKPIs />
				{:else if selectedPage === 'reports'}
					<Reports />
				{:else if selectedPage === 'blockchain'}
					<!-- block -->
				{/if}
			</div>
		</div>
	{/if}
</Layout>
