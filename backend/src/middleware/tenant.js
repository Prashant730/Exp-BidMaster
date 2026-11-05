const Tenant = require('../models/Tenant');

const tenantContext = async (req, res, next) => {
  try {
    // Resolve by x-tenant-id header or x-tenant-subdomain
    let tenantIdentifier = req.headers['x-tenant-id'] || req.headers['x-tenant-subdomain'];
    
    // Fallback to parsing host when not explicitly provided
    if (!tenantIdentifier && req.hostname) {
      const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(req.hostname) || req.hostname === '::1';
      if (!isIP && req.hostname !== 'localhost') {
        const parts = req.hostname.split('.');
        // e.g. tenant1.bidmaster.com or tenant1.localhost
        if (parts.length >= 3 && parts[0] !== 'www') {
          tenantIdentifier = parts[0];
        } else if (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www') {
          tenantIdentifier = parts[0];
        }
      }
    }

    if (!tenantIdentifier) {
      // Standalone / SuperAdmin / Global route without a specific tenant scope
      req.tenant = null;
      return next();
    }

    // Try finding by object ID if it matches 24 hex chars, or by subdomain
    let tenant;
    if (tenantIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      tenant = await Tenant.findById(tenantIdentifier);
    } else {
      tenant = await Tenant.findOne({ subdomain: tenantIdentifier.toLowerCase() });
    }

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tenant account is not active' });
    }

    req.tenant = tenant;
    // Inject tenantId into body and query for isolation
    if (req.body && typeof req.body === 'object') {
      req.body.tenantId = tenant._id;
    }
    if (req.query && typeof req.query === 'object') {
      req.query.tenantId = tenant._id;
    }
    next();
  } catch (error) {
    console.error('Tenant Context Error:', error);
    res.status(500).json({ success: false, message: 'Server error processing tenant' });
  }
};

module.exports = { tenantContext };
