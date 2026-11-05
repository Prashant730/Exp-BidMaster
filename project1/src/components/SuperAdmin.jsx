import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tenantAPI } from '../services/api'

function SuperAdmin({ currentUser }) {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newTenant, setNewTenant] = useState({
    name: '',
    subdomain: '',
    customDomain: '',
    primaryColor: '#c3a372',
  })
  const [creating, setCreating] = useState(false)
  const [activeDevTenant, setActiveDevTenant] = useState(
    localStorage.getItem('mockTenant') || 'default'
  )

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const response = await tenantAPI.getAll()
      setTenants(response.data.data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching tenants:', err)
      setError(err.response?.data?.message || 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      setCreating(true)
      const payload = {
        name: newTenant.name.trim(),
        subdomain: newTenant.subdomain.trim().toLowerCase(),
        customDomain: newTenant.customDomain ? newTenant.customDomain.trim().toLowerCase() : undefined,
        settings: {
          primaryColor: newTenant.primaryColor,
        },
      }
      await tenantAPI.create(payload)
      setNewTenant({
        name: '',
        subdomain: '',
        customDomain: '',
        primaryColor: '#c3a372',
      })
      await fetchTenants()
    } catch (err) {
      console.error('Error creating tenant:', err)
      alert(err.response?.data?.message || 'Error creating tenant')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'suspended' : 'active'
      await tenantAPI.update(id, { status: nextStatus })
      fetchTenants()
    } catch (err) {
      console.error('Error updating tenant:', err)
      alert(err.response?.data?.message || 'Failed to update tenant status')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete tenant "${name}"? This action cannot be undone.`)) {
      return
    }
    try {
      await tenantAPI.delete(id)
      fetchTenants()
    } catch (err) {
      console.error('Error deleting tenant:', err)
      alert(err.response?.data?.message || 'Failed to delete tenant')
    }
  }

  const handleSetDevTenant = (subdomain) => {
    localStorage.setItem('mockTenant', subdomain)
    setActiveDevTenant(subdomain)
  }

  const filteredTenants = tenants.filter((t) => {
    const q = searchTerm.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      t.subdomain.toLowerCase().includes(q) ||
      (t.customDomain && t.customDomain.toLowerCase().includes(q))
    )
  })

  const totalTenants = tenants.length
  const activeTenants = tenants.filter((t) => t.status === 'active').length
  const totalAuctions = tenants.reduce((acc, t) => acc + (t.stats?.auctions || 0), 0)
  const totalUsers = tenants.reduce((acc, t) => acc + (t.stats?.users || 0), 0)

  if (currentUser && currentUser.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16 px-4">
        <div className="max-w-md mx-auto bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] rounded-xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✕
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You must be logged in as a <strong>Platform SuperAdmin</strong> to view this portal.
          </p>
          <Link
            to="/"
            className="inline-block bg-black dark:bg-[#c3a372] text-white dark:text-black px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👑</span>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                SuperAdmin Control Plane
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage multi-tenant organizations, domain isolation, and platform instances.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] px-4 py-2 rounded-lg text-sm">
            <span className="text-gray-500 dark:text-gray-400">Dev Active Scope:</span>
            <span className="font-semibold text-[#c3a372]">{activeDevTenant}</span>
          </div>
        </div>

        {/* Stats Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] p-5 rounded-xl shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Organizations
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totalTenants}</div>
          </div>
          <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] p-5 rounded-xl shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Active Tenants
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{activeTenants}</div>
          </div>
          <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] p-5 rounded-xl shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#c3a372]">
              Auctions Hosted
            </div>
            <div className="mt-2 text-3xl font-bold text-[#c3a372]">{totalAuctions}</div>
          </div>
          <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] p-5 rounded-xl shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-500">
              Tenant Users
            </div>
            <div className="mt-2 text-3xl font-bold text-blue-500">{totalUsers}</div>
          </div>
        </div>

        {/* Create New Tenant Form */}
        <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>➕</span> Provision New Tenant
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Christie's Auctions"
                value={newTenant.name}
                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c3a372]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subdomain Slug *
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="e.g. christies"
                  value={newTenant.subdomain}
                  onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c3a372]"
                  required
                />
                <span className="bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-700 px-2 py-2 text-xs text-gray-500 rounded-r-lg">
                  .bidmaster
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Domain (Optional)
              </label>
              <input
                type="text"
                placeholder="auctions.brand.com"
                value={newTenant.customDomain}
                onChange={(e) => setNewTenant({ ...newTenant, customDomain: e.target.value })}
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c3a372]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-black dark:bg-[#c3a372] hover:bg-gray-900 dark:hover:bg-[#d6b785] text-white dark:text-black font-semibold py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Provision Tenant'}
              </button>
            </div>
          </form>
        </div>

        {/* Tenants Table */}
        <div className="bg-white dark:bg-[#1a1918] border border-gray-200 dark:border-[#2a2825] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-[#2a2825] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active SaaS Tenants</h2>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c3a372]"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading organizations...</div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">{error}</div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No matching tenants found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Organization</th>
                    <th className="px-6 py-4">Subdomain / Domain</th>
                    <th className="px-6 py-4">Metrics</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tenant.settings?.primaryColor || '#c3a372' }}
                          />
                          <span>{tenant.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        <div className="font-mono text-xs">{tenant.subdomain}.bidmaster.com</div>
                        {tenant.customDomain && (
                          <div className="text-xs text-gray-400 font-mono">{tenant.customDomain}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{tenant.stats?.auctions || 0} auctions</span> •{' '}
                        <span>{tenant.stats?.users || 0} users</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tenant.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => handleSetDevTenant(tenant.subdomain)}
                          title="Set as active tenant in current browser session"
                          className={`text-xs px-2.5 py-1 rounded font-medium ${
                            activeDevTenant === tenant.subdomain
                              ? 'bg-[#c3a372] text-black'
                              : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {activeDevTenant === tenant.subdomain ? 'Current Scope' : 'Switch To'}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(tenant._id, tenant.status)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(tenant._id, tenant.name)}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SuperAdmin
