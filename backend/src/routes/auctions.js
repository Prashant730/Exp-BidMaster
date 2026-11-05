const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const {
  createAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
  placeBid,
  setAutoBid,
  removeBid,
  getUserAuctions,
} = require('../controllers/auctionController')
const { protect, optionalAuth } = require('../middleware/auth')
const { isAdmin, isSeller, isNotAdmin } = require('../middleware/roleCheck')
const { checkAuctionLimit } = require('../middleware/planEnforcement')

// Validation middleware
function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    })
  }
  next()
}

// @route   GET /api/auctions
// @desc    Get all auctions with filters
// @access  Public
router.get('/', optionalAuth, getAuctions)

// @route   GET /api/auctions/user/:userId
// @desc    Get user's auctions
// @access  Authenticated
router.get('/user/:userId', protect, getUserAuctions)

// @route   GET /api/auctions/:id
// @desc    Get auction by ID
// @access  Public
router.get('/:id', optionalAuth, getAuctionById)

// @route   POST /api/auctions
// @desc    Create a new auction
// @access  Seller
router.post(
  '/',
  protect,
  isSeller,
  checkAuctionLimit,
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ max: 5000 })
      .withMessage('Description cannot exceed 5000 characters'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('startingPrice')
      .isFloat({ min: 0 })
      .withMessage('Starting price must be a positive number'),
    body('duration')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('Duration must be between 1 and 168 hours'),
  ],
  validate,
  createAuction
)

// @route   PUT /api/auctions/:id
// @desc    Update auction
// @access  Owner/Admin
router.put(
  '/:id',
  protect,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description cannot exceed 5000 characters'),
  ],
  validate,
  updateAuction
)

// @route   DELETE /api/auctions/:id
// @desc    Delete auction
// @access  Admin
router.delete('/:id', protect, isAdmin, deleteAuction)

// @route   POST /api/auctions/:id/bid
// @desc    Place bid on auction
// @access  Authenticated (non-admin)
router.post(
  '/:id/bid',
  protect,
  isNotAdmin,
  [
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Bid amount must be a positive number'),
  ],
  validate,
  placeBid
)

// @route   POST /api/auctions/:id/auto-bid
// @desc    Configure proxy auto-bidding
// @access  Authenticated (non-admin)
router.post(
  '/:id/auto-bid',
  protect,
  isNotAdmin,
  [
    body('maxBid')
      .isFloat({ min: 0 })
      .withMessage('Max bid amount must be a positive number'),
  ],
  validate,
  setAutoBid
)

// @route   DELETE /api/auctions/:id/bid/:bidId
// @desc    Remove bid from auction
// @access  Admin
router.delete('/:id/bid/:bidId', protect, isAdmin, removeBid)

module.exports = router
