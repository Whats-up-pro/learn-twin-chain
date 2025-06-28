// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ModuleProgressNFT is ERC1155, ERC1155URIStorage, Ownable {
    // Module completion tracking
    mapping(string => uint256) public moduleToTokenId; // moduleId -> tokenId
    mapping(address => mapping(uint256 => uint256)) public studentModuleProgress; // student -> tokenId -> amount
    mapping(uint256 => string) public tokenIdToModule; // tokenId -> moduleId
    
    // Learning milestones tracking
    mapping(address => uint256) public studentTotalModules; // student -> total completed modules
    mapping(address => uint256) public studentLearningLevel; // student -> learning level (1-5)
    
    // Token ID counter
    uint256 private _nextTokenId = 1;
    
    // Events
    event ModuleCompleted(
        address indexed student,
        uint256 indexed tokenId,
        string moduleId,
        uint256 amount,
        string metadataURI
    );
    
    event LearningLevelUp(
        address indexed student,
        uint256 newLevel,
        uint256 totalModules
    );

    constructor() ERC1155("") Ownable(msg.sender) {}

    function mintModuleCompletion(
        address student,
        string memory moduleId,
        string memory metadataURI,
        uint256 amount
    ) public onlyOwner returns (uint256) {
        // Check if module already has a token ID
        uint256 tokenId = moduleToTokenId[moduleId];
        
        if (tokenId == 0) {
            // Create new token for this module
            tokenId = _nextTokenId++;
            moduleToTokenId[moduleId] = tokenId;
            tokenIdToModule[tokenId] = moduleId;
            _setURI(tokenId, metadataURI);
        }
        
        // Mint tokens to student
        _mint(student, tokenId, amount, "");
        
        // Update student progress
        studentModuleProgress[student][tokenId] += amount;
        studentTotalModules[student] += amount;
        
        // Check for level up
        _checkAndUpdateLevel(student);
        
        emit ModuleCompleted(student, tokenId, moduleId, amount, metadataURI);
        return tokenId;
    }

    function _checkAndUpdateLevel(address student) internal {
        uint256 totalModules = studentTotalModules[student];
        uint256 currentLevel = studentLearningLevel[student];
        uint256 newLevel = _calculateLevel(totalModules);
        
        if (newLevel > currentLevel) {
            studentLearningLevel[student] = newLevel;
            emit LearningLevelUp(student, newLevel, totalModules);
        }
    }

    function _calculateLevel(uint256 totalModules) internal pure returns (uint256) {
        if (totalModules >= 20) return 5; // Master
        if (totalModules >= 15) return 4; // Advanced
        if (totalModules >= 10) return 3; // Intermediate
        if (totalModules >= 5) return 2;  // Beginner
        return 1; // Novice
    }

    function getStudentProgress(address student) public view returns (
        uint256 totalModules,
        uint256 currentLevel,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) {
        totalModules = studentTotalModules[student];
        currentLevel = studentLearningLevel[student];
        
        // Get all tokens owned by student
        uint256 tokenCount = _nextTokenId - 1;
        uint256[] memory tempTokenIds = new uint256[](tokenCount);
        uint256[] memory tempAmounts = new uint256[](tokenCount);
        uint256 actualCount = 0;
        
        for (uint256 i = 1; i < _nextTokenId; i++) {
            uint256 balance = balanceOf(student, i);
            if (balance > 0) {
                tempTokenIds[actualCount] = i;
                tempAmounts[actualCount] = balance;
                actualCount++;
            }
        }
        
        // Create properly sized arrays
        tokenIds = new uint256[](actualCount);
        amounts = new uint256[](actualCount);
        
        for (uint256 i = 0; i < actualCount; i++) {
            tokenIds[i] = tempTokenIds[i];
            amounts[i] = tempAmounts[i];
        }
    }

    function getModuleTokenId(string memory moduleId) public view returns (uint256) {
        return moduleToTokenId[moduleId];
    }

    function getModuleFromTokenId(uint256 tokenId) public view returns (string memory) {
        return tokenIdToModule[tokenId];
    }

    // Override required functions for OpenZeppelin v5
    function uri(uint256 tokenId) public view override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return super.uri(tokenId);
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}