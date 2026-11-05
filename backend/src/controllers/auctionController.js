const auctionService = require('../services/auctionService')
const { getIO } = require('../config/socket')
const { logAndEmitActivity } = require('./activityController')

// @desc    Create a new auction
// @route   POST /api/auctions
// @access  Seller
async function createAuction(req, res, next) {
  try {
    const auction = await auctionService.createAuction(req.body, req.user)

    // Emit socket event partitioned by tenant and globally
    try {
      const io = getIO()
      const tenantRoom = auction.tenantId ? `tenant_${auction.tenantId}` : 'tenant_global'
      io.to(tenantRoom).emit('auctionCreated', { auction })
      io.emit('auctionCreated', { auction }) // backwards compatibility
    } catch (socketError) {
      // Socket not initialized
    }

    // Log activity
    await logAndEmitActivity({
      type: 'auction_created',
      message: `New auction: ${auction.title}`,
      userId: req.user._id,
      userName: req.user.username,
      auctionId: auction._id,
      auctionTitle: auction.title,
      amount: auction.startingPrice,
      tenantId: auction.tenantId,
    })

    res.status(201).json({
      success: true,
      data: auction,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get all auctions with filters
// @route   GET /api/auctions
// @access  Public
async function getAuctions(req, res, next) {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      search: req.query.search,
      tenantId: req.tenant ? req.tenant._id : (req.query.tenantId || null),
    }

    const auctions = await auctionService.getAuctions(filters)

    res.json({
      success: true,
      count: auctions.length,
      data: auctions,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get auction by ID
// @route   GET /api/auctions/:id
// @access  Public
async function getAuctionById(req, res, next) {
  try {
    const auction = await auctionService.getAuctionById(req.params.id)

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found',
      })
    }

    res.json({
      success: true,
      data: auction,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update auction
// @route   PUT /api/auctions/:id
// @access  Owner/Admin
async function updateAuction(req, res, next) {
  try {
    const auction = await auctionService.updateAuction(
      req.params.id,
      req.body,
      req.user
    )

    // Emit socket event
    try {
      const io = getIO()
      const tenantRoom = auction.tenantId ? `tenant_${auction.tenantId}` : 'tenant_global'
      io.to(tenantRoom).emit('auctionUpdated', {
        auctionId: auction._id,
        updates: req.body,
      })
      io.to('auction_' + auction._id).emit('auctionUpdated', {
        auctionId: auction._id,
        updates: req.body,
      })
    } catch (socketError) {
      // Socket not initialized
    }

    // Log activity
    await logAndEmitActivity({
      type: 'auction_updated',
      message: `Auction updated: ${auction.title}`,
      userId: req.user._id,
      userName: req.user.username,
      auctionId: auction._id,
      auctionTitle: auction.title,
      tenantId: auction.tenantId,
    })

    res.json({
      success: true,
      data: auction,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete auction
// @route   DELETE /api/auctions/:id
// @access  Owner/Admin
async function deleteAuction(req, res, next) {
  try {
    const auction = await auctionService.getAuctionById(req.params.id)
    await auctionService.deleteAuction(req.params.id, req.user)

    // Emit socket event
    try {
      const io = getIO()
      const tenantRoom = auction?.tenantId ? `tenant_${auction.tenantId}` : 'tenant_global'
      io.to(tenantRoom).emit('auctionRemoved', { auctionId: req.params.id })
      io.emit('auctionRemoved', { auctionId: req.params.id })
    } catch (socketError) {
      // Socket not initialized
    }

    // Log activity
    if (auction) {
      await logAndEmitActivity({
        type: 'auction_deleted',
        message: `Auction deleted: ${auction.title}`,
        userId: req.user._id,
        userName: req.user.username,
        auctionId: auction._id,
        auctionTitle: auction.title,
        tenantId: auction.tenantId,
      })
    }

    res.json({
      success: true,
      message: 'Auction deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Place a bid on auction
// @route   POST /api/auctions/:id/bid
// @access  Bidder
async function placeBid(req, res, next) {
  try {
    const { amount } = req.body

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a bid amount',
      })
    }

    const { auction, previousHighestBid } = await auctionService.placeBid(
      req.params.id,
      req.user._id,
      req.user.name || req.user.username,
      parseFloat(amount)
    )

    const latestBid = auction.bids[auction.bids.length - 1]

    // Real-time socket broadcast with outbid details
    try {
      const io = getIO()
      const tenantRoom = auction.tenantId ? `tenant_${auction.tenantId}` : 'tenant_global'
      const payload = {
        auctionId: auction._id,
        auctionTitle: auction.title,
        amount: auction.currentPrice,
        newPrice: auction.currentPrice,
        bidderName: latestBid.bidderName,
        bidderId: latestBid.bidderId,
        timestamp: latestBid.timestamp,
        tenantId: auction.tenantId,
        previousHighestBidderId: previousHighestBid ? previousHighestBid.bidderId : null,
      }
      io.to(tenantRoom).emit('bidPlaced', payload)
      io.to('auction_' + auction._id).emit('bidPlaced', payload)
      io.emit('bidPlaced', payload) // global broadcast
    } catch (socketErr) {
      // socket not initialized in test mode
    }

    // Log activity
    await logAndEmitActivity({
      type: 'bid',
      message: `Bid of $${latestBid.amount} placed on ${auction.title}`,
      userId: req.user._id,
      userName: req.user.username,
      auctionId: auction._id,
      auctionTitle: auction.title,
      amount: latestBid.amount,
      tenantId: auction.tenantId,
    })

    res.status(201).json({
      success: true,
      data: {
        auction,
        bid: latestBid,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Set or update Auto-Bid (Proxy Bidding)
// @route   POST /api/auctions/:id/auto-bid
// @access  Bidder
async function setAutoBid(req, res, next) {
  try {
    const { maxBid } = req.body

    if (!maxBid || isNaN(maxBid)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid max bid amount',
      })
    }

    const auction = await auctionService.setAutoBid(
      req.params.id,
      req.user._id,
      req.user.name || req.user.username,
      parseFloat(maxBid)
    )

    const latestBid = auction.bids[auction.bids.length - 1]

    // Real-time socket broadcast
    try {
      const io = getIO()
      const tenantRoom = auction.tenantId ? `tenant_${auction.tenantId}` : 'tenant_global'
      const payload = {
        auctionId: auction._id,
        auctionTitle: auction.title,
        amount: auction.currentPrice,
        newPrice: auction.currentPrice,
        bidderName: latestBid ? latestBid.bidderName : req.user.name,
        bidderId: latestBid ? latestBid.bidderId : req.user._id,
        timestamp: latestBid ? latestBid.timestamp : new Date(),
        tenantId: auction.tenantId,
      }
      io.to(tenantRoom).emit('bidPlaced', payload)
      io.to('auction_' + auction._id).emit('bidPlaced', payload)
      io.emit('bidPlaced', payload)
    } catch (socketErr) {
      // socket not initialized
    }

    res.status(200).json({
      success: true,
      message: `Auto-bid set up to $${maxBid}`,
      data: auction,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Remove a bid from auction
// @route   DELETE /api/auctions/:id/bids/:bidId
// @access  Admin only
async function removeBid(req, res, next) {
  try {
    const auction = await auctionService.removeBid(
      req.params.id,
      req.params.bidId,
      req.user
    )

    // Log activity
    await logAndEmitActivity({
      type: 'admin_action',
      message: `Bid removed from ${auction.title}`,
      userId: req.user._id,
      userName: req.user.username,
      auctionId: auction._id,
      auctionTitle: auction.title,
      tenantId: auction.tenantId,
    })

    res.json({
      success: true,
      data: auction,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get auctions created by user
// @route   GET /api/auctions/user/:userId
// @access  Authenticated
async function getUserAuctions(req, res, next) {
  try {
    const auctions = await auctionService.getUserAuctions(req.params.userId)

    res.json({
      success: true,
      count: auctions.length,
      data: auctions,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
  placeBid,
  setAutoBid,
  removeBid,
  getUserAuctions,
}
