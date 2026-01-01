// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract LinkLockr is ERC1155 {
    // Safety Cap: Protocol forbids charging more than 5%
    uint256 public constant MAX_FEE_BPS = 500; 

    struct LinkData {
        uint256 price;
        address creator;
        bool active;
        string ipfsHash;
        string slug;
    }

    // Lookup: keccak256(slug) -> Link Data
    mapping(bytes32 => LinkData) public links;

    event LinkCreated(string slug, address indexed creator, uint256 price, string ipfsHash);
    event LinkPurchased(string slug, address indexed buyer, address indexed creator, uint256 feePaid);

    constructor() 
        ERC1155("https://linklockr.xyz/api/metadata/{id}.json") 
    {
    }

    // --- 1. CREATE (Permissionless) ---
    function createLink(string calldata _slug, uint256 _price, string calldata _ipfsHash) external {
        // Generate ID from the slug string
        bytes32 slugId = keccak256(abi.encodePacked(_slug));
        
        require(!links[slugId].active, "Slug already taken");
        require(_price > 0, "Price must be > 0");

        links[slugId] = LinkData({
            price: _price,
            creator: msg.sender,
            active: true,
            ipfsHash: _ipfsHash,
            slug: _slug
        });

        // Mint the Admin/Creator Token (Balance = 1)
        _mint(msg.sender, uint256(slugId), 1, "");
        
        emit LinkCreated(_slug, msg.sender, _price, _ipfsHash);
    }

    // --- 2. BUY (Overloaded) ---
    
    // Path A: Public Utility (0% Fee)
    // Direct interaction with contract via Etherscan/Scripts
    function buyLink(string calldata _slug, address _recipient) external payable {
        _processBuy(_slug, _recipient, address(0), 0);
    }

    // Path B: Premium Frontend Interface (Custom Fee, up to 5%)
    function buyLink(string calldata _slug, address _recipient, address _feeRecipient, uint256 _feeBps) external payable {
        require(_feeBps <= MAX_FEE_BPS, "Fee exceeds protocol limit");
        _processBuy(_slug, _recipient, _feeRecipient, _feeBps);
    }

    // Internal Logic
    function _processBuy(string calldata _slug, address _recipient, address _feeRecipient, uint256 _feeBps) internal {
        bytes32 slugId = keccak256(abi.encodePacked(_slug));
        LinkData memory link = links[slugId];
        
        require(link.active, "Link not found or inactive");
        // Buyer must send exact ETH amount equal to price
        require(msg.value == link.price, "Incorrect payment amount");

        uint256 fee = 0;

        // Only calculate fee if a valid recipient and > 0 BPS are passed
        if (_feeRecipient != address(0) && _feeBps > 0) {
            fee = (link.price * _feeBps) / 10000;
            // Transfer Fee
            (bool sentFee, ) = _feeRecipient.call{value: fee}("");
            require(sentFee, "Fee transfer failed");
        }

        // Pay Creator the rest (Price - Fee)
        uint256 creatorShare = link.price - fee;
        (bool sentCreator, ) = link.creator.call{value: creatorShare}("");
        require(sentCreator, "Creator payment failed");

        // Mint Access Token to Buyer
        _mint(_recipient, uint256(slugId), 1, "");
        
        emit LinkPurchased(_slug, _recipient, link.creator, fee);
    }
}