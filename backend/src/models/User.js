const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['bidder', 'seller', 'admin', 'superadmin'],
      default: 'bidder',
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
    },
    isValidated: {
      type: Boolean,
      default: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    sellerStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    // Profile fields
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String,
    },
    // Seller request fields
    businessName: {
      type: String,
      trim: true,
    },
    businessType: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    experience: {
      type: String,
    },
    website: {
      type: String,
      trim: true,
    },
    requestedAt: {
      type: Date,
    },
    // Activity tracking
    bids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
      },
    ],
    wonItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Index for faster queries (email and username already indexed via unique: true)
userSchema.index({ sellerStatus: 1 })
userSchema.index({ status: 1 })

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next()
  }

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Method to get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    tenantId: this.tenantId,
    username: this.username,
    email: this.email,
    role: this.role,
    isValidated: this.isValidated,
    isAdmin: this.isAdmin,
    sellerStatus: this.sellerStatus,
    status: this.status,
    name: this.name,
    phone: this.phone,
    address: this.address,
    profilePhoto: this.profilePhoto,
    businessName: this.businessName,
    businessType: this.businessType,
    description: this.description,
    experience: this.experience,
    website: this.website,
    requestedAt: this.requestedAt,
    bids: this.bids,
    wonItems: this.wonItems,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

const User = mongoose.model('User', userSchema)

module.exports = User
