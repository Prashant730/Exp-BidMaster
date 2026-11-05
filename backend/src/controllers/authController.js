const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { logAndEmitActivity } = require('./activityController')

// Generate JWT token
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
async function register(req, res, next) {
  try {
    const { username, email, password, role, name, tenantId } = req.body

    // Check if user already exists (scoped by tenant if in tenant context, or globally for standalone)
    const existingUserQuery = {
      $or: [{ email: email }, { username: username }],
    }
    if (tenantId) {
      existingUserQuery.$or = [
        { email, tenantId },
        { username, tenantId },
      ]
    }
    const existingUser = await User.findOne(existingUserQuery)

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
        })
      }
      return res.status(409).json({
        success: false,
        message: 'Username already exists',
      })
    }

    // Determine role and validation status
    let userRole = role || 'bidder'
    let isValidated = true
    let sellerStatus = 'none'
    let isAdmin = false

    // Only allow bidder or seller roles during registration
    if (userRole === 'admin') {
      userRole = 'bidder' // Prevent admin registration
    }

    // If registering as seller, set pending status
    if (userRole === 'seller') {
      isValidated = false
      sellerStatus = 'pending'
    }

    // Create user
    const createData = {
      username,
      email,
      password,
      role: userRole,
      isValidated,
      sellerStatus,
      isAdmin,
      name: name || username,
    }
    if (tenantId) {
      createData.tenantId = tenantId
    }
    const user = await User.create(createData)

    // Generate token
    const token = generateToken(user._id)

    // Return user data without password
    const userData = user.toPublicJSON()

    // Log activity for new user registration
    await logAndEmitActivity({
      type: 'user_registered',
      message: `New user registered: ${user.username}`,
      userId: user._id,
      userName: user.username,
      metadata: { email: user.email, role: userRole },
    })

    res.status(201).json({
      success: true,
      token,
      ...userData,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
async function login(req, res, next) {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      })
    }

    // Find user and include password for comparison
    const query = { email }
    if (req.body.tenantId) {
      query["$or"] = [
        { tenantId: req.body.tenantId },
        { tenantId: null },
        { tenantId: { $exists: false } },
        { role: 'superadmin' }
      ]
    }
    const user = await User.findOne(query).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    // Check if user is banned
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned',
      })
    }

    // Generate token
    const token = generateToken(user._id)

    // Return user data without password
    const userData = user.toPublicJSON()

    // Log login activity
    await logAndEmitActivity({
      type: 'user_login',
      message: `User logged in: ${user.username}`,
      userId: user._id,
      userName: user.username || user.name,
      metadata: { email: user.email, role: user.role },
    })

    res.json({
      success: true,
      token,
      ...userData,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    res.json({
      success: true,
      ...user.toPublicJSON(),
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
async function updateProfile(req, res, next) {
  try {
    const { name, phone, address, profilePhoto } = req.body

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, profilePhoto },
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      ...user.toPublicJSON(),
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  generateToken,
}
