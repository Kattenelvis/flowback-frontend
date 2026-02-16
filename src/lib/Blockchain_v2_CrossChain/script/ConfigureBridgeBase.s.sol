// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

/**
 * @title ConfigureBridgeBase - Bridge Configuration Script for Base Sepolia (L2)
 * @notice This script configures the PollsBridge contract on Base Sepolia to point to 
 *         the PollsOnEthereum contract on Ethereum Sepolia (L1).
 * @dev This script is idempotent - it checks the current configuration before making changes.
 *      Using an interface instead of importing the full contract to avoid linking issues.
 * 
 * Purpose:
 * - Enables the PollsBridge contract on Base (L2) to send poll results to Ethereum (L1)
 * - Creates a unidirectional communication: Base → Ethereum for final poll storage
 * 
 * Usage:
 *   forge script script/ConfigureBridgeBase.s.sol --rpc-url https://sepolia.base.org --broadcast
 */
interface IPollsBridge {
    function setEthereumPollsContract(address l1) external;
    function ethereumPollsContract() external view returns (address);
}

contract ConfigureBridgeBase is Script {
    function run() external {
        // Get the private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get contract addresses from environment or use hardcoded testnet values
        // Environment variables can be set in .env file for production deployment
        address pollsBridgeAddress =
            vm.envOr("POLLS_BRIDGE_ADDRESS", address(0x63FE5f2006C9ba7D07D185b3b24a35daFa527ab5));

        address pollsOnEthereumAddress =
            vm.envOr("POLLS_ON_ETHEREUM_ADDRESS", address(0x52938bb530D57B7bf754D33eB1dE417Ebba96DFd));

        // Validate addresses to prevent common errors
        require(pollsBridgeAddress != address(0), "Invalid PollsBridge address: zero address");
        require(pollsOnEthereumAddress != address(0), "Invalid PollsOnEthereum address: zero address");
        require(pollsBridgeAddress.code.length > 0, "No code at PollsBridge address");
        require(pollsOnEthereumAddress.code.length > 0, "No code at PollsOnEthereum address");

        // Create an interface instance to interact with the PollsBridge contract
        IPollsBridge bridge = IPollsBridge(pollsBridgeAddress);

        // Check the current L1 contract address configured in the bridge
        address current = bridge.ethereumPollsContract();
        console.log("Current L1 address in bridge:", current);
        
        // Only update if the configuration has changed (idempotent operation)
        if (current != pollsOnEthereumAddress) {
            console.log("Setting L1 address on L2 bridge...");
            console.log("Previous L1 address:", current);
            
            // Configure the bridge to point to PollsOnEthereum on L1
            bridge.setEthereumPollsContract(pollsOnEthereumAddress);
            
            console.log("New L1 address:", pollsOnEthereumAddress);
        } else {
            // Configuration is already correct, no action needed
            console.log("L2 bridge already configured correctly. No action taken.");
        }

        // Print summary
        console.log("\n=== Bridge Configuration Summary ===");
        console.log("PollsBridge (L2 - Base Sepolia):", pollsBridgeAddress);
        console.log("PollsOnEthereum (L1 - Ethereum Sepolia):", pollsOnEthereumAddress);

        vm.stopBroadcast();
    }
}