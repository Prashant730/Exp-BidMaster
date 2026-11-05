const mongoose = require('mongoose')

// Embedded bid schema
const bidSchema = new mongoose.Schema(
  {
    bidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bidderName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [0, 'Bid amount must be positive'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
)

const auctionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    startingPrice: {
      type: Number,
      required: [true, 'Starting price is required'],
      min: [0, 'Starting price must be positive'],
    },
    currentPrice: {
      type: Number,
      required: true,
      min: [0, 'Current price must be positive'],
    },
    image: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'cancelled'],
      default: 'active',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    sellerName: {
      type: String,
      required: true,
    },
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    winnerName: {
      type: String,
    },
    isPermanent: {
      type: Boolean,
      default: false,
    },
    bids: [bidSchema],
  },
  {
    timestamps: true,
  }
)

// Indexes for faster queries
auctionSchema.index({ tenantId: 1, status: 1 })
auctionSchema.index({ category: 1 })
auctionSchema.index({ status: 1 })
auctionSchema.index({ endTime: 1 })
auctionSchema.index({ seller: 1 })
auctionSchema.index({ currentPrice: 1 })
auctionSchema.index({ title: 'text', description: 'text' })

// Virtual for checking if auction is active
auctionSchema.virtual('isActive').get(function () {
  return this.status === 'active' && new Date() < this.endTime
})

// Method to get highest bid
auctionSchema.methods.getHighestBid = function () {
  if (this.bids.length === 0) return null
  return this.bids.reduce(
    (max, bid) => (bid.amount > max.amount ? bid : max),
    this.bids[0]
  )
}

// Method to add a bid
auctionSchema.methods.addBid = function (bidderId, bidderName, amount) {
  this.bids.push({
    bidderId: bidderId,
    bidderName: bidderName,
    amount: amount,
    timestamp: new Date(),
  })
  this.currentPrice = amount
  return this
}

// Method to remove a bid and recalculate price
auctionSchema.methods.removeBid = function (bidId) {
  this.bids = this.bids.filter((bid) => bid._id.toString() !== bidId.toString())

  // Recalculate current price
  if (this.bids.length === 0) {
    this.currentPrice = this.startingPrice
  } else {
    const highestBid = this.getHighestBid()
    this.currentPrice = highestBid ? highestBid.amount : this.startingPrice
  }

  return this
}

// Pre-save hook to set currentPrice if not set
auctionSchema.pre('save', function (next) {
  if (this.isNew && !this.currentPrice) {
    this.currentPrice = this.startingPrice
  }
  next()
})

const Auction = mongoose.model('Auction', auctionSchema)

module.exports = Auction
