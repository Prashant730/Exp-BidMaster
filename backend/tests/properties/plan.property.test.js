const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const Auction = require('../../src/models/Auction');
const { generateToken } = require('../../src/controllers/authController');

describe('SaaS Foundation: Onboarding & Plan Limits', () => {
  // Helper to onboard a fresh tenant
  async function onboardTestTenant(subdomain = 'gallerytest', plan = 'free') {
    const res = await request(app)
      .post('/api/tenants/onboard')
      .send({
        businessName: 'Plan Test Gallery',
        subdomain,
        adminName: 'Gallery Boss',
        adminEmail: `boss_${subdomain}@plantest.com`,
        adminPassword: 'securepass123',
        plan,
      });

    return {
      res,
      tenant: res.body.data?.tenant,
      user: res.body.data?.user,
      token: res.body.data?.token,
    };
  }

  test('Public SaaS Onboarding: provision tenant + admin user in one request', async () => {
    const { res, tenant, user, token } = await onboardTestTenant('freshgal', 'free');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(tenant.subdomain).toBe('freshgal');
    expect(tenant.plan).toBe('free');
    expect(user.email).toBe('boss_freshgal@plantest.com');
    expect(token).toBeDefined();
  });

  test('Public SaaS Onboarding: reject duplicate subdomain', async () => {
    await onboardTestTenant('dupgal', 'free');

    const res = await request(app)
      .post('/api/tenants/onboard')
      .send({
        businessName: 'Another Gallery',
        subdomain: 'dupgal', // duplicate
        adminName: 'Another Boss',
        adminEmail: 'boss2@plantest.com',
        adminPassword: 'securepass123',
        plan: 'free',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('Plans Catalog: GET /api/tenants/plans returns Free, Pro, Enterprise', async () => {
    const res = await request(app).get('/api/tenants/plans');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const plans = res.body.data;
    expect(plans.length).toBe(3);
    const planIds = plans.map((p) => p.id);
    expect(planIds).toContain('free');
    expect(planIds).toContain('pro');
    expect(planIds).toContain('enterprise');
  });

  test('Tenant Dashboard: GET /api/tenants/current/dashboard returns plan & usage stats', async () => {
    const { tenant, token } = await onboardTestTenant('dashgal', 'free');

    const res = await request(app)
      .get('/api/tenants/current/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenant._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plan.id).toBe('free');
    expect(res.body.data.usage.auctions.limit).toBe(5);
    expect(res.body.data.usage.users.limit).toBe(50);
  });

  test('Plan Enforcement: Free plan enforces maximum active auction limit (5)', async () => {
    const { tenant, user, token } = await onboardTestTenant('limitgal', 'free');

    // Create 5 active auctions directly under this tenant
    for (let i = 1; i <= 5; i++) {
      await Auction.create({
        tenantId: tenant._id,
        seller: user._id,
        sellerName: 'Gallery Boss',
        title: `Plan Test Auction ${i}`,
        description: 'Test Description for auction limit testing',
        category: 'Art',
        startingPrice: 100,
        currentPrice: 100,
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // active
        status: 'active',
      });
    }

    // Attempting to create a 6th auction via API should be blocked with 403 PLAN_LIMIT_REACHED
    const res = await request(app)
      .post('/api/auctions')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenant._id.toString())
      .send({
        title: 'Plan Test Auction 6 (Should Fail)',
        description: 'Over the free plan limit',
        category: 'Art',
        startingPrice: 200,
        duration: 24,
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PLAN_LIMIT_REACHED');
  });

  test('Plan Upgrade: Upgrading tenant to Pro plan raises the limit', async () => {
    const { tenant, token } = await onboardTestTenant('upgradegal', 'free');

    const res = await request(app)
      .post('/api/tenants/current/plan')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenant._id.toString())
      .send({ newPlan: 'pro' });

    expect(res.status).toBe(200);
    expect(res.body.data.plan).toBe('pro');

    // Verify dashboard now reflects Pro plan
    const dashRes = await request(app)
      .get('/api/tenants/current/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenant._id.toString());

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.data.plan.id).toBe('pro');
    expect(dashRes.body.data.usage.auctions.limit).toBe(50);
  });
});
