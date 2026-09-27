<script lang="ts">
	import type { GroupDetails, SelectablePage } from './interface';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import NotificationOptions from '$lib/Generic/NotificationOptions.svelte';
	import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
	import { faGlobeEurope } from '@fortawesome/free-solid-svg-icons/faGlobeEurope';
	import DefaultBanner from '$lib/assets/default_banner_group.png';
	import { env } from '$env/dynamic/public';
	import Fa from 'svelte-fa';
	import NewDescription from '$lib/Poll/NewDescription.svelte';
	import Button from '$lib/Generic/Button.svelte';
	import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
	import { goto } from '$app/navigation';

	export let selectedPage: SelectablePage,
		group: GroupDetails,
		memberCount: number;

	//https://docs.flowback.org/#notification-categories
	const groupNotificationCategories = [
		'group',
		'group_user',
		'kanban',
		'poll',
		'thread'
	];

	const groupNotificationCategoriesReadable = [
		'Group',
		'Group User',
		'Kanban',
		'Polls',
		'Threads'
	];
</script>

<div
	id="group-header"
	class="bg-white dark:bg-darkobject w-full max-w-[120rem]"
>
	<div class="relative">
		<div class="relative">
			<img
				class="cover w-full"
				src={group.cover_image
					? `${env.PUBLIC_API_URL}${group.cover_image}`
					: DefaultBanner}
				alt="cover"
			/>

			{#if !(env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE')}
				<Button
					onClick={() => goto(`/groups`)}
					Class="fixed left-0 top-0 p-3 m-4 transition-all bg-gray-200 dark:bg-darkobject hover:brightness-95 active:brightness-90"
				>
					<div class="text-gray-800 dark:text-gray-200">
						<Fa icon={faArrowLeft} />
					</div>
				</Button>
			{/if}

			<Button
				hoverEffect={false}
				Class="absolute z-[40] right-0 top-0 p-3 m-4 transition-all bg-gray-200 dark:bg-darkobject"
			>
				<NotificationOptions
					hoverEffect={false}
					type="group"
					api={`group/${$page.params.groupId}/notification/subscribe`}
					id={Number($page.params.groupId)}
					categories={groupNotificationCategories}
					labels={groupNotificationCategoriesReadable}
					Class="text-gray-800 dark:text-gray-200 z-100 relative"
					ClassOpen="-left-[90px]"
				/>
			</Button>
		</div>

		<img
			class="absolute -bottom-12 left-1/2 -translate-x-1/2 lg:left-[12%] lg:translate-x-0 profile rounded-full"
			src={group.image ? `${env.PUBLIC_API_URL}${group.image}` : DefaultBanner}
			alt="profile"
		/>
	</div>

	<div class="dark:bg-darkobject dark:text-darkmodeText w-full px-4 mx-auto pt-16 pb-4 lg:w-[55%] lg:px-0 lg:py-4">
		<div class="">
			<div
				class="flex flex-wrap justify-center items-baseline relative lg:justify-start"
				id="notifications-list-group"
			>
				<button
					class="text-xl break-words min-w-0 hover:text-gray-800 dark:hover:text-gray-400 cursor-pointer"
					id="group-header-title"
					on:click={() => (selectedPage = 'flow')}
				>
					{group.name}
				</button>
				<button
					class="text-sm ml-6 hover:text-gray-800 dark:hover:text-gray-400 cursor-pointer"
					on:click={() => (selectedPage = 'members')}
				>
					{memberCount}
					{$_('members')}
				</button>
				<div class="ml-2">
					{#if typeof window !== 'undefined' && !(env.PUBLIC_ONE_GROUP_FLOWBACK === 'TRUE')}
						{#if group.public}
							<Fa icon={faGlobeEurope} size={'xs'} />
						{:else}
							<Fa icon={faLock} />
						{/if}
					{/if}
				</div>
			</div>
		</div>
		{#if group.description.length > 0}
			<div class="text-xs mt-2 pb-1 grid-area-description break-words">
				<NewDescription
					limit={2}
					lengthLimit={250}
					description={group.description}
				/>
			</div>
		{/if}
	</div>
</div>

<style>
	img.cover {
		aspect-ratio: 5;
		/* width: 100%; */
	}

	img.profile {
		width: 100px;
		height: 100px;
	}
</style>
