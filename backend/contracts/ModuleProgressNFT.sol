// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./LearningDataRegistry.sol";
import "./ZKLearningVerifier.sol";

/**
 * @title ModuleProgressNFT
 * @dev ERC-1155 NFT contract for learning module completion tracking
 * Features: ZK proof verification + learning data verification
 */
contract ModuleProgressNFT is ERC1155, ERC1155URIStorage, Ownable, ReentrancyGuard, Pausable {
    
    // ============ STRUCTS ============
    struct ModuleCompletion {
        address student;
        string moduleId;
        uint256 completionTime;
        uint256 score;
        bool isVerified;
        bytes32 learningSessionHash;
    }
    
    struct ZKProofData {
        uint256[2] proofA;
        uint256[2][2] proofB;
        uint256[2] proofC;
        uint256[8] publicInputs;
    }

    // Struct for minting parameters to reduce stack depth
    struct MintParams {
        string moduleId;
        string metadataURI;
        uint256 amount;
        uint256 score;
        bytes32 learningSessionHash;
    }

    // ============ STATE VARIABLES ============
    mapping(bytes32 => bool) public usedProofs;
    mapping(address => mapping(string => ModuleCompletion)) public moduleCompletions;
    mapping(string => bool) public validModuleIds;
    
    LearningDataRegistry public learningDataRegistry;
    ZKLearningVerifier public zkLearningVerifier;
    
    uint256 public totalCompletions;
    uint256 public minScoreThreshold = 70;
    
    // Temporary storage for proof hash calculation to reduce stack depth
    bytes32 private tempProofHash;
    uint256 private tempHashPart1;
    uint256 private tempHashPart2;
    uint256 private tempHashPart3;
    uint256 private tempHashPart4;
    
    // ============ EVENTS ============
    event ModuleCompleted(
        address indexed student,
        string indexed moduleId,
        uint256 amount,
        string metadataURI,
        uint256 completionTime,
        uint256 score,
        bytes32 learningSessionHash,
        bytes32 proofHash
    );
    
    event ProofUsed(bytes32 indexed proofHash, address indexed student, string moduleId);
    event LearningDataRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event ZKVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    // ============ CONSTRUCTOR ============
    constructor(
        string memory baseURI,
        address initialOwner,
        address _learningDataRegistry,
        address _zkLearningVerifier
    ) ERC1155(baseURI) Ownable(initialOwner) {
        learningDataRegistry = LearningDataRegistry(_learningDataRegistry);
        zkLearningVerifier = ZKLearningVerifier(_zkLearningVerifier);
    }

    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Student mints NFT using ZK proof + verified learning data
     */
    function mintWithZKProof(
        MintParams calldata params,
        ZKProofData calldata proofData
    ) external whenNotPaused nonReentrant {
        // Step 1: Basic validation
        _validateBasicParams(params);
        
        // Step 2: Validate learning session
        _validateLearningSession(msg.sender, params.moduleId, params.learningSessionHash);

        // Step 3: Process proof and mint
        _processProofAndMint(params, proofData);
    }

    function _validateBasicParams(MintParams calldata params) private view {
        require(params.score >= minScoreThreshold, "Score below threshold");
        require(params.amount > 0, "Amount must be greater than 0");
        require(bytes(params.metadataURI).length > 0, "Empty metadata URI");
        require(validModuleIds[params.moduleId], "Invalid module ID");
        require(!moduleCompletions[msg.sender][params.moduleId].isVerified, "Already completed");
    }

    function _validateLearningSession(address student, string memory moduleId, bytes32 learningSessionHash) private view {
        require(learningDataRegistry.isSessionVerified(learningSessionHash), "Learning session not verified");
        
        (address sessionStudent, string memory sessionModuleId,,,,,,,) = learningDataRegistry.getLearningSession(learningSessionHash);
        require(sessionStudent == student, "Learning session not owned by student");
        require(_compareStrings(sessionModuleId, moduleId), "Module ID mismatch");
    }

    function _processProofAndMint(MintParams calldata params, ZKProofData calldata proofData) private {
        bytes32 proofHash = _calculateProofHash(proofData, params.learningSessionHash);
        require(!usedProofs[proofHash], "Proof already used");

        // Verify ZK proof
        bool isValid = zkLearningVerifier.verifyModuleProgressProof(
            proofData.proofA, 
            proofData.proofB, 
            proofData.proofC, 
            proofData.publicInputs, 
            params.metadataURI, 
            params.score
        );
        require(isValid, "Invalid ZK proof");

        // Execute mint
        _executeMint(params, proofHash);
    }

    function _executeMint(MintParams calldata params, bytes32 proofHash) private {
        usedProofs[proofHash] = true;
        
        // Store completion data
        moduleCompletions[msg.sender][params.moduleId] = ModuleCompletion({
            student: msg.sender,
            moduleId: params.moduleId,
            completionTime: block.timestamp,
            score: params.score,
            isVerified: true,
            learningSessionHash: params.learningSessionHash
        });
        
        totalCompletions++;
        uint256 tokenId = _getTokenId(params.moduleId);
        
        _mint(msg.sender, tokenId, params.amount, "");
        _setURI(tokenId, params.metadataURI);
        
        emit ModuleCompleted(
            msg.sender, 
            params.moduleId, 
            params.amount, 
            params.metadataURI, 
            block.timestamp, 
            params.score, 
            params.learningSessionHash, 
            proofHash
        );
    }

    function _calculateProofHash(ZKProofData calldata proofData, bytes32 learningSessionHash) private returns (bytes32) {
        // Break down the hash calculation to reduce stack depth
        tempHashPart1 = proofData.proofA[0];
        tempHashPart2 = proofData.proofA[1];
        tempHashPart3 = proofData.proofB[0][0];
        tempHashPart4 = proofData.proofB[0][1];
        
        // Calculate hash in parts to avoid stack overflow
        bytes32 hash1 = keccak256(abi.encodePacked(
            tempHashPart1, tempHashPart2, tempHashPart3, tempHashPart4
        ));
        
        tempHashPart1 = proofData.proofB[1][0];
        tempHashPart2 = proofData.proofB[1][1];
        tempHashPart3 = proofData.proofC[0];
        tempHashPart4 = proofData.proofC[1];
        
        bytes32 hash2 = keccak256(abi.encodePacked(
            tempHashPart1, tempHashPart2, tempHashPart3, tempHashPart4
        ));
        
        tempHashPart1 = proofData.publicInputs[0];
        tempHashPart2 = proofData.publicInputs[1];
        tempHashPart3 = proofData.publicInputs[2];
        tempHashPart4 = proofData.publicInputs[3];
        
        bytes32 hash3 = keccak256(abi.encodePacked(
            tempHashPart1, tempHashPart2, tempHashPart3, tempHashPart4
        ));
        
        tempHashPart1 = proofData.publicInputs[4];
        tempHashPart2 = proofData.publicInputs[5];
        tempHashPart3 = proofData.publicInputs[6];
        
        bytes32 hash4 = keccak256(abi.encodePacked(
            tempHashPart1, tempHashPart2, tempHashPart3, learningSessionHash
        ));
        
        // Final hash combining all parts
        tempProofHash = keccak256(abi.encodePacked(hash1, hash2, hash3, hash4));
        return tempProofHash;
    }

    function _compareStrings(string memory a, string memory b) private pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    /**
     * @dev Owner can mint directly (for testing or special cases)
     */
    function mintByOwner(
        address student,
        string memory moduleId,
        string memory metadataURI,
        uint256 amount,
        uint256 score
    ) external onlyOwner whenNotPaused {
        require(score >= minScoreThreshold, "Score below threshold");
        require(amount > 0, "Amount must be greater than 0");
        require(validModuleIds[moduleId], "Invalid module ID");
        
        moduleCompletions[student][moduleId] = ModuleCompletion({
            student: student,
            moduleId: moduleId,
            completionTime: block.timestamp,
            score: score,
            isVerified: true,
            learningSessionHash: bytes32(0)
        });
        
        totalCompletions++;
        uint256 tokenId = _getTokenId(moduleId);
        
        _mint(student, tokenId, amount, "");
        _setURI(tokenId, metadataURI);
        
        emit ModuleCompleted(student, moduleId, amount, metadataURI, block.timestamp, score, bytes32(0), bytes32(0));
    }

    // ============ ADMIN FUNCTIONS ============
    
    function addValidModule(string memory moduleId) external onlyOwner {
        require(bytes(moduleId).length > 0, "Empty module ID");
        require(!validModuleIds[moduleId], "Module ID already valid");
        validModuleIds[moduleId] = true;
    }
    
    function removeValidModule(string memory moduleId) external onlyOwner {
        require(validModuleIds[moduleId], "Module ID not valid");
        validModuleIds[moduleId] = false;
    }
    
    function updateMinScoreThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold <= 100, "Invalid threshold");
        minScoreThreshold = newThreshold;
    }
    
    function updateLearningDataRegistry(address newRegistry) external onlyOwner {
        require(newRegistry != address(0), "Invalid registry address");
        address oldRegistry = address(learningDataRegistry);
        learningDataRegistry = LearningDataRegistry(newRegistry);
        emit LearningDataRegistryUpdated(oldRegistry, newRegistry);
    }
    
    function updateZKLearningVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "Invalid verifier address");
        address oldVerifier = address(zkLearningVerifier);
        zkLearningVerifier = ZKLearningVerifier(newVerifier);
        emit ZKVerifierUpdated(oldVerifier, newVerifier);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ VIEW FUNCTIONS ============
    
    function _getTokenId(string memory moduleId) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(moduleId)));
    }
    
    function getModuleCompletion(address student, string memory moduleId) external view returns (
        address studentAddr,
        string memory module,
        uint256 completionTime,
        uint256 score,
        bool isVerified,
        bytes32 learningSessionHash
    ) {
        ModuleCompletion storage completion = moduleCompletions[student][moduleId];
        return (
            completion.student,
            completion.moduleId,
            completion.completionTime,
            completion.score,
            completion.isVerified,
            completion.learningSessionHash
        );
    }
    
    function hasCompletedModule(address student, string memory moduleId) external view returns (bool) {
        return moduleCompletions[student][moduleId].isVerified;
    }
    
    function getZKLearningVerifier() external view returns (address) {
        return address(zkLearningVerifier);
    }
    
    // ============ OVERRIDE FUNCTIONS ============
    
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal override(ERC1155) {
        super._update(from, to, ids, values);
    }
    
    function uri(uint256 tokenId) public view override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return super.uri(tokenId);
    }
}