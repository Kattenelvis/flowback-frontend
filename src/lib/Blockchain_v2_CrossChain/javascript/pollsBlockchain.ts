//import { ethers } from 'ethers';
import { ethers, BrowserProvider } from 'ethers';
import contractABI from './contractABI.json';

interface Window {
	//ethereum?: import('ethers').providers.ExternalProvider;
	ethereum?: any;
}

async function getUser() {
	if (window.ethereum) {
		await window.ethereum.request({ method: 'eth_requestAccounts' });
		const provider = new BrowserProvider(window.ethereum);
		const signer = await provider.getSigner();

		const address = await signer.getAddress();
		console.log('Address:', address);

		return signer;
	} else {
		console.log('MetaMask is not available');
		throw new Error('MetaMask is not available');
	}
}

const getContract = async () => {
	const signer = await getUser();
	const contractAddress = '0x27013b43c40fB4fB0c23DD0E56f1fB90FA8a0276'; // v2 Base Sepolia address
	return new ethers.Contract(contractAddress, contractABI.abi ?? contractABI, signer);
};

export const createPoll = async (groupId: number, title: string) => {
	try {
		const contract = await getContract();
		const nowInSeconds = Math.floor(Date.now() / 1000);
		const oneDayInSeconds = 24 * 60 * 60;

		const tx = await contract.createPoll(
			title,
			'tag',
			groupId, //group
			nowInSeconds, //pollstartdate
			nowInSeconds + oneDayInSeconds, //proposalenddate
			nowInSeconds + 2 * oneDayInSeconds, //votingstartdate
			nowInSeconds + 3 * oneDayInSeconds, //delegateenddate
			nowInSeconds + 4 * oneDayInSeconds, //enddate
			10, //maximum vote range
			true // _storeOnEthereum
		);

		const receipt = await tx.wait();

		if (receipt && receipt.status === 1n) {
			console.log('Transaction successful');
			const logs = receipt.logs;
			const parsedLogs = logs
				.map((log: any) => contract.interface.parseLog(log))
				.filter((log: any) => log !== null);
			const pollCreatedEvents = parsedLogs.filter((log: any) => log.name === 'PollCreated');

			if (pollCreatedEvents.length > 0) {
				const PollCreatedEvent = pollCreatedEvents[0];
				const pollId = parseInt(PollCreatedEvent.args.pollId.toString());
				const pollTitle = PollCreatedEvent.args.title;
				console.log(`Poll created with title ${pollTitle} and id ${pollId}`);
				return pollId;
			}
		}

		return null;
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error creating poll:', error.message);
		} else {
			console.error('An unexpected error occurred:', error);
		}
		return null;
	}
};

export const getPoll = async (id: number) => {
	try {
		const contract = await getContract();
		const poll = await contract.getPoll(id);
		console.log(`Poll with id ${poll.pollId}:`);
		console.log(`Title: ${poll.title}`);
		console.log(`Tag: ${poll.tag}`);
		console.log(`Startdate: ${poll.pollStartDate}`);
		console.log(`Voting date: ${poll.votingStartDate}`);
		console.log(`Enddate: ${poll.endDate}`);
		console.log(`Proposalcount: ${poll.proposalCount}`);

		return poll;
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error getting poll:', error.message);
		} else {
			console.error('An unexpected error occurred:', error);
		}
		return null;
	}
};

export const proposalCreate = async (pollId: number, title: string) => {
	try {
		const contract = await getContract();
		const tx = await contract.addProposal(pollId, title);

		const receipt = await tx.wait();

		if (receipt && receipt.status === 1n) {
			console.log('Transaction successful');
			const logs = receipt.logs;
			const parsedLogs = logs
				.map((log: any) => contract.interface.parseLog(log))
				.filter((log: any) => log !== null);
			const ProposalCreatedEvent = parsedLogs.find((log: any) => log.name === 'ProposalAdded');

			if (ProposalCreatedEvent) {
				const pollIdResult = parseInt(ProposalCreatedEvent.args.pollId.toString());
				const proposalId = parseInt(ProposalCreatedEvent.args.proposalId.toString());
				const description = ProposalCreatedEvent.args.description;
				console.log(
					`Proposal with id ${proposalId} created on poll with id ${pollIdResult}: PROPOSAL: ${description}`
				);
				return proposalId;
			}
		}

		return null;
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error creating proposal:', error.message);
		} else {
			console.error('An unexpected error occurred:', error);
		}
		return null;
	}
};

export const getProposalsOnPoll = async (id: number) => {
	try {
		const contract = await getContract();
		const proposals = await contract.getProposals(id);
		console.log(proposals);
		console.log('PROPOSALS ON POLLID ', id);

		proposals.forEach((element: any) => {
			console.log(
				`Proposal id ${element.proposalId}: "${element.description}" votes: ${element.voteCount}`
			);
		});

		return proposals;
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error getting proposals:', error.message);
		} else {
			console.error('An unexpected error occurred:', error);
		}
		return null;
	}
};

export const getPollResults = async (id: number) => {
	try {
		const contract = await getContract();
		const results = await contract.getPollResults(id);
		console.log(results);
		return results;
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error getting poll results:', error.message);
		} else {
			console.error('An unexpected error occurred:', error);
		}
		return null;
	}
};

export const vote = async (_pollId: number, _proposalId: number, _score: number, _group: number) => {
	try {
		const contract = await getContract();
		const tx = await contract.vote(_pollId, _proposalId, _score, _group);

		const receipt = await tx.wait();

		if (receipt && receipt.status === 1n) {
			console.log('Transaction successful');
			const logs = receipt.logs;
			const parsedLogs = logs
				.map((log: any) => contract.interface.parseLog(log))
				.filter((log: any) => log !== null);
			const VoteSubmittedEvent = parsedLogs.find((log: any) => log.name === 'VoteSubmitted');

			if (VoteSubmittedEvent) {
				console.log(VoteSubmittedEvent.args);
				const pollId = parseInt(VoteSubmittedEvent.args.pollId.toString());
				const voter = VoteSubmittedEvent.args.voter;
				const votesForProposal = parseInt(VoteSubmittedEvent.args.votesForProposal.toString());
				console.log(
					`Vote has been cast on a proposal on poll with id ${pollId} by voter: ${voter}, votes for that proposal is now ${votesForProposal}`
				);
				return true;
			}
		}

		return null;
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error voting:', error.message);
		} else {
			console.error('An unexpected error occurred:', error);
		}
		return null;
	}
};