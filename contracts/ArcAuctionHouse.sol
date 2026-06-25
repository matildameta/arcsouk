// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Deploy on Remix (https://remix.ethereum.org). Imports resolve automatically.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * Arc Souk Auction House.
 * - The owner (deployer = admin) mints a 1/1 NFT into the contract and opens an
 *   English auction priced in USDC.
 * - Bidders approve USDC, then bid(); funds are escrowed in the contract.
 *   When out-bid, the previous bidder is refunded automatically.
 * - After the timer ends, the owner settles: the NFT goes to the winner and the
 *   winning USDC goes to the owner. If there were no bids, the NFT returns to the owner.
 */
contract ArcAuctionHouse is ERC721URIStorage, Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;

    struct Auction {
        uint256 tokenId;
        uint256 startBid; // minimum first bid, in USDC base units
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool settled;
        bool exists;
    }

    uint256 public nextAuctionId = 1;
    uint256 public nextTokenId = 1;
    mapping(uint256 => Auction) public auctions;

    event AuctionCreated(uint256 indexed auctionId, uint256 indexed tokenId, uint256 startBid, uint256 endTime, string tokenURI);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 amount);

    constructor(address usdcToken) ERC721("Arc Souk Auction", "ARCA") Ownable(msg.sender) {
        require(usdcToken != address(0), "usdc=0");
        usdc = IERC20(usdcToken);
    }

    /** Admin: mint the NFT (held in escrow by this contract) and open an auction. */
    function createAuction(string calldata uri, uint256 startBid, uint256 durationSeconds)
        external
        onlyOwner
        returns (uint256 auctionId)
    {
        require(durationSeconds > 0, "duration");
        uint256 tokenId = nextTokenId++;
        _mint(address(this), tokenId);
        _setTokenURI(tokenId, uri);

        auctionId = nextAuctionId++;
        uint256 end = block.timestamp + durationSeconds;
        auctions[auctionId] = Auction({
            tokenId: tokenId,
            startBid: startBid,
            endTime: end,
            highestBidder: address(0),
            highestBid: 0,
            settled: false,
            exists: true
        });
        emit AuctionCreated(auctionId, tokenId, startBid, end, uri);
    }

    /** Bidder: approve USDC for `amount` first, then call this. Must beat the current bid. */
    function bid(uint256 auctionId, uint256 amount) external nonReentrant {
        Auction storage a = auctions[auctionId];
        require(a.exists, "no auction");
        require(block.timestamp < a.endTime, "ended");
        if (a.highestBid == 0) {
            require(amount >= a.startBid, "below start bid");
        } else {
            require(amount > a.highestBid, "bid too low");
        }

        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC pull failed");

        address prevBidder = a.highestBidder;
        uint256 prevBid = a.highestBid;
        a.highestBidder = msg.sender;
        a.highestBid = amount;

        if (prevBidder != address(0)) {
            require(usdc.transfer(prevBidder, prevBid), "refund failed");
        }
        emit BidPlaced(auctionId, msg.sender, amount);
    }

    /** Admin: after the timer ends, deliver the NFT to the winner and the USDC to the owner. */
    function settleAuction(uint256 auctionId) external onlyOwner nonReentrant {
        Auction storage a = auctions[auctionId];
        require(a.exists, "no auction");
        require(block.timestamp >= a.endTime, "not ended");
        require(!a.settled, "already settled");
        a.settled = true;

        if (a.highestBidder != address(0)) {
            _transfer(address(this), a.highestBidder, a.tokenId);
            require(usdc.transfer(owner(), a.highestBid), "payout failed");
            emit AuctionSettled(auctionId, a.highestBidder, a.highestBid);
        } else {
            _transfer(address(this), owner(), a.tokenId);
            emit AuctionSettled(auctionId, address(0), 0);
        }
    }

    /** Convenience read for the frontend. */
    function getAuction(uint256 auctionId)
        external
        view
        returns (
            uint256 tokenId,
            uint256 startBid,
            uint256 endTime,
            address highestBidder,
            uint256 highestBid,
            bool settled,
            string memory uri
        )
    {
        Auction storage a = auctions[auctionId];
        return (a.tokenId, a.startBid, a.endTime, a.highestBidder, a.highestBid, a.settled, a.exists ? tokenURI(a.tokenId) : "");
    }
}
