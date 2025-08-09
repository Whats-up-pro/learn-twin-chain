// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LearningDataRegistry
 * @dev Decentralized learning data storage on blockchain
 * Stores learning evidence hashes and validates learning data
 */
contract LearningDataRegistry is Ownable, ReentrancyGuard, Pausable {
    
    // ============ STRUCTS ============
    struct LearningSession {
        address student;
        string moduleId;
        bytes32 learningDataHash; // IPFS hash of learning data
        uint256 timestamp;
        uint256 score;
        uint256 timeSpent;
        uint256 attempts;
        bool isVerified;
        address[] validators;
        mapping(address => bool) validatorApprovals;
        uint256 approvalCount;
    }
    
    struct LearningEvidence {
        bytes32 sessionHash;
        string ipfsHash;
        uint256 timestamp;
        bool exists;
    }
    
    // ============ STATE VARIABLES ============
    mapping(bytes32 => LearningSession) public learningSessions;
    mapping(bytes32 => LearningEvidence) public learningEvidence;
    mapping(address => bool) public authorizedValidators;
    mapping(address => bytes32[]) public studentSessions;
    
    uint256 public minValidators = 1;
    uint256 public sessionTimeout = 24 hours;  // Tăng từ 1 hour lên 24 hours
    uint256 public totalSessions;
    
    // ============ EVENTS ============
    event LearningSessionCreated(
        bytes32 indexed sessionHash,
        address indexed student,
        string moduleId,
        bytes32 learningDataHash,
        uint256 timestamp
    );
    
    event LearningSessionVerified(
        bytes32 indexed sessionHash,
        address indexed validator,
        bool approved,
        uint256 approvalCount
    );
    
    event LearningEvidenceStored(
        bytes32 indexed evidenceHash,
        string ipfsHash,
        uint256 timestamp
    );
    
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    
    // ============ CONSTRUCTOR ============
    constructor(address initialOwner) Ownable(initialOwner) {
        authorizedValidators[initialOwner] = true;
        emit ValidatorAdded(initialOwner);
    }
    
    // ============ MODIFIERS ============
    modifier onlyAuthorizedValidator() {
        require(authorizedValidators[msg.sender], "LearningDataRegistry: Not authorized validator");
        _;
    }
    
    modifier sessionExists(bytes32 sessionHash) {
        require(learningSessions[sessionHash].timestamp > 0, "LearningDataRegistry: Session does not exist");
        _;
    }
    
    modifier sessionNotExpired(bytes32 sessionHash) {
        require(
            block.timestamp - learningSessions[sessionHash].timestamp <= sessionTimeout,
            "LearningDataRegistry: Session expired"
        );
        _;
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Create a new learning session
     * @param moduleId The module identifier
     * @param learningDataHash IPFS hash of learning data
     * @param score Student's score
     * @param timeSpent Time spent learning
     * @param attempts Number of attempts
     */
    function createLearningSession(
        string memory moduleId,
        bytes32 learningDataHash,
        uint256 score,
        uint256 timeSpent,
        uint256 attempts
    ) external whenNotPaused nonReentrant returns (bytes32) {
        require(bytes(moduleId).length > 0, "LearningDataRegistry: Empty module ID");
        require(score <= 100, "LearningDataRegistry: Invalid score");
        require(timeSpent > 0, "LearningDataRegistry: Invalid time spent");
        require(attempts > 0, "LearningDataRegistry: Invalid attempts");
        
        // Create session hash
        bytes32 sessionHash = keccak256(abi.encodePacked(
            msg.sender,
            moduleId,
            learningDataHash,
            block.timestamp,
            block.chainid
        ));
        
        require(learningSessions[sessionHash].timestamp == 0, "LearningDataRegistry: Session already exists");
        
        // Create learning session
        LearningSession storage session = learningSessions[sessionHash];
        session.student = msg.sender;
        session.moduleId = moduleId;
        session.learningDataHash = learningDataHash;
        session.timestamp = block.timestamp;
        session.score = score;
        session.timeSpent = timeSpent;
        session.attempts = attempts;
        session.isVerified = false;
        session.approvalCount = 0;
        
        // Add to student's sessions
        studentSessions[msg.sender].push(sessionHash);
        totalSessions++;
        
        emit LearningSessionCreated(sessionHash, msg.sender, moduleId, learningDataHash, block.timestamp);
        
        return sessionHash;
    }
    
    /**
     * @dev Store learning evidence on IPFS and blockchain
     * @param sessionHash The learning session hash
     * @param ipfsHash IPFS hash of the learning evidence
     */
    function storeLearningEvidence(
        bytes32 sessionHash,
        string memory ipfsHash
    ) external whenNotPaused nonReentrant sessionExists(sessionHash) {
        require(bytes(ipfsHash).length > 0, "LearningDataRegistry: Empty IPFS hash");
        
        LearningEvidence storage evidence = learningEvidence[sessionHash];
        evidence.sessionHash = sessionHash;
        evidence.ipfsHash = ipfsHash;
        evidence.timestamp = block.timestamp;
        evidence.exists = true;
        
        emit LearningEvidenceStored(sessionHash, ipfsHash, block.timestamp);
    }
    
    /**
     * @dev Validator approves or rejects learning session
     * @param sessionHash The learning session hash
     * @param approved Whether the session is approved
     */
    function validateLearningSession(
        bytes32 sessionHash,
        bool approved
    ) external whenNotPaused nonReentrant onlyAuthorizedValidator sessionExists(sessionHash) sessionNotExpired(sessionHash) {
        LearningSession storage session = learningSessions[sessionHash];
        
        require(!session.validatorApprovals[msg.sender], "LearningDataRegistry: Already validated");
        
        session.validatorApprovals[msg.sender] = approved;
        session.validators.push(msg.sender);
        
        if (approved) {
            session.approvalCount++;
        }
        
        emit LearningSessionVerified(sessionHash, msg.sender, approved, session.approvalCount);
        
        // Auto-verify if enough approvals
        if (session.approvalCount >= minValidators) {
            session.isVerified = true;
        }
    }
    
    /**
     * @dev Check if learning session is verified
     * @param sessionHash The learning session hash
     * @return True if session is verified
     */
    function isSessionVerified(bytes32 sessionHash) external view returns (bool) {
        return learningSessions[sessionHash].isVerified;
    }
    
    /**
     * @dev Get learning session data
     * @param sessionHash The learning session hash
     * @return student The student address
     * @return moduleId The module identifier
     * @return learningDataHash The IPFS hash of learning data
     * @return timestamp The session timestamp
     * @return score The student's score
     * @return timeSpent The time spent learning
     * @return attempts The number of attempts
     * @return isVerified Whether the session is verified
     * @return approvalCount The number of validator approvals
     */
    function getLearningSession(bytes32 sessionHash) external view returns (
        address student,
        string memory moduleId,
        bytes32 learningDataHash,
        uint256 timestamp,
        uint256 score,
        uint256 timeSpent,
        uint256 attempts,
        bool isVerified,
        uint256 approvalCount
    ) {
        LearningSession storage session = learningSessions[sessionHash];
        return (
            session.student,
            session.moduleId,
            session.learningDataHash,
            session.timestamp,
            session.score,
            session.timeSpent,
            session.attempts,
            session.isVerified,
            session.approvalCount
        );
    }
    
    /**
     * @dev Get learning evidence
     * @param sessionHash The learning session hash
     * @return ipfsHash The IPFS hash of evidence
     * @return timestamp The evidence timestamp
     * @return exists Whether the evidence exists
     */
    function getLearningEvidence(bytes32 sessionHash) external view returns (
        string memory ipfsHash,
        uint256 timestamp,
        bool exists
    ) {
        LearningEvidence storage evidence = learningEvidence[sessionHash];
        return (evidence.ipfsHash, evidence.timestamp, evidence.exists);
    }
    
    /**
     * @dev Get student's learning sessions
     * @param student The student address
     * @return Array of session hashes
     */
    function getStudentSessions(address student) external view returns (bytes32[] memory) {
        return studentSessions[student];
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Add authorized validator
     */
    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "LearningDataRegistry: Invalid validator address");
        require(!authorizedValidators[validator], "LearningDataRegistry: Validator already authorized");
        
        authorizedValidators[validator] = true;
        emit ValidatorAdded(validator);
    }
    
    /**
     * @dev Remove authorized validator
     */
    function removeValidator(address validator) external onlyOwner {
        require(authorizedValidators[validator], "LearningDataRegistry: Validator not authorized");
        
        authorizedValidators[validator] = false;
        emit ValidatorRemoved(validator);
    }
    
    /**
     * @dev Update minimum validators required
     */
    function updateMinValidators(uint256 newMinValidators) external onlyOwner {
        require(newMinValidators > 0, "LearningDataRegistry: Invalid min validators");
        minValidators = newMinValidators;
    }
    
    /**
     * @dev Update session timeout
     */
    function updateSessionTimeout(uint256 newTimeout) external onlyOwner {
        sessionTimeout = newTimeout;
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
} 