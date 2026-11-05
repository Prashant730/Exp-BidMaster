const mongoose = require('mongoose')

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const settingsSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
    },
    commissionRate: {
      type: Number,
      default: 0.05,
      min: [0, 'Commission rate cannot be negative'],
      max: [1, 'Commission rate cannot exceed 100%'],
    },
    categories: {
      type: [String],
      default: [
        'Watches',
        'Art',
        'Collectibles',
        'Furniture',
        'Electronics',
        'Jewelry',
      ],
    },
    siteRules: {
      defaultAuctionDuration: {
        type: Number,
        default: 24, // hours
      },
      minBidIncrement: {
        type: Number,
        default: 100,
      },
      maxAuctionDuration: {
        type: Number,
        default: 168, // 7 days in hours
      },
      minStartingPrice: {
        type: Number,
        default: 10,
      },
      termsOfService: {
        type: String,
        default:
          'By using this platform, users agree to abide by all terms and conditions.',
      },
      communityGuidelines: {
        type: String,
        default:
          'Users must treat others with respect and follow all platform policies.',
      },
    },
    announcements: [announcementSchema],
  },
  {
    timestamps: true,
  }
)

// Static method to get or create settings (singleton pattern)
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({})
  }
  return settings
}

// Static method to update settings
settingsSchema.statics.updateSettings = async function (updates) {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create(updates)
  } else {
    Object.assign(settings, updates)
    await settings.save()
  }
  return settings
}

const Settings = mongoose.model('Settings', settingsSchema)

module.exports = Settings
