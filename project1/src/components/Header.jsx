import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import BeginnerGuide from './BeginnerGuide.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

function Header(props) {
  const user = props.user
  const onLoginClick = props.onLoginClick
  const onLogout = props.onLogout
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [showBeginnerGuide, setShowBeginnerGuide] = useState(false)
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
	const location = useLocation()
	const { isDark, toggleTheme } = useTheme()

  return (
    <header className="bg-white dark:bg-black shadow-lg dark:shadow-none sticky top-0 z-50 transition-colors duration-200 dark:border-b dark:border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl sm:text-3xl font-serif text-gray-900 dark:text-white tracking-tight">BidMaster</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium transition-colors duration-200 ${
                location.pathname === '/' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Live Auctions
            </Link>
            <Link
              to="/pricing"
              className={`font-medium transition-colors duration-200 ${
                location.pathname === '/pricing' ? 'text-[#c3a372]' : 'text-gray-600 dark:text-gray-200 hover:text-[#c3a372]'
              }`}
            >
              Pricing & Plans
            </Link>
				{(!user || !user.isAdmin) && (
					<>
						<Link
							to="/create"
							className={`font-medium transition-colors duration-200 ${
								location.pathname === '/create' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
							}`}
						>
							Sell Item
						</Link>

						<button
							onClick={() => setShowBeginnerGuide(true)}
							className="font-medium text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
						>
							Learn More
						</button>
					</>
				)}

          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

				{user ? (
					<div className="relative">
					<button
						onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
						className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-black text-white font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400"
						aria-haspopup="true"
						aria-expanded={isUserMenuOpen}
						title={user.name}
					>
						{user.profilePhoto ? (
							<img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
						) : (
							(user.name || 'U').charAt(0).toUpperCase()
						)}
					</button>
						{isUserMenuOpen && (
						<div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl py-2 z-50">
								<div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-slate-700">Signed in as <span className="font-medium">{user.name}</span></div>
              {user.isAdmin && (
								<Link
									to="/tenant-dashboard"
									onClick={() => setIsUserMenuOpen(false)}
									className="block px-4 py-2 text-sm text-[#c3a372] hover:bg-gray-100 dark:hover:bg-slate-700 font-semibold"
								>
									🏢 Tenant Dashboard
								</Link>
							)}
              {user.isAdmin && (
								<Link
									to="/admin"
									onClick={() => setIsUserMenuOpen(false)}
									className="block px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 font-semibold"
								>
									Admin Panel
								</Link>
							)}
              {user.isAdmin && (
                <Link
                  to="/admin-guide"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Admin Guide
                </Link>
              )}
              {user.role === 'superadmin' && (
                <Link
                  to="/superadmin"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-[#c3a372] hover:bg-gray-100 dark:hover:bg-slate-700 font-semibold"
                >
                  👑 SuperAdmin (SaaS)
                </Link>
              )}
              {(user.role === 'auctioneer' || user.isAdmin) && user.isValidated && (
                <Link
                  to="/auctioneer"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 font-semibold"
                >
                  Auctioneer Dashboard
                </Link>
              )}
								<Link
									to="/profile"
									onClick={() => setIsUserMenuOpen(false)}
									className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
								>
									My Profile
								</Link>
							{user.isAdmin && (
								<Link
									to="/seller-approval"
									onClick={() => setIsUserMenuOpen(false)}
									className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
								>
									Seller Approvals
								</Link>
							)}
							{(!user.isAdmin && user.role !== 'seller' && !user.sellerStatus) && (
								<Link
									to="/seller-approval"
									onClick={() => setIsUserMenuOpen(false)}
									className="block px-4 py-2 text-sm text-black dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 font-medium"
								>
									Become a Seller
								</Link>
							)}
							{(!user || !user.isAdmin) && (
								<>
									<Link
										to="/policy"
										onClick={() => setIsUserMenuOpen(false)}
										className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
									>
										Policy
									</Link>
									<Link
										to="/contact"
										onClick={() => setIsUserMenuOpen(false)}
										className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
									>
										Contact
									</Link>
								</>
							)}
								<div className="my-2 border-t border-gray-100 dark:border-slate-700" />
								<button
									onClick={() => {
										setIsUserMenuOpen(false)
										onLogout()
									}}
									className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-700"
								>
									Logout
								</button>
							</div>
						)}
					</div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="hidden sm:block text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white px-2 py-2 font-medium text-sm transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-[#1a1918] dark:hover:bg-black text-[#c3a372] px-5 sm:px-6 py-2.5 rounded font-medium text-sm transition-all duration-200"
                >
                  <span className="hidden sm:inline">Create Account</span>
                  <span className="sm:hidden">Join</span>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
				{isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-slate-700 pt-4 animate-fadeIn">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="font-medium text-base text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-purple-400 py-2" onClick={() => setIsMenuOpen(false)}>
                Live Auctions
              </Link>
              {(!user || !user.isAdmin) && (
                <Link to="/create" className="font-medium text-base text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-purple-400 py-2" onClick={() => setIsMenuOpen(false)}>
                  Sell Item
                </Link>
              )}
							{user && (
								<>
									<Link to="/profile" className="font-medium text-base text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-purple-400 py-2" onClick={() => setIsMenuOpen(false)}>
										My Profile
									</Link>
									{user.isAdmin && (
										<>
											<Link to="/admin" className="font-medium text-base text-black dark:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>
												Admin Dashboard
											</Link>
											<Link to="/seller-approval" className="font-medium text-base text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-purple-400 py-2" onClick={() => setIsMenuOpen(false)}>
												Seller Approvals
											</Link>
										</>
									)}
									{user.role === 'superadmin' && (
										<Link to="/superadmin" className="font-medium text-base text-[#c3a372] py-2" onClick={() => setIsMenuOpen(false)}>
											👑 SuperAdmin (SaaS)
										</Link>
									)}
									{(!user.isAdmin && user.role !== 'seller' && !user.sellerStatus) && (
										<Link to="/seller-approval" className="font-medium text-base text-black dark:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>
											Become a Seller
										</Link>
									)}
									{user.isAdmin && (
										<Link to="/admin" className="font-medium text-base text-black dark:text-gray-200 py-2 hidden" onClick={() => setIsMenuOpen(false)}>
											Admin Panel
										</Link>
									)}
									{(user.role === 'auctioneer' || user.isAdmin) && user.isValidated && (
										<Link to="/auctioneer" className="font-medium text-base text-blue-600 dark:text-blue-400 py-2" onClick={() => setIsMenuOpen(false)}>
											Auctioneer Dashboard
										</Link>
									)}
								</>
							)}
              <button
                onClick={() => {
                  setShowBeginnerGuide(true)
                  setIsMenuOpen(false)
                }}
                className="font-medium text-base text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-purple-400 text-left py-2"
              >
                Learn More
              </button>
              {!user && (
                <>
                  <Link to="/login" className="font-medium text-base text-black dark:text-gray-200 py-2" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="font-medium text-base bg-black text-white px-4 py-2 rounded-lg text-center" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
              {user && !user.isAdmin && (
                <>
                  <Link to="/policy" className="font-medium text-base text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-purple-400 py-2" onClick={() => setIsMenuOpen(false)}>
                    Policy
                  </Link>
                  <Link to="/contact" className="font-medium text-base text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-purple-400 py-2" onClick={() => setIsMenuOpen(false)}>
                    Contact
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showBeginnerGuide && <BeginnerGuide onClose={() => setShowBeginnerGuide(false)} />}
    </header>
  )
}

export default Header
