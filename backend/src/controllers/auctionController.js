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

    const { auction, bid } = await auctionService.placeBid(
      req.params.id,
      parseFloat(amount),
      req.user
    )

    // Log activity
    await logAndEmitActivity({
      type: 'bid',
      message: `Bid of $${bid.amount} placed on ${auction.title}`,
      userId: req.user._id,
      userName: req.user.username,
      auctionId: auction._id,
      auctionTitle: auction.title,
      amount: bid.amount,
      tenantId: auction.tenantId,
    })

    res.status(201).json({
      success: true,
      data: {
        auction,
        bid,
      },
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
  removeBid,
  getUserAuctions,
}
