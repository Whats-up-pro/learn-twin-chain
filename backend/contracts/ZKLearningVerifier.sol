// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ModuleProgressNFT.sol";
import "./LearningAchievementNFT.sol";
import "./verifiers/learning_achievement_verifier.sol";
import "./verifiers/module_progress_verifier.sol";

/**
 * @title ZKLearningVerifier - On-chain zkSNARK Proof Verifier
 * @dev Verifies Groth16 zkSNARK proofs on-chain using snarkjs-generated verifiers
 */
contract ZKLearningVerifier is Ownable, ReentrancyGuard, Pausable {
    
    ModuleProgressNFT public moduleNFT;
    LearningAchievementNFT public achievementNFT;
    
    // Verifier contracts
    LearningAchievementVerifier public learningAchievementVerifier;
    ModuleProgressVerifier public moduleProgressVerifier;
    
    // Security measures
    mapping(bytes32 => bool) public usedProofs;
    mapping(address => uint256) public userNonces;
    
    // Proof verification storage for student minting
    mapping(bytes32 => bool) public verifiedProofs;
    mapping(bytes32 => address) public proofStudent;
    
    // Rate limiting
    mapping(address => uint256) public lastSubmission;
    uint256 public submissionCooldown = 30 seconds;
    
    // Events
    event ProofVerified(
        address indexed student,
        string indexed circuitType,
        bytes32 indexed proofHash,
        bool verified,
        uint256 timestamp
    );
    
    event NFTMinted(
        address indexed student,
        string indexed nftType,
        bytes32 indexed proofHash,
        uint256 tokenId,
        uint256 timestamp
    );
    
    event VerifierUpdated(
        string indexed circuitType,
        address indexed verifierAddress,
        uint256 timestamp
    );

    // Modifiers
    modifier rateLimited() {
        require(
            block.timestamp >= lastSubmission[msg.sender] + submissionCooldown,
            "Rate limit exceeded"
        );
        _;
        lastSubmission[msg.sender] = block.timestamp;
    }

    constructor(
        address _moduleNFT,
        address _achievementNFT,
        address _moduleProgressVerifier,
        address _learningAchievementVerifier
    ) Ownable(msg.sender) {
        moduleNFT = ModuleProgressNFT(_moduleNFT);
        achievementNFT = LearningAchievementNFT(_achievementNFT);
        moduleProgressVerifier = ModuleProgressVerifier(_moduleProgressVerifier);
        learningAchievementVerifier = LearningAchievementVerifier(_learningAchievementVerifier);
    }

    /**
     * @dev Verify zkSNARK proof for module progress
     */
    function verifyModuleProgressProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[9] memory publicInputs, // moduleId, studentHash, minScore, maxTime, maxAttempts, commitmentHash, score, extraField, extra
        string memory metadataUri,
        uint256 score
    ) public whenNotPaused nonReentrant rateLimited returns (bool) {
        require(address(moduleProgressVerifier) != address(0), "Module progress verifier not set");
        
        // Verify the proof using snarkjs-generated verifier
        bool isValid = moduleProgressVerifier.verifyProof(a, b, c, publicInputs);
        
        if (isValid) {
            // Create proof hash for uniqueness check (split to avoid stack too deep)
            bytes32 hash1 = keccak256(abi.encodePacked(
                a[0], a[1], b[0][0], b[0][1]
            ));
            bytes32 hash2 = keccak256(abi.encodePacked(
                b[1][0], b[1][1], c[0], c[1]
            ));
            bytes32 hash3 = keccak256(abi.encodePacked(
                publicInputs[0], publicInputs[1], publicInputs[2], publicInputs[3]
            ));
            bytes32 hash4 = keccak256(abi.encodePacked(
                publicInputs[4], publicInputs[5], publicInputs[6], publicInputs[7]
            ));
            bytes32 proofHash = keccak256(abi.encodePacked(hash1, hash2, hash3, hash4));
            
            require(!usedProofs[proofHash], "Proof already used");
            usedProofs[proofHash] = true;
            
            // Extract student address from hash (assuming it's the second public input)
            address student = address(uint160(publicInputs[1]));
            
            // Store proof verification for student to mint later
            verifiedProofs[proofHash] = true;
            proofStudent[proofHash] = student;
            
            emit ProofVerified(student, "module_progress", proofHash, true, block.timestamp);
            
            return true;
        }
        
        return false;
    }

    /**
     * @dev Verify zkSNARK proof for learning achievement
     */
    function verifyLearningAchievementProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[9] memory publicInputs, // skillType, studentHash, minModules, minScore, minPractice, commitmentHash, skillLevelHash, achievementType, extraField
        string memory metadataUri,
        string memory skillType
    ) public whenNotPaused nonReentrant rateLimited returns (bool) {
        require(address(learningAchievementVerifier) != address(0), "Learning achievement verifier not set");
        
        // Verify the proof using snarkjs-generated verifier
        bool isValid = learningAchievementVerifier.verifyProof(a, b, c, publicInputs);
        
        if (isValid) {
            // Create proof hash for uniqueness check (split to avoid stack too deep)
            bytes32 hash1 = keccak256(abi.encodePacked(
                a[0], a[1], b[0][0], b[0][1]
            ));
            bytes32 hash2 = keccak256(abi.encodePacked(
                b[1][0], b[1][1], c[0], c[1]
            ));
            bytes32 hash3 = keccak256(abi.encodePacked(
                publicInputs[0], publicInputs[1], publicInputs[2], publicInputs[3]
            ));
            bytes32 hash4 = keccak256(abi.encodePacked(
                publicInputs[4], publicInputs[5], publicInputs[6], publicInputs[7]
            ));
            bytes32 hash5 = keccak256(abi.encodePacked(
                publicInputs[8]
            ));
            bytes32 proofHash = keccak256(abi.encodePacked(hash1, hash2, hash3, hash4, hash5));
            
            require(!usedProofs[proofHash], "Proof already used");
            usedProofs[proofHash] = true;
            
            // Extract student address from hash
            address student = address(uint160(publicInputs[1]));
            
            // Store proof verification for student to mint later
            verifiedProofs[proofHash] = true;
            proofStudent[proofHash] = student;
            
            emit ProofVerified(student, "learning_achievement", proofHash, true, block.timestamp);
            
            return true;
        }
        
        return false;
    }

    /**
     * @dev Batch verify multiple module progress proofs
     */
    function batchVerifyModuleProgressProofs(
        uint256[2][] memory a,
        uint256[2][2][] memory b,
        uint256[2][] memory c,
        uint256[9][] memory publicInputs,
        string[] memory metadataUris,
        uint256[] memory scores
    ) public whenNotPaused nonReentrant returns (bool[] memory) {
        require(
            a.length == b.length && b.length == c.length && 
            c.length == publicInputs.length && publicInputs.length == metadataUris.length &&
            metadataUris.length == scores.length,
            "Array lengths must match"
        );
        
        bool[] memory results = new bool[](a.length);
        
        for (uint256 i = 0; i < a.length; i++) {
            // Temporarily disable rate limiting for batch operations
            bool isValid = moduleProgressVerifier.verifyProof(a[i], b[i], c[i], publicInputs[i]);
            
            if (isValid) {
                // Create proof hash for uniqueness check (split to avoid stack too deep)
                bytes32 hash1 = keccak256(abi.encodePacked(
                    a[i][0], a[i][1], b[i][0][0], b[i][0][1]
                ));
                bytes32 hash2 = keccak256(abi.encodePacked(
                    b[i][1][0], b[i][1][1], c[i][0], c[i][1]
                ));
                bytes32 hash3 = keccak256(abi.encodePacked(
                    publicInputs[i][0], publicInputs[i][1], publicInputs[i][2], publicInputs[i][3]
                ));
                bytes32 hash4 = keccak256(abi.encodePacked(
                    publicInputs[i][4], publicInputs[i][5], publicInputs[i][6], publicInputs[i][7]
                ));
                bytes32 proofHash = keccak256(abi.encodePacked(hash1, hash2, hash3, hash4));
                
                if (!usedProofs[proofHash]) {
                    usedProofs[proofHash] = true;
                    
                    // Extract student address from hash
                    address student = address(uint160(publicInputs[i][1]));
                    
                    // Store proof verification for student to mint later
                    verifiedProofs[proofHash] = true;
                    proofStudent[proofHash] = student;
                    
                    emit ProofVerified(student, "module_progress", proofHash, true, block.timestamp);
                    
                    results[i] = true;
                }
            }
        }
        
        return results;
    }

    // Admin functions
    function setLearningAchievementVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid verifier address");
        learningAchievementVerifier = LearningAchievementVerifier(_verifier);
        emit VerifierUpdated("learning_achievement", _verifier, block.timestamp);
    }
    
    function setModuleProgressVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid verifier address");
        moduleProgressVerifier = ModuleProgressVerifier(_verifier);
        emit VerifierUpdated("module_progress", _verifier, block.timestamp);
    }
    
    function setSubmissionCooldown(uint256 newCooldown) external onlyOwner {
        require(newCooldown >= 10 seconds, "Cooldown too short");
        require(newCooldown <= 1 hours, "Cooldown too long");
        submissionCooldown = newCooldown;
    }
    
    function incrementUserNonce(address user) external onlyOwner {
        userNonces[user]++;
    }
    
    // Emergency functions
    function emergencyPause() external onlyOwner {
        _pause();
    }
    
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function updateModuleNFT(address _moduleNFT) external onlyOwner {
        require(_moduleNFT != address(0), "Invalid address");
        moduleNFT = ModuleProgressNFT(_moduleNFT);
    }
    
    function updateAchievementNFT(address _achievementNFT) external onlyOwner {
        require(_achievementNFT != address(0), "Invalid address");
        achievementNFT = LearningAchievementNFT(_achievementNFT);
    }
    
    // View functions
    function getUserNonce(address user) external view returns (uint256) {
        return userNonces[user];
    }
    
    function isProofUsed(bytes32 proofHash) external view returns (bool) {
        return usedProofs[proofHash];
    }
    
    function canSubmit(address user) external view returns (bool) {
        return block.timestamp >= lastSubmission[user] + submissionCooldown;
    }
    
    function getLearningAchievementVerifier() external view returns (address) {
        return address(learningAchievementVerifier);
    }
    
    function getModuleProgressVerifier() external view returns (address) {
        return address(moduleProgressVerifier);
    }
} 