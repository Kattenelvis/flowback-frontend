<script lang="ts">
	import { page } from '$app/stores';
	import { fetchRequest } from '$lib/FetchRequest';
	import type { User } from '$lib/User/interfaces';
	import Layout from '$lib/Generic/Layout.svelte';
	import DefaultPFP from '$lib/assets/abstract-user-flat-4.svg';
	import DefaultBanner from '$lib/assets/default_banner_user.png';
	import { _ } from 'svelte-i18n';
	import Button from '$lib/Generic/Button.svelte';
	import TextArea from '$lib/Generic/TextArea.svelte';
	import { blobifyImages, getUserInfo } from '$lib/Generic/GenericFunctions';
	import TextInput from '$lib/Generic/TextInput.svelte';
	import CropperModal from '$lib/Generic/Cropper/CropperModal.svelte';
	import { env } from '$env/dynamic/public';
	import Fa from 'svelte-fa';
	import {
		faArrowLeft,
		faPen,
		faPaperPlane,
		faGlobe,
		faPhone,
		faEnvelope,
		faCamera
	} from '@fortawesome/free-solid-svg-icons';
	import { afterNavigate, goto } from '$app/navigation';
	import { TelInput, normalizedCountries } from 'svelte-tel-input';
	import type { DetailedValue, CountryCode } from 'svelte-tel-input/types';
	import { ErrorHandlerStore } from '$lib/Generic/ErrorHandlerStore';
	import { chatOpenStore, chatPartnerStore } from '$lib/Chat/functions';
	import { getUserChannelId } from '$lib/Chat/functions';
	import Loader from '$lib/Generic/Loader.svelte';
	import { userStore } from '$lib/User/interfaces';
	import History from '../../lib/Delegation/History.svelte';
	import { isMobile } from '$lib/utils/isMobile';

	let user: User = {
		banner_image: '',
		bio: '',
		email: '',
		profile_image: '',
		username: '',
		website: '',
		contact_email: '',
		contact_phone: '',
		id: 0
	};

	let userEdit: User = {
		banner_image: '',
		bio: '',
		email: '',
		profile_image: '',
		username: '',
		website: '',
		contact_email: '',
		contact_phone: '',
		id: 0
	};

	let isUser = false,
		isEditing = false,
		profileImagePreview = DefaultPFP,
		bannerImagePreview = '',
		currentlyCroppingProfile: boolean = false,
		currentlyCroppingBanner = false,
		oldProfileImagePreview = '',
		oldBannerImagePreview = '',
		croppedImage: string,
		loading = false,
		// Any Country Code Alpha-2 (ISO 3166)
		selectedCountry: CountryCode | null = 'SE',
		// Validity
		valid = true,
		// Optional - Extended details about the parsed phone number
		detailedValue: DetailedValue | null = null;

	const blankSymbol = '___';

	afterNavigate(() => {
		isEditing = false;
		getUser();
	});

	let userRequest = 0;
	const getUser = async () => {
		const request = ++userRequest;
		//The URL has no ID if the user is on their own profile
		const userId = $page.url.searchParams.get('id');
		const viewingSelf = !userId || userId === ($userStore?.id || -1).toString();
		isUser = viewingSelf;

		const { res, json } = await fetchRequest(
			'GET',
			viewingSelf ? 'user' : `users?id=${userId}`
		);
		if (request !== userRequest) return;
		if (!res.ok) {
			ErrorHandlerStore.set({
				message: 'Could not fetch user',
				success: false
			});
			return;
		}
		user = viewingSelf ? json : json?.results[0];
		userEdit = user;
		profileImagePreview = DefaultPFP;
		bannerImagePreview = '';

		if (userEdit.bio === null || userEdit.bio === blankSymbol)
			userEdit.bio = '';
		if (userEdit.website === null || userEdit.website === blankSymbol)
			userEdit.website = '';

		if (user.profile_image)
			profileImagePreview = `${env.PUBLIC_API_URL}${user.profile_image}`;
		if (user.banner_image)
			bannerImagePreview = `${env.PUBLIC_API_URL}${user.banner_image}`;

		if (!user.contact_email || userEdit.contact_email === 'a@a.com')
			userEdit.contact_email = '';
		if (!user.contact_phone || userEdit.contact_phone === '+4646464646')
			userEdit.contact_phone = '';

		document.title = `${user.username}'s profile`;
	};

	const editUser = async () => {
		loading = true;
		const imageToSend = await blobifyImages(profileImagePreview);
		const bannerImageToSend = await blobifyImages(bannerImagePreview);

		const formData = new FormData();
		formData.append('username', userEdit.username);
		formData.append('bio', userEdit.bio === '' ? blankSymbol : userEdit.bio);
		formData.append(
			'website',
			userEdit.website === '' ? blankSymbol : userEdit.website
		);
		formData.append(
			'contact_email',
			userEdit.contact_email === '' ? `a@a.com` : userEdit.contact_email
		);
		formData.append(
			'contact_phone',
			userEdit.contact_phone === '' ? `+4646464646` : userEdit.contact_phone
		);

		if (bannerImagePreview !== '')
			formData.append('banner_image', bannerImageToSend);
		if (profileImagePreview !== DefaultPFP)
			formData.append('profile_image', imageToSend);

		const { res, json } = await fetchRequest(
			'POST',
			`user/update`,
			formData,
			true,
			false
		);

		loading = false;

		if (!res.ok) {
			const message =
				json.detail[Object.keys(json.detail)[0]][0] ||
				'Could not update profile';

			ErrorHandlerStore.set({ message, success: false });
			return;
		}

		// Required to update user properly
		const updatedUser = await getUserInfo();
		userStore.set(updatedUser);
		user = updatedUser;

		isEditing = false;
		ErrorHandlerStore.set({
			message: 'Profile successfully updated',
			success: true
		});
	};

	const handleCropProfileImage = async (e: any) => {
		//Type string, for preview image
		oldProfileImagePreview = profileImagePreview;
		if (e.target.files.length > 0)
			profileImagePreview = URL.createObjectURL(e.target.files[0]);
		currentlyCroppingProfile = true;
	};

	const handleCropBanner = async (e: any) => {
		//Type string, for preview image
		oldBannerImagePreview = bannerImagePreview;
		if (e.target.files.length > 0)
			bannerImagePreview = URL.createObjectURL(e.target.files[0]);
		currentlyCroppingBanner = true;
	};

	let imageToBeCropped: any;

	$: if (currentlyCroppingProfile) imageToBeCropped = profileImagePreview;
	else if (currentlyCroppingBanner) imageToBeCropped = bannerImagePreview;

	// The backend stores placeholders instead of empty values, see editUser
	const shown = (value: string | null, placeholder: string) =>
		!value || value === placeholder ? '' : value;

	$: bio = shown(user.bio, blankSymbol);
	$: website = shown(user.website, blankSymbol);
	$: phone = shown(user.contact_phone, '+4646464646');
	$: contactEmail = shown(user.contact_email, 'a@a.com');

	$: contactRows = [
		{
			id: 'profile-contact-website',
			icon: faGlobe,
			label: 'Website',
			value: website,
			href: /^https?:\/\//.test(website) ? website : `https://${website}`,
			external: true
		},
		{
			id: 'profile-contact-phone',
			icon: faPhone,
			label: 'Phone number',
			value: phone,
			href: `tel:${phone}`,
			external: false
		},
		{
			id: 'profile-contact-email',
			icon: faEnvelope,
			label: 'E-mail',
			value: contactEmail,
			href: `mailto:${contactEmail}`,
			external: false
		}
	];
</script>

{#if currentlyCroppingProfile || currentlyCroppingBanner}
	<!-- Cropp image -->
	<CropperModal
		confirmAction={() => {
			if (currentlyCroppingProfile) profileImagePreview = croppedImage;
			else if (currentlyCroppingBanner) bannerImagePreview = croppedImage;

			currentlyCroppingProfile = false;
			currentlyCroppingBanner = false;
		}}
		cancelAction={() => {
			currentlyCroppingProfile = false;
			currentlyCroppingBanner = false;
			profileImagePreview = oldProfileImagePreview;
		}}
		bind:croppedImage
		bind:currentlyCroppingProfile
		bind:image={imageToBeCropped}
	/>
{/if}

<!-- Viewing someone's profile -->
<Layout centered Class="bg-white dark:bg-darkobject shadow">
	{#if !isEditing}
		<div class="relative w-full">
			<!-- On mobile the TopHeader already has a back arrow -->
			{#if !$isMobile}
				<Button
					onClick={() => {
						if (window.history.length > 1) {
							window.history.back();
						} else {
							goto('/');
						}
					}}
					Class="fixed p-3 m-4 transition-all bg-gray-200 dark:bg-darkobject hover:brightness-95 active:brightness-90"
				>
					<div class="text-gray-800 dark:text-gray-200">
						<Fa icon={faArrowLeft} />
					</div>
				</Button>
			{/if}
			<img
				src={bannerImagePreview || DefaultBanner}
				class="w-full cover object-cover"
				alt="banner"
			/>

			{#if isUser}
				<Button
					onClick={() => (isEditing = true)}
					Class="absolute right-0 top-0 p-3 m-4 transition-all bg-gray-200 dark:bg-darkobject hover:brightness-95 active:brightness-90"
					id="edit-profile-button"
				>
					<div class="text-gray-800 dark:text-gray-200">
						<Fa icon={faPen} />
					</div>
				</Button>
			{/if}
		</div>
		<!-- Mobile: avatar, name and contact info stacked and centered. Desktop: three columns. -->
		<div
			class="flex flex-col items-center px-5 pb-8 md:flex-row md:items-start md:justify-around md:px-0 md:pb-0 w-full max-w-[850px]"
		>
			<img
				src={profileImagePreview}
				class="-mt-12 md:mt-0 md:-translate-y-10 h-24 w-24 md:h-[100px] md:w-[100px] shrink-0 z-10 rounded-full object-cover bg-white border-4 border-white dark:border-darkobject md:border md:border-gray-300"
				alt="avatar"
				id="avatar"
			/>
			<div
				class="z-0 dark:bg-darkobject dark:text-darkmodeText w-full md:w-[60%] pt-3 text-center md:text-left md:py-6 md:px-4"
			>
				<div
					class="text-2xl md:text-xl text-primary dark:text-secondary font-bold md:max-w-[600px] break-words"
				>
					{user.username}
				</div>
				{#if bio}
					<p class="mt-1 whitespace-pre-wrap break-words">{bio}</p>
				{:else}
					<p class="mt-1 text-gray-400 italic">{$_('This user has no bio')}</p>
				{/if}
			</div>
			<section class="dark:text-darkmodeText w-full mt-6 md:mt-0 md:py-6 md:w-[30%]">
				<div
					class="flex items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-600"
				>
					<h2 class="text-primary dark:text-secondary font-bold">
						{$_('Contact Information')}
					</h2>
					{#await getUserChannelId(user.id) then channelId}
						{#if channelId}
							<button
								on:click={() => {
									chatOpenStore.set(true);
									chatPartnerStore.set(channelId);
								}}
								class="text-primary dark:text-secondary p-2 -m-2"
								aria-label={$_('Send message')}
								title={$_('Send message')}
							>
								<Fa icon={faPaperPlane} rotate="60" />
							</button>
						{/if}
					{/await}
				</div>

				<ul class="divide-y divide-gray-100 dark:divide-gray-700">
					{#each contactRows as row}
						<li class="flex items-start gap-3 py-2.5" id={row.id}>
							<Fa icon={row.icon} fw class="mt-1 text-gray-400" />
							<div class="min-w-0">
								<span class="block text-xs text-gray-500 dark:text-gray-400">
									{$_(row.label)}
								</span>
								{#if row.value}
									<a
										href={row.href}
										target={row.external ? '_blank' : null}
										rel={row.external ? 'noopener noreferrer' : null}
										class="block break-words text-primary dark:text-secondary hover:underline"
									>
										{row.value}
									</a>
								{:else}
									<span class="block text-gray-400 italic">{$_('None provided')}</span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</section>
		</div>
		<!-- Editing your own profile -->
	{:else}
		<Loader bind:loading>
			<!-- Banner Image -->
			<label
				for="file-ip-2"
				class="relative block cursor-pointer bg-gray-200 w-full h-[40%] cover"
			>
				<img
					src={currentlyCroppingBanner
						? oldBannerImagePreview
						: bannerImagePreview || DefaultBanner}
					class="w-full cover object-cover transition-all filter hover:grayscale-[70%] hover:bg-gray-200 dark:bg-darkobject dark:hover:brightness-[120%] backdrop-grayscale"
					alt="banner"
				/>
				<!-- Touch screens have no hover, so show that the image can be changed -->
				<span
					class="absolute right-3 bottom-3 rounded-full bg-white dark:bg-darkobject dark:text-darkmodeText text-gray-700 p-2 shadow"
					aria-hidden="true"
				>
					<Fa icon={faCamera} />
				</span>
				<input
					class="hidden"
					type="file"
					id="file-ip-2"
					accept="image/*"
					on:change={handleCropBanner}
				/>
			</label>
			<form
				class="bg-white w-full p-4 md:p-8 flex flex-col items-center justify-center dark:bg-darkobject dark:text-darkmodeText"
				on:submit|preventDefault={editUser}
			>
				<div
					class="flex flex-col md:flex-row items-center justify-center gap-6 pb-6 w-full"
				>
					<label
						for="file-ip-1"
						class="relative z-10 shrink-0 cursor-pointer -mt-14 md:mt-6"
					>
						<!-- Profile Picture -->
						<img
							src={currentlyCroppingProfile
								? oldProfileImagePreview
								: profileImagePreview}
							class="h-28 w-28 md:h-36 md:w-36 block rounded-full object-cover bg-white border-4 border-white dark:border-darkobject md:border md:border-gray-300 transition-all filter hover:grayscale-[70%] hover:bg-gray-200 dark:bg-darkobject dark:hover:brightness-[120%] backdrop-grayscale"
							alt="avatar"
							id="avatar"
						/>
						<span
							class="absolute right-1 bottom-1 rounded-full bg-white dark:bg-darkobject dark:text-darkmodeText text-gray-700 p-2 shadow"
							aria-hidden="true"
						>
							<Fa icon={faCamera} />
						</span>
						<input
							class="hidden"
							type="file"
							name="file-ip-1"
							id="file-ip-1"
							accept="image/*"
							on:change={handleCropProfileImage}
						/></label
					>

					<div class="flex flex-col gap-1 w-full md:w-[40%]">
						<TextInput
							autofocus
							onBlur={() => (currentlyEditing = null)}
							label={'Name'}
							bind:value={userEdit.username}
							Class="p-2 text-left"
						/>

						<TextInput
							autofocus
							onBlur={() => (currentlyEditing = null)}
							label={'Website'}
							bind:value={userEdit.website}
							Class="p-2 text-left"
						/>

						<!-- p-2 lines the field up with the TextInputs around it -->
						<div class="p-2">
							<label
								for="profile-phone-input"
								class="block mb-1 text-md dark:text-darkmodeText"
							>
								{$_('Phone number')}
							</label>
							<div class="wrapper flex gap-2 w-full">
								<select
									class="country-select shrink-0 {!valid ? 'invalid' : ''}"
									aria-label="Default select example"
									name="Country"
									bind:value={selectedCountry}
								>
									<option value={null} hidden={selectedCountry !== null}
										>Please select</option
									>
									{#each normalizedCountries as currentCountry (currentCountry.id)}
										<option
											value={currentCountry.iso2}
											selected={currentCountry.iso2 === selectedCountry}
											aria-selected={currentCountry.iso2 === selectedCountry}
										>
											{currentCountry.iso2} (+{currentCountry.dialCode})
										</option>
									{/each}
								</select>
								<!-- w-0 so the input's intrinsic width can't widen the page on mobile -->
								<TelInput
									id="profile-phone-input"
									bind:country={selectedCountry}
									bind:value={userEdit.contact_phone}
									bind:valid
									bind:detailedValue
									class="basic-tel-input w-0 flex-1 {!valid ? 'invalid' : ''}"
								/>
							</div>
						</div>

						<TextInput
							autofocus
							onBlur={() => (currentlyEditing = null)}
							label={'Mail'}
							type="email"
							bind:value={userEdit.contact_email}
							Class="p-2 text-left"
						/>

						<TextArea
							autofocus
							onBlur={() => (currentlyEditing = null)}
							label={'Bio'}
							bind:value={userEdit.bio}
							Class="p-2 text-left"
							inputClass="whitespace-pre-wrap"
						/>
					</div>
				</div>

				<div class="flex gap-2 w-full px-2 md:px-0 md:w-[50%]">
					<Button
						Class="flex-1"
						buttonStyle="warning-light"
						onClick={() => {
							isEditing = false;
							// profileImagePreview = oldProfileImagePreview;
							getUser();
						}}>{$_('Cancel')}</Button
					>
					<Button Class="flex-1" buttonStyle="primary-light" type="submit">
						{$_('Save changes')}</Button
					>
				</div>
			</form>
		</Loader>
	{/if}

	{#if $page.url.searchParams.get('delegate_id')}
		<History
			history={Number($page.url.searchParams.get('delegate_id'))}
			groupId={Number($page.url.searchParams.get('group_id'))}
			delegateName={user.username}
		/>
	{/if}
</Layout>

<style>
	img.cover {
		aspect-ratio: 5;
		/* width: 100%; */
	}

	.bg-semi-transparent {
		background-color: rgb(209, 213, 219);
	}

	.wrapper :global(.basic-tel-input) {
		height: 32px;
		padding-left: 12px;
		padding-right: 12px;
		border-radius: 6px;
		border: 1px solid;
		outline: none;
	}

	.wrapper :global(.country-select) {
		height: 36px;
		padding-left: 12px;
		padding-right: 12px;
		border-radius: 6px;
		border: 1px solid;
		outline: none;
	}

	.wrapper :global(.invalid) {
		border-color: red;
	}
</style>
