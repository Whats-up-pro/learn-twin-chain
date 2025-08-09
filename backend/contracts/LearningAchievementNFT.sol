// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ZKLearningVerifier.sol";

/**
 * @title LearningAchievementNFT
 * @dev ERC-721 NFT contract for learning achievements
 * Features: Signature-based minting, achievement levels, security measures
 */
contract LearningAchievementNFT is ERC721, Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using Strings for uint256;

    // ============ ENUMS ============
    enum AchievementType {
        COURSE_COMPLETION,
        SKILL_CERTIFICATION,
        LEARNING_MILESTONE,
        EXCELLENCE_AWARD,
        INNOVATION_PROJECT
    }

    // ============ STRUCTS ============
    struct Achievement {
        uint256 tokenId;
        address student;
        AchievementType achievementType;
        string title;
        string description;
        string metadataURI;
        uint256 score;
        uint256 mintedAt;
        bool isVerified;
        uint256 expiresAt;
    }
    
    struct ZKProofData {
        uint256[2] proofA;
        uint256[2][2] proofB;
        uint256[2] proofC;
        uint256[9] publicInputs;
    }

    // Struct for minting parameters to reduce stack depth
    struct MintParams {
        AchievementType achievementType;
        string title;
        string description;
        string metadataURI;
        uint256 score;
        uint256 expiresAt;
    }

    // ============ STATE VARIABLES ============
    uint256 private _tokenIds;
    mapping(bytes32 => bool) public usedSignatures;
    mapping(uint256 => Achievement) public achievements;
    mapping(address => uint256[]) public studentAchievements;
    mapping(address => bool) public authorizedSigners;
    mapping(AchievementType => bool) public validAchievementTypes;
    mapping(address => uint256) public nonces; // Nonce for each student
    
    ZKLearningVerifier public zkLearningVerifier; // Add ZK verifier reference
    
    uint256 public totalAchievements;
    uint256 public minScoreThreshold = 80; // Minimum score for achievements
    uint256 public signatureExpiryTime = 2 hours; // Signature expiry time
    uint256 public achievementExpiryTime = 365 days; // Achievement expiry time
    
    string public baseTokenURI;
    
    // Token URI storage
    mapping(uint256 => string) private _tokenURIs;

    // ============ EVENTS ============
    event AchievementMinted(
        uint256 indexed tokenId,
        address indexed student,
        AchievementType indexed achievementType,
        string title,
        string description,
        uint256 score,
        uint256 mintedAt,
        uint256 expiresAt,
        bytes32 proofHash // Add proof hash to event
    );
    
    event SignatureUsed(bytes32 indexed signatureHash, address indexed student, uint256 tokenId);
    event AuthorizedSignerAdded(address indexed signer);
    event AuthorizedSignerRemoved(address indexed signer);
    event MinScoreThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event SignatureExpiryTimeUpdated(uint256 oldTime, uint256 newTime);
    event AchievementExpiryTimeUpdated(uint256 oldTime, uint256 newTime);
    event ZKVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    // ============ CONSTRUCTOR ============
    constructor(
        string memory name,
        string memory symbol,
        string memory _baseTokenURI,
        address initialOwner,
        address _zkLearningVerifier // Add ZK verifier parameter
    ) ERC721(name, symbol) Ownable(initialOwner) {
        baseTokenURI = _baseTokenURI;
        authorizedSigners[initialOwner] = true;
        zkLearningVerifier = ZKLearningVerifier(_zkLearningVerifier);
        
        // Enable all achievement types by default
        for (uint8 i = 0; i < 5; i++) {
            validAchievementTypes[AchievementType(i)] = true;
        }
        
        emit AuthorizedSignerAdded(initialOwner);
    }

    // ============ MODIFIERS ============
    modifier onlyAuthorizedSigner() {
        require(authorizedSigners[msg.sender], "LearningAchievementNFT: Not authorized signer");
        _;
    }

    modifier validAchievementType(AchievementType achievementType) {
        require(validAchievementTypes[achievementType], "LearningAchievementNFT: Invalid achievement type");
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        require(_exists(tokenId), "LearningAchievementNFT: Token does not exist");
        _;
    }

    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Student mints achievement NFT using real ZK proof verification
     * @param params Minting parameters struct
     * @param proofData ZK proof data containing proofA, proofB, proofC, and publicInputs
     */
    function mintWithZKProof(
        MintParams calldata params,
        ZKProofData calldata proofData,
        bytes calldata signature,
        string calldata challengeNonce
    ) external whenNotPaused nonReentrant validAchievementType(params.achievementType) {
        _validateMintParams(params);
        
        bytes32 proofHash = _calculateProofHash(proofData);
        require(!usedSignatures[proofHash], "LearningAchievementNFT: Proof already used");
        _verifySenderSignature(signature, challengeNonce, params);
        
        bool isValid = _verifyZKProof(proofData, params.metadataURI, params.achievementType);
        require(isValid, "LearningAchievementNFT: Invalid ZK proof");
        
        _processMint(params, proofHash);
    }

    function _validateMintParams(MintParams calldata params) private view {
        require(params.score >= minScoreThreshold, "LearningAchievementNFT: Score below threshold");
        require(bytes(params.title).length > 0, "LearningAchievementNFT: Empty title");
        require(bytes(params.description).length > 0, "LearningAchievementNFT: Empty description");
        require(bytes(params.metadataURI).length > 0, "LearningAchievementNFT: Empty metadata URI");
    }

    function _calculateProofHash(ZKProofData calldata proofData) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            proofData.proofA[0], proofData.proofA[1], 
            proofData.proofB[0][0], proofData.proofB[0][1], proofData.proofB[1][0], proofData.proofB[1][1], 
            proofData.proofC[0], proofData.proofC[1],
            proofData.publicInputs[0], proofData.publicInputs[1], proofData.publicInputs[2], 
            proofData.publicInputs[3], proofData.publicInputs[4], proofData.publicInputs[5], 
            proofData.publicInputs[6], proofData.publicInputs[7]
        ));
    }

    function _verifyZKProof(
        ZKProofData calldata proofData, 
        string memory metadataURI, 
        AchievementType achievementType
    ) private returns (bool) {
        return zkLearningVerifier.verifyLearningAchievementProof(
            proofData.proofA, 
            proofData.proofB, 
            proofData.proofC, 
            proofData.publicInputs, 
            metadataURI, 
            _achievementTypeToString(achievementType)
        );
    }

    function _processMint(MintParams calldata params, bytes32 proofHash) private {
        // Mark proof as used to prevent replay
        usedSignatures[proofHash] = true;
        
        // Mint NFT
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(msg.sender, newTokenId);
        _tokenURIs[newTokenId] = params.metadataURI;
        
        // Record achievement
        achievements[newTokenId] = Achievement({
            tokenId: newTokenId,
            student: msg.sender,
            achievementType: params.achievementType,
            title: params.title,
            description: params.description,
            metadataURI: params.metadataURI,
            score: params.score,
            mintedAt: block.timestamp,
            isVerified: true,
            expiresAt: params.expiresAt
        });
        
        // Add to student's achievements
        studentAchievements[msg.sender].push(newTokenId);
        totalAchievements++;
        
        emit AchievementMinted(
            newTokenId, 
            msg.sender, 
            params.achievementType, 
            params.title, 
            params.description, 
            params.score, 
            block.timestamp, 
            params.expiresAt, 
            proofHash
        );
    }

    function _verifySenderSignature(
        bytes calldata signature,
        string calldata challengeNonce,
        MintParams calldata params
    ) private view {
        require(signature.length == 65, "LearningAchievementNFT: invalid signature length");
        // Message: bind chainId, contract, msg.sender, achievement params and nonce
        bytes32 messageHash = keccak256(
            abi.encode(
                block.chainid,
                address(this),
                msg.sender,
                params.achievementType,
                keccak256(bytes(params.title)),
                keccak256(bytes(params.description)),
                keccak256(bytes(params.metadataURI)),
                params.score,
                params.expiresAt,
                keccak256(bytes(challengeNonce))
            )
        ).toEthSignedMessageHash();
        address recovered = ECDSA.recover(messageHash, signature);
        require(recovered == msg.sender, "LearningAchievementNFT: invalid signature for sender");
    }

    /**
     * @dev Owner can mint directly (for testing or special cases)
     */
    function mintByOwner(
        address student,
        AchievementType achievementType,
        string memory title,
        string memory description,
        string memory metadataURI,
        uint256 score,
        uint256 expiresAt
    ) external onlyOwner whenNotPaused validAchievementType(achievementType) {
        require(score >= minScoreThreshold, "LearningAchievementNFT: Score below threshold");
        require(bytes(title).length > 0, "LearningAchievementNFT: Empty title");
        require(bytes(description).length > 0, "LearningAchievementNFT: Empty description");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(student, newTokenId);
        _tokenURIs[newTokenId] = metadataURI;
        
        achievements[newTokenId] = Achievement({
            tokenId: newTokenId,
            student: student,
            achievementType: achievementType,
            title: title,
            description: description,
            metadataURI: metadataURI,
            score: score,
            mintedAt: block.timestamp,
            isVerified: true,
            expiresAt: expiresAt
        });
        
        studentAchievements[student].push(newTokenId);
        totalAchievements++;
        
        emit AchievementMinted(newTokenId, student, achievementType, title, description, score, block.timestamp, expiresAt, bytes32(0));
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Add authorized signer
     */
    function addAuthorizedSigner(address signer) external onlyOwner {
        require(signer != address(0), "LearningAchievementNFT: Invalid signer address");
        require(!authorizedSigners[signer], "LearningAchievementNFT: Signer already authorized");
        
        authorizedSigners[signer] = true;
        emit AuthorizedSignerAdded(signer);
    }
    
    /**
     * @dev Remove authorized signer
     */
    function removeAuthorizedSigner(address signer) external onlyOwner {
        require(authorizedSigners[signer], "LearningAchievementNFT: Signer not authorized");
        
        authorizedSigners[signer] = false;
        emit AuthorizedSignerRemoved(signer);
    }
    
    /**
     * @dev Enable/disable achievement type
     */
    function setAchievementTypeValid(AchievementType achievementType, bool isValid) external onlyOwner {
        validAchievementTypes[achievementType] = isValid;
    }
    
    /**
     * @dev Update minimum score threshold
     */
    function updateMinScoreThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold <= 100, "LearningAchievementNFT: Invalid threshold");
        uint256 oldThreshold = minScoreThreshold;
        minScoreThreshold = newThreshold;
        emit MinScoreThresholdUpdated(oldThreshold, newThreshold);
    }
    
    /**
     * @dev Update signature expiry time
     */
    function updateSignatureExpiryTime(uint256 newExpiryTime) external onlyOwner {
        uint256 oldExpiryTime = signatureExpiryTime;
        signatureExpiryTime = newExpiryTime;
        emit SignatureExpiryTimeUpdated(oldExpiryTime, newExpiryTime);
    }
    
    /**
     * @dev Update achievement expiry time
     */
    function updateAchievementExpiryTime(uint256 newExpiryTime) external onlyOwner {
        uint256 oldExpiryTime = achievementExpiryTime;
        achievementExpiryTime = newExpiryTime;
        emit AchievementExpiryTimeUpdated(oldExpiryTime, newExpiryTime);
    }
    
    /**
     * @dev Update ZK learning verifier
     */
    function updateZKLearningVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "LearningAchievementNFT: Invalid verifier address");
        address oldVerifier = address(zkLearningVerifier);
        zkLearningVerifier = ZKLearningVerifier(newVerifier);
        emit ZKVerifierUpdated(oldVerifier, newVerifier);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get achievement details
     */
    function getAchievement(uint256 tokenId) external view tokenExists(tokenId) returns (Achievement memory) {
        return achievements[tokenId];
    }
    
    /**
     * @dev Get all achievements for a student
     */
    function getStudentAchievements(address student) external view returns (uint256[] memory) {
        return studentAchievements[student];
    }
    
    /**
     * @dev Check if achievement is expired
     */
    function isAchievementExpired(uint256 tokenId) external view tokenExists(tokenId) returns (bool) {
        Achievement memory achievement = achievements[tokenId];
        if (achievement.expiresAt == 0) return false; // No expiry
        return block.timestamp > achievement.expiresAt;
    }
    
    /**
     * @dev Get total achievements by type for a student
     */
    function getStudentAchievementCountByType(address student, AchievementType achievementType) 
        external view returns (uint256) {
        uint256 count = 0;
        uint256[] memory tokenIds = studentAchievements[student];
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (achievements[tokenIds[i]].achievementType == achievementType) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @dev Check if signature is used
     */
    function isSignatureUsed(bytes32 signatureHash) external view returns (bool) {
        return usedSignatures[signatureHash];
    }
    
    /**
     * @dev Get total token count
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }
    
    /**
     * @dev Get ZK learning verifier address
     */
    function getZKLearningVerifier() external view returns (address) {
        return address(zkLearningVerifier);
    }

    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Convert achievement type to string
     */
    function _achievementTypeToString(AchievementType achievementType) internal pure returns (string memory) {
        if (achievementType == AchievementType.COURSE_COMPLETION) return "course_completion";
        if (achievementType == AchievementType.SKILL_CERTIFICATION) return "skill_certification";
        if (achievementType == AchievementType.LEARNING_MILESTONE) return "learning_milestone";
        if (achievementType == AchievementType.EXCELLENCE_AWARD) return "excellence_award";
        if (achievementType == AchievementType.INNOVATION_PROJECT) return "innovation_project";
        return "unknown";
    }
    
    /**
     * @dev Set token URI
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    /**
     * @dev Get token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();
        
        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }
    
    /**
     * @dev Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
}