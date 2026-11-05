import { io } from 'socket.io-client'

// Get the socket URL from environment variables, or use default localhost URL
let SOCKET_URL = 'http://localhost:5000'

if (import.meta.env && import.meta.env.VITE_SOCKET_URL) {
  SOCKET_URL = import.meta.env.VITE_SOCKET_URL
} else if (import.meta.env && import.meta.env.PROD) {
  // Use your new Render backend as the default in production
  SOCKET_URL = 'https://bidmaster-1-zgvo.onrender.com'
  console.log("Using Production Socket URL:", SOCKET_URL)
}

// Variable to store the socket connection
let socket = null

// Helper to determine current tenant scope
function getActiveTenantScope() {
  let subdomain = localStorage.getItem('mockTenant')
  if (!subdomain && typeof window !== 'undefined' && window.location.hostname) {
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname)
    if (!isIP && window.location.hostname !== 'localhost') {
      const parts = window.location.hostname.split('.')
      if (parts.length >= 3 && parts[0] !== 'www') {
        subdomain = parts[0]
      } else if (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www') {
        subdomain = parts[0]
      }
    }
  }
  return subdomain || 'default'
}

// Function to handle successful connection
function handleConnect() {
  console.log('Connected to server via WebSocket')
  const tenantScope = getActiveTenantScope()
  if (socket && tenantScope) {
    socket.emit('joinTenant', { subdomain: tenantScope })
  }
}

// Function to handle disconnection
function handleDisconnect() {
  console.log('Disconnected from server')
}

// Function to connect to the socket server
export function connectSocket() {
  // Only create a new connection if one doesn't exist
  if (!socket) {
    // Create socket connection with configuration
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    })

    // Listen for connection event
    socket.on('connect', handleConnect)

    // Listen for disconnection event
    socket.on('disconnect', handleDisconnect)
  }
  return socket
}

// Function to disconnect from the socket server
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Function to retrieve current socket or initialize it
export function getSocket() {
  if (!socket) {
    return connectSocket()
  }
  return socket
}

// Helper to join a specific auction room
export function joinAuctionRoom(auctionId) {
  if (socket) {
    socket.emit('joinAuction', { auctionId })
  }
}

// Helper to leave a specific auction room
export function leaveAuctionRoom(auctionId) {
  if (socket) {
    socket.emit('leaveAuction', { auctionId })
  }
}

// Helper to join admin room
export function joinAdminRoom(tenantId) {
  if (socket) {
    socket.emit('joinAdminRoom', { tenantId })
  }
}

// Helper to leave admin room
export function leaveAdminRoom(tenantId) {
  if (socket) {
    socket.emit('leaveAdminRoom', { tenantId })
  }
}

export default {
  connectSocket,
  disconnectSocket,
  joinAuctionRoom,
  leaveAuctionRoom,
  joinAdminRoom,
  leaveAdminRoom,
  getSocket,
}
