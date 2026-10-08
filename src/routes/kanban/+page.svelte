<script>
	import Button from '$lib/Generic/Button.svelte';
	import Layout from '$lib/Generic/Layout.svelte';
	import KanbanBoard from '$lib/Group/Kanban/KanbanBoard.svelte';
	import { _ } from 'svelte-i18n';
	import Fa from 'svelte-fa';
	import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
	import { isMobile } from '$lib/utils/isMobile';
</script>

<svelte:head>
	<title>Kanban</title>
</svelte:head>

<!-- This is for the personal kanban page. <Kanban /> is also used in groups, so this file is not reduntant -->
<Layout centered>
	<div class="relative w-full">
	<div class="flex justify-center">
		{#if !$isMobile}
			<Button
				onClick={() => history.back()}
				Class=" max-h-[3rem] p-3 m-4 transition-all bg-gray-200 dark:bg-darkobject hover:brightness-95 active:brightness-90"
				id="back-button"
			>
				<div class="text-gray-800 dark:text-gray-200">
					<Fa icon={faArrowLeft} />
				</div>
			</Button>
		{/if}
		
			<KanbanBoard Class=" min-w-0 md:mr-[70px]" />
		</div>
	</div>
</Layout>
