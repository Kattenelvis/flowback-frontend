# BLOCKCHAIN_V2_MEDIUM_GUIDE.md

## Blockchain v2 Developer Guide (Medium Version)

This document explains how the Blockchain v2 integration works in the Flowback project. It is designed for developers who need more detail than the Quick Start Guide, but do not require the full technical documentation.

---

## 1. Introduction

Blockchain v2 integrates Base Sepolia (Layer 2) and Ethereum Sepolia (Layer 1) to provide decentralized membership, delegation, and voting.  
Base Sepolia is used for execution, and Ethereum Sepolia is used for permanent storage of finalized poll results.

The integration is fully optional and is activated in the `.env` file by setting:

```
PUBLIC_BLOCKCHAIN_INTEGRATION=TRUE
PUBLIC_BLOCKCHAIN_VERSION=v2
```

---


## 2. Requirements

To run the blockchain integration locally, the following are needed:

1. Flowback frontend (SvelteKit)
2. Flowback backend (Django, running through Docker)
3. MetaMask browser extension
4. Base Sepolia configured in MetaMask
5. `.env` configured with all blockchain variables

Blockchain development tools such as Foundry are not required unless contract code is modified.

---

## 3. Environment Variables

The following variables must be present in the project root `.env` file:

```
PUBLIC_BLOCKCHAIN_INTEGRATION=TRUE
PUBLIC_BLOCKCHAIN_VERSION=v2

PUBLIC_V2_POLLS_ADDRESS=0x27013b43c40fB4fB0c23DD0E56f1fB90FA8a0276
PUBLIC_V2_META_TX_HANDLER_ADDRESS=0x52938bb530D57B7bf754D33eB1dE417Ebba96DFd
PUBLIC_V2_POLLS_BRIDGE_ADDRESS=0x63FE5f2006C9ba7D07D185b3b24a35daFa527ab5

PUBLIC_V2_CHAIN_ID=84532
PUBLIC_V2_RPC_URL=https://sepolia.base.org
PUBLIC_V2_EXPLORER_URL=https://sepolia.basescan.org
```

These contract addresses are already deployed and do not need to be changed unless Solidity code is updated.

The backend must also be running to provide `blockchain_id` values for each group.

---

## 4. Contract Overview

### 4.1 Polls Contract (Base Sepolia)
Handles:
- Group membership
- Delegations
- Poll creation
- Voting

### 4.2 MetaTxHandler Contract
Handles gasless meta-transactions and signature-based interactions.

### 4.3 PollsBridge Contract
Transfers finalized poll data from Base to Ethereum.

### 4.4 PollsOnEthereum Contract
Stores poll results on Ethereum for permanent recordkeeping.

Ownership is not required for daily operations.

---

## 5. Frontend Architecture

Blockchain v2 is accessed using unified adapters located in:

```
src/lib/Blockchain_v2_CrossChain/adapters/
```

Important files:

- `rightToVoteUnified.ts`  
- `delegationAdapter.ts`  
- `rightToVoteAdapter.ts`  
- `pollsBlockchain.ts`  
- `client.ts`

These adapters manage network selection, contract initialization, and method calls.

---

## 6. Running the Backend

The backend must be started using Docker:

```
docker compose up -d
```

The backend provides group-level metadata and the `blockchain_id` required for all blockchain operations.

---

## 7. Running the Frontend

Start the frontend using:

```
npm install
npm run dev
```

Open:

```
http://localhost:4000
```

Ensure MetaMask is connected to Base Sepolia before performing any blockchain actions.

---

## 8. Testing Blockchain Features

Navigate to:

```
/blockchain
```

This page contains simple interfaces for testing:

- Membership  
- Delegation  
- Delegate boosting  
- Membership lookup  
- Group lookups  

Each function requires a valid `blockchain_id`.

---

## 9. Common Errors and Solutions

### 9.1 Wrong Network
Ensure MetaMask is connected to Base Sepolia.

### 9.2 Invalid BigNumberish
Occurs when using `group.id` instead of `group.blockchain_id`.

### 9.3 Missing Transactions
Ensure `PUBLIC_BLOCKCHAIN_INTEGRATION` is set to `TRUE`.

### 9.4 Transaction Reverted
Reasons:
- User already a member
- User not a member
- Insufficient test ETH
- Incorrect input types

---

## 10. Contract Ownership

The contracts were deployed by Zoher using his MetaMask account.  
Owner permissions are only needed for configuring:
- Bridge contract
- MetaTxHandler contract

These configurations are complete.  
Daily operations do not require owner privileges.

---

## 11. Summary

The blockchain integration in Flowback v2 works immediately once:

1. The backend is running
2. The frontend is running
3. The `.env` file is configured
4. MetaMask is set to Base Sepolia

Developers can test all features from the `/blockchain` page.  
Redeployment of contracts is not required unless Solidity code is changed.

