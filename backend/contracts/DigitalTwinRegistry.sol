// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol"; // Or use a DID-based access control

struct TwinDataLog {
    string did;
    bytes32 dataHash; // Hash of the Digital Twin state
    string ipfsCid;   // CID of the full Digital Twin data on IPFS
    uint256 timestamp;
    uint256 version;
}

contract DigitalTwinRegistry is Ownable {
    // Mapping from DID string to an array of logs
    mapping(string => TwinDataLog[]) public didLogs;
    // Mapping from DID to the index of its latest log in didLogs[did]
    mapping(string => uint256) public latestLogIndex;

    event TwinDataUpdated(
        string indexed did,
        uint256 version,
        bytes32 dataHash,
        string ipfsCid,
        uint256 timestamp
    );

    // For this example, only contract owner can log.
    // In a real DID system, this would be restricted to the DID controller.
    function logTwinUpdate(
        string memory _did,
        uint256 _version,
        bytes32 _dataHash,
        string memory _ipfsCid
    ) public onlyOwner { // Replace onlyOwner with DID-based auth in production
        TwinDataLog memory newLog = TwinDataLog({
            did: _did,
            dataHash: _dataHash,
            ipfsCid: _ipfsCid,
            timestamp: block.timestamp,
            version: _version
        });

        didLogs[_did].push(newLog);
        latestLogIndex[_did] = didLogs[_did].length - 1;

        emit TwinDataUpdated(_did, _version, _dataHash, _ipfsCid, block.timestamp);
    }

    function getLatestTwinDataLog(string memory _did) public view returns (TwinDataLog memory) {
        require(didLogs[_did].length > 0, "No logs found for this DID");
        return didLogs[_did][latestLogIndex[_did]];
    }

    function getAllTwinDataLogs(string memory _did) public view returns (TwinDataLog[] memory) {
        return didLogs[_did];
    }

     function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}