// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LearningAchievementNFT
 * @dev ERC-721 NFT contract for learning achievements
 * Supports different types of achievements with expiration dates
 */
contract LearningAchievementNFT is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    enum AchievementType {
        COURSE_COMPLETION,
        SKILL_MASTERY,
        CERTIFICATION,
        MILESTONE,
        SPECIAL_RECOGNITION
    }

    struct Achievement {
        uint256 tokenId;
        AchievementType achievementType;
        string title;
        string description;
        string metadataURI;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevoked;
    }

    // Mapping from token ID to achievement details
    mapping(uint256 => Achievement) public achievements;
    
    // Mapping from token ID to token URI
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping from achievement hash to token ID for uniqueness
    mapping(string => uint256) public achievementHashToTokenId;
    
    // Mapping from student address to their achievement token IDs
    mapping(address => uint256[]) public studentAchievements;
    
    // Mapping from student address to achievement type count
    mapping(address => mapping(AchievementType => uint256)) public studentAchievementCount;

    // Events
    event AchievementMinted(
        address indexed student,
        uint256 indexed tokenId,
        AchievementType achievementType,
        string title,
        string metadataURI
    );

    event AchievementRevoked(
        address indexed student,
        uint256 indexed tokenId,
        string reason
    );

    constructor() ERC721("Learning Achievement NFT", "LARN") Ownable(msg.sender) {}

    function mintAchievement(
        address student,
        AchievementType achievementType,
        string memory title,
        string memory description,
        string memory metadataURI,
        uint256 expiresAt
    ) public onlyOwner returns (uint256) {
        // Create achievement hash for uniqueness
        string memory achievementHash = _createAchievementHash(
            student,
            achievementType,
            title,
            description
        );

        // Check if achievement already exists
        require(
            achievementHashToTokenId[achievementHash] == 0,
            "Achievement already exists for this student and criteria"
        );

        uint256 newTokenId = _nextTokenId++;

        // Create achievement
        Achievement memory newAchievement = Achievement({
            tokenId: newTokenId,
            achievementType: achievementType,
            title: title,
            description: description,
            metadataURI: metadataURI,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            isRevoked: false
        });

        achievements[newTokenId] = newAchievement;
        _tokenURIs[newTokenId] = metadataURI;
        achievementHashToTokenId[achievementHash] = newTokenId;
        studentAchievements[student].push(newTokenId);
        studentAchievementCount[student][achievementType]++;

        // Mint NFT
        _safeMint(student, newTokenId);

        emit AchievementMinted(student, newTokenId, achievementType, title, metadataURI);
        return newTokenId;
    }

    function mintCourseCompletion(
        address student,
        string memory courseName,
        string memory description,
        string memory metadataURI
    ) public onlyOwner returns (uint256) {
        return mintAchievement(
            student,
            AchievementType.COURSE_COMPLETION,
            courseName,
            description,
            metadataURI,
            0 // Never expires
        );
    }

    function mintSkillMastery(
        address student,
        string memory skillName,
        string memory description,
        string memory metadataURI,
        uint256 expiresAt
    ) public onlyOwner returns (uint256) {
        return mintAchievement(
            student,
            AchievementType.SKILL_MASTERY,
            skillName,
            description,
            metadataURI,
            expiresAt
        );
    }

    function mintCertification(
        address student,
        string memory certificationName,
        string memory description,
        string memory metadataURI,
        uint256 expiresAt
    ) public onlyOwner returns (uint256) {
        return mintAchievement(
            student,
            AchievementType.CERTIFICATION,
            certificationName,
            description,
            metadataURI,
            expiresAt
        );
    }

    function revokeAchievement(uint256 tokenId, string memory reason) public onlyOwner {
        require(_tokenExists(tokenId), "Achievement does not exist");
        require(!achievements[tokenId].isRevoked, "Achievement already revoked");

        achievements[tokenId].isRevoked = true;
        emit AchievementRevoked(ownerOf(tokenId), tokenId, reason);
    }

    function checkAchievementValidity(uint256 tokenId) public view returns (bool) {
        if (!_tokenExists(tokenId)) return false;
        
        Achievement memory achievement = achievements[tokenId];
        
        // Check if revoked
        if (achievement.isRevoked) return false;
        
        // Check if expired
        if (achievement.expiresAt > 0 && block.timestamp > achievement.expiresAt) {
            return false;
        }
        
        return true;
    }

    function getStudentAchievements(address student) public view returns (uint256[] memory) {
        return studentAchievements[student];
    }

    // Split getAchievementDetails into smaller functions to avoid stack too deep
    function getAchievementType(uint256 tokenId) public view returns (AchievementType) {
        require(_tokenExists(tokenId), "Achievement does not exist");
        return achievements[tokenId].achievementType;
    }

    function getAchievementTitle(uint256 tokenId) public view returns (string memory) {
        require(_tokenExists(tokenId), "Achievement does not exist");
        return achievements[tokenId].title;
    }

    function getAchievementDescription(uint256 tokenId) public view returns (string memory) {
        require(_tokenExists(tokenId), "Achievement does not exist");
        return achievements[tokenId].description;
    }

    function getAchievementMetadataURI(uint256 tokenId) public view returns (string memory) {
        require(_tokenExists(tokenId), "Achievement does not exist");
        return achievements[tokenId].metadataURI;
    }

    function getAchievementIssuedAt(uint256 tokenId) public view returns (uint256) {
        require(_tokenExists(tokenId), "Achievement does not exist");
        return achievements[tokenId].issuedAt;
    }

    function getAchievementExpiresAt(uint256 tokenId) public view returns (uint256) {
        require(_tokenExists(tokenId), "Achievement does not exist");
        return achievements[tokenId].expiresAt;
    }

    function getAchievementIsRevoked(uint256 tokenId) public view returns (bool) {
        require(_tokenExists(tokenId), "Achievement does not exist");
        return achievements[tokenId].isRevoked;
    }

    function getStudentAchievementCount(address student, AchievementType achievementType) 
        public view returns (uint256) {
        return studentAchievementCount[student][achievementType];
    }

    function _createAchievementHash(
        address student,
        AchievementType achievementType,
        string memory title,
        string memory description
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            student,
            uint256(achievementType),
            title,
            description
        ));
    }

    // Helper function to check if token exists (OpenZeppelin v5 compatible)
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }

    // Override tokenURI to return custom URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_tokenExists(tokenId), "ERC721: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    // Function to update token URI (only owner)
    function setTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        require(_tokenExists(tokenId), "ERC721: URI set for nonexistent token");
        _tokenURIs[tokenId] = uri;
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}