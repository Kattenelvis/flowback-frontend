<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Button from './Button.svelte';
	import { onMount } from 'svelte';

	let hasClicked = true;

	onMount(() => {
		hasClicked = localStorage.getItem('cookies-consent') === 'true';
	});

	const acceptCookies = () => {
		hasClicked = true;
		localStorage.setItem('cookies-consent', 'true');
	};

	//TODO: Maybe implement this in the future (using google analytics)
	/* Sources for further knowledge:
    https://support.google.com/analytics/answer/9976101
    https://support.google.com/tagmanager/answer/10718549
    https://www.youtube.com/watch?v=4lKkRD-xVMk&ab_channel=LovesData
    https://developers.google.com/tag-platform/tag-manager/templates/consent-apis
    */
	const denyCookies = () => {
		hasClicked = true;
		localStorage.setItem('cookies-consent', 'false');
	};
</script>

<div
	class="bg-white p-4 fixed text-sm bottom-3 dark:bg-darkbackground dark:text-darkmodeText left-1/2 -translate-x-1/2 border-gray-200 shadow-xl z-50 flex flex-col items-center xl:!flex-none"
	class:hidden={hasClicked !== false}
>
	<span class="text-center">{$_('We use cookies to improve the experience of Flowback')} </span>
	<Button onClick={acceptCookies} Class="mt-2 py-1">{$_('Ok')}</Button>
</div>
