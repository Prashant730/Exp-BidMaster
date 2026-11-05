const { PLANS } = require('../config/plans');
const Auction = require('../models/Auction');
const User = require('../models/User');

/**
 * Enforce maximum auction limits based on tenant plan
 */
const checkAuctionLimit = async (req, res, next) => {
  try {
    if (!req.tenant) {
      // In standalone / non-tenant mode, skip limit checks
      return next();
    }

    const tenantPlanKey = req.tenant.plan || 'free';
    const planConfig = PLANS[tenantPlanKey] || PLANS.free;

    // Count active auctions for this tenant
    const activeAuctionCount = await Auction.countDocuments({
      tenantId: req.tenant._id,
      status: 'active',
      endTime: { $gt: new Date() },
    });

    if (activeAuctionCount >= planConfig.maxAuctions) {
      return res.status(403).json({
        success: false,
        code: 'PLAN_LIMIT_REACHED',
        message: `Your current ${planConfig.name} allows a maximum of ${planConfig.maxAuctions} active auction(s). Please upgrade to Pro or Enterprise to create more auctions.`,
        currentCount: activeAuctionCount,
        maxAllowed: planConfig.maxAuctions,
        plan: tenantPlanKey,
      });
    }

    next();
  } catch (error) {
    console.error('Plan enforcement error:', error);
    res.status(500).json({ success: false, message: 'Error checking subscription plan limits' });
  }
};

/**
 * Enforce maximum registered user accounts based on tenant plan
 */
const checkUserLimit = async (req, res, next) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.body.tenantId;
    if (!tenantId) {
      return next();
    }

    const tenant = req.tenant || (await require('../models/Tenant').findById(tenantId));
    if (!tenant) {
      return next();
    }

    const tenantPlanKey = tenant.plan || 'free';
    const planConfig = PLANS[tenantPlanKey] || PLANS.free;

    const totalUsers = await User.countDocuments({ tenantId: tenant._id });

    if (totalUsers >= planConfig.maxUsers) {
      return res.status(403).json({
        success: false,
        code: 'USER_LIMIT_REACHED',
        message: `The organization has reached its maximum user capacity (${planConfig.maxUsers} users) on the ${planConfig.name}. Please contact the administrator to upgrade the plan.`,
        currentUsers: totalUsers,
        maxAllowed: planConfig.maxUsers,
        plan: tenantPlanKey,
      });
    }

    next();
  } catch (error) {
    console.error('User limit check error:', error);
    next();
  }
};

/**
 * Enforce custom branding features based on tenant plan
 */
const checkBrandingPermission = (req, res, next) => {
  if (!req.tenant) return next();

  const tenantPlanKey = req.tenant.plan || 'free';
  const planConfig = PLANS[tenantPlanKey] || PLANS.free;

  if (!planConfig.customBranding) {
    return res.status(403).json({
      success: false,
      code: 'PLAN_UPGRADE_REQUIRED',
      message: `Custom branding and themes are available on Pro and Enterprise plans. Please upgrade to customize branding.`,
      plan: tenantPlanKey,
    });
  }

  next();
};

module.exports = {
  checkAuctionLimit,
  checkUserLimit,
  checkBrandingPermission,
};
