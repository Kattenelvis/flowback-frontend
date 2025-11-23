# BLOCKCHAIN_V2_FULL_DOCUMENTATION.md

# Blockchain v2 – Full Developer Documentation

This document provides a detailed and structured explanation of the Flowback Blockchain v2 architecture. It is intended for developers who will maintain, extend, or integrate the blockchain features of the Flowback platform. This documentation describes the architecture, contracts, adapters, flows, testing procedures, common issues, and maintenance guidelines.

---

## 1. Introduction

Blockchain v2 integrates Base Sepolia as the execution layer and Ethereum Sepolia as the permanent storage layer.  
Base Sepolia handles all group membership, delegation, proposal creation, and voting.  
Ethereum Sepolia stores finalized poll results for long term integrity.  

The integration depends on configuration in the `.env` file:

```
PUBLIC_BLOCKCHAIN_INTEGRATION=TRUE
PUBLIC_BLOCKCHAIN_VERSION=v2
```

---


## 2. System Architecture

### 2.1 Layer 2 – Base Sepolia
Responsible for:
- Group membership
- Delegations
- Voting
- Meta-transactions
- Cross‑chain export of results

### 2.2 Layer 1 – Ethereum Sepolia
Responsible for:
- Storing finalized poll results
- Providing long‑term verifiable data

---

## 3. Smart Contracts

All contracts are located on Base Sepolia unless specified otherwise.

### 3.1 Polls.sol  
Core contract for:
- Membership
- Delegations
- Poll creation
- Voting

### 3.2 RightToVote.sol  
Manages membership and access control for group participation.

### 3.3 Delegations.sol  
Handles delegation relationships between members.

### 3.4 PollHelpers.sol  
Assists Polls.sol with reusable logic.

### 3.5 ProposalHelpers.sol  
Auxiliary utilities for proposal‑related logic.

### 3.6 SharedErrors.sol  
Central errors used across all contracts.

### 3.7 MetaTxHandler.sol  
Enables gasless interaction through signature verification.

### 3.8 MetaVoting.sol  
Adds support for off‑chain signed voting (if used).

### 3.9 PollsBridge.sol  
Exports poll data from Base Sepolia to Ethereum Sepolia through the bridge.

### 3.10 PollsOnEthereum.sol (Ethereum Sepolia)  
Stores finalized poll and voting data on Layer 1.

### 3.11 Prediction Contracts (if used)
- Predictions.sol  
- PredictionBets.sol  
- PredictionHelpers.sol  
- PredictionBetHelpers.sol

These are not required for core membership and voting.

---

## 4. Contract Ownership

All contracts were deployed by Zoher using a MetaMask account.  
The owner address is the account used during deployment.

Owner permissions are used only for:
- Configuring the bridge
- Setting MetaTxHandler
- Setting PollsOnEthereum

Daily operations do not require owner privileges.

---

## 5. Deployment Summary

Deployment details are recorded in the deployment documentation.  
Relevant contract addresses include:

```
Polls.sol                      0x27013b43c40fB4fB0c23DD0E56f1fB90FA8a0276
MetaTxHandler.sol              0x52938bb530D57B7bf754D33eB1dE417Ebba96DFd
PollsBridge.sol                0x63FE5f2006C9ba7D07D185b3b24a35daFa527ab5
PollsOnEthereum.sol (L1)       0x52938bb530D57B7bf754D33eB1dE417Ebba96DFd
```

These contracts are verified on Sourcify.

---

## 6. Environment Variables

Required `.env` variables:

```
PUBLIC_BLOCKCHAIN_INTEGRATION=TRUE
PUBLIC_BLOCKCHAIN_VERSION=v2
PUBLIC_V2_CHAIN_ID=84532
PUBLIC_V2_RPC_URL=https://sepolia.base.org
PUBLIC_V2_POLLS_ADDRESS=0x27013b43c40fB4fB0c23DD0E56f1fB90FA8a0276
PUBLIC_V2_META_TX_HANDLER_ADDRESS=0x52938bb530D57B7bf754D33eB1dE417Ebba96DFd
PUBLIC_V2_POLLS_BRIDGE_ADDRESS=0x63FE5f2006C9ba7D07D185b3b24a35daFa527ab5
```

---

## 7. Frontend Architecture

Blockchain v2 relies on the unified adapter architecture.

### 7.1 Adapters (CrossChain)

Located in:

```
src/lib/Blockchain_v2_CrossChain/adapters/
```

### Key adapter files:

#### rightToVoteUnified.ts  
Single entry point for membership logic.

#### rightToVoteAdapter.ts  
Blockchain specific membership support.

#### delegationAdapter.ts  
Delegation actions.

### 7.2 JavaScript interaction layer

Located in:

```
src/lib/Blockchain_v2_CrossChain/javascript/
```

Files include:
- client.ts  
- pollsBlockchain.ts  
- delegationsBlockchain.ts  
- contractABI.json  

These modules:
- Initialize the contract
- Prepare transactions
- Handle read and write operations

---

## 8. Flow Descriptions

This section describes how each blockchain operation works.

### 8.1 Membership Flow
1. User selects a group.
2. Backend returns `blockchain_id`.
3. Frontend uses rightToVoteUnified to call membership function.
4. User signs in MetaMask.
5. Transaction is sent to Polls.sol.
6. Membership is updated.

### 8.2 Delegation Flow
1. User enters `blockchain_id` and delegate target.
2. Adapter calls delegation contract functions.
3. MetaMask confirms the action.
4. Delegation is recorded in Polls.sol.

### 8.3 Voting Flow
1. Poll is created in the backend.
2. Frontend sends vote transaction.
3. Poll data is stored on Base Sepolia.
4. If finalized, PollsBridge exports results to Ethereum.

### 8.4 Cross‑Chain Flow
1. Poll is finalized on Base.
2. PollsBridge collects data and submits to L1.
3. PollsOnEthereum stores permanent results.

---

## 9. Testing Blockchain Behaviour

Testing can be done through:

```
/blockchain
```

This page supports:
- Membership actions
- Delegation actions
- Vote simulation steps
- Membership lookups
- Group lookups

Each requires `blockchain_id`.

---

## 10. Common Issues and Solutions

### Issue: Wrong network  
Solution: MetaMask must be set to Base Sepolia.

### Issue: Reverted transaction  
Possible causes:
- User already a member
- User is not a member
- Wrong data types
- Insufficient gas

### Issue: Invalid BigNumberish  
Solution: Use `group.blockchain_id` instead of `group.id`.

### Issue: No transactions appear  
Solution: Ensure blockchain integration is enabled in `.env`.

---

## 11. File Structure Summary

### Important Frontend Files

```
src/lib/Blockchain_v2_CrossChain/adapters/rightToVoteUnified.ts
src/lib/Blockchain_v2_CrossChain/adapters/rightToVoteAdapter.ts
src/lib/Blockchain_v2_CrossChain/adapters/delegationAdapter.ts
src/lib/Blockchain_v2_CrossChain/javascript/pollsBlockchain.ts
src/lib/Blockchain_v2_CrossChain/javascript/delegationsBlockchain.ts
src/lib/Blockchain_v2_CrossChain/javascript/client.ts
src/lib/Blockchain_v2_CrossChain/javascript/contractABI.json
```

### Important Contract Files

```
Polls.sol
RightToVote.sol
Delegations.sol
MetaTxHandler.sol
PollsBridge.sol
PollsOnEthereum.sol
PollHelpers.sol
ProposalHelpers.sol
SharedErrors.sol
```

---

## 12. Maintenance Guidelines

1. Do not redeploy contracts unless Solidity code changes.
2. Do not modify contract addresses in `.env`.
3. Frontend blockchain logic should only be updated through adapters.
4. Ensure backend always provides correct `blockchain_id`.
5. Do not modify MetaTxHandler unless necessary.
6. Any cross‑chain modifications require updating the bridge configuration.

---

## 13. Redeployment Rules

Redeployment is required only when:
- Changing Solidity logic
- Changing constructor values
- Adding new blockchain features
- Switching networks

Redeployment is not needed for:
- Frontend modifications
- Backend modifications
- Adapter updates
- Environment configuration

---

## 14. Summary

The Flowback Blockchain v2 system is stable and fully configured.  
Frontend developers can work without modifying any contracts.  
Backend and frontend operate through unified adapters that abstract the blockchain layer.  
No redeployment is needed unless contract logic is changed.


