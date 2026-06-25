export const auctionAddress = (process.env.NEXT_PUBLIC_AUCTION_ADDRESS ?? '') as `0x${string}`;
export const auctionConfigured = /^0x[a-fA-F0-9]{40}$/.test(auctionAddress);

export const auctionAbi = [
  {
    type: 'function',
    name: 'createAuction',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'uri', type: 'string' },
      { name: 'startBid', type: 'uint256' },
      { name: 'durationSeconds', type: 'uint256' },
    ],
    outputs: [{ name: 'auctionId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'bid',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'auctionId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'settleAuction',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'auctionId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getAuction',
    stateMutability: 'view',
    inputs: [{ name: 'auctionId', type: 'uint256' }],
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'startBid', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'highestBidder', type: 'address' },
      { name: 'highestBid', type: 'uint256' },
      { name: 'settled', type: 'bool' },
      { name: 'uri', type: 'string' },
    ],
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'event',
    name: 'AuctionCreated',
    inputs: [
      { indexed: true, name: 'auctionId', type: 'uint256' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'startBid', type: 'uint256' },
      { indexed: false, name: 'endTime', type: 'uint256' },
      { indexed: false, name: 'tokenURI', type: 'string' },
    ],
  },
  {
    type: 'event',
    name: 'BidPlaced',
    inputs: [
      { indexed: true, name: 'auctionId', type: 'uint256' },
      { indexed: true, name: 'bidder', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'AuctionSettled',
    inputs: [
      { indexed: true, name: 'auctionId', type: 'uint256' },
      { indexed: true, name: 'winner', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
  },
] as const;
