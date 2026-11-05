import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tenantAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

function TenantDashboard({ currentUser }) {
  const [dashboardData, setDashboardData] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [brandingForm, setBrandingForm] = useState({
    primaryColor: '#c3a372',
    secondaryColor: '#1a1918',
    description: '',
    website: '',
  })
  const [savingBranding, setSavingBranding] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState(false)
  const [notice, setNotice] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboard()
    fetchPlans()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await tenantAPI.getDashboard()
      const data = res.data.data
      setDashboardData(data)
      if (data.tenant?.settings) {
        setBrandingForm({
          primaryColor: data.tenant.settings.primaryColor || '#c3a372',
          secondaryColor: data.tenant.settings.secondaryColor || '#1a1918',
          description: data.tenant.settings.description || '',
          website: data.tenant.settings.website || '',
        })
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching tenant dashboard:', err)
      setError(err.response?.data?.message || 'Failed to load tenant dashboard. Ensure you are signed in as a tenant administrator.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const res = await tenantAPI.getPlans()
      setPlans(res.data.data || [])
    } catch (err) {
      console.error('Error fetching plans:', err)
    }
  }

  const handleUpgradePlan = async (newPlanId) => {
    if (!window.confirm(`Are you sure you want to change your organization plan to ${newPlanId.toUpperCase()}?`)) {
      return
    }

    try {
      setUpgradingPlan(true)
      await tenantAPI.updatePlan(newPlanId)
      setNotice(`Successfully updated subscription plan to ${newPlanId.toUpperCase()}!`)
      await fetchDashboard()
    } catch (err) {
      console.error('Plan upgrade error:', err)
      alert(err.response?.data?.message || 'Failed to upgrade plan')
    } finally {
      setUpgradingPlan(false)
    }
  }

  const handleSaveBranding = async (e) => {
    e.preventDefault()
    try {
      setSavingBranding(true)
      await tenantAPI.updateSettings(brandingForm)
      setNotice('Branding and theme colors saved successfully!')
      await fetchDashboard()
    } catch (err) {
      console.error('Save branding error:', err)
      alert(err.response?.data?.message || 'Failed to save branding')
    } finally {
      setSavingBranding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-20 text-center text-gray-500">
        Loading Tenant Control Plane...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16 px-4">
        <div className="max-w-md mx-auto bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] rounded-xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tenant Access Required</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Link
              to="/business/signup"
              className="bg-[#c3a372] text-black px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 text-sm"
            >
              Provision a Business Platform →
            </Link>
            <Link to="/login" className="text-gray-500 hover:underline text-xs">
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { tenant, plan, usage, stats } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Notification */}
        {notice && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex justify-between items-center">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} className="font-bold text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tenant.settings?.primaryColor || '#c3a372' }}
              />
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {tenant.name}
              </h1>
              <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded bg-[#c3a372]/20 text-[#c3a372] border border-[#c3a372]/30">
                {plan.name}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-mono">
              Dedicated domain: <strong>{tenant.subdomain}.bidmaster.com</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/create"
              className="bg-black dark:bg-[#c3a372] hover:bg-gray-900 dark:hover:bg-[#d6b785] text-white dark:text-black font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              + List New Auction
            </Link>
            <Link
              to="/"
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              View Live Storefront ↗
            </Link>
          </div>
        </div>

        {/* Quota & Usage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Active Auctions Cap */}
          <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Active Auctions
              </span>
              <span className="text-xs font-semibold text-[#c3a372]">{usage.auctions.percent}% used</span>
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-3">
              {usage.auctions.active}{' '}
              <span className="text-sm font-normal text-gray-500">
                / {usage.auctions.limit >= 1000 ? 'Unlimited' : usage.auctions.limit}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  usage.auctions.percent >= 90 ? 'bg-red-500' : 'bg-[#c3a372]'
                }`}
                style={{ width: `${Math.min(100, usage.auctions.percent)}%` }}
              />
            </div>
          </div>

          {/* Registered Users */}
          <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Registered Users
              </span>
              <span className="text-xs font-semibold text-blue-500">{usage.users.percent}% used</span>
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-3">
              {usage.users.total}{' '}
              <span className="text-sm font-normal text-gray-500">
                / {usage.users.limit >= 1000 ? 'Unlimited' : usage.users.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${Math.min(100, usage.users.percent)}%` }}
              />
            </div>
          </div>

          {/* Total Bidding Volume */}
          <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] p-6 rounded-2xl shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Gross Auction Volume
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
              ${usage.volume.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Across {stats.completedAuctions + stats.activeAuctions} listings</p>
          </div>

          {/* Platform Fee Rate */}
          <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] p-6 rounded-2xl shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Platform Take Rate
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
              {plan.commissionRate * 100}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {plan.id === 'free' ? 'Upgrade to Pro for 5% take rate' : 'Lowest tier commission applied'}
            </p>
          </div>
        </div>

        {/* Subscription Plan Switcher / Upgrade Section */}
        <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Subscription & Plan Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Scale your auction limits and unlock enterprise branding as your bidder audience expands.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isCurrent = tenant.plan === p.id
              return (
                <div
                  key={p.id}
                  className={`border rounded-xl p-6 flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-[#c3a372] bg-[#c3a372]/5 ring-2 ring-[#c3a372]'
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-base text-gray-900 dark:text-white">{p.name}</h3>
                      {isCurrent && (
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                          Active Plan
                        </span>
                      )}
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                      ${p.price}
                      <span className="text-xs font-normal text-gray-500">/mo</span>
                    </div>

                    <ul className="text-xs space-y-2 mb-6 text-gray-600 dark:text-gray-300">
                      <li>• {p.maxAuctions >= 1000 ? 'Unlimited' : p.maxAuctions} active listings</li>
                      <li>• {p.maxUsers >= 1000 ? 'Unlimited' : p.maxUsers} registered bidders</li>
                      <li>• {p.commissionRate * 100}% platform commission</li>
                      <li>• {p.customBranding ? 'Custom branding & themes' : 'Standard BidMaster branding'}</li>
                    </ul>
                  </div>

                  <button
                    disabled={isCurrent || upgradingPlan}
                    onClick={() => handleUpgradePlan(p.id)}
                    className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs transition-colors ${
                      isCurrent
                        ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                        : 'bg-black dark:bg-[#c3a372] hover:bg-gray-800 dark:hover:bg-[#d6b785] text-white dark:text-black'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : `Switch to ${p.name}`}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Custom Branding & Theme Customizer */}
        <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Storefront Branding & Theme</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Personalize your auction storefront colors, logo, and organization description.
              </p>
            </div>
            {!plan.customBranding && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-300">
                🔒 Requires Pro or Enterprise Plan
              </span>
            )}
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Primary Brand Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    disabled={!plan.customBranding}
                    value={brandingForm.primaryColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                    className="w-12 h-10 p-1 border rounded cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="text"
                    disabled={!plan.customBranding}
                    value={brandingForm.primaryColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                    className="w-32 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono uppercase disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Organization Website
                </label>
                <input
                  type="url"
                  placeholder="https://yourgallery.com"
                  value={brandingForm.website}
                  onChange={(e) => setBrandingForm({ ...brandingForm, website: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Organization Tagline / About
                </label>
                <textarea
                  rows={3}
                  placeholder="Curators of 19th-century fine art and vintage timepieces..."
                  value={brandingForm.description}
                  onChange={(e) => setBrandingForm({ ...brandingForm, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingBranding || !plan.customBranding}
                className="bg-black dark:bg-[#c3a372] hover:bg-gray-800 dark:hover:bg-[#d6b785] text-white dark:text-black font-semibold py-2.5 px-6 rounded-lg text-sm shadow-md transition-colors disabled:opacity-50"
              >
                {savingBranding ? 'Saving...' : 'Save Branding Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TenantDashboard

