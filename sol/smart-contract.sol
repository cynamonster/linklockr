// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LinkLockr is ERC1155 {
    IERC20 public immutable usdcToken;
    
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

    constructor(address _usdcAddress) 
        ERC1155("https://linklockr.xyz/api/metadata/{id}.json") 
    {
        usdcToken = IERC20(_usdcAddress);
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
    
    // Option A: The "Public Good" Path (0% Fee)
    // Used by people interacting directly via Etherscan/Scripts
    function buyLink(string calldata _slug, address _recipient) external {
        _processBuy(_slug, _recipient, address(0), 0);
    }

    // Option B: The "Interface" Path (Custom Fee)
    // Used by your Frontend to charge 5%
    function buyLink(string calldata _slug, address _recipient, address _feeRecipient, uint256 _feeBps) external {
        require(_feeBps <= MAX_FEE_BPS, "Fee exceeds protocol limit");
        _processBuy(_slug, _recipient, _feeRecipient, _feeBps);
    }

    // Internal Logic
    function _processBuy(string calldata _slug, address _recipient, address _feeRecipient, uint256 _feeBps) internal {
        bytes32 slugId = keccak256(abi.encodePacked(_slug));
        LinkData memory link = links[slugId];
        
        require(link.active, "Link not found or inactive");

        uint256 fee = 0;
        
        // Only calculate fee if a valid recipient and > 0 BPS are passed
        if (_feeRecipient != address(0) && _feeBps > 0) {
            fee = (link.price * _feeBps) / 10000;
            // Transfer Fee
            require(usdcToken.transferFrom(msg.sender, _feeRecipient, fee), "Fee transfer failed");
        }

        // Pay Creator the rest (Price - Fee)
        uint256 creatorShare = link.price - fee;
        require(usdcToken.transferFrom(msg.sender, link.creator, creatorShare), "Creator payment failed");

        // Mint Access Token to Buyer
        _mint(_recipient, uint256(slugId), 1, "");
        
        emit LinkPurchased(_slug, _recipient, link.creator, fee);
    }
}