// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

/**
 * @title ConfigureBridgeEthereum - Bridge Configuration Script for Ethereum Sepolia (L1)
 * @notice This script configures the PollsOnEthereum contract on Ethereum Sepolia to accept
 *         data from the PollsBridge contract on Base Sepolia (L2).
 * @dev This script is idempotent - it checks the current configuration before making changes.
 *      Using an interface instead of importing the full contract to avoid linking issues.
 * 
 * Purpose:
 * - Enables the PollsOnEthereum contract on Ethereum (L1) to receive poll results from Base (L2)
 * - Creates authorization: Only PollsBridge can send results to PollsOnEthereum
 * - Ensures data integrity by restricting who can call storage functions
 * 
 * Usage:
 *   forge script script/ConfigureBridgeEthereum.s.sol --rpc-url https://ethereum-sepolia-rpc.publicnode.com --broadcast
 */
interface IPollsOnEthereum {
    function setBridgeContract(address l2) external;
    function bridgeContract() external view returns (address);
}

contract ConfigureBridgeEthereum is Script {
    function run() external {
        // Get the private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get contract addresses from environment or use hardcoded testnet values
        // Environment variables can be set in .env file for production deployment
        address pollsOnEthereumAddress =
            vm.envOr("POLLS_ON_ETHEREUM_ADDRESS", address(0x52938bb530D57B7bf754D33eB1dE417Ebba96DFd));

        address pollsBridgeAddress =
            vm.envOr("POLLS_BRIDGE_ADDRESS", address(0x63FE5f2006C9ba7D07D185b3b24a35daFa527ab5));

        // Validate addresses to prevent common errors
        require(pollsOnEthereumAddress != address(0), "Invalid PollsOnEthereum address: zero address");
        require(pollsBridgeAddress != address(0), "Invalid PollsBridge address: zero address");
        require(pollsOnEthereumAddress.code.length > 0, "No code at PollsOnEthereum address");
        // Note: PollsBridge is on Base (L2), so we don't check its code here on Ethereum (L1)

        // Create an interface instance to interact with the PollsOnEthereum contract
        IPollsOnEthereum pollsL1 = IPollsOnEthereum(pollsOnEthereumAddress);

        // Check the current L2 bridge address configured in the L1 contract
        address current = pollsL1.bridgeContract();
        console.log("Current L2 bridge address in L1 contract:", current);
        
        // Only update if the configuration has changed (idempotent operation)
        if (current != pollsBridgeAddress) {
            console.log("Setting L2 bridge on L1 contract...");
            console.log("Previous L2 bridge address:", current);
            
            // Configure the L1 contract to accept data from PollsBridge on L2
            pollsL1.setBridgeContract(pollsBridgeAddress);
            
            console.log("New L2 bridge address:", pollsBridgeAddress);
        } else {
            // Configuration is already correct, no action needed
            console.log("L1 contract already configured correctly. No action taken.");
        }

        // Print summary
        console.log("\n=== Bridge Configuration Summary ===");
        console.log("PollsOnEthereum (L1 - Ethereum Sepolia):", pollsOnEthereumAddress);
        console.log("PollsBridge (L2 - Base Sepolia):", pollsBridgeAddress);

        vm.stopBroadcast();
    }
}