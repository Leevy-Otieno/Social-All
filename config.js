// config.js — SINGLE SOURCE OF TRUTH
// Change anything here → applies everywhere in the app

module.exports = {

  // ── APP IDENTITY ──────────────────────────────────────────────
  app: {
    name: process.env.APP_NAME || 'YouBGram',
    tagline: process.env.APP_TAGLINE || 'Connect with the world',
    domain: process.env.APP_DOMAIN || 'https://youbgram.ybtshop.com',
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
    maintenance: process.env.MAINTENANCE === 'true',
    maintenanceMsg: 'App is under maintenance. Back soon!',
    version: '1.0.0',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@app.com',
  },

  // ── GOOGLE AUTH ───────────────────────────────────────────────
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    adminEmail: process.env.GOOGLE_ADMIN_EMAIL || 'admin@example.com',
  },

  // ── JWT ───────────────────────────────────────────────────────
  jwt: {
    secret: process.env.JWT_SECRET || 'CHANGE_ME_STRONG_SECRET_32CHARS',
    expiry: '30d',
    adminSecret: process.env.ADMIN_JWT_SECRET || 'CHANGE_ME_ADMIN_SECRET_32CHARS',
    adminExpiry: '12h',
  },

  // ── COLOUR THEME (used by React + Tailwind CSS variables) ─────
  theme: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryLight: '#DBEAFE',
    accent: '#0EA5E9',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    border: '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    sponsoredBg: '#FEF9C3',
    sponsoredText: '#A16207',
    darkSurface: '#0F172A',
    darkText: '#F1F5F9',
  },

  // ── TYPOGRAPHY ────────────────────────────────────────────────
  font: {
    family: "'Inter', 'Roboto', system-ui, sans-serif",
    sizeBase: '15px',
    sizeSm: '13px',
    sizeLg: '18px',
    sizeXl: '22px',
    weightNormal: 400,
    weightMedium: 500,
    weightBold: 700,
  },

  // ── PROFILE LIMITS ────────────────────────────────────────────
  profile: {
    usernameMin: 3,
    usernameMax: 30,
    usernameRegex: '^[a-zA-Z0-9_]+$',
    nameMax: 50,
    bioMax: 200,
    avatarMaxKb: 100,
    avatarQuality: 85,
    minAgeYears: 13,
  },

  // ── POST LIMITS ───────────────────────────────────────────────
  post: {
    textMax: 280,
    imageMaxKb: 500,
    imageQuality: 80,
    allowedMimes: ['image/jpeg','image/png','image/webp','image/gif'],
    maxImages: 1,
    mentionLimit: 5,
    shareUrlBase: '/p/',
    perPage: 20,
  },

  // ── COMMENT LIMITS ────────────────────────────────────────────
  comment: {
    textMax: 200,
    replyMax: 200,
    perPage: 30,
  },

  // ── ADS SYSTEM ────────────────────────────────────────────────
  ads: {
    enabled: true,
    feedMinBetween: 2,
    feedMaxBetween: 5,
    imageMaxKb: 200,
    inNotifications: true,
    inExplore: true,
    sponsoredLabel: 'Sponsored',
  },

  // ── NOTIFICATIONS ─────────────────────────────────────────────
  notification: {
    ttlHours: 2,
    perPage: 30,
  },

  // ── MESSAGES ─────────────────────────────────────────────────
  message: {
    textMax: 500,
    perPage: 50,
  },

  // ── EXPLORE ───────────────────────────────────────────────────
  explore: {
    postsPerPage: 30,
    usersPerPage: 30,
    searchMinChars: 2,
  },

  // ── FEED SUGGESTIONS ─────────────────────────────────────────
  suggestions: {
    enabled: true,
    everyNPosts: 5,
    usersPerCard: 5,
  },

  // ── REPORT REASONS ────────────────────────────────────────────
  reportReasons: [
    { key: 'spam', label: 'Spam or misleading' },
    { key: 'inappropriate', label: 'Inappropriate content' },
    { key: 'harassment', label: 'Harassment or bullying' },
    { key: 'hate_speech', label: 'Hate speech' },
    { key: 'other', label: 'Something else' },
  ],

  // ── ACCOUNT TYPES ─────────────────────────────────────────────
  accountTypes: [
    'Creator', 'Freelancer', 'Business Owner',
    'Student', 'Professional', 'Other',
  ],

  // ── RATE LIMITS ────────────────────────────────────────────────
  rateLimit: {
    global: 120,
    postCreate: 10,
    messageSend: 60,
    search: 30,
    auth: 20,
  },

  // ── STORAGE PATHS ─────────────────────────────────────────────
  storage: {
    avatarsDir: 'storage/avatars',
    postsDir: 'storage/posts',
    adsDir: 'storage/ads',
    publicUrl: '/storage',
  },

  // ── ADMIN ─────────────────────────────────────────────────────
  admin: {
    itemsPerPage: 25,
    sessionExpiry: '12h',
  },

  // ── RESPONSIVE BREAKPOINTS ────────────────
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1024,
  },

  // ── MOBILE ──────────────────────────────────────────────────
  mobile: {
    bottomNavHeight: '64px',
    cardBorderRadius: '12px',
    buttonBorderRadius: '8px',
    avatarSize: '40px',
    avatarSizeLg: '80px',
    touchTargetMin: '48px',
    pagePadding: '16px',
  },

  // ── DESKTOP ───────────────────────────────────────────────────
  desktop: {
    sidebarWidth: '240px',
    contentMaxWidth: '600px',
    pagePadding: '24px',
  },

};
