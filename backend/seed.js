require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./src/models/User')
const Auction = require('./src/models/Auction')
const Settings = require('./src/models/Settings')
const Tenant = require('./src/models/Tenant')

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB Connected')

    // Clear existing data
    console.log('Clearing existing data...')
    await User.deleteMany({})
    await Auction.deleteMany({})
    await Settings.deleteMany({})
    await Tenant.deleteMany({})

    // Create tenants
    console.log('Creating tenants...')
    const defaultTenant = await Tenant.create({
      name: 'BidMaster Global',
      subdomain: 'default',
      status: 'active',
      settings: {
        primaryColor: '#c3a372',
        secondaryColor: '#1a1918',
      },
    })

    const sampleTenant = await Tenant.create({
      name: 'Art & Collectibles Hub',
      subdomain: 'arthub',
      status: 'active',
      settings: {
        primaryColor: '#6366f1',
        secondaryColor: '#0f172a',
      },
    })

    // Create superadmin user
    console.log('Creating superadmin user...')
    await User.create({
      username: 'superadmin',
      email: 'superadmin@bidmaster.com',
      password: 'admin123',
      role: 'superadmin',
      isAdmin: true,
      name: 'Platform SuperAdmin',
    })

    // Create admin user
    console.log('Creating admin user...')
    const admin = await User.create({
      username: 'admin',
      email: 'admin@auction.com',
      password: 'admin123',
      role: 'admin',
      isAdmin: true,
      name: 'Admin User',
    })

    // Create seller users
    console.log('Creating seller users...')
    const seller1 = await User.create({
      username: 'seller1',
      email: 'seller1@auction.com',
      password: 'seller123',
      role: 'seller',
      sellerStatus: 'approved',
      isValidated: true,
      name: 'John Seller',
      businessName: 'Luxury Watches Co',
      businessType: 'Retail',
    })

    const seller2 = await User.create({
      username: 'seller2',
      email: 'seller2@auction.com',
      password: 'seller123',
      role: 'seller',
      sellerStatus: 'approved',
      isValidated: true,
      name: 'Jane Art Dealer',
      businessName: 'Fine Arts Gallery',
      businessType: 'Art Dealer',
    })

    // Create bidder users
    console.log('Creating bidder users...')
    const bidder1 = await User.create({
      username: 'bidder1',
      email: 'bidder1@auction.com',
      password: 'bidder123',
      role: 'bidder',
      name: 'Alice Bidder',
    })

    const bidder2 = await User.create({
      username: 'bidder2',
      email: 'bidder2@auction.com',
      password: 'bidder123',
      role: 'bidder',
      name: 'Bob Collector',
    })

    const bidder3 = await User.create({
      username: 'bidder3',
      email: 'bidder3@auction.com',
      password: 'bidder123',
      role: 'bidder',
      name: 'Charlie Buyer',
    })

    const bidder4 = await User.create({
      username: 'bidder4',
      email: 'bidder4@auction.com',
      password: 'bidder123',
      role: 'bidder',
      name: 'Diana Collector',
    })

    const bidder5 = await User.create({
      username: 'bidder5',
      email: 'bidder5@auction.com',
      password: 'bidder123',
      role: 'bidder',
      name: 'Edward Enthusiast',
    })

    // Create pending seller
    console.log('Creating pending seller...')
    await User.create({
      username: 'pending_seller',
      email: 'pending@auction.com',
      password: 'pending123',
      role: 'seller',
      sellerStatus: 'pending',
      isValidated: false,
      name: 'Charlie Pending',
      businessName: 'Electronics Store',
      businessType: 'Electronics',
      description: 'Selling quality electronics',
    })

    // Create sample auctions
    console.log('Creating sample auctions...')

    // Active auctions - using longer durations (7-30 days)
    const auction1 = await Auction.create({
      title: 'Vintage Rolex Submariner Watch',
      description:
        'Authentic vintage Rolex Submariner from 1960s. Excellent condition with original box and papers.',
      category: 'Watches',
      startingPrice: 5000,
      currentPrice: 7500,
      image:
        'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800',
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      seller: seller1._id,
      sellerName: seller1.name,
      status: 'active',
      bids: [
        {
          bidderId: bidder1._id,
          bidderName: bidder1.name,
          amount: 6000,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          bidderId: bidder2._id,
          bidderName: bidder2.name,
          amount: 7500,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
      ],
    })

    await Auction.create({
      title: 'Modern Abstract Painting',
      description:
        'Original abstract painting by emerging artist. Acrylic on canvas, 48x36 inches.',
      category: 'Art',
      startingPrice: 1500,
      currentPrice: 1500,
      image:
        'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
      endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      seller: seller2._id,
      sellerName: seller2.name,
      status: 'active',
    })

    await Auction.create({
      title: 'Antique Victorian Furniture Set',
      description:
        'Beautiful Victorian-era furniture set including sofa, two chairs, and coffee table. Restored to original condition.',
      category: 'Furniture',
      startingPrice: 3000,
      currentPrice: 3500,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
      endTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      seller: seller1._id,
      sellerName: seller1.name,
      status: 'active',
      bids: [
        {
          bidderId: bidder1._id,
          bidderName: bidder1.name,
          amount: 3500,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
      ],
    })

    await Auction.create({
      title: 'Rare Baseball Card Collection',
      description:
        'Complete set of 1952 Topps baseball cards including Mickey Mantle rookie card. Professionally graded.',
      category: 'Collectibles',
      startingPrice: 10000,
      currentPrice: 10000,
      image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800',
      endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      seller: seller2._id,
      sellerName: seller2.name,
      status: 'active',
    })

    await Auction.create({
      title: 'MacBook Pro 16" M3 Max',
      description:
        'Brand new sealed MacBook Pro 16-inch with M3 Max chip, 64GB RAM, 2TB SSD. Space Black.',
      category: 'Electronics',
      startingPrice: 3000,
      currentPrice: 3200,
      image:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      endTime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
      seller: seller1._id,
      sellerName: seller1.name,
      status: 'active',
      bids: [
        {
          bidderId: bidder2._id,
          bidderName: bidder2.name,
          amount: 3200,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
      ],
    })

    await Auction.create({
      title: 'Diamond Engagement Ring',
      description:
        '2 carat diamond engagement ring, platinum setting, VS1 clarity, E color. Certified by GIA.',
      category: 'Jewelry',
      startingPrice: 8000,
      currentPrice: 9500,
      image:
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
      endTime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      seller: seller2._id,
      sellerName: seller2.name,
      status: 'active',
      bids: [
        {
          bidderId: bidder1._id,
          bidderName: bidder1.name,
          amount: 8500,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        {
          bidderId: bidder2._id,
          bidderName: bidder2.name,
          amount: 9500,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ],
    })

    // Create ended auction
    await Auction.create({
      title: 'Vintage Camera Collection',
      description:
        'Collection of vintage film cameras from the 1970s-1980s. All in working condition.',
      category: 'Collectibles',
      startingPrice: 500,
      currentPrice: 850,
      image:
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800',
      endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      seller: seller1._id,
      sellerName: seller1.name,
      status: 'ended',
      winnerId: bidder1._id,
      winnerName: bidder1.name,
      bids: [
        {
          bidderId: bidder2._id,
          bidderName: bidder2.name,
          amount: 600,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          bidderId: bidder1._id,
          bidderName: bidder1.name,
          amount: 850,
          timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
        },
      ],
    })

    // Create PERMANENT demo auctions (never expire)
    console.log('Creating permanent demo auctions...')
    const farFuture = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 years from now

    await Auction.create({
      title: 'Classic Omega Speedmaster Professional',
      description:
        'The iconic Omega Speedmaster Professional "Moonwatch" - the same model worn on the Apollo missions. Features manual-winding movement, hesalite crystal, and comes with original box and papers. Excellent condition with minor wear consistent with age.',
      category: 'Watches',
      startingPrice: 4500,
      currentPrice: 4500,
      image:
        'https://img.chrono24.com/images/uhren/43725996-z8ktsyxkh4et7nifcjsdtbed-ExtraLarge.jpg',
      endTime: farFuture,
      seller: seller1._id,
      sellerName: seller1.name,
      status: 'active',
      isPermanent: true,
      bids: [],
    })

    await Auction.create({
      title: 'Renaissance Oil Painting - Italian Landscape',
      description:
        'Stunning 18th century Italian landscape oil painting. Original gilt frame. Depicts the rolling hills of Tuscany with a pastoral scene. Authenticated by leading art historians. Perfect for collectors of classical European art.',
      category: 'Art',
      startingPrice: 12000,
      currentPrice: 12000,
      image:
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
      endTime: farFuture,
      seller: seller2._id,
      sellerName: seller2.name,
      status: 'active',
      isPermanent: true,
      bids: [],
    })

    await Auction.create({
      title: 'Rare First Edition Harry Potter Book',
      description:
        'First edition, first printing of "Harry Potter and the Philosopher\'s Stone" by J.K. Rowling. Published by Bloomsbury 1997. One of only 500 copies printed. Excellent condition with minor shelf wear. A true collector\'s item.',
      category: 'Collectibles',
      startingPrice: 25000,
      currentPrice: 25000,
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
      endTime: farFuture,
      seller: seller1._id,
      sellerName: seller1.name,
      status: 'active',
      isPermanent: true,
      bids: [],
    })

    await Auction.create({
      title: 'Mid-Century Modern Eames Lounge Chair',
      description:
        'Authentic Herman Miller Eames Lounge Chair and Ottoman (670/671). Original 1970s production with rosewood veneer and black leather. All original parts, professionally cleaned and conditioned. A design icon for any modern home.',
      category: 'Furniture',
      startingPrice: 3500,
      currentPrice: 3500,
      image:
        'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800',
      endTime: farFuture,
      seller: seller2._id,
      sellerName: seller2.name,
      status: 'active',
      isPermanent: true,
      bids: [],
    })

    await Auction.create({
      title: 'Sony PlayStation 5 Pro Limited Edition',
      description:
        'Brand new sealed PlayStation 5 Pro Limited Edition console. Includes two DualSense controllers, vertical stand, and exclusive limited edition design. Only 10,000 units produced worldwide. Perfect for gaming collectors.',
      category: 'Electronics',
      startingPrice: 800,
      currentPrice: 800,
      image:
        'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800',
      endTime: farFuture,
      seller: seller1._id,
      sellerName: seller1.name,
      status: 'active',
      isPermanent: true,
      bids: [],
    })

    await Auction.create({
      title: 'Vintage Cartier Love Bracelet 18K Gold',
      description:
        'Authentic Cartier Love Bracelet in 18K yellow gold. Size 17. Comes with original screwdriver, box, and certificate. Classic timeless design. Shows beautiful patina consistent with vintage pieces from the 1990s.',
      category: 'Jewelry',
      startingPrice: 6500,
      currentPrice: 6500,
      image:
        'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800',
      endTime: farFuture,
      seller: seller2._id,
      sellerName: seller2.name,
      status: 'active',
      isPermanent: true,
      bids: [],
    })

    await Auction.create({
      title: 'Antique Persian Silk Rug - Tabriz',
      description:
        'Exquisite hand-knotted Persian silk rug from Tabriz. Approximately 100 years old. Features intricate floral medallion design with rich reds, blues, and ivory. Size: 8x10 feet. Museum quality piece with documented provenance.',
      category: 'Collectibles',
      startingPrice: 15000,
      currentPrice: 15000,
      image:
        'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800',
      endTime: farFuture,
      seller: seller1._id,
      sellerName: seller1.name,
      status: 'active',
      isPermanent: true,
      bids: [],
    })

    await Auction.create({
      title: 'Apple Vision Pro 1TB - Sealed',
      description:
        'Brand new factory sealed Apple Vision Pro with 1TB storage. Includes all accessories, travel case, and AppleCare+. The ultimate spatial computing device. Experience apps, entertainment, and productivity like never before.',
      category: 'Electronics',
      startingPrice: 4200,
      currentPrice: 4200,
      image:
        'https://images.unsplash.com/photo-1628202926206-c63a34b1618f?w=800',
      endTime: farFuture,
      seller: seller2._id,
      sellerName: seller2.name,
      status: 'active',
      isPermanent: true,
      bids: [],
    })

    // Create platform settings
    console.log('Creating platform settings...')
    await Settings.create({
      commissionRate: 0.05,
      categories: [
        'Watches',
        'Art',
        'Collectibles',
        'Furniture',
        'Electronics',
        'Jewelry',
      ],
      siteRules: {
        defaultAuctionDuration: 24,
        minBidIncrement: 100,
        maxAuctionDuration: 168,
        minStartingPrice: 10,
      },
      announcements: [
        {
          title: 'Welcome to BidMaster!',
          message: 'Start bidding on amazing items from verified sellers.',
          priority: 'high',
          active: true,
        },
      ],
    })

    // Create sample activities for live activity feed
    console.log('Creating sample activities...')
    const Activity = require('./src/models/Activity')
    await Activity.deleteMany({})

    await Activity.create([
      {
        type: 'user_registered',
        message: 'New user registered: John Seller',
        userId: seller1._id,
        userName: seller1.name,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        type: 'seller_approved',
        message: 'Seller approved: John Seller',
        userId: seller1._id,
        userName: seller1.name,
        createdAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000),
      },
      {
        type: 'user_registered',
        message: 'New user registered: Jane Art Dealer',
        userId: seller2._id,
        userName: seller2.name,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        type: 'seller_approved',
        message: 'Seller approved: Jane Art Dealer',
        userId: seller2._id,
        userName: seller2.name,
        createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
      },
      {
        type: 'user_registered',
        message: 'New user registered: Alice Bidder',
        userId: bidder1._id,
        userName: bidder1.name,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        type: 'user_registered',
        message: 'New user registered: Bob Collector',
        userId: bidder2._id,
        userName: bidder2.name,
        createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      },
      {
        type: 'user_registered',
        message: 'New user registered: Charlie Buyer',
        userId: bidder3._id,
        userName: bidder3.name,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        type: 'user_registered',
        message: 'New user registered: Diana Collector',
        userId: bidder4._id,
        userName: bidder4.name,
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      },
      {
        type: 'user_registered',
        message: 'New user registered: Edward Enthusiast',
        userId: bidder5._id,
        userName: bidder5.name,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        type: 'auction_created',
        message: 'New auction: Vintage Rolex Submariner Watch',
        userId: seller1._id,
        userName: seller1.name,
        auctionId: auction1._id,
        auctionTitle: auction1.title,
        createdAt: new Date(Date.now() - 55 * 60 * 1000),
      },
      {
        type: 'bid',
        message: 'Bid placed: $6000 on Vintage Rolex Submariner Watch',
        userId: bidder1._id,
        userName: bidder1.name,
        auctionId: auction1._id,
        auctionTitle: auction1.title,
        amount: 6000,
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        type: 'bid',
        message: 'Bid placed: $7500 on Vintage Rolex Submariner Watch',
        userId: bidder2._id,
        userName: bidder2.name,
        auctionId: auction1._id,
        auctionTitle: auction1.title,
        amount: 7500,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        type: 'seller_request',
        message: 'Seller request submitted by Charlie Pending',
        userId: null,
        userName: 'Charlie Pending',
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
    ])

    console.log('\n✅ Database seeded successfully!')
    console.log('\n📝 Test Accounts:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('SuperAdmin:')
    console.log('  Email: superadmin@bidmaster.com')
    console.log('  Password: admin123')
    console.log('\nAdmin:')
    console.log('  Email: admin@auction.com')
    console.log('  Password: admin123')
    console.log('\nSellers:')
    console.log('  Email: seller1@auction.com')
    console.log('  Password: seller123')
    console.log('  Email: seller2@auction.com')
    console.log('  Password: seller123')
    console.log('\nBidders:')
    console.log('  Email: bidder1@auction.com (Alice Bidder)')
    console.log('  Email: bidder2@auction.com (Bob Collector)')
    console.log('  Email: bidder3@auction.com (Charlie Buyer)')
    console.log('  Email: bidder4@auction.com (Diana Collector)')
    console.log('  Email: bidder5@auction.com (Edward Enthusiast)')
    console.log('  Password for all: bidder123')
    console.log('\nPending Seller (needs approval):')
    console.log('  Email: pending@auction.com')
    console.log('  Password: pending123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
