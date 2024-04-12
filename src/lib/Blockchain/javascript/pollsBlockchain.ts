
import { ethers } from 'ethers';
import contractABI from './contractABI.json';

interface Window {
  ethereum?: import('ethers').providers.ExternalProvider;
}

  async function getUser() {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log('Address:', address);
      //console.log("GetCode:", await provider.getCode("0xf43205cD2E7Ab7416D73cCcFC30cD5d980c9A31a"));

      return signer;
    } else {
      console.log('MetaMask is not available');
      throw new Error('MetaMask is not available');
    }
  }
  
  const getContract = async () => {
    const signer = await getUser();
    const contractAddress = '0x0fDD2AD1aEE84C91DEb80c25993c0bEde05987A3'; //use this address
    return new ethers.Contract(contractAddress, contractABI, signer);
  };
  



//----------------------------TODO update with inputs ---------------------------------------------------

export const createPoll= async () => {

	const contract = await getContract();
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const oneDayInSeconds = 24 * 60 * 60; 
  try {
        const tx = await contract.createPoll(
          "title",
          "tag",
          1, //group
          nowInSeconds, //pollstartdate
          nowInSeconds + oneDayInSeconds, //proposalenddate
          nowInSeconds + 2 * oneDayInSeconds, //votingstartdate
          nowInSeconds + 3 * oneDayInSeconds, //delegateenddate
          nowInSeconds + 4 * oneDayInSeconds, //enddate
        );
	    
        const txReceipt = await tx.wait({ timeout: 40000 }).catch((error:any) => {
        console.error('Error waiting for transaction:', error);
      });

      if (txReceipt && txReceipt.status === 1) {
        console.log('Transaction successful');
        const logs = txReceipt.logs;
        const parsedLogs = logs.map((log: any) => contract.interface.parseLog(log));
        const pollCreatedEvents = parsedLogs.filter(log => log.name === 'PollCreated');
        const PollCreatedEvent = pollCreatedEvents.length > 0 ? pollCreatedEvents[0] : undefined;

        console.log(PollCreatedEvent)
            if (PollCreatedEvent) {
                const pollId = parseInt(PollCreatedEvent.args.pollId);
                const title = PollCreatedEvent.args.title;
                console.log(`Poll created with title ${title} and id ${pollId}`);
            }
        }
  } catch (error) {

    if (error instanceof Error) {
      console.error('Error waiting for transaction:', error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
};

export const getPoll= async () => {

	const contract = await getContract();
  try {
    const tx = await contract.getPoll(1); //id 1
    console.log(`Poll with id ${tx.pollId}:`);
    console.log(`Title: ${tx.title}`);
    console.log(`Tag: ${tx.tag}`);
    console.log(`Startdate: ${tx.pollStartDate}`);
    console.log(`Enddate: ${tx.endDate}`);
    console.log(`Proposalcount: ${tx.proposalCount}`);

    //delegateEndDate, group, proposalEndDate
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error waiting for transaction:', error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
};
export const createProposal= async () => {

	const contract = await getContract();
  try {
        const tx = await contract.addProposal(
          1, //pollid
          "description", //description
        );
	    
        const txReceipt = await tx.wait({ timeout: 40000 }).catch((error:any) => {
        console.error('Error waiting for transaction:', error);
      });

      if (txReceipt && txReceipt.status === 1) {
        console.log('Transaction successful');
        const logs = txReceipt.logs;
        const parsedLogs = logs.map((log: any) => contract.interface.parseLog(log));
        const ProposalCreatedEvent = parsedLogs.find(log => log.name === 'ProposalAdded');
            if (ProposalCreatedEvent) {
                const pollId = parseInt(ProposalCreatedEvent.args.pollId);
                const proposalId = ProposalCreatedEvent.args.proposalId;
                const description = ProposalCreatedEvent.args.description;
                console.log(`Proposal with id ${proposalId} created on poll with id ${pollId}: PROPOSAL: ${description}`);
            }
        }
  } catch (error) {

    if (error instanceof Error) {
      console.error('Error waiting for transaction:', error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
};
export const getProposalsOnPoll= async () => {
  const contract = await getContract();
  try {
    const tx = await contract.getProposals(1); //poll id 1
    console.log(tx);
    console.log("PROPOSALS ON POLLID ", 1); //change when inputs is done
    tx.forEach(element => {
      console.log(`Proposal id ${element.proposalId}: "${element.description}" votes: ${element.voteCount}`)
    });
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error waiting for transaction:', error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}
export const getPollResults= async () => {
  const contract = await getContract();
  try {
    const tx = await contract.getPollResults(1); //poll id 1
    console.log(tx)
    
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error waiting for transaction:', error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }

}
export const vote= async () => {

	const contract = await getContract();
  try {
        const tx = await contract.vote(
          1, //pollid
          1, //proposalid
        );
	    
        const txReceipt = await tx.wait({ timeout: 40000 }).catch((error:any) => {
        console.error('Error waiting for transaction:', error);
      });

      if (txReceipt && txReceipt.status === 1) {
        console.log('Transaction successful');
        const logs = txReceipt.logs;
        const parsedLogs = logs.map((log: any) => contract.interface.parseLog(log));
        const VoteSubmittedCreatedEvent = parsedLogs.find(log => log.name === 'VoteSubmitted');
            if (VoteSubmittedCreatedEvent) {
                const pollId = parseInt(VoteSubmittedCreatedEvent.args.pollId);
                const voter= VoteSubmittedCreatedEvent.args.voter;
                const votesForProposal = VoteSubmittedCreatedEvent.args.votesForProposal;
                console.log(`Vote has been cast on poll with id ${pollId} by voter: ${voter}, votes for proposal is now ${votesForProposal}`);
            }
        }
  } catch (error) {

    if (error instanceof Error) {
      console.error('Error waiting for transaction:', error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
};