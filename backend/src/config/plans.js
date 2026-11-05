const PLANS = {
  free: {
    id: 'free',
    name: 'Free Starter',
    price: 0,
    interval: 'month',
    maxAuctions: 5,
    maxUsers: 50,
    commissionRate: 0.10, // 10%
    customBranding: false,
    analyticsLevel: 'basic', // basic, advanced, enterprise
    features: [
      'Up to 5 active auctions',
      'Up to 50 registered bidders',
      '10% platform fee',
      'Standard auction types',
      'Community support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Business Pro',
    price: 99,
    interval: 'month',
    maxAuctions: 50,
    maxUsers: 1000,
    commissionRate: 0.05, // 5%
    customBranding: true,
    analyticsLevel: 'advanced',
    features: [
      'Up to 50 active auctions',
      'Up to 1,000 registered bidders',
      '5% platform fee (half of free plan)',
      'Custom branding & logo colors',
      'Advanced auction dashboard & reporting',
      'Custom subdomain or custom domain support',
      'Priority email support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise VIP',
    price: 499,
    interval: 'month',
    maxAuctions: 1000000, // Unlimited
    maxUsers: 1000000, // Unlimited
    commissionRate: 0.02, // 2%
    customBranding: true,
    analyticsLevel: 'enterprise',
    features: [
      'Unlimited active auctions',
      'Unlimited bidders & accounts',
      'Ultra-low 2% platform fee',
      'White-label custom domain & full CSS theming',
      'Real-time enterprise metrics & exports',
      'Dedicated account manager & 24/7 SLA',
      'Custom integrations & webhooks',
    ],
  },
};

module.exports = { PLANS };

