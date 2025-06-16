// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract LearnTwinNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    mapping(string => uint256) public moduleToTokenId; // moduleId -> tokenId

    event AchievementMinted(address indexed learner, uint256 indexed tokenId, string moduleId, string tokenURI);

    constructor() ERC721("LearnTwinAchievement", "LTA") {}

    function mintAchievement(address learner, string memory moduleId, string memory tokenURI)
        public
        onlyOwner  // Or a specific minter role
        returns (uint256)
    {
        require(moduleToTokenId[moduleId] == 0, "NFT for this module already minted to someone or this module ID is in use."); // Simple check, can be more robust

        _tokenIdCounter.increment();
        uint256 newItemId = _tokenIdCounter.current();
        _safeMint(learner, newItemId);
        _setTokenURI(newItemId, tokenURI);

        moduleToTokenId[moduleId] = newItemId; // Optional: track if module ID has an associated token

        emit AchievementMinted(learner, newItemId, moduleId, tokenURI);
        return newItemId;
    }

    // The following functions are overrides required by Solidity.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721URIStorage)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}