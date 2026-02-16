// src/lib/Blockchain_v2_CrossChain/adapters/pollsAdapter.ts

/**
 * Polls & Proposals Adapter (Unified v1/v2/REST)
 * ------------------------------------------------
 * This adapter provides a unified interface for:
 *  - Creating polls
 *  - Adding proposals
 *  - Fetching proposals
 *  - Voting
 *  - Fetching poll results
 *
 * It automatically chooses between:
 *   - Blockchain v1
 *   - Blockchain v2 (Cross-chain)
 *   - REST API fallback
 *
 * The goal is to match the structure of delegationAdapter.ts
 * so the entire blockchain integration stays consistent.
 */

import { PUBLIC_BLOCKCHAIN_VERSION, PUBLIC_BLOCKCHAIN_INTEGRATION } from '$env/static/public';

// Blockchain v1
import {
  createPoll as createPoll_v1,
  proposalCreate as proposalCreate_v1,
  getProposalsOnPoll as getProposals_v1,
  vote as vote_v1,
  getPollResults as getPollResults_v1
} from '$lib/Blockchain_v1_Ethereum/javascript/pollsBlockchain';

// Blockchain v2
import {
  createPoll as createPoll_v2,
  proposalCreate as proposalCreate_v2,
  getProposalsOnPoll as getProposals_v2,
  vote as vote_v2,
  getPollResults as getPollResults_v2
} from '$lib/Blockchain_v2_CrossChain/javascript/pollsBlockchain';

// REST fallback
import { ProposalsApi } from '$lib/api/proposals';


// ----------------------------------------------------
// Version helpers
// ----------------------------------------------------

const isBlockchainEnabled = PUBLIC_BLOCKCHAIN_INTEGRATION === 'TRUE';
const isV2 = PUBLIC_BLOCKCHAIN_VERSION === 'v2';

/**
 * Chooses between v1, v2, or REST.
 */
function chooseVersion() {
  if (!isBlockchainEnabled) return 'rest';
  return isV2 ? 'v2' : 'v1';
}


// ----------------------------------------------------
// Unified API
// ----------------------------------------------------

/**
 * Create Poll
 */
export const createPollAdapter = async (groupId: number, title: string) => {
  const version = chooseVersion();

  if (version === 'v2') {
    return await createPoll_v2(groupId, title);
  }

  if (version === 'v1') {
    return await createPoll_v1(groupId, title);
  }

  console.warn('[pollsAdapter] Poll creation is not supported in REST mode.');
  return null;
};



/**
 * Create Proposal
 */
export const proposalCreateAdapter = async (pollId: number, title: string) => {
  const version = chooseVersion();

  if (version === 'v2') {
    return await proposalCreate_v2(pollId, title);
  }

  if (version === 'v1') {
    return await proposalCreate_v1(pollId, title);
  }

  console.warn('[pollsAdapter] Using REST fallback for proposal creation.');
  return await ProposalsApi.createProposal(String(pollId), {
    start_date: new Date(),
    end_date: new Date()
  });
};



/**
 * Fetch Proposals
 */
export const getProposalsAdapter = async (pollId: number) => {
  const version = chooseVersion();

  if (version === 'v2') {
    return await getProposals_v2(pollId);
  }

  if (version === 'v1') {
    return await getProposals_v1(pollId);
  }

  console.warn('[pollsAdapter] Using REST fallback for reading proposals.');
  const apiResponse = await ProposalsApi.getProposals(String(pollId));
  return apiResponse?.data ?? [];
};



/**
 * Vote
 */
export const voteAdapter = async (
  pollId: number,
  proposalId: number,
  score: number | null,
  groupId?: number
) => {
  const version = chooseVersion();

  if (version === 'v2') {
    if (groupId == null) {
      console.error('[pollsAdapter] Missing groupId (blockchain_id) for v2 vote().');
      return null;
    }

    return await vote_v2(
      pollId,
      proposalId,
      score ?? 1, // default score
      groupId     // must be blockchain_id
    );
  }

  if (version === 'v1') {
    return await vote_v1(pollId, proposalId);
  }

  console.warn('[pollsAdapter] REST fallback voting (off-chain only).');
  return await ProposalsApi.updateVotes(String(pollId), [proposalId]);
};



/**
 * Poll Results
 */
export const getPollResultsAdapter = async (pollId: number) => {
  const version = chooseVersion();

  if (version === 'v2') return await getPollResults_v2(pollId);
  if (version === 'v1') return await getPollResults_v1(pollId);

  console.warn('[pollsAdapter] REST fallback for poll results.');
  return await ProposalsApi.getVotes(String(pollId));
};
