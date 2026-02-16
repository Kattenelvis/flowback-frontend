// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PollsOnEthereum} from "../src/PollsOnEthereum.sol";

contract DeployPollsOnEthereum is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PollsOnEthereum contract
        PollsOnEthereum pollsOnEthereum = new PollsOnEthereum();
        console.log("PollsOnEthereum deployed at:", address(pollsOnEthereum));

        vm.stopBroadcast();
    }
}
