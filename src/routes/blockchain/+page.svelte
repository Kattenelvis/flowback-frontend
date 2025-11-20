<script lang="ts">
	import Layout from '$lib/Generic/Layout.svelte';
	import { test } from '$lib/Blockchain_v1_Ethereum/javascript/test';
	import Button from '$lib/Generic/Button.svelte';
	import { onMount } from 'svelte';
 // ---------------------------------------
    // OLD v1 IMPORTS (commented out)
    // ---------------------------------------
    /*
	
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

	*/

	//import {
	//	becomeDelegate,
	//	delegate,
	//} from '$lib/Blockchain_v1_Ethereum/javascript/delegationsBlockchain';

	// ---------------------------------------
    // NEW unified v1/v2 adapters
    // ---------------------------------------
    // Membership adapter (unifies v1 and v2 depending on env)
    import {
        becomeMemberOfGroup,
        removeGroupMembership,
        isUserMemberInGroup,
        getGroupsUserIsMemberIn
    } from '$lib/Blockchain_v2_CrossChain/adapters/rightToVoteUnified';

	// Delegations adapter v2
	import {
		becomeDelegate,
		delegateToDelegate,
	} from '$lib/Blockchain_v2_CrossChain/adapters/delegationAdapter';

	// TODO: Polls + Predictions unified adapters will be added next
    // import { createPoll, ... } from '$lib/Blockchain_v2_CrossChain/adapters/pollsUnified';

	onMount(() => {
		// test(value); // Call test with group
	});

	// function handleChange(event) {
	//     value = event.target.valueAsNumber; // Converts input string to number
	// }

  	// ---------------------------------------
    // Wallet connection
    // ---------------------------------------
	let userAddress = '';
	let id = 8;
	//let groupId = 5;
	// IMPORTANT: Use blockchain_id (from Django admin) not group.id
	// Example: blockchain_id = 220516665 (not group.id = 5)
	let groupId = 220516665;  // Changed from 5 to blockchain_id
	let pollId = 8;
	let proposalId = 1;
	let delegateAddress = '0x7B95c1314BD7d95737157d9E6EcFCf0b6c22f272';  // for testing
	async function connectWallet() {
		if (typeof window.ethereum !== 'undefined') {
			try {
				const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
				userAddress = accounts[0];
			} catch (error) {
				console.error('Error connecting to MetaMask', error);
			}
		} else {
			console.error('MetaMask is not installed!');
		}
	}

	// Helper functions with logging
	async function handleBecomeMember() {
		try {
			console.log('Becoming member of group:', groupId);
			const receipt = await becomeMemberOfGroup(groupId);
			console.log('Successfully became member!', receipt);
			console.log('Transaction hash:', receipt.hash);
			console.log('Block number:', receipt.blockNumber);
			alert(`Successfully became member of group ${groupId}!\nTransaction: ${receipt.hash}`);
		} catch (error) {
			console.error('Error becoming member:', error);
			const err = error as any;
			alert(`Error: ${err?.message || err?.reason || 'Unknown error'}`);
		}
	}

	async function handleResignMember() {
		try {
			console.log('Resigning from group:', groupId);
			const receipt = await removeGroupMembership(groupId);
			console.log('Successfully resigned!', receipt);
			console.log('Transaction hash:', receipt.hash);
			console.log('Block number:', receipt.blockNumber);
			alert(`Successfully resigned from group ${groupId}!\nTransaction: ${receipt.hash}`);
		} catch (error) {
			console.error('Error resigning:', error);
			const err = error as any;
			alert(`Error: ${err?.message || err?.reason || 'Unknown error'}`);
		}
	}

	async function handleCheckMembership() {
		try {
			console.log('Checking membership for group:', groupId);
			const isMember = await isUserMemberInGroup(Number(groupId));
			console.log('Is member?', isMember);
			alert(`Is member of group ${groupId}: ${isMember ? 'YES' : 'NO'}`);
		} catch (error) {
			console.error('Error checking membership:', error);
			const err = error as any;
			alert(`Error: ${err?.message || err?.reason || 'Unknown error'}`);
		}
	}
</script>

<Layout>
	<button on:click={connectWallet}>
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

	<!-- ===================================================== -->
    <!--                  RIGHT TO VOTE (membership)           -->
    <!-- ===================================================== -->

	<b>rightToVote</b>
	<div class="p-6">
		<!--<input type="text" bind:value={groupId} placeholder="Enter Group ID">
        <button on:click={() => becomeMemberOfGroup(groupId)}>Become member</button>-->
		<input type="text" bind:value={groupId} placeholder="Enter Blockchain ID (not group.id)">
		<button on:click={handleBecomeMember}>Become member</button>
	</div>
	<div class="p-6">
        <!--
		<button on:click={() => removeGroupMembership(groupId)}>Resign as member</button>
		-->
		<button on:click={handleResignMember}>Resign as member</button>
	</div>
	<div class="p-6">
		<!--
		<button on:click={isUserMemberInGroup}>Check if user is member of group</button>
        <button on:click={() => isUserMemberInGroup(Number(groupId))}>
		-->
		<button on:click={handleCheckMembership}>
    	Check if user is member of group
		</button>
	</div>
	<div class="p-6">
		<!-- 
		<button on:click={getGroupsUserIsMemberIn}>Get groups user is member in</button> 
        <button on:click={() => console.log("getGroupsUserIsMemberIn not implemented in v2 yet")}> 
		-->
		<button on:click={async () => {
			try {
				console.log('Getting all groups user is member in...');
				const groups = await getGroupsUserIsMemberIn();
				console.log('Groups:', groups);
				if (groups && Array.isArray(groups)) {
					const groupsStr = groups.length > 0 ? groups.map(g => g.toString()).join(', ') : 'None';
					alert(`Groups you are member in: ${groupsStr}`);
				} else {
					alert('Groups you are member in: None');
				}
			} catch (error) {
				console.error('Error:', error);
				const err = error as any;
				alert(`Error: ${err?.message || 'Unknown error'}`);
			}
		}}>
    	Get groups user is member in
		</button>
	</div>
	<hr />

	<!-- ===================================================== -->
    <!--                     POLLS (v1 currently)              -->
    <!--                POLLS SECTION TEMPORARILY OFF          -->
    <!-- ===================================================== -->
  <!--
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
	-->
    <!-- ===================================================== -->
    <!--               PREDICTIONS – temporarily off           -->
    <!-- ===================================================== -->
	<!--
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
	-->
	<!-- ===================================================== -->
    <!--                     DELEGATIONS (v2 OK)                -->
    <!-- ===================================================== -->
	<b>delegations</b>
	<div class="p-6">
		<button on:click={() => becomeDelegate(groupId)}>Become delegate</button>
	</div>
	<!-- v1 - old (commented for reference) -->
	<!-- <div class="p-6">
		<button on:click={() => delegate(groupId)}>Delegate</button>
	</div> -->
	<!-- v2 - new -->
	<div class="p-6">
	<input type="text" bind:value={delegateAddress} placeholder="Enter Delegate Address">
	<button on:click={() => delegateToDelegate(delegateAddress, groupId)}>Delegate</button>
	</div>
</Layout>

<style>
	/* hr {
		border: 0;
		border-top: 1px solid #8a8a8a;
		margin: 20px 0;
	} */
</style>
