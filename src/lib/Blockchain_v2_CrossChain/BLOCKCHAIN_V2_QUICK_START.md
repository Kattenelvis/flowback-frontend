# BLOCKCHAIN_V2_QUICK_START.md

## Blockchain v2 Quick Start Guide

This document provides a short and clear set of instructions for running and testing the Blockchain v2 integration in the Flowback project. It is intended for developers who want to set up the environment quickly without reading the full documentation.

---

## 1. Requirements

To run the blockchain integration locally, you need the following:

1. The Flowback frontend installed.
2. The Flowback backend running through Docker.
3. MetaMask installed in your browser.
4. Base Sepolia network added to MetaMask.
5. A correct `.env` file containing all blockchain variables.

Blockchain development tools are not required for normal use. Foundry is only needed if Solidity code is changed.

---


## 2. Environment Variables

Create an `.env` file in the project root and ensure the following values are present:

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

These contract addresses are already deployed and configured. No redeployment is needed unless Solidity code changes.

---

## 3. Running the Backend

Start the backend using Docker:

```
docker compose up -d
```

The backend provides the `blockchain_id` values required for interacting with the contracts.

---

## 4. Running the Frontend

Install dependencies and start the development server:

```
npm install
npm run dev
```

The application will be available at:

```
http://localhost:4000
```

Make sure MetaMask is connected to Base Sepolia.

---

## 5. Testing Blockchain Functions

Open:

```
http://localhost:4000/blockchain
```

This page allows you to test:
- Joining a group  
- Leaving a group  
- Becoming a delegate  
- Delegating votes  
- Checking membership  
- Listing all groups for a user  

Every function requires a valid `blockchain_id` from the backend.

---

## 6. Common Problems

### Wrong Network  
MetaMask must be on Base Sepolia.

### Invalid Identifier  
Use `group.blockchain_id` instead of `group.id`.

### No Transactions  
Check that `PUBLIC_BLOCKCHAIN_INTEGRATION` is set to `TRUE`.

### Reverted Transactions  
Possible causes:
- The user is already a member.
- The user is not a member.
- Insufficient gas or test ETH.

---

## 7. Contract Ownership

The contracts were deployed by Zoher using his MetaMask account.  
Daily operations do not require the owner role.  
The owner role is only needed for configuration tasks, and these tasks are already completed.

---

## 8. Summary

Once the backend and frontend are running, and the `.env` file is correctly configured, the blockchain integration will function immediately.  
All testing can be done through the `/blockchain` page without any additional setup.

