const Auction = require('../models/Auction')

// Create a new auction with calculated end time
async function createAuction(auctionData, seller) {
  const durationHours = parseInt(auctionData.duration) || 24
  const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000)

  const auction = await Auction.create({
    tenantId: auctionData.tenantId,
    title: auctionData.title,
    description: auctionData.description,
    category: auctionData.category,
    startingPrice: parseFloat(auctionData.startingPrice),
    currentPrice: parseFloat(auctionData.startingPrice),
    image:
      auctionData.image ||
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
    endTime: endTime,
    seller: seller._id,
    sellerName: seller.name || seller.username,
    status: 'active',
    bids: [],
  })

  return auction
}

// Get auctions with filtering
async function getAuctions(filters = {}) {
  const query = filters.tenantId ? { tenantId: filters.tenantId } : {}

  // Category filter
  if (filters.category && filters.category !== 'all') {
    query.category = filters.category
  }

  // Status filter
  if (filters.status) {
    if (filters.status === 'active') {
      query.status = 'active'
      query.endTime = { $gt: new Date() }
    } else if (filters.status === 'ended') {
      query.$or = [{ status: 'ended' }, { endTime: { $lte: new Date() } }]
    }
  }

  // Price range filter
  if (filters.minPrice) {
    query.currentPrice = {
      ...query.currentPrice,
      $gte: parseFloat(filters.minPrice),
    }
  }
  if (filters.maxPrice) {
    query.currentPrice = {
      ...query.currentPrice,
      $lte: parseFloat(filters.maxPrice),
    }
  }

  // Search filter
  if (filters.search) {
    query.$text = { $search: filters.search }
  }

  const auctions = await Auction.find(query)
    .populate('seller', 'username name')
    .sort({ createdAt: -1 })

  return auctions
}

// Get auction by ID
async function getAuctionById(id) {
  const auction = await Auction.findById(id)
    .populate('seller', 'username name email')
    .populate('bids.bidderId', 'username name')

  return auction
}

// Update auction
async function updateAuction(id, updates, userId, isAdmin) {
  const auction = await Auction.findById(id)

  if (!auction) {
    return null
  }

  // Check ownership (unless admin)
  if (!isAdmin && auction.seller.toString() !== userId.toString()) {
    throw new Error('Not authorized to update this auction')
  }

  // Only allow certain fields to be updated
  const allowedUpdates = ['title', 'description', 'category', 'image']

  // Admin can also update status
  if (isAdmin) {
    allowedUpdates.push('status', 'endTime')
  }

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      auction[key] = updates[key]
    }
  }

  await auction.save()
  return auction
}

// Delete auction
async function deleteAuction(id) {
  const result = await Auction.findByIdAndDelete(id)
  return result
}

// Calculate standard bid increment based on current price
function calculateMinimumIncrement(currentPrice) {
  if (currentPrice < 100) return 5
  if (currentPrice < 500) return 10
  if (currentPrice < 2000) return 25
  if (currentPrice < 10000) return 50
  return 100
}

// Place a bid on an auction with Proxy / Auto-Bid resolution
async function placeBid(auctionId, bidderId, bidderName, amount) {
  const auction = await Auction.findById(auctionId)

  if (!auction) {
    throw new Error('Auction not found')
  }

  // Check if auction is active
  if (auction.status !== 'active') {
    throw new Error('This auction has ended')
  }

  // Check if auction time has expired
  if (new Date() >= auction.endTime && !auction.isPermanent) {
    throw new Error('This auction has ended')
  }

  // Check if bid is higher than current price
  if (amount <= auction.currentPrice) {
    throw new Error(
      'Bid must be higher than current price of ' + auction.currentPrice
    )
  }

  // Get previous highest bidder for outbid notification
  const previousHighestBid =
    auction.bids.length > 0 ? auction.bids[auction.bids.length - 1] : null

  // Add bid
  auction.addBid(bidderId, bidderName, amount)

  // Automatic Proxy Bidding Execution:
  // If there are other users with active autoBids higher than the new current price,
  // the highest auto-bidder will counter-bid by min increment (up to their maxBid).
  if (auction.autoBids && auction.autoBids.length > 0) {
    const eligibleAutoBids = auction.autoBids
      .filter(ab => ab.bidderId.toString() !== bidderId.toString() && ab.maxBid > auction.currentPrice)
      .sort((a, b) => b.maxBid - a.maxBid)

    if (eligibleAutoBids.length > 0) {
      const topAuto = eligibleAutoBids[0]
      const increment = calculateMinimumIncrement(auction.currentPrice)
      const counterAmount = Math.min(topAuto.maxBid, auction.currentPrice + increment)

      if (counterAmount > auction.currentPrice) {
        auction.addBid(topAuto.bidderId, topAuto.bidderName, counterAmount)
      }
    }
  }

  await auction.save()

  return {
    auction,
    previousHighestBid,
  }
}

// Set or update an Auto-Bid (Proxy Bid) for a user
async function setAutoBid(auctionId, bidderId, bidderName, maxBid) {
  const auction = await Auction.findById(auctionId)
  if (!auction) throw new Error('Auction not found')

  if (auction.status !== 'active' || (new Date() >= auction.endTime && !auction.isPermanent)) {
    throw new Error('This auction has ended')
  }

  if (maxBid <= auction.currentPrice) {
    throw new Error('Max auto-bid must be higher than current price of ' + auction.currentPrice)
  }

  if (!auction.autoBids) {
    auction.autoBids = []
  }

  const existingIdx = auction.autoBids.findIndex(
    ab => ab.bidderId.toString() === bidderId.toString()
  )

  if (existingIdx !== -1) {
    auction.autoBids[existingIdx].maxBid = maxBid
    auction.autoBids[existingIdx].bidderName = bidderName
  } else {
    auction.autoBids.push({
      bidderId,
      bidderName,
      maxBid,
      createdAt: new Date(),
    })
  }

  const highestBid = auction.getHighestBid()
  if (!highestBid || highestBid.bidderId.toString() !== bidderId.toString()) {
    const increment = calculateMinimumIncrement(auction.currentPrice)
    const initialBid = Math.min(maxBid, auction.currentPrice + increment)
    if (initialBid > auction.currentPrice) {
      auction.addBid(bidderId, bidderName, initialBid)
    }
  }

  await auction.save()
  return auction
}

// Remove a bid from an auction
async function removeBid(auctionId, bidId) {
  const auction = await Auction.findById(auctionId)

  if (!auction) {
    throw new Error('Auction not found')
  }

  auction.removeBid(bidId)
  await auction.save()

  return auction
}

// Get auctions by seller
async function getAuctionsBySeller(sellerId) {
  const auctions = await Auction.find({ seller: sellerId }).sort({
    createdAt: -1,
  })

  return auctions
}

// End expired auctions (excluding permanent demo auctions)
async function endExpiredAuctions() {
  const now = new Date()

  const expiredAuctions = await Auction.find({
    status: 'active',
    endTime: { $lte: now },
    isPermanent: { $ne: true },
  })

  const endedAuctions = []

  for (const auction of expiredAuctions) {
    auction.status = 'ended'

    // Determine winner
    if (auction.bids.length > 0) {
      const highestBid = auction.getHighestBid()
      auction.winnerId = highestBid.bidderId
      auction.winnerName = highestBid.bidderName
    }

    await auction.save()
    endedAuctions.push(auction)
  }

  return endedAuctions
}

module.exports = {
  createAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
  placeBid,
  setAutoBid,
  calculateMinimumIncrement,
  removeBid,
  getAuctionsBySeller,
  endExpiredAuctions,
}
