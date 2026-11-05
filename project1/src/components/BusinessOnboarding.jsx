import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { tenantAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

function BusinessOnboarding() {
  const [searchParams] = useSearchParams()
  const initialPlan = searchParams.get('plan') || 'free'

  const [formData, setFormData] = useState({
    businessName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    plan: initialPlan,
    themeColor: '#c3a372',
  })

  const [plans, setPlans] = useState([])
  const [subdomainStatus, setSubdomainStatus] = useState(null) // null, 'available', 'taken', 'invalid'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successData, setSuccessData] = useState(null)
  const { login: setAuthSession } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await tenantAPI.getPlans()
      setPlans(res.data.data || [])
    } catch (err) {
      console.error('Error fetching plans:', err)
    }
  }

  // Handle subdomain auto-formatting
  const handleSubdomainChange = (e) => {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setFormData({ ...formData, subdomain: raw })
    if (raw.length >= 3) {
      setSubdomainStatus('available')
    } else {
      setSubdomainStatus(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await tenantAPI.onboard(formData)
      const data = res.data.data

      // Store token and current mockTenant in localStorage for immediate testing
      localStorage.setItem('token', data.token)
      localStorage.setItem('mockTenant', data.tenant.subdomain)
      localStorage.setItem('user', JSON.stringify(data.user))

      setSuccessData(data)
    } catch (err) {
      console.error('Onboarding failed:', err)
      setError(err.response?.data?.message || 'Failed to create business platform. Please check your entries.')
    } finally {
      setLoading(false)
    }
  }

  if (successData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] rounded-2xl p-8 sm:p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
            ✓
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Welcome to BidMaster!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Your organization <strong>{successData.tenant.name}</strong> has been provisioned on the{' '}
            <span className="capitalize text-[#c3a372] font-semibold">{successData.tenant.plan}</span> plan.
          </p>

          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 text-left mb-8 space-y-3 border border-gray-200 dark:border-slate-700">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Dedicated Tenant Subdomain:</span>
              <span className="font-mono font-bold text-[#c3a372]">
                {successData.tenant.subdomain}.bidmaster.com
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Administrator Email:</span>
              <span className="font-medium text-gray-900 dark:text-white">{successData.user.email}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Assigned Plan:</span>
              <span className="font-semibold uppercase tracking-wider text-xs px-2 py-0.5 rounded bg-[#c3a372]/20 text-[#c3a372]">
                {successData.tenant.plan} Tier
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                window.location.href = '/tenant-dashboard'
              }}
              className="bg-[#c3a372] hover:bg-[#d6b785] text-black font-semibold py-3 px-6 rounded-lg text-sm shadow-md transition-all"
            >
              Open Tenant Dashboard →
            </button>
            <button
              onClick={() => {
                window.location.href = '/'
              }}
              className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg text-sm transition-all"
            >
              Go to Live Auctions
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/pricing" className="text-xs font-semibold text-[#c3a372] hover:underline mb-2 inline-block">
            ← View All Pricing Plans
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Create Your Business Auction Platform
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Set up your organization, customize your branding, and start listing live auctions in under two minutes.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] rounded-2xl p-6 sm:p-10 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Organization & Domain */}
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-[#c3a372] mb-4">
                1. Organization Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Business / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Heritage Rare Coins"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c3a372]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Desired Subdomain Slug *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      required
                      placeholder="heritage"
                      value={formData.subdomain}
                      onChange={handleSubdomainChange}
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-l-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c3a372]"
                    />
                    <span className="bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-700 px-3 py-2.5 text-xs text-gray-500 rounded-r-lg font-mono">
                      .bidmaster.com
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Your platform will be accessible at <code>{formData.subdomain || 'yourbrand'}.bidmaster.com</code>
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Choose Subscription Plan */}
            <div className="border-t border-gray-200 dark:border-slate-800 pt-8">
              <h2 className="text-base font-bold uppercase tracking-wider text-[#c3a372] mb-4">
                2. Select Subscription Tier
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map((p) => {
                  const isSelected = formData.plan === p.id
                  return (
                    <div
                      key={p.id}
                      onClick={() => setFormData({ ...formData, plan: p.id })}
                      className={`cursor-pointer rounded-xl p-4 border transition-all ${
                        isSelected
                          ? 'border-[#c3a372] bg-[#c3a372]/10 dark:bg-[#c3a372]/5 ring-2 ring-[#c3a372]'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</span>
                        {isSelected && <span className="text-[#c3a372] text-sm">●</span>}
                      </div>
                      <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                        ${p.price}
                        <span className="text-xs font-normal text-gray-500">/mo</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {p.maxAuctions >= 1000 ? 'Unlimited' : p.maxAuctions} active auctions • {p.commissionRate * 100}% platform fee
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 3. Administrator Account */}
            <div className="border-t border-gray-200 dark:border-slate-800 pt-8">
              <h2 className="text-base font-bold uppercase tracking-wider text-[#c3a372] mb-4">
                3. Business Administrator Account
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c3a372]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Admin Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jane@heritagecoins.com"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c3a372]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c3a372]"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 dark:border-slate-800 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black dark:bg-[#c3a372] hover:bg-gray-900 dark:hover:bg-[#d6b785] text-white dark:text-black font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all text-base disabled:opacity-50"
              >
                {loading ? 'Provisioning Your Auction Platform...' : 'Launch Auction Platform Now 🚀'}
              </button>
              <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                By provisioning a platform, you agree to BidMaster's SaaS Master Service Agreement & Privacy Policy.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BusinessOnboarding

