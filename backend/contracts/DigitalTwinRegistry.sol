// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol"; // Or use a DID-based access control
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

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

contract DigitalTwinRegistry is Ownable, EIP712 {
    // Mapping from DID string to an array of logs
    mapping(string => TwinDataLog[]) public didLogs;
    // Mapping from DID to the index of its latest log in didLogs[did]
    mapping(string => uint256) public latestLogIndex;
    
    // Mapping from DID to DIDLink
    mapping(string => DIDLink) public didLinks;
    // Mapping from DID to controller/owner address
    mapping(string => address) public didOwner;
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

    event TwinRegistered(
        string indexed did,
        address indexed owner
    );

    // EIP-712 typehash for Update struct
    bytes32 private constant UPDATE_TYPEHASH = keccak256(
        "Update(string did,uint256 version,bytes32 dataHash,string ipfsCid,bytes32 nonce)"
    );

    // Nonce tracking to prevent replay (per controller address)
    mapping(address => mapping(bytes32 => bool)) public usedNonces;

    constructor() Ownable(msg.sender) EIP712("DigitalTwinRegistry", "1") {}

    // Register a DID and its controller/owner address (admin-controlled in this version)
    function registerTwin(
        string memory _did,
        address _owner
    ) public onlyOwner {
        require(_owner != address(0), "Invalid owner address");
        didOwner[_did] = _owner;
        emit TwinRegistered(_did, _owner);
    }

    // For this example, authorization allows either DID controller or contract owner.
    // In a real DID system, prefer EIP-712 verification.
    function logTwinUpdate(
        string memory _did,
        uint256 _version,
        bytes32 _dataHash,
        string memory _ipfsCid
    ) public { // Authorization below
        address controller = didOwner[_did];
        require(controller != address(0), "Twin not registered");
        require(msg.sender == controller || msg.sender == owner(), "Not authorized");
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

    // EIP-712 based update: anyone can submit if they hold a valid signature from controller
    struct Update {
        string did;
        uint256 version;
        bytes32 dataHash;
        string ipfsCid;
        bytes32 nonce;
    }

    function _hashUpdate(Update memory u) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                UPDATE_TYPEHASH,
                keccak256(bytes(u.did)),
                u.version,
                u.dataHash,
                keccak256(bytes(u.ipfsCid)),
                u.nonce
            )
        );
    }

    function logTwinUpdateBySig(Update memory u, bytes memory signature) public {
        address controller = didOwner[u.did];
        require(controller != address(0), "Twin not registered");

        // Prevent replay per-controller
        require(!usedNonces[controller][u.nonce], "Nonce already used");

        bytes32 digest = _hashTypedDataV4(_hashUpdate(u));
        address signer = ECDSA.recover(digest, signature);
        require(signer == controller, "Invalid signer");

        usedNonces[controller][u.nonce] = true;

        TwinDataLog memory newLog = TwinDataLog({
            did: u.did,
            dataHash: u.dataHash,
            ipfsCid: u.ipfsCid,
            timestamp: block.timestamp,
            version: u.version
        });

        didLogs[u.did].push(newLog);
        latestLogIndex[u.did] = didLogs[u.did].length - 1;

        emit TwinDataUpdated(u.did, u.version, u.dataHash, u.ipfsCid, block.timestamp);
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