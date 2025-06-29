// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol"; // Or use a DID-based access control

struct TwinDataLog {
    string did;
    bytes32 dataHash; // Hash of the Digital Twin state
    string ipfsCid;   // CID of the full Digital Twin data on IPFS
    uint256 timestamp;
    uint256 version;
}

struct DIDLink {
    string did;
    string cidDid;
    address studentAddress;
    string skill;
    string tokenId;
    uint256 timestamp;
}

contract DigitalTwinRegistry is Ownable {
    // Mapping from DID string to an array of logs
    mapping(string => TwinDataLog[]) public didLogs;
    // Mapping from DID to the index of its latest log in didLogs[did]
    mapping(string => uint256) public latestLogIndex;
    
    // Mapping from DID to DIDLink
    mapping(string => DIDLink) public didLinks;
    // Array of all DIDs that have been linked
    string[] public linkedDIDs;

    event TwinDataUpdated(
        string indexed did,
        uint256 version,
        bytes32 dataHash,
        string ipfsCid,
        uint256 timestamp
    );

    event DIDLinked(
        string indexed did,
        string cidDid,
        address indexed studentAddress,
        string skill,
        string tokenId,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

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

    function linkDIDToBlockchain(
        string memory _did,
        string memory _cidDid,
        address _studentAddress,
        string memory _skill,
        string memory _tokenId
    ) public onlyOwner {
        DIDLink memory newLink = DIDLink({
            did: _did,
            cidDid: _cidDid,
            studentAddress: _studentAddress,
            skill: _skill,
            tokenId: _tokenId,
            timestamp: block.timestamp
        });

        didLinks[_did] = newLink;
        
        // Add to array if not already present
        bool exists = false;
        for (uint i = 0; i < linkedDIDs.length; i++) {
            if (keccak256(bytes(linkedDIDs[i])) == keccak256(bytes(_did))) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            linkedDIDs.push(_did);
        }

        emit DIDLinked(_did, _cidDid, _studentAddress, _skill, _tokenId, block.timestamp);
    }

    function getDIDLink(string memory _did) public view returns (DIDLink memory) {
        require(bytes(didLinks[_did].did).length > 0, "DID not linked");
        return didLinks[_did];
    }

    function getAllLinkedDIDs() public view returns (string[] memory) {
        return linkedDIDs;
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