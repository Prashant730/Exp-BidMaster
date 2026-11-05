import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

function AuctionGrid(props) {
  const auctions = props.auctions
  const currentUser = props.currentUser
  const onAdminRemove = props.onAdminRemove
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('ending')
  const [activeTheaterAuction, setActiveTheaterAuction] = useState(null)

  const categories = ['all', 'Watches', 'Art', 'Collectibles', 'Furniture', 'Electronics', 'Jewelry']

  const filteredAuctions = auctions.filter(function(auction) {
    return filter === 'all' || auction.category === filter
  })

  const sortedAuctions = filteredAuctions.slice()
  sortedAuctions.sort(function(a, b) {
    if (sortBy === 'ending') {
      return a.endTime - b.endTime
    } else if (sortBy === 'price') {
      return b.currentPrice - a.currentPrice
    }
    return 0
  })

  return (
    <section className="py-8 sm:py-12 bg-gray-50 dark:bg-black transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Filters and Sorting */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 dark:border-[#2a2825] pb-4 mb-10 space-y-6 md:space-y-0">
          <div className="flex flex-wrap gap-6 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`text-[13px] uppercase tracking-wider font-medium transition-colors whitespace-nowrap pb-1 border-b-2 ${
                  filter === category
                    ? 'border-[#2a2825] dark:border-[#c3a372] text-[#2a2825] dark:text-[#c3a372]'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <span className="text-[11px] uppercase tracking-widest text-gray-400 font-medium">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-gray-900 dark:text-white font-medium text-sm focus:ring-0 cursor-pointer"
            >
              <option value="ending">Ending Soon</option>
              <option value="price">Highest Price</option>
            </select>
          </div>
        </div>

        {/* Auction Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
          {sortedAuctions.map(auction => (
            <AuctionCard
              key={auction._id || auction.id}
              auction={auction}
              currentUser={currentUser}
              onAdminRemove={onAdminRemove}
              onOpenTheater={(a) => setActiveTheaterAuction(a)}
            />
          ))}
        </div>

        {/* Live Auction Theater Modal */}
        {activeTheaterAuction && (
          <LiveAuctionTheater
            auction={activeTheaterAuction}
            currentUser={currentUser}
            onClose={() => setActiveTheaterAuction(null)}
          />
        )}

        {sortedAuctions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No auctions found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function AuctionCard(props) {
  const auction = props.auction
  const currentUser = props.currentUser
  const onAdminRemove = props.onAdminRemove
  const onOpenTheater = props.onOpenTheater
  const { placeBid } = useApp()
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())
  const [quickBidding, setQuickBidding] = useState(false)
  const [bidSuccessPulse, setBidSuccessPulse] = useState(false)

  function calculateTimeLeft() {
    const endTime = auction.endTime instanceof Date ? auction.endTime.getTime() : auction.endTime
    const difference = endTime - Date.now()
    let timeLeft = {}

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    return timeLeft
  }

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [auction.endTime, auction.status])

  const endTime = auction.endTime instanceof Date ? auction.endTime.getTime() : auction.endTime
  const isAuctionEnded = auction.status === 'ended' || (endTime - Date.now() <= 0 && !auction.isPermanent)
  const isEndingSoon = !isAuctionEnded && !auction.isPermanent && (endTime - Date.now() < 3600000) // Less than 1 hour

  // Format time display
  function formatTimeLeft() {
    if (auction.isPermanent) {
      return '∞ Always'
    }
    if (timeLeft.days && timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`
    }
    return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
  }

  const auctionId = auction._id || auction.id

  // 1-Click Fast Bid Execution right from Card
  async function handleQuickBid(e, increment) {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUser) {
      alert('Please sign in to place a bid')
      return
    }
    if (currentUser.isAdmin) {
      alert('Admins cannot place bids')
      return
    }
    if (isAuctionEnded) {
      alert('This auction has already ended')
      return
    }

    try {
      setQuickBidding(true)
      const targetAmount = auction.currentPrice + increment
      const result = await placeBid(auctionId, {
        amount: targetAmount,
        bidderName: currentUser.name || currentUser.username,
      })
      if (result && result.success) {
        setBidSuccessPulse(true)
        setTimeout(() => setBidSuccessPulse(false), 1500)
      } else {
        alert(result?.message || 'Could not place quick bid')
      }
    } catch (err) {
      alert('Error placing bid')
    } finally {
      setQuickBidding(false)
    }
  }

  return (
    <div className={`bg-transparent group flex flex-col h-full w-full relative transition-all duration-300 rounded-sm ${bidSuccessPulse ? 'ring-2 ring-[#c3a372] scale-[1.01]' : ''}`}>
      <Link to={`/auction/${auctionId}`} className="flex flex-col h-full w-full">
        <div className="relative overflow-hidden flex-shrink-0 border border-gray-100 dark:border-[#2a2825] rounded-sm">
          <img
            src={auction.image}
            alt={auction.title}
            className="w-full h-56 object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {isAuctionEnded ? (
              <span className="bg-[#1a1918]/90 text-[#d4d0c8] px-2 py-1 text-[10px] uppercase tracking-wider font-semibold border border-[#2a2825]">Ended</span>
            ) : (
              <span className="bg-white/95 dark:bg-[#1a1918]/95 text-[#2a2825] dark:text-[#c3a372] px-2 py-1 text-[10px] uppercase tracking-wider font-semibold border border-gray-200 dark:border-[#2a2825] flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c3a372] animate-pulse"></span>Live
              </span>
            )}
            {isEndingSoon && (
              <span className="bg-[#b95757]/95 text-white px-2 py-1 text-[10px] uppercase tracking-wider font-semibold shadow-sm">Ending</span>
            )}
          </div>
          
          {/* Quick Stream Theater Button */}
          {!isAuctionEnded && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (onOpenTheater) onOpenTheater(auction)
              }}
              className="absolute bottom-3 left-3 bg-black/80 hover:bg-black text-[#c3a372] text-[11px] font-semibold px-2.5 py-1 rounded backdrop-blur-sm border border-[#3a352e] flex items-center gap-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              title="Open Live Auction Arena"
            >
              <span>⚡ Live Arena</span>
            </button>
          )}

          {currentUser && currentUser.isAdmin && (
            <button
              onClick={function(e) {
                e.preventDefault()
                e.stopPropagation()
                if (onAdminRemove) {
                  onAdminRemove(auctionId)
                }
              }}
              className="absolute top-3 left-3 bg-white/90 text-red-600 hover:bg-white px-2 py-1 text-[10px] uppercase tracking-wider font-bold shadow-sm"
              title="Remove auction"
            >
              Remove
            </button>
          )}
        </div>

        <div className="pt-4 pb-2 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-1 gap-2">
            <h3 className="font-serif text-lg text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-[#d4b88f] transition-colors line-clamp-1 flex-1">{auction.title}</h3>
          </div>

          <p className="text-gray-500 dark:text-[#a39f98] text-xs font-light mb-3 flex-shrink-0 uppercase tracking-widest">{auction.category}</p>

          <div className="border-t border-gray-100 dark:border-[#2a2825] pt-3 flex justify-between items-end mb-3">
            <div>
              <p className="text-[10px] text-gray-400 dark:text-[#a39f98] uppercase tracking-wider mb-0.5">Current Bid</p>
              <p className="text-lg font-serif font-semibold text-gray-900 dark:text-[#c3a372]">₹{auction.currentPrice.toLocaleString()}</p>
            </div>
            
            <div className="text-right">
              <p className="text-[10px] text-gray-400 dark:text-[#a39f98] uppercase tracking-wider mb-0.5">
                {auction.isPermanent ? 'Status' : 'Time Left'}
              </p>
              <p className={`text-sm font-medium ${isEndingSoon && !auction.isPermanent ? 'text-[#b95757]' : 'text-gray-700 dark:text-[#d4d0c8]'}`}>
                {formatTimeLeft()}
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* 1-Click Fast Bid Strip on the Card */}
      {!isAuctionEnded && (
        <div className="pt-1 pb-1 border-t border-gray-100 dark:border-[#22201d] flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Fast Bid:</span>
          <button
            disabled={quickBidding}
            onClick={(e) => handleQuickBid(e, 50)}
            className="flex-1 bg-gray-100 hover:bg-[#c3a372] hover:text-black dark:bg-[#1a1918] dark:hover:bg-[#c3a372] text-gray-800 dark:text-[#e4e0d8] dark:hover:text-black text-xs font-semibold py-1.5 rounded transition-colors disabled:opacity-50 border border-gray-200 dark:border-[#2a2825]"
          >
            +₹50
          </button>
          <button
            disabled={quickBidding}
            onClick={(e) => handleQuickBid(e, 100)}
            className="flex-1 bg-gray-100 hover:bg-[#c3a372] hover:text-black dark:bg-[#1a1918] dark:hover:bg-[#c3a372] text-gray-800 dark:text-[#e4e0d8] dark:hover:text-black text-xs font-semibold py-1.5 rounded transition-colors disabled:opacity-50 border border-gray-200 dark:border-[#2a2825]"
          >
            +₹100
          </button>
          <button
            disabled={quickBidding}
            onClick={(e) => handleQuickBid(e, 500)}
            className="flex-1 bg-gray-100 hover:bg-[#c3a372] hover:text-black dark:bg-[#1a1918] dark:hover:bg-[#c3a372] text-gray-800 dark:text-[#e4e0d8] dark:hover:text-black text-xs font-semibold py-1.5 rounded transition-colors disabled:opacity-50 border border-gray-200 dark:border-[#2a2825]"
          >
            +₹500
          </button>
        </div>
      )}
    </div>
  )
}

// Live Auction Theater / Arena Modal
function LiveAuctionTheater({ auction, currentUser, onClose }) {
  const { placeBid } = useApp()
  const [bidding, setBidding] = useState(false)
  const [customBid, setCustomBid] = useState('')
  const [theaterSuccess, setTheaterSuccess] = useState('')

  const auctionId = auction._id || auction.id

  async function submitBid(amount) {
    if (!currentUser) {
      alert('Please log in to bid')
      return
    }
    if (currentUser.isAdmin) {
      alert('Admins cannot bid')
      return
    }

    try {
      setBidding(true)
      const res = await placeBid(auctionId, {
        amount: parseFloat(amount),
        bidderName: currentUser.name || currentUser.username,
      })
      if (res && res.success) {
        setTheaterSuccess(`Bid of ₹${amount} placed!`)
        setTimeout(() => setTheaterSuccess(''), 2000)
        setCustomBid('')
      } else {
        alert(res?.message || 'Failed to place bid')
      }
    } catch (e) {
      alert('Error placing bid')
    } finally {
      setBidding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121110] border border-[#2e2a24] w-full max-w-2xl rounded-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2e2a24] bg-[#1a1816]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-[#c3a372] font-semibold">Live Bidding Arena</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <img
              src={auction.image}
              alt={auction.title}
              className="w-full sm:w-48 h-40 object-cover rounded border border-[#2e2a24]"
            />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-serif text-white mb-1">{auction.title}</h2>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">{auction.category}</p>
              
              <div className="bg-[#1a1816] p-3 rounded border border-[#2e2a24] inline-block sm:block">
                <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Current Highest Bid</span>
                <span className="text-3xl font-serif font-bold text-[#c3a372]">₹{auction.currentPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {theaterSuccess && (
            <div className="p-2.5 bg-[#c3a372]/20 border border-[#c3a372] text-[#c3a372] rounded text-center text-sm font-semibold animate-pulse">
              ✓ {theaterSuccess}
            </div>
          )}

          {/* Quick Increment Row */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2 font-medium">1-Click Fast Tap:</label>
            <div className="grid grid-cols-4 gap-3">
              {[50, 100, 250, 500].map(inc => (
                <button
                  key={inc}
                  disabled={bidding}
                  onClick={() => submitBid(auction.currentPrice + inc)}
                  className="bg-[#1c1a17] hover:bg-[#c3a372] text-[#e4e0d8] hover:text-black font-semibold py-3 rounded border border-[#332e27] transition-all transform active:scale-95 text-sm flex flex-col items-center justify-center"
                >
                  <span className="text-xs opacity-70">+₹{inc}</span>
                  <span className="text-base font-bold">₹{auction.currentPrice + inc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Bid Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (customBid) submitBid(customBid)
            }}
            className="flex gap-2"
          >
            <input
              type="number"
              placeholder={`Enter amount > ₹${auction.currentPrice}`}
              value={customBid}
              onChange={(e) => setCustomBid(e.target.value)}
              min={auction.currentPrice + 1}
              className="flex-1 bg-[#161513] border border-[#332e27] rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#c3a372]"
            />
            <button
              type="submit"
              disabled={bidding || !customBid || parseFloat(customBid) <= auction.currentPrice}
              className="bg-[#c3a372] text-black font-bold px-6 py-2 rounded hover:bg-[#d8b885] transition-colors disabled:opacity-40"
            >
              {bidding ? 'Placing...' : 'Place Bid'}
            </button>
          </form>

          {/* Recent Bids Feed */}
          <div>
            <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Live Activity Stream</h4>
            <div className="bg-[#161513] border border-[#2e2a24] rounded divide-y divide-[#22201c] max-h-36 overflow-y-auto">
              {(auction.bids && auction.bids.length > 0) ? (
                auction.bids.slice().reverse().map((bid, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">{bid.bidder}</span>
                    <span className="text-[#c3a372] font-semibold">₹{bid.amount.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-gray-500">No bids placed yet. Be the first!</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuctionGrid
