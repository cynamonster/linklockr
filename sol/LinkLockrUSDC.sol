// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LinkLockrUSDC
 * @notice Decentralized, token-gated digital vending machine on Base settled in Native USDC.
 * @dev ERC-1155 access tokens are minted upon successful payment.
 *      Affiliate and creator referral splits are handled off-chain via Supabase indexing,
 *      while the protocol guarantees immutable non-custodial payouts directly to creator and platform wallets.
 */
contract LinkLockrUSDC is ERC1155, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Safety Cap: Protocol limits platform convenience fee to at most 5% (500 bps)
    uint256 public constant MAX_FEE_BPS = 500; 

    // Base Native USDC Contract:
    // Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (6 decimals)
    // Sepolia Testnet: 0x036CbD53842c5426634e7929541eC2318f3dCF7e (6 decimals)
    IERC20 public immutable usdcToken;

    struct LinkData {
        uint256 price;       // Price in USDC micro-units (e.g., 5_000_000 = $5.00 USDC)
        address creator;     // Wallet address of the content creator
        bool active;         // Active status of the link
        string ipfsHash;     // Pointer to ciphertext metadata
        string slug;         // Human-readable slug identifier
    }

    // Lookup: keccak256(slug) -> Link Data
    mapping(bytes32 => LinkData) public links;

    // --- EVENTS ---
    event LinkCreated(
        string slug,
        bytes32 indexed slugId,
        address indexed creator,
        uint256 price,
        string ipfsHash
    );

    event LinkPurchased(
        string slug,
        bytes32 indexed slugId,
        address indexed buyer,
        address indexed creator,
        uint256 pricePaid,
        uint256 feePaid
    );

    /**
     * @param _usdcAddress The Native USDC token contract address on Base.
     * @param _uri The ERC-1155 metadata URI (e.g., "https://linklockr.xyz/api/metadata/{id}.json").
     */
    constructor(address _usdcAddress, string memory _uri) ERC1155(_uri) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcAddress);
    }

    // --- 1. CREATE (Permissionless) ---
    /**
     * @notice Registers a new paywalled link slug with price in USDC.
     * @param _slug Unique human-readable identifier (e.g. "brave-blue-lion").
     * @param _price Price in USDC micro-units (6 decimals). Must be > 0.
     * @param _ipfsHash Encrypted content pointer / CID.
     */
    function createLink(
        string calldata _slug,
        uint256 _price,
        string calldata _ipfsHash
    ) external nonReentrant {
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

        // Mint Creator Access Token (Token ID = uint256(slugId))
        _mint(msg.sender, uint256(slugId), 1, "");
        
        emit LinkCreated(_slug, slugId, msg.sender, _price, _ipfsHash);
    }

    // --- 2. BUY (Overloaded) ---

    /**
     * @notice Path A: Public Utility / Direct on-chain purchase (0% Fee).
     * @param _slug The slug of the link being purchased.
     * @param _recipient The address receiving the ERC-1155 access token.
     */
    function buyLink(string calldata _slug, address _recipient) external nonReentrant {
        _processBuy(_slug, _recipient, address(0), 0);
    }

    /**
     * @notice Path B: Managed Interface purchase (Dynamic convenience fee up to 5%).
     * @param _slug The slug of the link being purchased.
     * @param _recipient The address receiving the ERC-1155 access token.
     * @param _feeRecipient Platform treasury wallet receiving convenience fee.
     * @param _feeBps Fee in basis points (e.g. 500 = 5.0%, 250 = 2.5%).
     */
    function buyLink(
        string calldata _slug,
        address _recipient,
        address _feeRecipient,
        uint256 _feeBps
    ) external nonReentrant {
        require(_feeBps <= MAX_FEE_BPS, "Fee exceeds protocol limit");
        _processBuy(_slug, _recipient, _feeRecipient, _feeBps);
    }

    // --- INTERNAL LOGIC ---
    function _processBuy(
        string calldata _slug,
        address _recipient,
        address _feeRecipient,
        uint256 _feeBps
    ) internal {
        bytes32 slugId = keccak256(abi.encodePacked(_slug));
        LinkData memory link = links[slugId];
        
        require(link.active, "Link not found or inactive");
        require(_recipient != address(0), "Invalid recipient address");

        uint256 fee = 0;

        // Calculate platform fee if applicable
        if (_feeRecipient != address(0) && _feeBps > 0) {
            fee = (link.price * _feeBps) / 10000;
            // Transfer convenience fee to platform treasury
            usdcToken.safeTransferFrom(msg.sender, _feeRecipient, fee);
        }

        // Transfer remaining balance directly to creator
        uint256 creatorShare = link.price - fee;
        usdcToken.safeTransferFrom(msg.sender, link.creator, creatorShare);

        // Mint ERC-1155 access token to the designated recipient
        _mint(_recipient, uint256(slugId), 1, "");
        
        // Emits full accounting details for off-chain Supabase indexer / affiliate tracking
        emit LinkPurchased(_slug, slugId, _recipient, link.creator, link.price, fee);
    }
}
