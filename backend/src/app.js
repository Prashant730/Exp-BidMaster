const express = require('express')
const cors = require('cors')
const path = require('path')
const helmet = require('helmet')

const app = express()
const { tenantContext } = require('./middleware/tenant')

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}))

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://project1-steel-ten.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true)

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.includes('.vercel.app')
      ) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-tenant-subdomain'],
  })
)

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Apply tenant context to API routes
app.use('/api', tenantContext)

app.use('/api/auth', require('./routes/auth'))
app.use('/api/tenants', require('./routes/tenants'))
app.use('/api/users', require('./routes/users'))
app.use('/api/auctions', require('./routes/auctions'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/activity', require('./routes/activity'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/contact', require('./routes/contact'))

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

app.use((err, req, res, next) => {
  console.error('Error:', err.stack)

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ msg: e.message }))
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors,
    })
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(409).json({
      success: false,
      message: field + ' already exists',
    })
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    })
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS: Origin not allowed',
    })
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  })
})

module.exports = app

