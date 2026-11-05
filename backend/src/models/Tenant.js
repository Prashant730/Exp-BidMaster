const mongoose = require('mongoose')

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subdomain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    customDomain: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    billing: {
      status: {
        type: String,
        enum: ['active', 'past_due', 'trialing', 'canceled'],
        default: 'active',
      },
      nextBillingDate: {
        type: Date,
      },
    },
    settings: {
      logoUrl: String,
      primaryColor: {
        type: String,
        default: '#c3a372',
      },
      secondaryColor: {
        type: String,
        default: '#1a1918',
      },
      description: String,
      website: String,
    },
  },
  {
    timestamps: true,
  }
)

const Tenant = mongoose.model('Tenant', tenantSchema)

module.exports = Tenant
