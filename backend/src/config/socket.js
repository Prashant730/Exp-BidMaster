const { Server } = require('socket.io')

let io = null

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://project1-steel-ten.vercel.app',
        process.env.FRONTEND_URL,
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join tenant-scoped room for multi-tenant isolation
    socket.on('joinTenant', (data) => {
      const tenantId = data?.tenantId || data?.subdomain || 'global'
      socket.join('tenant_' + tenantId)
      console.log(`Socket ${socket.id} joined tenant_${tenantId}`)
    })

    // Join auction room for real-time updates
    socket.on('joinAuction', (data) => {
      socket.join('auction_' + data.auctionId)
      console.log('Socket ' + socket.id + ' joined auction_' + data.auctionId)
    })

    // Leave auction room
    socket.on('leaveAuction', (data) => {
      socket.leave('auction_' + data.auctionId)
      console.log('Socket ' + socket.id + ' left auction_' + data.auctionId)
    })

    // Join admin room for live activity feed
    socket.on('joinAdminRoom', (data) => {
      const adminRoom = data?.tenantId ? `admin_room_${data.tenantId}` : 'admin_room'
      socket.join(adminRoom)
      socket.join('admin_room')
      console.log('Socket ' + socket.id + ' joined ' + adminRoom)
    })

    // Leave admin room
    socket.on('leaveAdminRoom', (data) => {
      const adminRoom = data?.tenantId ? `admin_room_${data.tenantId}` : 'admin_room'
      socket.leave(adminRoom)
      socket.leave('admin_room')
      console.log('Socket ' + socket.id + ' left ' + adminRoom)
    })

    // Handle bid placement from frontend
    socket.on('bidPlace', (data) => {
      console.log('Bid placed:', data)
      const targetRoom = data.tenantId ? `tenant_${data.tenantId}` : null

      if (targetRoom) {
        io.to(targetRoom).emit('bidPlaced', data)
      } else {
        io.emit('bidPlaced', data)
      }

      // Also emit to auction room
      if (data.auctionId) {
        io.to('auction_' + data.auctionId).emit('bidPlaced', data)
      }

      // Also emit to admin room for live activity
      const activityPayload = {
        type: 'bid',
        message: 'Bid of $' + data.amount + ' placed',
        userName: data.bidderName,
        auctionId: data.auctionId,
        auctionTitle: data.auctionTitle || 'Unknown Auction',
        amount: data.amount,
        timestamp: data.timestamp || new Date(),
        tenantId: data.tenantId,
      }
      io.to('admin_room').emit('newActivity', activityPayload)
      if (data.tenantId) {
        io.to(`admin_room_${data.tenantId}`).emit('newActivity', activityPayload)
      }
    })

    // Handle broadcast bid place (alternative event name)
    socket.on('broadcastBidPlace', (data) => {
      console.log('Broadcasting bid:', data)
      const targetRoom = data.tenantId ? `tenant_${data.tenantId}` : null
      if (targetRoom) {
        socket.to(targetRoom).emit('bidPlaced', data)
      } else {
        socket.broadcast.emit('bidPlaced', data)
      }
    })

    // Handle auction updates from frontend
    socket.on('auctionUpdate', (data) => {
      console.log('Auction updated:', data)
      const targetRoom = data.tenantId ? `tenant_${data.tenantId}` : null
      if (targetRoom) {
        io.to(targetRoom).emit('auctionUpdated', data)
      } else {
        io.emit('auctionUpdated', data)
      }
      if (data.auctionId || data.id) {
        io.to('auction_' + (data.auctionId || data.id)).emit('auctionUpdated', data)
      }
    })

    socket.on('broadcastAuctionUpdate', (data) => {
      console.log('Broadcasting auction update:', data)
      const targetRoom = data.tenantId ? `tenant_${data.tenantId}` : null
      if (targetRoom) {
        socket.to(targetRoom).emit('auctionUpdated', data)
      } else {
        socket.broadcast.emit('auctionUpdated', data)
      }
    })

    // Handle auction removal
    socket.on('auctionRemove', (data) => {
      console.log('Auction removed:', data)
      const targetRoom = data.tenantId ? `tenant_${data.tenantId}` : null
      if (targetRoom) {
        io.to(targetRoom).emit('auctionRemoved', data)
      } else {
        io.emit('auctionRemoved', data)
      }
    })

    // Handle auction creation
    socket.on('auctionCreate', (data) => {
      console.log('Auction created:', data)
      const targetRoom = data.tenantId ? `tenant_${data.tenantId}` : null
      if (targetRoom) {
        io.to(targetRoom).emit('auctionCreated', data)
      } else {
        io.emit('auctionCreated', data)
      }

      // Also emit to admin room for live activity
      const activityPayload = {
        type: 'auction_created',
        message: 'New auction: ' + data.auction.title,
        userName: data.auction.seller,
        auctionId: data.auction.id,
        auctionTitle: data.auction.title,
        amount: data.auction.startingPrice,
        timestamp: new Date(),
        tenantId: data.tenantId,
      }
      io.to('admin_room').emit('newActivity', activityPayload)
      if (data.tenantId) {
        io.to(`admin_room_${data.tenantId}`).emit('newActivity', activityPayload)
      }
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}

module.exports = {
  initializeSocket,
  getIO,
}
