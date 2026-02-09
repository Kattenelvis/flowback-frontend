# 📋 **v2 Cross-Chain Smart Contracts Deployment Documentation**

## 🎯 **Deployment Overview**

### **Deployment Date:** October 21, 2025
### **Networks:** Base Sepolia (L2) + Ethereum Sepolia (L1)
### **Architecture:** Cross-Chain Poll System
### **Verification Status:** ✅ Verified on Sourcify

---

## 🌉 **Cross-Chain Architecture**

### **Base Sepolia (L2) - Execution Layer:**
- **Network:** Base Sepolia (Chain ID: 84532)
- **Purpose:** Poll execution, voting, meta-transactions
- **Cost:** Lower gas fees, faster transactions

### **Ethereum Sepolia (L1) - Storage Layer:**
- **Network:** Ethereum Sepolia (Chain ID: 11155111)
- **Purpose:** Permanent storage of poll results
- **Cost:** Higher security, immutable records

---

## 📊 **Deployed Contracts**

### **Base Sepolia Contracts (L2):**

#### **1. Polls Contract**
- **Address:** `0x27013b43c40fB4fB0c23DD0E56f1fB90FA8a0276`
- **Function:** Poll management and voting
- **Gas Used:** 4,675,607 gas
- **Cost:** 0.000004675971697346 ETH
- **Transaction Hash:** `0x74e2a033607535cae2adc52f0f340bd847da0fb2f7f490663ebd5c6f9127bfec`
- **Verification:** ✅ Verified on Sourcify

#### **2. MetaTxHandler Contract**
- **Address:** `0x52938bb530D57B7bf754D33eB1dE417Ebba96DFd`
- **Function:** Meta-transaction handling (gasless voting)
- **Gas Used:** 487,427 gas
- **Cost:** 0.000000487465019306 ETH
- **Transaction Hash:** `0x73d613365b028108703b0b0fbba1fb92fe7b574079e6f79dac0379e89e8344cd`
- **Verification:** ✅ Verified on Sourcify

#### **3. PollsBridge Contract**
- **Address:** `0x63FE5f2006C9ba7D07D185b3b24a35daFa527ab5`
- **Function:** Bridge for Ethereum L1 communication
- **Gas Used:** 229,720 gas
- **Cost:** 0.00000022973791816 ETH
- **Transaction Hash:** `0xf6caadb318670aad2fb55b55c5e6be1f8954ed9edd40bc0c8bcc0602a3c775ac`
- **Verification:** ✅ Verified on Sourcify

### **Ethereum Sepolia Contracts (L1):**

#### **4. PollsOnEthereum Contract**
- **Address:** `0x52938bb530D57B7bf754D33eB1dE417Ebba96DFd`
- **Function:** Store poll results and votes from Base network
- **Gas Used:** 334,950 gas
- **Cost:** 0.0000003349533495 ETH
- **Transaction Hash:** `0xfbf324f4a6a8880e1cf591db508a74167bc791819e21adcc630e618abacac89f`
- **Verification:** ✅ Verified on Sourcify

---

## 💰 **Total Deployment Cost**

### **Base Sepolia (L2):**
- **Total Gas:** 5,392,754 gas
- **Total Cost:** 0.000005393174634812 ETH

### **Ethereum Sepolia (L1):**
- **Total Gas:** 334,950 gas
- **Total Cost:** 0.0000003349533495 ETH

### **Combined Total:**
- **Total Gas:** 5,727,704 gas
- **Total Cost:** 0.000005728128084312 ETH
- **USD Equivalent:** ~$0.01 (approximate)

---

## 🔗 **Useful Links**

### **Base Sepolia Explorer (L2):**
- **Polls:** https://sepolia.basescan.org/address/0x27013b43c40fB4fB0c23DD0E56f1fB90FA8a0276
- **MetaTxHandler:** https://sepolia.basescan.org/address/0x52938bb530D57B7bf754D33eB1dE417Ebba96DFd
- **PollsBridge:** https://sepolia.basescan.org/address/0x63FE5f2006C9ba7D07D185b3b24a35daFa527ab5

### **Ethereum Sepolia Explorer (L1):**
- **PollsOnEthereum:** https://sepolia.etherscan.io/address/0x52938bb530D57B7bf754D33eB1dE417Ebba96DFd

### **Sourcify Verification:**
- **Polls (Base):** https://sourcify.dev/server/v2/verify/e398cf3d-1f05-4d05-8b22-cac6f06e6839
- **MetaTxHandler (Base):** https://sourcify.dev/server/v2/verify/10291d55-d3dd-433f-bb88-706fdcfb831a
- **PollsBridge (Base):** https://sourcify.dev/server/v2/verify/da86c1cc-23cd-40af-9f75-9e27ae6d148d
- **PollsOnEthereum (Ethereum):** https://sourcify.dev/server/v2/verify/d171e404-e983-43f2-b9cc-4877d9219ec1

---

## ⚙️ **Deployment Configuration**

### **Configuration File Used:**
- **foundry.toml:** `src/lib/Blockchain_v2_CrossChain/foundry.toml`

### **Network Configurations:**
- **Base Sepolia RPC:** `https://sepolia.base.org`
- **Base Sepolia Chain ID:** 84532
- **Ethereum Sepolia RPC:** `https://ethereum-sepolia-rpc.publicnode.com`
- **Ethereum Sepolia Chain ID:** 11155111

### **Environment Variables:**
- **PRIVATE_KEY:** From `.env` file in `Blockchain_v2_CrossChain`
- **BASE_SEPOLIA_RPC_URL:** `https://sepolia.base.org`
- **ETHEREUM_SEPOLIA_RPC_URL:** `https://ethereum-sepolia-rpc.publicnode.com`

---

## 🔗 **Cross-Chain Bridge Configuration**

### **Overview**
The bridge configuration enables communication between Base Sepolia (L2) and Ethereum Sepolia (L1) for storing poll results permanently on Ethereum.

### **Configuration Scripts:**
- **ConfigureBridgeBase.s.sol:** Configures PollsBridge on Base to point to PollsOnEthereum on Ethereum
- **ConfigureBridgeEthereum.s.sol:** Configures PollsOnEthereum on Ethereum to accept data from PollsBridge on Base

### **Configuration Results:**

#### **1. Base Sepolia Configuration:**
- **Script:** `ConfigureBridgeBase.s.sol`
- **Transaction Hash:** `0x91243dfd92c2b482ed2b4e26689001ab2016745ba965e1e504a15f786564269c`
- **Gas Used:** 43,806 gas
- **Cost:** 0.000000043810249182 ETH
- **Block:** 32924942
- **Configuration:**
  - PollsBridge now points to PollsOnEthereum at `0x52938bb530D57B7bf754D33eB1dE417Ebba96DFd`

#### **2. Ethereum Sepolia Configuration:**
- **Script:** `ConfigureBridgeEthereum.s.sol`
- **Transaction Hash:** `0x8059714ee3aed090a9e661cc7a5031dfbb272b44a377d395df6d5d129e0204a5`
- **Gas Used:** 43,731 gas
- **Cost:** 0.000000043731174924 ETH
- **Block:** 9505682
- **Configuration:**
  - PollsOnEthereum now accepts data from PollsBridge at `0x63FE5f2006C9ba7D07D185b3b24a35daFa527ab5`

### **Total Bridge Configuration Cost:**
- **Total Gas:** 87,537 gas
- **Total Cost:** 0.000000087541423106 ETH (~$0.00001)

---

## 📁 **Important Files**

### **Deployment Scripts:**
- **DeployPolls.s.sol:** `src/lib/Blockchain_v2_CrossChain/script/DeployPolls.s.sol` (Base Sepolia)
- **DeployPollsOnEthereum.s.sol:** `src/lib/Blockchain_v2_CrossChain/script/DeployPollsOnEthereum.s.sol` (Ethereum Sepolia)
- **ConfigureBridgeBase.s.sol:** `src/lib/Blockchain_v2_CrossChain/script/ConfigureBridgeBase.s.sol` (Bridge Configuration - Base)
- **ConfigureBridgeEthereum.s.sol:** `src/lib/Blockchain_v2_CrossChain/script/ConfigureBridgeEthereum.s.sol` (Bridge Configuration - Ethereum)

### **Deployment Records:**
- **Base Sepolia:** `src/lib/Blockchain_v2_CrossChain/broadcast/DeployPolls.s.sol/84532/run-latest.json`
- **Ethereum Sepolia:** `src/lib/Blockchain_v2_CrossChain/broadcast/DeployPollsOnEthereum.s.sol/11155111/run-latest.json`
- **Bridge Base:** `src/lib/Blockchain_v2_CrossChain/broadcast/ConfigureBridgeBase.s.sol/84532/run-latest.json`
- **Bridge Ethereum:** `src/lib/Blockchain_v2_CrossChain/broadcast/ConfigureBridgeEthereum.s.sol/11155111/run-latest.json`

### **ABI Files:**
- **Polls ABI:** `src/lib/Blockchain_v2_CrossChain/out/Polls.sol/Polls.json`
- **MetaTxHandler ABI:** `src/lib/Blockchain_v2_CrossChain/out/MetaTxHandler.sol/MetaTxHandler.json`
- **PollsBridge ABI:** `src/lib/Blockchain_v2_CrossChain/out/PollsBridge.sol/PollsBridge.json`
- **PollsOnEthereum ABI:** `src/lib/Blockchain_v2_CrossChain/out/PollsOnEthereum.sol/PollsOnEthereum.json`

---


## 🔄 **Update History**

- **October 21, 2025:** Contracts deployed on Base Sepolia
- **October 21, 2025:** Contracts verified on Sourcify
- **October 21, 2025:** PollsOnEthereum deployed on Ethereum Sepolia
- **October 27, 2025:** Cross-chain bridge configuration completed (Base ↔ Ethereum)
- **October 21, 2025:** This documentation created and updated

---

