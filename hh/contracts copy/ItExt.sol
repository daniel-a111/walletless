


// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

struct Transaction {
    address to;
    uint value;
    bytes data;
    bytes32 cert;
}
/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */
contract ItExt {

    mapping(uint => Transaction) public pendings;
    uint public nonce;
    bool public processing = false;
    uint public recordCounter;
    uint public cursor;

    uint public workCount;

    event GasCost(uint cost);

    function register(
        address to, uint value, bytes calldata data, bytes32 cert
    ) external {
        pendings[recordCounter++] = Transaction({
            to: to, value: value, data: data, cert: cert
        });
    }

    function increaseNonce() public {

        if (!processing) {
            processing = true;
            cursor = 0;
        }
        // uint i = 0;
        for (uint i = cursor; i < recordCounter; i++) {
            // workCount++;

            uint256 start = gasleft();
            uint256 start2 = gasleft(); // 10
            if (start2 < 30000) {
                cursor = i;
                return;
            }
            uint256 end = gasleft();
            uint256 end2 = gasleft();

            // emit GasCost(start);
            // emit GasCost(start-start2);
            // emit GasCost(start2-end);
            // emit GasCost(end-end2);
            // emit GasCost(end2);
            workCount++;
            // gasLeft = gasleft();
            // if (gasLeft < 20000) {
            //     cursor = i;
            //     return;
            // }
        }
        nonce++;
        processing = false;
    }

    function setCounter(uint c) public {
        recordCounter = c;
    }
}