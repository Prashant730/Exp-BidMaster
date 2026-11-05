import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import AuctionGrid from './components/AuctionGrid.jsx'
import AuctionDetail from './components/AuctionDetail.jsx'
import CreateAuction from './components/CreateAuction.jsx'
import UserProfile from './components/UserProfile.jsx'
import LoginModal from './components/LoginModal.jsx'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import BiddingPolicy from './components/BiddingPolicy.jsx'
import ContactSupport from './components/ContactSupport.jsx'
import Admin from './components/Admin.jsx'
import SuperAdmin from './components/SuperAdmin.jsx'
import PricingPlans from './components/PricingPlans.jsx'
import BusinessOnboarding from './components/BusinessOnboarding.jsx'
import TenantDashboard from './components/TenantDashboard.jsx'
import AdminGuide from './components/AdminGuide.jsx'
import AuctioneerDashboard from './components/AuctioneerDashboard.jsx'
import SellerApproval from './components/SellerApproval.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuctionProvider } from './context/AuctionContext.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AppProvider, useApp } from './context/AppContext.jsx'
import './index.css'
import './dark-theme-professional.css'

// Component to redirect to home on page reload
function RedirectToHome() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(function() {
    const isPageReload = !sessionStorage.getItem('app_loaded')
    if (isPageReload && location.pathname !== '/') {
      sessionStorage.setItem('app_loaded', 'true')
      window.location.href = '/'
      return
    }
    sessionStorage.setItem('app_loaded', 'true')
  }, [location.pathname, navigate])

  return null
}

function AppContent() {
  const appContext = useApp()
  const auctions = appContext.auctions
  const users = appContext.users
  const commissionRate = appContext.commissionRate
  const updateAuction = appContext.updateAuction
  const removeAuction = appContext.removeAuction
  const addUser = appContext.addUser
  const createAuction = appContext.createAuction
  const outbidAlert = appContext.outbidAlert
  const setOutbidAlert = appContext.setOutbidAlert
  const placeBid = appContext.placeBid

  const { user: authUser, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [localUser, setLocalUser] = useState(null)
  const user = authUser || localUser

  function handleLogin(email, _password, name, requestSeller) {
    let isAdmin = email && email.endsWith('@admin.com')
    let isSeller = (email && email.endsWith('@seller.com')) || requestSeller === true

    let userRole = 'bidder'
    if (isAdmin) userRole = 'admin'
    else if (isSeller) userRole = 'seller'

    let isValidated = !isSeller
    let sellerStatus = isSeller ? 'pending' : null

    const newUser = {
      name: name || 'Demo User',
      email: email,
      bids: [],
      wonItems: [],
      address: '',
      phone: '',
      profilePhoto: '',
      status: 'active',
      role: userRole,
      isValidated: isValidated,
      isAdmin: isAdmin,
      sellerStatus: sellerStatus
    }

    setLocalUser(newUser)
    addUser(newUser)
    setShowLogin(false)
  }

  function onUpdateAuction(auctionId, updates) {
    updateAuction(auctionId, updates)
  }

  function onUserBid(auctionId) {
    setLocalUser(function(prev) {
      if (!prev) return prev
      if (prev.bids && prev.bids.includes(auctionId)) return prev

      return {
        ...prev,
        bids: [...(prev.bids || []), auctionId]
      }
    })
  }

  function handleLogout() {
    if (logout) logout()
    setLocalUser(null)
  }

  async function handleCreateAuction(auctionData) {
    return await createAuction({
      ...auctionData,
      user: user
    })
  }

  function handleUpdateUser(updated) {
    setLocalUser(updated)
  }

  return (
    <Router>
      <RedirectToHome />
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
        <Header user={user} onLoginClick={() => setShowLogin(true)} onLogout={handleLogout} />

        <Routes>
          <Route path="/" element={
            <>
              <Hero user={user} />
              <AuctionGrid auctions={auctions} currentUser={user} onAdminRemove={removeAuction} />
            </>
          } />

          <Route path="/auction/:id" element={
            <AuctionDetail
              auctions={auctions}
              user={user}
              onUpdateAuction={onUpdateAuction}
              onUserBid={onUserBid}
              onAdminRemove={removeAuction}
            />
          } />

          <Route path="/create" element={
            <CreateAuction user={user} onAddAuction={handleCreateAuction} />
          } />

          <Route path="/admin" element={
            <Admin currentUser={user} users={users} auctions={auctions} commissionRate={commissionRate} />
          } />

          <Route path="/superadmin" element={
            <SuperAdmin currentUser={user} />
          } />

          <Route path="/pricing" element={<PricingPlans />} />
          <Route path="/business/signup" element={<BusinessOnboarding />} />
          <Route path="/tenant-dashboard" element={<TenantDashboard currentUser={user} />} />

          <Route path="/profile" element={
            <UserProfile user={user} auctions={auctions} onUpdateUser={handleUpdateUser} users={users} />
          } />

          <Route path="/policy" element={<BiddingPolicy />} />
          <Route path="/contact" element={<ContactSupport />} />
          <Route path="/admin-guide" element={<AdminGuide />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auctioneer" element={<AuctioneerDashboard currentUser={user} auctions={auctions} />} />
          <Route path="/seller-approval" element={<SellerApproval currentUser={user} />} />
        </Routes>

        {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}

        {/* Global Outbid Notification Floating Toast with Instant 1-Click Re-Bid */}
        {outbidAlert && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1a1816] border-2 border-[#b95757] text-white p-4 rounded-lg shadow-2xl max-w-sm animate-bounce">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span className="font-bold text-sm text-[#e4a0a0]">You were outbid!</span>
              </div>
              <button
                onClick={() => setOutbidAlert(null)}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-300 mb-3">
              Someone outbid you on <span className="text-[#c3a372] font-semibold">{outbidAlert.auctionTitle}</span>. Current highest: <span className="font-bold">₹{outbidAlert.newPrice.toLocaleString()}</span>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!user) return
                  await placeBid(outbidAlert.auctionId, {
                    amount: outbidAlert.suggestedBid,
                    bidderName: user.name || user.username,
                  })
                  setOutbidAlert(null)
                }}
                className="flex-1 bg-[#c3a372] hover:bg-[#d8b885] text-black font-bold text-xs py-2 px-3 rounded shadow transition-transform active:scale-95 text-center"
              >
                ⚡ Counter-Bid ₹{outbidAlert.suggestedBid.toLocaleString()}
              </button>
              <button
                onClick={() => setOutbidAlert(null)}
                className="bg-black/50 hover:bg-black text-gray-300 text-xs py-2 px-3 rounded border border-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </Router>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AuctionProvider>
            <AppProvider initialAuctions={[]} initialUsers={[]} initialCommissionRate={0.05}>
              <AppContent />
            </AppProvider>
          </AuctionProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

