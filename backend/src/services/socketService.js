const { getIO } = require('../config/socket')

// Helper to determine tenant room
function getTenantRoom(tenantId) {
  return tenantId ? `tenant_${tenantId}` : null
}

// Emit bid update to all clients in auction & tenant
function emitBidUpdate(auctionId, bidData) {
  try {
    const io = getIO()
    const payload = {
      auctionId,
      newPrice: bidData.newPrice,
      bidderId: bidData.bidderId,
      bidderName: bidData.bidderName,
      timestamp: new Date(),
      tenantId: bidData.tenantId,
    }

    // Emit to auction-specific room
    io.to('auction_' + auctionId).emit('bidUpdate', payload)

    // Emit to tenant-scoped room
    if (bidData.tenantId) {
      io.to(`tenant_${bidData.tenantId}`).emit('bidUpdate', payload)
    }

    // Also global emit for backwards compatibility
    io.emit('bidUpdate', payload)
  } catch (error) {
    console.error('Socket emit error:', error.message)
  }
}

// Emit outbid notification to previous highest bidder
function emitOutbid(auctionId, previousBidderId, newPrice, bidderName) {
  try {
    const io = getIO()
    io.emit('outbid', {
      auctionId,
      previousBidderId,
      newPrice,
      bidderName,
    })
    io.to('auction_' + auctionId).emit('outbid', {
      auctionId,
      previousBidderId,
      newPrice,
      bidderName,
    })
  } catch (error) {
    console.error('Socket emit error:', error.message)
  }
}

// Emit auction created event
function emitAuctionCreated(auction) {
  try {
    const io = getIO()
    if (auction.tenantId) {
      io.to(`tenant_${auction.tenantId}`).emit('auctionCreated', { auction })
    }
    io.emit('auctionCreated', { auction })
  } catch (error) {
    console.error('Socket emit error:', error.message)
  }
}

// Emit auction updated event
function emitAuctionUpdated(auctionId, updates) {
  try {
    const io = getIO()
    io.to('auction_' + auctionId).emit('auctionUpdated', { auctionId, updates })
    if (updates.tenantId) {
      io.to(`tenant_${updates.tenantId}`).emit('auctionUpdated', { auctionId, updates })
    }
    io.emit('auctionUpdated', { auctionId, updates })
  } catch (error) {
    console.error('Socket emit error:', error.message)
  }
}

// Emit auction removed event
function emitAuctionRemoved(auctionId, tenantId) {
  try {
    const io = getIO()
    if (tenantId) {
      io.to(`tenant_${tenantId}`).emit('auctionRemoved', { auctionId })
    }
    io.to('auction_' + auctionId).emit('auctionRemoved', { auctionId })
    io.emit('auctionRemoved', { auctionId })
  } catch (error) {
    console.error('Socket emit error:', error.message)
  }
}

// Emit auction ended event
function emitAuctionEnded(auction) {
  try {
    const io = getIO()
    const payload = {
      auctionId: auction._id,
      winnerId: auction.winnerId,
      winnerName: auction.winnerName,
      finalPrice: auction.currentPrice,
      tenantId: auction.tenantId,
    }

    io.to('auction_' + auction._id).emit('auctionEnded', payload)
    if (auction.tenantId) {
      io.to(`tenant_${auction.tenantId}`).emit('auctionEnded', payload)
    }
    io.emit('auctionEnded', payload)
  } catch (error) {
    console.error('Socket emit error:', error.message)
  }
}

// Emit user updated event
function emitUserUpdated(userEmail, updates) {
  try {
    const io = getIO()
    io.emit('userUpdated', { userEmail, updates })
  } catch (error) {
    console.error('Socket emit error:', error.message)
  }
}

// Emit activity notification (e.g. for admin dashboards)
function emitActivity(activity) {
  try {
    const io = getIO()
    io.to('admin_room').emit('newActivity', activity)
    if (activity.tenantId) {
      io.to(`admin_room_${activity.tenantId}`).emit('newActivity', activity)
    }
  } catch (error) {
    console.error('Socket emit error:', error.message)
  }
}

module.exports = {
  emitBidUpdate,
  emitOutbid,
  emitAuctionCreated,
  emitAuctionUpdated,
  emitAuctionRemoved,
  emitAuctionEnded,
  emitUserUpdated,
  emitActivity,
}
