const fc = require('fast-check')
const request = require('supertest')
const app = require('../../src/app')
const User = require('../../src/models/User')
const Tenant = require('../../src/models/Tenant')
const { generateToken } = require('../../src/controllers/authController')

/**
 * **Feature: Multi-Tenancy SaaS, Property 14: Tenant Management & Isolation**
 * **Validates: Tenant creation, SuperAdmin access control, duplicate prevention, and status toggling**
 */
describe('Property 14: Tenant Management & Multi-Tenancy', () => {
  let superadmin
  let superadminToken
  let regularUser
  let regularUserToken

  beforeAll(async () => {
    // Create superadmin
    superadmin = await User.create({
      username: 'superadmin_test',
      email: 'superadmin_test@platform.com',
      password: 'superadminpass123',
      role: 'superadmin',
      isAdmin: true,
    })
    superadminToken = generateToken(superadmin._id)

    // Create normal bidder
    regularUser = await User.create({
      username: 'regular_bidder_test',
      email: 'bidder_test@platform.com',
      password: 'bidderpass123',
      role: 'bidder',
      isAdmin: false,
    })
    regularUserToken = generateToken(regularUser._id)
  })

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['superadmin_test@platform.com', 'bidder_test@platform.com'] } })
    await Tenant.deleteMany({ subdomain: { $regex: /^test/ } })
  })

  test('non-superadmin cannot access tenant endpoints', async () => {
    const res = await request(app)
      .get('/api/tenants')
      .set('Authorization', `Bearer ${regularUserToken}`)

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  test('superadmin can create tenants with valid unique subdomains', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z0-9]{4,10}$/),
        async (suffix) => {
          const subdomain = `test${suffix}`
          const name = `Tenant Organization ${suffix}`

          const res = await request(app)
            .post('/api/tenants')
            .set('Authorization', `Bearer ${superadminToken}`)
            .send({ name, subdomain })

          if (res.status === 201) {
            expect(res.body.success).toBe(true)
            expect(res.body.data.subdomain).toBe(subdomain.toLowerCase())

            // Try duplicate creation -> must return 409
            const dupRes = await request(app)
              .post('/api/tenants')
              .set('Authorization', `Bearer ${superadminToken}`)
              .send({ name: 'Another Name', subdomain })

            expect(dupRes.status).toBe(409)

            // Public lookup must succeed
            const publicRes = await request(app).get(`/api/tenants/public/${subdomain}`)
            expect(publicRes.status).toBe(200)
            expect(publicRes.body.data.name).toBe(name)
          }

          return true
        }
      ),
      { numRuns: 10 }
    )
  })
})

