const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Auction = require('../models/Auction');
const { PLANS } = require('../config/plans');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token for user
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Reserved subdomains that businesses cannot pick
const RESERVED_SUBDOMAINS = ['www', 'admin', 'api', 'app', 'superadmin', 'mail', 'billing', 'test', 'localhost'];

// @desc    Public SaaS onboarding - register new business & provision tenant + admin user
// @route   POST /api/tenants/onboard
// @access  Public
exports.onboardTenant = async (req, res) => {
  try {
    const {
      businessName,
      subdomain,
      adminName,
      adminEmail,
      adminPassword,
      plan = 'free',
      themeColor = '#c3a372',
    } = req.body;

    // Validate required fields
    if (!businessName || !subdomain || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide business name, subdomain, admin email, and admin password',
      });
    }

    const cleanSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleanSubdomain.length < 3 || cleanSubdomain.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain must be between 3 and 30 alphanumeric characters',
      });
    }

    if (RESERVED_SUBDOMAINS.includes(cleanSubdomain)) {
      return res.status(400).json({
        success: false,
        message: 'This subdomain is reserved by the platform. Please choose another.',
      });
    }

    // Check if subdomain already exists
    const existingTenant = await Tenant.findOne({ subdomain: cleanSubdomain });
    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: `The subdomain "${cleanSubdomain}" is already registered. Please choose another one.`,
      });
    }

    // Verify plan
    const selectedPlan = PLANS[plan.toLowerCase()] ? plan.toLowerCase() : 'free';

    // 1. Create the tenant first (active status)
    const tenant = await Tenant.create({
      name: businessName.trim(),
      subdomain: cleanSubdomain,
      plan: selectedPlan,
      contactEmail: adminEmail.trim().toLowerCase(),
      status: 'active',
      settings: {
        primaryColor: themeColor || '#c3a372',
        secondaryColor: '#1a1918',
      },
    });

    // 2. Create the tenant admin account linked to this tenant
    // Generate a unique username if necessary
    const baseUsername = adminEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    let username = `${cleanSubdomain}_${baseUsername}`;
    if (username.length > 30) {
      username = username.substring(0, 30);
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      username = `${cleanSubdomain}_${Math.random().toString(36).substring(2, 6)}`;
    }

    const adminUser = await User.create({
      username,
      email: adminEmail.trim().toLowerCase(),
      password: adminPassword,
      name: adminName || businessName,
      role: 'admin',
      isAdmin: true,
      isValidated: true,
      tenantId: tenant._id,
    });

    // Set tenant ownerId
    tenant.ownerId = adminUser._id;
    await tenant.save();

    // Generate JWT token
    const token = generateToken(adminUser._id);

    res.status(201).json({
      success: true,
      message: 'Business account and tenant provisioned successfully!',
      data: {
        token,
        tenant: {
          _id: tenant._id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          plan: tenant.plan,
          status: tenant.status,
          settings: tenant.settings,
        },
        user: {
          _id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          isAdmin: adminUser.isAdmin,
          tenantId: tenant._id,
        },
      },
    });
  } catch (error) {
    console.error('Tenant Onboarding Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating tenant' });
  }
};

// @desc    Get all available plans & specs
// @route   GET /api/tenants/plans
// @access  Public
exports.getPlans = (req, res) => {
  res.status(200).json({
    success: true,
    data: Object.values(PLANS),
  });
};

// @desc    Get dashboard metrics for current tenant
// @route   GET /api/tenants/current/dashboard
// @access  Tenant Admin / SuperAdmin
exports.getCurrentTenantDashboard = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.query.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'No tenant context found. Please specify tenant.',
      });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const planKey = tenant.plan || 'free';
    const planConfig = PLANS[planKey] || PLANS.free;

    // Calculate usage metrics
    const totalAuctions = await Auction.countDocuments({ tenantId });
    const activeAuctions = await Auction.countDocuments({
      tenantId,
      status: 'active',
      endTime: { $gt: new Date() },
    });
    const completedAuctions = await Auction.countDocuments({
      tenantId,
      $or: [{ status: 'ended' }, { endTime: { $lte: new Date() } }],
    });
    const totalUsers = await User.countDocuments({ tenantId });
    const totalBidders = await User.countDocuments({ tenantId, role: 'bidder' });
    const totalSellers = await User.countDocuments({ tenantId, role: 'seller' });

    // Calculate total bidding volume
    const auctions = await Auction.find({ tenantId });
    let totalVolume = 0;
    let totalBidsCount = 0;
    auctions.forEach((auc) => {
      totalVolume += auc.currentPrice || 0;
      totalBidsCount += (auc.bids && auc.bids.length) || 0;
    });

    const usage = {
      auctions: {
        active: activeAuctions,
        total: totalAuctions,
        limit: planConfig.maxAuctions,
        percent: planConfig.maxAuctions > 0 ? Math.min(100, Math.round((activeAuctions / planConfig.maxAuctions) * 100)) : 0,
      },
      users: {
        total: totalUsers,
        limit: planConfig.maxUsers,
        percent: planConfig.maxUsers > 0 ? Math.min(100, Math.round((totalUsers / planConfig.maxUsers) * 100)) : 0,
      },
      volume: totalVolume,
      totalBids: totalBidsCount,
    };

    res.status(200).json({
      success: true,
      data: {
        tenant,
        plan: planConfig,
        usage,
        stats: {
          activeAuctions,
          completedAuctions,
          totalUsers,
          totalBidders,
          totalSellers,
          totalVolume,
        },
      },
    });
  } catch (error) {
    console.error('Tenant Dashboard Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upgrade or change tenant plan
// @route   POST /api/tenants/current/plan
// @access  Tenant Admin / SuperAdmin
exports.updateTenantPlan = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.body.tenantId;
    const { newPlan } = req.body;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'No tenant context found' });
    }

    if (!newPlan || !PLANS[newPlan.toLowerCase()]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Choose between free, pro, or enterprise.',
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { plan: newPlan.toLowerCase() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Plan updated to ${PLANS[newPlan.toLowerCase()].name} successfully!`,
      data: tenant,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update current tenant branding/settings
// @route   PUT /api/tenants/current/settings
// @access  Tenant Admin
exports.updateTenantSettings = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.body.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'No tenant context found' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const planKey = tenant.plan || 'free';
    const planConfig = PLANS[planKey] || PLANS.free;

    const { primaryColor, secondaryColor, logoUrl, description, website } = req.body;

    // Check if free plan is trying to set custom colors
    if (!planConfig.customBranding && (primaryColor || secondaryColor || logoUrl)) {
      return res.status(403).json({
        success: false,
        code: 'UPGRADE_REQUIRED',
        message: 'Custom branding and colors are available on Pro and Enterprise plans.',
      });
    }

    if (primaryColor) tenant.settings.primaryColor = primaryColor;
    if (secondaryColor) tenant.settings.secondaryColor = secondaryColor;
    if (logoUrl !== undefined) tenant.settings.logoUrl = logoUrl;
    if (description !== undefined) tenant.settings.description = description;
    if (website !== undefined) tenant.settings.website = website;

    await tenant.save();

    res.status(200).json({
      success: true,
      message: 'Branding settings updated successfully',
      data: tenant.settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tenants
// @route   GET /api/tenants
// @access  SuperAdmin
exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({}).sort({ createdAt: -1 });

    const tenantsWithMetrics = await Promise.all(
      tenants.map(async (t) => {
        const userCount = await User.countDocuments({ tenantId: t._id });
        const auctionCount = await Auction.countDocuments({ tenantId: t._id });
        const planConfig = PLANS[t.plan || 'free'] || PLANS.free;
        return {
          ...t.toObject(),
          planDetails: planConfig,
          stats: {
            users: userCount,
            auctions: auctionCount,
          },
        };
      })
    );

    res.status(200).json({ success: true, data: tenantsWithMetrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public tenant details (by subdomain or id) for branding/login
// @route   GET /api/tenants/public/:subdomain
// @access  Public
exports.getPublicTenant = async (req, res) => {
  try {
    const { subdomain } = req.params;
    let tenant;
    if (subdomain.match(/^[0-9a-fA-F]{24}$/)) {
      tenant = await Tenant.findById(subdomain);
    } else {
      tenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
    }

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const planConfig = PLANS[tenant.plan || 'free'] || PLANS.free;

    res.status(200).json({
      success: true,
      data: {
        _id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain,
        plan: tenant.plan,
        planName: planConfig.name,
        status: tenant.status,
        settings: tenant.settings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a tenant (Admin/SuperAdmin)
// @route   POST /api/tenants
// @access  SuperAdmin
exports.createTenant = async (req, res) => {
  try {
    const { name, subdomain, customDomain, plan = 'free', settings } = req.body;
    if (!name || !subdomain) {
      return res.status(400).json({ success: false, message: 'Name and subdomain are required' });
    }

    const existing = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Subdomain is already registered' });
    }

    const tenant = await Tenant.create({
      name,
      subdomain: subdomain.toLowerCase(),
      customDomain,
      plan: PLANS[plan.toLowerCase()] ? plan.toLowerCase() : 'free',
      settings,
    });
    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a tenant
// @route   PUT /api/tenants/:id
// @access  SuperAdmin
exports.updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a tenant
// @route   DELETE /api/tenants/:id
// @access  SuperAdmin
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.status(200).json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
