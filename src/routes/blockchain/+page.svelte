<script>
	import Layout from '$lib/Generic/Layout.svelte';
	import { test } from '$lib/Blockchain_v1_Ethereum/javascript/test';
	import Button from '$lib/Generic/Button.svelte';
	import { onMount } from 'svelte';
	import {
		createPoll,
		getPoll,
		proposalCreate,
		getProposalsOnPoll,
		vote,
		getPollResults
	} from '$lib/Blockchain_v1_Ethereum/javascript/pollsBlockchain';
	import {
		createPrediction,
		getPredictionsOnPoll,
		createPredictionBet,
		getPredictionBets
	} from '$lib/Blockchain_v1_Ethereum/javascript/predictionsBlockchain';
	import {
		becomeMemberOfGroup,
		removeGroupMembership,
		isUserMemberInGroup,
		getGroupsUserIsMemberIn
	} from '$lib/Blockchain_v1_Ethereum/javascript/rightToVote';
	import {
		becomeDelegate,
		delegate,
	} from '$lib/Blockchain_v1_Ethereum/javascript/delegationsBlockchain';
	import { connectWallet as connectWalletV2, ensureChain } from "$lib/web3/frontend/wallet";
	import { env } from "$env/dynamic/public";


	onMount(() => {
		refreshNetwork();
	});

	// function handleChange(event) {
	//     value = event.target.valueAsNumber; // Converts input string to number
	// }

	let userAddress = '';
	let chainIdHex = '';
	let chainIdNum = 0;
	let id = 8;
	let groupId = 1;
	let pollId = 8;
	let proposalId = 1;

	let connecting = false;

	async function refreshNetwork() {
		if (typeof window === 'undefined' || !window?.ethereum) return;
		chainIdHex = String(await window.ethereum.request({ method: 'eth_chainId' }));
		chainIdNum = parseInt(chainIdHex, 16);
	}

	async function connectWallet() {
	  if (connecting) return;
	  connecting = true;

	  try {
	    await ensureChain();
	    userAddress = await connectWalletV2();
	    await refreshNetwork();
	  } catch (error) {
	    const msg =
		  error && typeof error === "object" && "message" in error
		    ? String(error.message)
		    : String(error);
		  
	    console.error("Error connecting wallet:", msg, error);
	  } finally {
	    connecting = false;
	  }
	}
</script>

<Layout>
	<div style="padding:10px;border:1px solid #ccc;border-radius:8px;margin:10px 0;">
		<div><b>Network</b></div>
		<div>chainId: {chainIdNum} ({chainIdHex})</div>
		<div>target: {Number(env.PUBLIC_V2_CHAIN_ID)}</div>
	</div>
	<button on:click={connectWallet} disabled={connecting}>
		{#if userAddress}
			Connected: {userAddress}
		{:else}
			Connect Wallet
		{/if}
	</button>

	{#if userAddress}
		<p>Wallet Address: {userAddress}</p>
	{/if}
	<hr />
	<b>rightToVote</b>
	<div class="p-6">
		<input type="text" bind:value={groupId} placeholder="Enter Group ID">
		<button on:click={() => becomeMemberOfGroup(groupId)}>Become member</button>
	</div>
	<div class="p-6">
		<button on:click={() => removeGroupMembership(groupId)}>Resign as member</button>
	</div>
	<div class="p-6">
		<button on:click={isUserMemberInGroup}>Check if user is member of group</button>
	</div>
	<div class="p-6">
		<button on:click={getGroupsUserIsMemberIn}>Get groups user is member in</button>
	</div>
	<hr />
	<b>polls</b>
	<div class="p-6">
		<input type="text" bind:value={groupId} placeholder="Enter Group ID">
		<button on:click={() => createPoll(groupId, "le title")}>Create poll</button>
	</div>
	<div class="p-6">
		<button on:click={() => getPoll(pollId)}>Get poll</button>
	</div>
	<div class="p-6">
		<input type="text" bind:value={pollId} placeholder="Enter Poll Id">
		<button on:click={() => proposalCreate(pollId)}>Create proposal</button>
	</div>
	<div class="p-6">
		<input type="text" bind:value={pollId} placeholder="Enter Poll Id">
		<button on:click={() => getProposalsOnPoll(pollId)}>Get proposals </button>
	</div>
	<div class="p-6">
		<button on:click={() => getPollResults(id)}>Get pollresult</button>
	</div>
	<div class="p-6">
		<input type="text" bind:value={pollId} placeholder="Enter Poll Id">
		<input type="text" bind:value={proposalId} placeholder="Enter Proposal Id">
		<button on:click={() => vote(pollId, proposalId)}>vote</button>
	</div>
	<hr />
	<b>prediction/predictionbets</b>
	<div class="p-6">
		<button on:click={() => createPrediction(id, 1)}>Create prediction</button>
	</div>
	<div class="p-6">
		<button on:click={() => getPredictionsOnPoll(id, 1)}>Get predictions on poll</button>
	</div>
	<div class="p-6">
		<button on:click={() => createPredictionBet(id, 1)}>Create prediction bet</button>
	</div>
	<div class="p-6">
		<button on:click={() => getPredictionBets(id, 1)}>Get prediction bets</button>
	</div>
	<hr />
	<b>delegations</b>
	<div class="p-6">
		<button on:click={() => becomeDelegate(groupId)}>Become delegate</button>
	</div>
	<div class="p-6">
		<button on:click={() => delegate(groupId)}>Delegate</button>
	</div>
</Layout>

<style>
	/* hr {
		border: 0;
		border-top: 1px solid #8a8a8a;
		margin: 20px 0;
	} */
</style>
