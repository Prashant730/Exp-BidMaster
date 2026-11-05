const express = require('express');
const router = express.Router();
const {
  getTenants,
  getPublicTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  onboardTenant,
  getPlans,
  getCurrentTenantDashboard,
  updateTenantPlan,
  updateTenantSettings,
} = require('../controllers/tenantController');
const { protect } = require('../middleware/auth');

// Role check middleware for superadmin
const authorizeSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Not authorized as superadmin' });
  }
  next();
};

// Role check middleware for tenant admin (admin or superadmin)
const authorizeTenantAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin' && !req.user.isAdmin)) {
    return res.status(403).json({ success: false, message: 'Not authorized as tenant administrator' });
  }
  next();
};

// 1. Public onboarding route (businesses register for SaaS)
router.post('/onboard', onboardTenant);

// 2. Public route to view plans
router.get('/plans', getPlans);

// 3. Public route to fetch tenant metadata for branding / tenant detection
router.get('/public/:subdomain', getPublicTenant);

// 4. Tenant self-service dashboard & management routes (authenticated tenant admin)
router.get('/current/dashboard', protect, authorizeTenantAdmin, getCurrentTenantDashboard);
router.post('/current/plan', protect, authorizeTenantAdmin, updateTenantPlan);
router.put('/current/settings', protect, authorizeTenantAdmin, updateTenantSettings);

// 5. SuperAdmin protected management routes
router.route('/')
  .get(protect, authorizeSuperAdmin, getTenants)
  .post(protect, authorizeSuperAdmin, createTenant);

router.route('/:id')
  .put(protect, authorizeSuperAdmin, updateTenant)
  .delete(protect, authorizeSuperAdmin, deleteTenant);

module.exports = router;
