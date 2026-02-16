// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {Polls} from "../src/Polls.sol";
import {MetaTxHandler} from "../src/MetaTxHandler.sol";
import {PollsBridge} from "../src/PollsBridge.sol";

contract DeployPolls is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Polls contract first
        Polls polls = new Polls();
        console.log("Polls deployed at:", address(polls));

        // Deploy MetaTxHandler with Polls address
        MetaTxHandler metaTxHandler = new MetaTxHandler(address(polls));
        console.log("MetaTxHandler deployed at:", address(metaTxHandler));

        // Deploy PollsBridge
        PollsBridge pollsBridge = new PollsBridge();
        console.log("PollsBridge deployed at:", address(pollsBridge));

        vm.stopBroadcast();
    }
}
