<script lang="ts">
	import Layout from '$lib/Generic/Layout.svelte';
	import { test } from '$lib/Blockchain_v1_Ethereum/javascript/test';
	import Button from '$lib/Generic/Button.svelte';
	import { onMount } from 'svelte';
	import {
	createPollAdapter,
	proposalCreateAdapter,
	getProposalsAdapter,
	voteAdapter,
	getPollResultsAdapter
	} from '$lib/Blockchain_v2_CrossChain/adapters/pollsAdapter';

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
		addressIsDelegate,
		removeDelegation
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
	// IMPORTANT: groupId here is the on-chain group identifier.
	// For v2 this should be the group's blockchain_id (from Django admin),
	// not the Django database id.
	let groupId = 220516665;  // example blockchain_id, can be changed in the UI
	let pollId = 8;
	let proposalId = 1;
	let delegateAddress = '0x7B95c1314BD7d95737157d9E6EcFCf0b6c22f272';  // for testing

	// List of on-chain group IDs (blockchain_id in v2) where the connected address is a member
	let membershipGroups: string[] = [];
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

	let title = "Test Poll";
	let proposalTitle = "My Proposal";

	async function handleCreatePoll() {
		try {
			console.log("[Poll] Creating poll…", groupId, title);
			const poll = await createPollAdapter(Number(groupId), title);
			console.log("[Poll] Created:", poll);
			alert(`Poll created with ID: ${poll}`);
		} catch (e: unknown) {
			console.error("Error creating poll:", e);
			const err = e as Error;
			alert(err.message || "Error");
		}
	}

	async function handleCreateProposal() {
		try {
			console.log("[Proposal] Creating…", pollId, proposalTitle);
			const result = await proposalCreateAdapter(Number(pollId), proposalTitle);
			console.log("[Proposal] Created:", result);
			alert(`Proposal created: ${result}`);
		} catch (e: unknown) {
			console.error("Error creating proposal:", e);
			const err = e as Error;
			alert(err.message || "Error");
		}
	}


	async function handleGetProposals() {
		try {
			console.log("[Proposals] Fetching…", pollId);
			const proposals = await getProposalsAdapter(Number(pollId));
			console.log("[Proposals] ->", proposals);
			alert("Proposals logged to console");
		} catch (e: unknown) {
			console.error("Error getting proposals:", e);

			const err = e as Error;
			alert(err.message || "Error");
		}
	}


	async function handleVote() {
		try {
			console.log("[Vote] Voting…", pollId, proposalId, groupId);
			const v = await voteAdapter(Number(pollId), Number(proposalId), 1, Number(groupId));
			console.log("[Vote] Done:", v);
			alert("Vote submitted");
		} catch (e: unknown) {
			console.error("Error voting:", e);
		
			const err = e as Error;
			alert(err.message || "Error");
		}
	}


	async function handlePollResults() {
		try {
			const results = await getPollResultsAdapter(Number(pollId));
			console.log("[Poll Results] ->", results);
			alert("Results printed in console");
		} catch (e: unknown) {
			console.error("Error getting results:", e);

			const err = e as Error;
			alert(err.message || "Error");
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

	// Get all on-chain groups where the connected address is a member
	async function handleGetMembershipGroups() {
		try {
			console.log('Getting all groups user is member in...');
			const groups = await getGroupsUserIsMemberIn();
			console.log('Groups from chain:', groups);

			if (groups && Array.isArray(groups)) {
				membershipGroups = groups.map((g: any) => g.toString());
			} else {
				membershipGroups = [];
			}
		} catch (error) {
			console.error('Error getting membership groups:', error);
			const err = error as any;
			alert(`Error: ${err?.message || 'Unknown error'}`);
			membershipGroups = [];
		}
	}

	// Check if a specific address is registered as a delegate in the given on-chain groupId
	async function handleCheckIsDelegate() {
		try {
			console.log('Checking if address is delegate in group:', groupId, delegateAddress);

			// groupId here is already the on-chain identifier (blockchain_id in v2)
			const isDeleg = await addressIsDelegate(Number(groupId), delegateAddress);

			console.log('Is delegate?', isDeleg);
			alert(`Is ${delegateAddress} a delegate in group ${groupId}: ${isDeleg ? 'YES' : 'NO'}`);
		} catch (error) {
			console.error('Error checking delegate:', error);
			const err = error as any;
			alert(`Error: ${err?.message || err?.reason || 'Unknown error'}`);
		}
	}

	// Remove delegation from the connected user to the given delegate address in this on-chain group
	async function handleRemoveDelegation() {
		try {
			console.log('Removing delegation in group:', groupId, 'to', delegateAddress);

			const ok = await removeDelegation(delegateAddress, Number(groupId));
			if (!ok) {
				alert('Failed to remove delegation on chain');
				return;
			}

			alert(`Delegation to ${delegateAddress} in group ${groupId} was removed on chain`);
		} catch (error) {
			console.error('Error removing delegation:', error);
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
		<button on:click={handleGetMembershipGroups}>
    	Get groups user is member in
		</button>
		{#if membershipGroups.length > 0}
			<ul class="mt-2 list-disc list-inside text-sm">
				{#each membershipGroups as g}
					<li>{g}</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2 text-sm text-gray-500">No on-chain group memberships found.</p>
		{/if}
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
		<button on:click={() => vote(pollId, proposalId, 1, groupId)}>vote</button>
	</div>
	<hr />
	-->
	<!-- ===================================================== -->
	<!--                     POLLS (Unified v1/v2/REST)         -->
	<!-- ===================================================== -->

	<b>Polls (Unified)</b>

	<!-- Create poll -->
	<div class="p-6">
		<input type="text" bind:value={groupId} placeholder="Enter Blockchain Group ID" />
		<input type="text" bind:value={title} placeholder="Poll title" />
		<button on:click={handleCreatePoll}>Create Poll</button>
	</div>

	<!-- Get poll proposals -->
	<div class="p-6">
		<input type="text" bind:value={pollId} placeholder="Enter Poll ID" />
		<button on:click={handleGetProposals}>Get Proposals</button>
	</div>

	<!-- Create proposal -->
	<div class="p-6">
		<input type="text" bind:value={pollId} placeholder="Poll ID" />
		<input type="text" bind:value={proposalTitle} placeholder="Proposal title" />
		<button on:click={handleCreateProposal}>Create Proposal</button>
	</div>

	<!-- Vote -->
	<div class="p-6">
		<input type="text" bind:value={pollId} placeholder="Poll ID" />
		<input type="text" bind:value={proposalId} placeholder="Proposal ID" />
		<button on:click={handleVote}>Vote</button>
	</div>

	<!-- Results -->
	<div class="p-6">
		<button on:click={handlePollResults}>Get Results</button>
	</div>

	<hr />


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
	<div class="p-6">
		<button on:click={handleCheckIsDelegate}>Check if address is delegate</button>
	</div>
	<div class="p-6">
		<button on:click={handleRemoveDelegation}>Remove delegation</button>
	</div>
</Layout>

<style>
	/* hr {
		border: 0;
		border-top: 1px solid #8a8a8a;
		margin: 20px 0;
	} */
</style>
