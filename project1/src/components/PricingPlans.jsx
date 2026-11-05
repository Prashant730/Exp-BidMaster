import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tenantAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

function PricingPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const navigate = useNavigate()

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await tenantAPI.getPlans()
      setPlans(res.data.data || [])
    } catch (err) {
      console.error('Failed to load plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (planId) => {
    navigate(`/business/signup?plan=${planId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Title & Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block py-1 px-3 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#c3a372]/20 text-[#c3a372] border border-[#c3a372]/30 mb-3">
            BidMaster for Business
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Launch Your Branded Auction Platform in Minutes
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Choose the right tier for your auction house, boutique gallery, or charity initiative. All plans include real-time bidding, automated timers, and our security suite.
          </p>

          {/* Billing Switcher */}
          <div className="mt-8 flex justify-center items-center space-x-3">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-12 h-6 flex items-center bg-gray-300 dark:bg-slate-700 rounded-full p-1 duration-300 cursor-pointer"
            >
              <div
                className={`bg-[#c3a372] w-4 h-4 rounded-full shadow-md transform duration-300 ${
                  billingCycle === 'annual' ? 'translate-x-6' : ''
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Annual Billing <span className="text-[#c3a372] text-xs font-bold">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const isPro = plan.id === 'pro'
              const isEnterprise = plan.id === 'enterprise'
              let price = plan.price
              if (billingCycle === 'annual' && price > 0) {
                price = Math.round(price * 0.8)
              }

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-2xl p-8 transition-all duration-300 ${
                    isPro
                      ? 'bg-black dark:bg-[#1a1918] text-white border-2 border-[#c3a372] shadow-2xl scale-105 z-10'
                      : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 shadow-md hover:shadow-xl'
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#c3a372] text-black text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-sm">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className={`text-sm mb-6 ${isPro ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                      {plan.id === 'free' && 'Ideal for hobbyists, testing, and small local community sales.'}
                      {plan.id === 'pro' && 'Tailored for established auctioneers and boutique antique/art dealers.'}
                      {plan.id === 'enterprise' && 'Built for high-volume commercial auction houses with custom needs.'}
                    </p>

                    {/* Price display */}
                    <div className="flex items-baseline mb-6">
                      <span className="text-5xl font-extrabold tracking-tight">${price}</span>
                      <span className={`ml-2 text-sm ${isPro ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        / month
                      </span>
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start">
                          <svg
                            className={`w-5 h-5 flex-shrink-0 mr-3 mt-0.5 ${
                              isPro ? 'text-[#c3a372]' : 'text-emerald-500'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className={`text-sm ${isPro ? 'text-gray-200' : 'text-gray-600 dark:text-gray-300'}`}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-center text-sm transition-all duration-200 ${
                      isPro
                        ? 'bg-[#c3a372] hover:bg-[#d6b785] text-black shadow-lg hover:shadow-xl'
                        : isEnterprise
                        ? 'bg-black dark:bg-[#c3a372] hover:bg-gray-800 dark:hover:bg-[#d6b785] text-white dark:text-black'
                        : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white'
                    }`}
                  >
                    {plan.id === 'free' ? 'Get Started Free' : `Start with ${plan.name}`}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Feature Comparison Highlights */}
        <div className="mt-20 border-t border-gray-200 dark:border-slate-800 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#c3a372]/20 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Dedicated Subdomain</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Each organization gets their own isolated environment (e.g. <code>artgallery.bidmaster.com</code>) with dedicated bidder rosters.
              </p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#c3a372]/20 flex items-center justify-center text-2xl">
                🎨
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Custom Brand Identity</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload your brand logo, customize primary and secondary theme colors, and tailor the look for your clientele.
              </p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#c3a372]/20 flex items-center justify-center text-2xl">
                🛡️
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Self-Service Tenant Portal</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time usage quotas, plan upgrades, auction caps, and commission oversight directly in your tenant dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingPlans

