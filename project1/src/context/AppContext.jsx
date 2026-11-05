import { createContext, useContext, useState, useEffect } from 'react'
import { getSocket } from '../services/socket.js'
import { auctionsAPI } from '../services/api.js'

const AppContext = createContext()

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export function AppProvider({ children, initialAuctions = [], initialUsers = [], initialCommissionRate = 0.05 }) {
  const [auctions, setAuctions] = useState(initialAuctions)
  const [users, setUsers] = useState(initialUsers)
  const [commissionRate, setCommissionRate] = useState(initialCommissionRate)
  const [loading, setLoading] = useState(true)

  // Load auctions from database
  async function loadAuctionsFromDB() {
    try {
      setLoading(true)
      const response = await auctionsAPI.getAll({ status: 'active' })
      const auctionsData = response.data.data || response.data
      if (auctionsData?.length > 0) {
        const dbAuctions = auctionsData.map(auction => ({
          id: auction._id,
          _id: auction._id,
          title: auction.title,
          description: auction.description,
          category: auction.category,
          startingPrice: auction.startingPrice,
          currentPrice: auction.currentPrice,
          image: auction.images?.[0] || auction.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
          endTime: new Date(auction.endTime).getTime(),
          bids: (auction.bids || []).map(bid => ({
            bidder: bid.bidderName,
            bidderId: bid.bidderId,
            amount: bid.amount,
            time: new Date(bid.timestamp)
          })),
          seller: auction.seller?.username || auction.seller?.name || auction.sellerName || 'Unknown',
          sellerId: auction.seller?._id || null,
          status: auction.status,
          isPermanent: auction.isPermanent || false
        }))
        setAuctions(dbAuctions)
      }
    } catch (error) {
      console.error('Error loading auctions:', error)
    } finally {
      setLoading(false)
    }
  }

  const [outbidAlert, setOutbidAlert] = useState(null)

  // Play subtle real-time audio chime on new bids or outbids
  function playBidChime(isOutbid = false) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(isOutbid ? 300 : 587.33, ctx.currentTime) // D5 or lower for outbid
      if (!isOutbid) {
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5
      } else {
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25)
      }
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch (e) {
      // Audio not permitted without interaction or unsupported
    }
  }

  // Socket event handlers
  useEffect(() => {
    loadAuctionsFromDB()
    const socket = getSocket()

    socket.on('bidUpdate', (data) => {
      playBidChime(false)
      setAuctions(prev => prev.map(auction => {
        const auctionId = auction._id || auction.id
        if (auctionId === data.auctionId) {
          return {
            ...auction,
            currentPrice: data.newPrice,
            bids: [...auction.bids, {
              bidder: data.bidderName,
              bidderId: data.bidderId,
              amount: data.newPrice,
              time: new Date(data.timestamp || Date.now())
            }]
          }
        }
        return auction
      }))
    })

    socket.on('bidPlaced', (data) => {
      playBidChime(false)

      // Check if current logged-in user was outbid
      const currentStoredUser = localStorage.getItem('user')
      if (currentStoredUser) {
        try {
          const parsed = JSON.parse(currentStoredUser)
          const currentUserId = parsed.id || parsed._id
          if (
            data.previousHighestBidderId &&
            data.previousHighestBidderId.toString() === currentUserId.toString() &&
            data.bidderId?.toString() !== currentUserId.toString()
          ) {
            playBidChime(true)
            setOutbidAlert({
              auctionId: data.auctionId,
              auctionTitle: data.auctionTitle || 'an item you bid on',
              newPrice: data.amount,
              suggestedBid: data.amount + 50,
            })
          }
        } catch (e) {
          // ignore
        }
      }

      setAuctions(prev => prev.map(auction => {
        const auctionId = auction._id || auction.id
        if (auctionId === data.auctionId) {
          return {
            ...auction,
            currentPrice: data.amount,
            bids: [...auction.bids, {
              bidder: data.bidderName,
              bidderId: data.bidderId,
              amount: data.amount,
              time: new Date(data.timestamp || Date.now())
            }]
          }
        }
        return auction
      }))
    })

    socket.on('auctionUpdated', (data) => {
      setAuctions(prev => prev.map(auction =>
        auction.id === data.auctionId ? { ...auction, ...data.updates } : auction
      ))
    })

    socket.on('auctionRemoved', (data) => {
      setAuctions(prev => prev.filter(auction => auction.id !== data.auctionId))
    })

    socket.on('auctionCreated', (data) => {
      setAuctions(prev => [data.auction, ...prev])
    })

    socket.on('auctionEnded', (data) => {
      setAuctions(prev => prev.map(auction =>
        auction.id === data.auctionId ? { ...auction, status: 'ended', endTime: data.endTime || auction.endTime } : auction
      ))
    })

    socket.on('userUpdated', (data) => {
      setUsers(prev => prev.map(user =>
        user.email === data.userEmail ? { ...user, ...data.updates } : user
      ))
    })

    socket.on('commissionRateUpdated', (data) => {
      setCommissionRate(data.commissionRate)
    })

    socket.on('userRegistered', (data) => {
      setUsers(prev => {
        if (prev.some(u => u.email === data.user.email)) return prev
        return [...prev, data.user]
      })
    })

    return () => {
      socket.off('bidUpdate')
      socket.off('bidPlaced')
      socket.off('auctionUpdated')
      socket.off('auctionRemoved')
      socket.off('auctionCreated')
      socket.off('auctionEnded')
      socket.off('userUpdated')
      socket.off('commissionRateUpdated')
      socket.off('userRegistered')
    }
  }, [])

  function updateAuction(auctionId, updates) {
    setAuctions(prev => prev.map(auction => {
      if (auction.id === auctionId) {
        const socket = getSocket()
        socket.emit('auctionUpdate', { auctionId, updates })
        return { ...auction, ...updates }
      }
      return auction
    }))
  }

  function removeAuction(auctionId) {
    setAuctions(prev => prev.filter(a => a.id !== auctionId))
    getSocket().emit('auctionRemove', { auctionId })
  }

  function updateUser(userEmail, updates) {
    setUsers(prev => prev.map(user => {
      if (user.email === userEmail) {
        getSocket().emit('userUpdate', { userEmail, updates })
        return { ...user, ...updates }
      }
      return user
    }))
  }

  function updateCommissionRateValue(newRate) {
    setCommissionRate(newRate)
    getSocket().emit('commissionRateUpdate', { commissionRate: newRate })
  }

  async function placeBid(auctionId, bidData) {
    const auction = auctions.find(a => a.id === auctionId || a._id === auctionId)
    if (!auction) return { success: false, message: 'Auction not found' }

    const endTime = auction.endTime instanceof Date ? auction.endTime.getTime() : auction.endTime
    if (endTime <= Date.now() || auction.status === 'ended') {
      return { success: false, message: 'This auction has ended' }
    }

    try {
      const mongoId = auction._id || auction.id
      const response = await auctionsAPI.placeBid(mongoId, bidData.amount)

      if (response.data?.success !== false) {
        const updatedAuction = response.data.data || response.data
        setAuctions(prev => prev.map(a => {
          const currentId = a._id || a.id
          if (currentId === mongoId) {
            return {
              ...a,
              currentPrice: updatedAuction.currentPrice,
              bids: (updatedAuction.bids || []).map(bid => ({
                bidder: bid.bidderName,
                bidderId: bid.bidderId,
                amount: bid.amount,
                time: new Date(bid.timestamp)
              }))
            }
          }
          return a
        }))
        return { success: true }
      }
      return { success: false, message: response.data?.message || 'Failed to place bid' }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to place bid' }
    }
  }

  function addUser(user) {
    setUsers(prev => {
      const exists = prev.some(u => u.email === user.email)
      if (exists) {
        return prev.map(u => u.email === user.email ? { ...u, ...user } : u)
      }
      getSocket().emit('userRegister', { user })
      return [...prev, user]
    })
  }

  function deleteUser(userEmail) {
    setUsers(prev => prev.filter(u => u.email !== userEmail))
    getSocket().emit('userDelete', { userEmail })
  }

  async function createAuction(auctionData) {
    try {
      // Call the backend API to create the auction
      const response = await auctionsAPI.create({
        title: auctionData.title,
        description: auctionData.description,
        category: auctionData.category,
        startingPrice: parseFloat(auctionData.startingPrice),
        duration: parseInt(auctionData.duration) || 24,
        image: auctionData.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
      })

      const savedAuction = response.data.data || response.data

      // Map the saved auction to our local format
      const newAuction = {
        id: savedAuction._id,
        _id: savedAuction._id,
        title: savedAuction.title,
        description: savedAuction.description,
        category: savedAuction.category,
        startingPrice: savedAuction.startingPrice,
        currentPrice: savedAuction.currentPrice,
        image: savedAuction.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
        endTime: new Date(savedAuction.endTime).getTime(),
        bids: [],
        seller: savedAuction.sellerName || auctionData.user?.name || 'Anonymous',
        sellerId: savedAuction.seller,
        status: 'active'
      }

      setAuctions(prev => [newAuction, ...prev])
      return { success: true, auction: newAuction }
    } catch (error) {
      console.error('Error creating auction:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create auction'
      }
    }
  }

  // Auto-end expired auctions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const endedIds = []

      setAuctions(prev => prev.map(auction => {
        const endTime = auction.endTime instanceof Date ? auction.endTime.getTime() : auction.endTime
        if (endTime <= now && auction.status !== 'ended') {
          endedIds.push(auction.id)
          return { ...auction, status: 'ended' }
        }
        return auction
      }))

      if (endedIds.length > 0) {
        const socket = getSocket()
        endedIds.forEach(id => socket.emit('auctionEnd', { auctionId: id, endTime: now }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const value = {
    auctions, setAuctions,
    users, setUsers,
    commissionRate, setCommissionRate: updateCommissionRateValue,
    updateAuction, removeAuction, updateUser,
    placeBid, addUser, deleteUser, createAuction,
    loadAuctionsFromDB, loading,
    outbidAlert, setOutbidAlert, playBidChime,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
