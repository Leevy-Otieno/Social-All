Social Media App — React + Node.js + SQLite
Entry Point: server.js | Deploy: cPanel Node.js | Build: Vite → Express serves dist

SECTION 1 — TECH STACK
LayerTechnologyBackend RuntimeNode.js 18 LTSBackend FrameworkExpress.js (minimal, no extra framework)DatabaseSQLite — better-sqlite3 (zero config, file-based)Image CompressionsharpFile UploadmulterAuthJWT (jsonwebtoken) + Google OAuth (google-auth-library)Real-timews (WebSocket)Schedulernode-cronStorageLocal /storage folder (Express static served)FrontendReact 18 + ViteUI Componentsshadcn/ui (npx shadcn@latest init)Iconsreact-iconsStateZustandRouterReact Router v6HTTP ClientAxiosStylingTailwind CSS (shadcn default)Google Client IDYOUR_GOOGLE_CLIENT_IDAdmin Gmailadmin@example.com
How It Works TogetheUser visits domain →
Express serves client/dist/index.html (React SPA) →
React Router handles all frontend pages →
API calls hit /api/v1/\* (Express handles) →
Admin: if Google login email = admin@example.com → auto admin access

SECTION 2 — MASTER CONFIG config.js
js// ╔══════════════════════════════════════════════════════════════╗
// ║ config.js — SINGLE SOURCE OF TRUTH ║
// ║ Change anything here → applies everywhere in the app ║
// ╚══════════════════════════════════════════════════════════════╝

module.exports = {

// ── APP IDENTITY ──────────────────────────────────────────────
app: {
name: process.env.APP_NAME || 'SocialApp',
tagline: process.env.APP_TAGLINE || 'Connect with the world',
domain: process.env.APP_DOMAIN || 'http://localhost:3000',
port: Number(process.env.PORT) || 3000,
env: process.env.NODE_ENV || 'development',
maintenance: process.env.MAINTENANCE === 'true',
maintenanceMsg: 'App is under maintenance. Back soon!',
version: '1.0.0',
supportEmail: process.env.SUPPORT_EMAIL || 'support@app.com',
},

// ── GOOGLE AUTH ───────────────────────────────────────────────
google: {
clientId: 'YOUR_GOOGLE_CLIENT_ID',
adminEmail: 'admin@example.com', // this email → auto admin access
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
// Primary palette — Blue sky + white + black (light mode, zero gradient)
primary: '#2563EB', // Blue-600 — buttons, links, active states
primaryHover: '#1D4ED8', // Blue-700 — hover state
primaryLight: '#DBEAFE', // Blue-100 — chip backgrounds, badges
accent: '#0EA5E9', // Sky-500 — secondary accent
background: '#FFFFFF', // Pure white — page background
surface: '#F8FAFC', // Slate-50 — card background
border: '#E2E8F0', // Slate-200 — dividers, borders
textPrimary: '#0F172A', // Slate-900 — main text
textSecondary: '#64748B', // Slate-500 — subtitles, timestamps
textMuted: '#94A3B8', // Slate-400 — placeholders
danger: '#EF4444', // Red-500 — errors, delete
success: '#22C55E', // Green-500 — success states
warning: '#F59E0B', // Amber-500 — warnings
// Sponsored / Ad label
sponsoredBg: '#FEF9C3', // Yellow-100
sponsoredText: '#A16207', // Yellow-800
// Dark surfaces (admin sidebar, mobile nav)
darkSurface: '#0F172A', // Slate-900
darkText: '#F1F5F9', // Slate-100
// No gradients anywhere — flat solid colours only
},

// ── TYPOGRAPHY ────────────────────────────────────────────────
font: {
family: "'Inter', 'Roboto', system-ui, sans-serif",
sizeBase: '15px', // body
sizeSm: '13px', // caption, timestamp
sizeLg: '18px', // section headings
sizeXl: '22px', // screen headings
weightNormal: 400,
weightMedium: 500,
weightBold: 700,
},

// ── PROFILE LIMITS ────────────────────────────────────────────
profile: {
usernameMin: 3,
usernameMax: 30,
usernameRegex: '^[a-zA-Z0-9_]+$', // alphanumeric + underscore only
nameMax: 50,
bioMax: 100,
avatarMaxKb: 10,
avatarQuality: 85,
minAgeYears: 13,
},

// ── POST LIMITS ───────────────────────────────────────────────
post: {
textMax: 100,
imageMaxKb: 100,
imageQuality: 85,
allowedMimes: ['image/jpeg','image/png','image/webp','image/gif'],
maxImages: 1,
mentionLimit: 5,
shareUrlBase: '/p/', // share URL format: {domain}/p/{postId}
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
feedMinBetween: 2, // min posts before ad appears
feedMaxBetween: 5, // max posts before ad appears
imageMaxKb: 200,
inNotifications:true,
inExplore: true,
sponsoredLabel: 'Sponsored',
},

// ── NOTIFICATIONS ─────────────────────────────────────────────
notification: {
ttlHours: 2, // auto-delete after N hours
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

// ── REPORT REASONS (admin can update here) ────────────────────
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

// ── RATE LIMITS (requests per minute) ────────────────────────
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
publicUrl: '/storage', // served at this path
},

// ── ADMIN ─────────────────────────────────────────────────────
admin: {
itemsPerPage: 25,
sessionExpiry: '12h',
// Note: admin login via Google only (admin@example.com)
// No username/password for admin
},

// ── RESPONSIVE BREAKPOINTS (mirrors Tailwind) ────────────────
breakpoints: {
mobile: 640, // < 640px = mobile
tablet: 1024, // 640–1024px = tablet
desktop: 1024, // >= 1024px = desktop (sidebar shows)
},

// ── MOBILE (Android-native feel) ─────────────────────────────
mobile: {
bottomNavHeight: '64px',
cardBorderRadius: '12px',
buttonBorderRadius: '8px',
avatarSize: '40px',
avatarSizeLg: '80px',
touchTargetMin: '48px', // accessibility min touch size
pagePadding: '16px',
},

// ── DESKTOP ───────────────────────────────────────────────────
desktop: {
sidebarWidth: '240px',
contentMaxWidth: '600px', // feed max width on desktop
pagePadding: '24px',
},

};

SECTION 3 — FILE STRUCTURE
social-app/
│
├── server.js ← ENTRY POINT: Express + API + WS + Cron + static serve
├── config.js ← MASTER CONFIG (all limits, theme, settings)
├── package.json ← root package (backend deps)
├── .env ← environment variables
├── .gitignore
│
├── db/
│ └── database.js ← SQLite init + 15 tables + all query helpers
│
├── middleware/
│ └── index.js ← verifyToken + adminAuth + profileComplete + bannedCheck + rateLimit
│
├── services/
│ └── index.js ← ImageService + NotificationService + FeedService
│
├── jobs/
│ └── index.js ← CleanupJob + AdDeactivateJob (cron tasks)
│
├── controllers/
│ ├── auth.js ← googleAuth + logout + me + step1 + step2 + step3
│ ├── posts.js ← feed + suggestions + CRUD + likes + explore + search + report
│ ├── social.js ← comments + profile + follow + analytics + notifications
│ ├── chat.js ← conversations + messages + adClick + appConfig
│ └── admin.js ← ALL admin: dashboard + users + posts + reports + ads + settings
│
├── routes/
│ ├── api.js ← /api/v1/_ routes
│ └── admin.js ← /admin/api/_ routes
│
├── storage/ ← uploaded files (created on first run)
│ ├── avatars/ ← 10 KB max
│ ├── posts/ ← 100 KB max
│ └── ads/ ← 200 KB max
│
├── data/
│ └── app.db ← SQLite database file (auto-created)
│
└── client/ ← React frontend (Vite)
├── package.json ← frontend deps
├── vite.config.js ← Vite config (proxy /api → backend in dev)
├── tailwind.config.js ← Tailwind config (reads theme from config)
├── components.json ← shadcn/ui config
├── index.html ← Vite HTML shell (only file with HTML)
│
└── src/
├── main.jsx ← React root mount
├── App.jsx ← Router + auth guard + layout wrapper
├── config.js ← client-side config (reads from /api/v1/config)
│
├── lib/
│ ├── api.js ← Axios instance + ALL API call functions
│ ├── auth.js ← Google Sign-In helper + token storage
│ └── utils.js ← shadcn cn() helper + date format + misc
│
├── store/
│ └── index.js ← Zustand: authStore + feedStore + notifStore + chatStore
│
├── components/
│ ├── ui/ ← shadcn auto-generated (Button, Input, Sheet, Dialog…)
│ ├── Layout.jsx ← Responsive shell: mobile bottom nav + desktop sidebar
│ ├── PostCard.jsx ← Post display card (like/comment/share/3-dot)
│ ├── AdCard.jsx ← YouTube + Custom ad display
│ ├── SuggestionCard.jsx← Horizontal user suggestions row
│ ├── CommentSheet.jsx ← Bottom sheet: comments + replies + likes
│ ├── CreatePost.jsx ← Bottom sheet: create post (image + text + @mention)
│ ├── ReportSheet.jsx ← Bottom sheet: 5 report reason options
│ └── Avatar.jsx ← Reusable avatar with fallback initials
│
├── pages/
│ ├── auth/
│ │ ├── Login.jsx ← Google sign-in button screen
│ │ ├── Step1.jsx ← Avatar + name + username + DOB
│ │ ├── Step2.jsx ← Bio + account type
│ │ └── Step3.jsx ← Summary + confirm
│ ├── Home.jsx ← Feed (posts + ads + suggestions)
│ ├── Explore.jsx ← Grid/list + search + tabs
│ ├── Notifications.jsx ← Notif list + ad injection
│ ├── Messages.jsx ← Conversations list
│ ├── Chat.jsx ← Single chat screen (WebSocket)
│ ├── Profile.jsx ← Own profile + grid + analytics link
│ ├── OtherProfile.jsx ← Other user profile + follow + message
│ ├── EditProfile.jsx ← Edit own profile
│ ├── Analytics.jsx ← Post analytics charts
│ └── admin/
│ ├── Dashboard.jsx ← Stats + charts
│ ├── Users.jsx ← User management
│ ├── Content.jsx ← Posts + Reports tabs
│ ├── Ads.jsx ← Ads CRUD
│ └── Settings.jsx ← Config editor
│
└── hooks/
└── index.js ← useAuth + useFeed + useWebSocket + useMediaQuery
File Size Estimate
Backend (Node.js) — 10 files
FileContentsEst. Linesserver.jsExpress + WS + Cron + routes + static~200config.jsFull master config~150db/database.js15 tables + indexes + all query helpers~800middleware/index.js5 middleware functions~160services/index.jsImage + Notification + Feed~320jobs/index.js2 cron jobs~80controllers/auth.js6 handlers~220controllers/posts.js11 handlers~430controllers/social.js13 handlers~460controllers/chat.js6 handlers~280controllers/admin.js18 handlers~880routes/api.jsRoute wiring~100routes/admin.jsRoute wiring~80
Frontend (React) — 23 files
FileContentsEst. Linessrc/main.jsxReact root~30src/App.jsxRouter + auth guards~120src/config.jsClient config~40src/lib/api.jsAll Axios API calls~500src/lib/auth.jsGoogle auth + token~80src/lib/utils.jsHelpers~60src/store/index.jsZustand stores~300src/components/Layout.jsxResponsive shell~200src/components/PostCard.jsxPost card~180src/components/AdCard.jsxAd display~120src/components/SuggestionCard.jsxSuggestions~100src/components/CommentSheet.jsxComments bottom sheet~250src/components/CreatePost.jsxCreate post sheet~220src/components/ReportSheet.jsxReport options~80src/components/Avatar.jsxAvatar component~60src/pages/auth/_.jsxLogin + Step1/2/3~120 eachsrc/pages/Home.jsxFeed page~200src/pages/Explore.jsxExplore page~250src/pages/Notifications.jsxNotifications~150src/pages/Messages.jsxConversations~150src/pages/Chat.jsxChat + WebSocket~250src/pages/Profile.jsxOwn profile~280src/pages/OtherProfile.jsxOther profile~200src/pages/Analytics.jsxAnalytics~200src/pages/admin/_.jsxAdmin pages × 5~250 eachsrc/hooks/index.jsCustom hooks~200

SECTION 4 — DATABASE SCHEMA (15 Tables)
sql-- All in db/database.js as db.exec(`...`)
-- SQLite — WAL mode + foreign keys ON

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
google_id TEXT UNIQUE NOT NULL,
email TEXT UNIQUE NOT NULL,
name TEXT NOT NULL,
username TEXT UNIQUE NOT NULL,
avatar TEXT,
bio TEXT,
account_type TEXT,
date_of_birth TEXT,
show_dob INTEGER DEFAULT 0,
show_account_type INTEGER DEFAULT 1,
is_profile_complete INTEGER DEFAULT 0,
profile_step INTEGER DEFAULT 1,
is_active INTEGER DEFAULT 1,
is_banned INTEGER DEFAULT 0,
ban_reason TEXT,
followers_count INTEGER DEFAULT 0,
following_count INTEGER DEFAULT 0,
posts_count INTEGER DEFAULT 0,
created_at TEXT DEFAULT (datetime('now')),
updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. follows
CREATE TABLE IF NOT EXISTS follows (
id INTEGER PRIMARY KEY AUTOINCREMENT,
follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
created_at TEXT DEFAULT (datetime('now')),
UNIQUE(follower_id, following_id)
);

-- 3. posts
CREATE TABLE IF NOT EXISTS posts (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
text TEXT,
image TEXT,
share_url TEXT,
likes_count INTEGER DEFAULT 0,
comments_count INTEGER DEFAULT 0,
views_count INTEGER DEFAULT 0,
reach_count INTEGER DEFAULT 0,
is_active INTEGER DEFAULT 1,
created_at TEXT DEFAULT (datetime('now')),
updated_at TEXT DEFAULT (datetime('now'))
);

-- 4. post_mentions
CREATE TABLE IF NOT EXISTS post_mentions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
mentioned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- 5. post_likes
CREATE TABLE IF NOT EXISTS post_likes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
created_at TEXT DEFAULT (datetime('now')),
UNIQUE(post_id, user_id)
);

-- 6. comments (top-level + replies via parent_id)
CREATE TABLE IF NOT EXISTS comments (
id INTEGER PRIMARY KEY AUTOINCREMENT,
post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
text TEXT NOT NULL,
likes_count INTEGER DEFAULT 0,
is_active INTEGER DEFAULT 1,
created_at TEXT DEFAULT (datetime('now')),
updated_at TEXT DEFAULT (datetime('now'))
);

-- 7. comment_likes
CREATE TABLE IF NOT EXISTS comment_likes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
created_at TEXT DEFAULT (datetime('now')),
UNIQUE(comment_id, user_id)
);

-- 8. notifications (auto-deleted after ttlHours via cron)
CREATE TABLE IF NOT EXISTS notifications (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
actor_id INTEGER,
type TEXT NOT NULL, -- like|comment|reply|mention|follow|system
target_type TEXT, -- post|comment|user
target_id INTEGER,
message TEXT,
is_read INTEGER DEFAULT 0,
expires_at TEXT NOT NULL, -- datetime('now', '+N hours')
created_at TEXT DEFAULT (datetime('now'))
);

-- 9. conversations
CREATE TABLE IF NOT EXISTS conversations (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_one_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
user_two_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
last_message_id INTEGER,
last_message_at TEXT DEFAULT (datetime('now')),
created_at TEXT DEFAULT (datetime('now')),
UNIQUE(user_one_id, user_two_id)
);

-- 10. messages
CREATE TABLE IF NOT EXISTS messages (
id INTEGER PRIMARY KEY AUTOINCREMENT,
conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
text TEXT NOT NULL,
is_read INTEGER DEFAULT 0,
created_at TEXT DEFAULT (datetime('now'))
);

-- 11. ads
CREATE TABLE IF NOT EXISTS ads (
id INTEGER PRIMARY KEY AUTOINCREMENT,
type TEXT NOT NULL, -- youtube|custom
title TEXT NOT NULL,
caption TEXT,
image TEXT,
youtube_url TEXT,
cta_text TEXT DEFAULT 'Learn More',
cta_url TEXT NOT NULL,
placement TEXT DEFAULT '["feed"]', -- JSON array
is_active INTEGER DEFAULT 1,
impressions INTEGER DEFAULT 0,
clicks INTEGER DEFAULT 0,
starts_at TEXT,
ends_at TEXT,
created_at TEXT DEFAULT (datetime('now')),
updated_at TEXT DEFAULT (datetime('now'))
);

-- 12. reports
CREATE TABLE IF NOT EXISTS reports (
id INTEGER PRIMARY KEY AUTOINCREMENT,
reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
target_type TEXT NOT NULL, -- post|user|comment
target_id INTEGER NOT NULL,
reason TEXT NOT NULL,
status TEXT DEFAULT 'pending', -- pending|actioned|dismissed
admin_note TEXT,
reviewed_at TEXT,
created_at TEXT DEFAULT (datetime('now'))
);

-- 13. admins (email-based, Google login only)
CREATE TABLE IF NOT EXISTS admins (
id INTEGER PRIMARY KEY AUTOINCREMENT,
google_id TEXT UNIQUE NOT NULL,
email TEXT UNIQUE NOT NULL,
name TEXT NOT NULL,
role TEXT DEFAULT 'super_admin',
last_login TEXT,
created_at TEXT DEFAULT (datetime('now'))
);

-- 14. system_announcements
CREATE TABLE IF NOT EXISTS system_announcements (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
message TEXT NOT NULL,
is_active INTEGER DEFAULT 1,
created_at TEXT DEFAULT (datetime('now'))
);

-- 15. ad_events (impression + click tracking)
CREATE TABLE IF NOT EXISTS ad_events (
id INTEGER PRIMARY KEY AUTOINCREMENT,
ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
event_type TEXT NOT NULL, -- impression|click
user_id INTEGER,
created_at TEXT DEFAULT (datetime('now'))
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_posts_random ON posts(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_follow_pair ON follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_post_likes ON post_likes(post_id, user_id);

SECTION 5 — server.js ENTRY POINT
jsconst express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cron = require('node-cron');
const cors = require('cors');
const config = require('./config');
const { initDB } = require('./db/database');
const { cleanupNotifications, deactivateExpiredAds } = require('./jobs/index');

// ── Init DB (creates tables + seeds admin on first run) ───────
initDB();

const app = express();
const server = http.createServer(app);

// ── WebSocket (real-time DM) ──────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/ws' });
const clients = new Map(); // userId → ws
wss.on('connection', (ws, req) => {
const token = new URL(req.url, 'http://x').searchParams.get('token');
try {
const { userId } = require('jsonwebtoken').verify(token, config.jwt.secret);
ws.userId = userId;
clients.set(String(userId), ws);
ws.on('close', () => clients.delete(String(userId)));
ws.on('error', () => clients.delete(String(userId)));
} catch { ws.terminate(); }
});
app.set('wsClients', clients);

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: config.app.domain, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Maintenance check
app.use((req, res, next) => {
if (config.app.maintenance && !req.path.startsWith('/admin/api'))
return res.status(503).json({ ok: false, message: config.app.maintenanceMsg });
next();
});

// ── Static ────────────────────────────────────────────────────
app.use('/storage', express.static(path.join(**dirname, 'storage')));
app.use(express.static(path.join(**dirname, 'client/dist'))); // React build

// ── API Routes ────────────────────────────────────────────────
app.use('/api/v1', require('./routes/api'));
app.use('/admin/api', require('./routes/admin'));

// Share link: /p/:id → React handles it as SPA route
// All non-API routes → serve React index.html
app.get(/^(?!\/api|\/admin\/api|\/storage).\*$/, (req, res) => {
res.sendFile(path.join(\_\_dirname, 'client/dist/index.html'));
});

// ── Cron Jobs ─────────────────────────────────────────────────
cron.schedule('_/5 _ \* \* _', cleanupNotifications); // every 5 min
cron.schedule('0 _ \* \* \*', deactivateExpiredAds); // every hour

// ── Start ─────────────────────────────────────────────────────
server.listen(config.app.port, () => {
console.log(`\n🚀 ${config.app.name} running at ${config.app.domain}`);
console.log(`   Port: ${config.app.port} | Env: ${config.app.env}`);
});

SECTION 6 — package.json
Root (Backend)
json{
"name": "social-app",
"version": "1.0.0",
"main": "server.js",
"scripts": {
"start": "node server.js",
"dev": "nodemon server.js",
"build": "cd client && npm install && npm run build",
"install:all": "npm install && cd client && npm install"
},
"dependencies": {
"better-sqlite3": "^9.4.3",
"bcryptjs": "^2.4.3",
"cors": "^2.8.5",
"express": "^4.18.3",
"express-rate-limit": "^7.2.0",
"google-auth-library": "^9.7.0",
"jsonwebtoken": "^9.0.2",
"multer": "^1.4.5-lts.1",
"node-cron": "^3.0.3",
"sharp": "^0.33.3",
"uuid": "^9.0.1",
"ws": "^8.16.0"
},
"devDependencies": {
"nodemon": "^3.1.0"
}
}
client/package.json
json{
"name": "social-app-client",
"version": "1.0.0",
"type": "module",
"scripts": {
"dev": "vite",
"build": "vite build",
"preview": "vite preview"
},
"dependencies": {
"react": "^18.3.0",
"react-dom": "^18.3.0",
"react-router-dom": "^6.22.3",
"axios": "^1.6.8",
"zustand": "^4.5.2",
"react-icons": "^5.1.0",
"@google/generative-ai":"\*",
"class-variance-authority":"^0.7.0",
"clsx": "^2.1.0",
"tailwind-merge": "^2.2.2",
"recharts": "^2.12.4",
"@radix-ui/react-dialog":"^1.0.5",
"@radix-ui/react-sheet":"^1.0.5",
"@radix-ui/react-tabs": "^1.0.4",
"@radix-ui/react-avatar":"^1.0.4",
"@radix-ui/react-dropdown-menu":"^2.0.6"
},
"devDependencies": {
"@vitejs/plugin-react": "^4.2.1",
"autoprefixer": "^10.4.19",
"postcss": "^8.4.38",
"tailwindcss": "^3.4.3",
"vite": "^5.2.8"
}
}

SECTION 7 — ALL FEATURES DETAILED
7.1 Google Auth (User + Admin — Same Login Button)
User clicks "Continue with Google" →
google_sign_in popup →
returns { credential: idToken } →
POST /api/v1/auth/google { idToken } →

Server:

1. Verify idToken with Google (google-auth-library)
2. Extract { sub, email, name, picture }
3. Check: if email === config.google.adminEmail
   → find/create in admins table
   → issue admin JWT (adminSecret, 12h)
   → return { token, role: 'admin', redirectTo: '/admin/dashboard' }
4. Else: regular user flow
   → find/create in users table
   → issue user JWT (secret, 30d)
   → if new: return { is_profile_complete: false, profile_step: 1 }
   → if existing: return { is_profile_complete: true }

React:
Admin → store adminToken → navigate to /admin/dashboard
New user → navigate to /setup/step1
Existing → navigate to /
7.2 Profile Setup (3 Steps)
Step 1: /setup/step1

- Avatar upload (optional) → compress to 10KB client-side before upload
- Full name (required, 50 chars)
- Username (required, 3-30 chars, alphanumeric+underscore, unique check on blur)
- Date of birth (required, must be 13+ years)
  POST /api/v1/auth/setup/step1 → sets profile_step=2

Step 2: /setup/step2

- Bio (optional, 100 chars, live counter)
- Account type (select from config.accountTypes)
  POST /api/v1/auth/setup/step2 → sets profile_step=3

Step 3: /setup/step3 (Summary)

- Shows all entered info in a card
- "Looks Good!" button
  POST /api/v1/auth/setup/step3 → sets is_profile_complete=1
  → navigate to /
  7.3 Home Feed
  URL: /
  Layout: Infinite scroll feed (max-w-[600px] centered on desktop)

Feed is a TYPED MIXED ARRAY from API:
[
{ type: 'post', data: {...} },
{ type: 'ad', data: {...} },
{ type: 'suggestion', data: { users: [...] } },
{ type: 'post', data: {...} },
...
]

Randomized: ORDER BY RANDOM() on every page load/refresh
Ad injection: every rand(2-5) posts
Suggestion injection: every 5 posts

Pull-to-refresh (swipe down) → new random batch
Scroll to bottom → load next page
7.4 Post Card
┌──────────────────────────────────────────────────┐
│ [Avatar] @username · 2 min ago [•••] │
├──────────────────────────────────────────────────┤
│ [Full-width post image if present] │
├──────────────────────────────────────────────────┤
│ Post text with @mentions highlighted blue │
├──────────────────────────────────────────────────┤
│ [♥ Like 24] [💬 Comments 5] [↗ Share] │
└──────────────────────────────────────────────────┘

[•••] Context menu:
Own post → [Delete Post] [Cancel]
Others → [Report Post] [Cancel]

♥ Like → optimistic toggle (instant UI) + API call
💬 Comments → opens CommentSheet (bottom sheet, full height)
↗ Share → copies {domain}/p/{postId} to clipboard + toast "Link copied"

@mention click → navigate to /profile/:username
Avatar/Name click → navigate to /profile/:username
7.5 Ad Card
YouTube Type:
┌──────────────────────────────────────────────────┐
│ [Sponsored badge — yellow bg] │
│ [YouTube thumbnail with ▶ play icon overlay] │
│ Ad Title │
│ [CTA Button: "Watch Now" → opens YouTube URL] │
└──────────────────────────────────────────────────┘

Custom Image Type:
┌──────────────────────────────────────────────────┐
│ [Sponsored badge — yellow bg] │
│ [Full-width ad image] │
│ Ad Title │
│ Caption text (if present) │
│ [CTA Button → opens cta_url in new tab] │
└──────────────────────────────────────────────────┘

On appear in viewport → POST /api/v1/ads/:id/impression (tracked)
On CTA click → POST /api/v1/ads/:id/click (tracked)
7.6 Comment Sheet (Bottom Sheet)
Opens as: shadcn <Sheet side="bottom"> full height

Header: "Comments" + close button

Body (scrollable):
Top-level comments list:
[Avatar] @username text content 2m ago
[♥ 3 like] [Reply] [×delete if own]

    → Reply section (indented):
      [Avatar] @username   reply text    1m ago
               [♥ 1]  [×delete if own]

Footer (pinned at bottom):
[Avatar] [Type a comment... (200 chars)] [Send]

Tap "Reply" → input placeholder: "Replying to @username"
→ sends as reply (parent_id set)
7.7 Create Post (Bottom Sheet)
Opens as: shadcn <Sheet side="bottom"> full screen

Header: [× Cancel] "Create Post" [Post button → blue, disabled if empty]

Body:
[User Avatar] [Text area — 100 chars max, live counter]
@ typing → dropdown list of matching users

[Image preview if picked — with × remove button]

Footer: [📷 Photo icon] to pick image

Image flow:
user picks → client compress (max 200KB) → preview shown
on Post tap → upload multipart → server compresses to 100KB final

On success: dismiss sheet + prepend new post to feed top
7.8 Suggestion Card
Horizontal scrollable card in feed:

"People you may know" [See All →]
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Avtr │ │ Avtr │ │ Avtr │ │ Avtr │ │ Avtr │
│ Name │ │ Name │ │ Name │ │ Name │ │ Name │
│@user │ │@user │ │@user │ │@user │ │@user │
│[Flw] │ │[Flw] │ │[Flw] │ │[Flw] │ │[Flw] │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘

[See All] → navigate to /explore?tab=users
[Follow] → POST /follow/:id → button changes to "Following"
7.9 Explore Screen (/explore)
Top: Search bar (shadcn Input + search icon)
Typing → debounced 400ms → GET /explore/search?q=&type=

Tabs: [Posts] [Users] (shadcn Tabs)

Posts tab:
2-column responsive image grid
Each cell: post image (square crop) + like count overlay
Tap → opens CommentSheet-style full PostCard bottom sheet
Ads: injected at random grid positions (full-width spanning 2 cols)

Users tab:
List: [Avatar] Name @username [Follow/Following]
Account type (if visible)
Tap row → navigate to /profile/:username
Ads: injected at random list positions

Search active state:
Shows results matching active tab type
No results → empty state illustration + "Nothing found"
7.10 Notifications Screen (/notifications)
Header: "Notifications" [Mark all read]

Mixed list:
Notification item:
[Actor Avatar] "@alex liked your post" 2m ago
[Actor Avatar] "@bob commented: Hello..." 5m ago
[Actor Avatar] "@carol started following you" 1h ago
[System Icon] Announcement Title + message just now
[Ad Card (compact)] — injected between items if ads.inNotifications=true

Unread → left border accent blue strip
Tap notification → navigate to relevant post or profile

Auto-delete: handled by server cron (every 5 min deletes expired)
React: re-fetch on screen mount / 30s interval poll
7.11 Messages (/messages + /chat/:userId)
/messages — Conversations list:
[Avatar] Name · Last message preview · time [● unread blue dot]

Tap → navigate to /chat/:userId

/chat/:userId — Chat screen:
Header: [← Back] [Avatar] @username

Messages area (scroll to bottom on open):
Received: left-aligned gray bubble
Sent: right-aligned blue bubble
Date separator if day changes

Input bar (pinned bottom):
[😊 Emoji] [Type message... 500 chars] [Send →]

WebSocket: connect on mount (ws://domain/ws?token=jwt)
receive → append bubble instantly
disconnect on unmount

Start chat from:
→ OtherProfile page → [Message] button → navigate to /chat/:userId
→ This creates/finds conversation via POST /conversations/:userId
7.12 Profile (/profile own, /profile/:username others)
Own Profile /profile:
Header: @username [✏️ Edit] [📊 Analytics]

[Large Avatar 80px]
Full Name
@username
Bio text
Account type badge (if show_account_type)

[Followers 120] [Following 45] [Posts 18] — tappable counts

[+ Create Post button]

Post Grid: 2-column image grid (own posts only)
Tap → PostCard bottom sheet

Other Profile /profile/:username:
Same layout but:
[Follow / Following button] [Message button]
No edit/analytics buttons
[Message] → navigate to /chat/:userId
7.13 Analytics (/analytics)
Header: [← Back] "Analytics"

Stats row:
[Total Reach] [Total Likes] [Total Comments] [Posts]

Chart: Recharts LineChart — reach over last 30 days
X axis: dates, Y axis: reach count
Color: config.theme.primary

Post Performance List:
[Thumb] post text preview
♥ 24 💬 5 👁 120 reach: 340

Sorted by reach (highest first)
7.14 Report Sheet
shadcn Sheet from bottom:

"Report Post" (or Report User / Report Comment)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
○ Spam or misleading
○ Inappropriate content
○ Harassment or bullying
○ Hate speech
○ Something else
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Submit Report] [Cancel]

On submit → POST /api/v1/reports → toast "Report sent"

SECTION 8 — API ROUTES (routes/api.js)
BASE: /api/v1
Auth header: Authorization: Bearer {jwt}

── AUTH ─────────────────────────────────────────────────────────
POST /auth/google googleAuth [public]
POST /auth/logout logout [token]
GET /auth/me me [token]
POST /auth/setup/step1 setupStep1 [token]
POST /auth/setup/step2 setupStep2 [token]
POST /auth/setup/step3 setupStep3 [token]

── FEED + POSTS ─────────────────────────────────────────────────
GET /feed getFeed [token+profile+notBanned]
GET /feed/suggestions getSuggestions [token]
POST /posts createPost [token]
GET /posts/:id getPost [token]
DELETE /posts/:id deletePost [token, own only]
POST /posts/:id/like likePost [token]
DELETE /posts/:id/like unlikePost [token]
POST /reports createReport [token]

── EXPLORE + SEARCH ─────────────────────────────────────────────
GET /explore/posts explorePosts [token]
GET /explore/users exploreUsers [token]
GET /explore/search search [token] ?q=&type=posts|users

── COMMENTS ─────────────────────────────────────────────────────
GET /posts/:id/comments getComments [token]
POST /posts/:id/comments createComment [token]
POST /comments/:id/replies createReply [token]
POST /comments/:id/like likeComment [token]
DELETE /comments/:id/like unlikeComment [token]
DELETE /comments/:id deleteComment [token, own only]

── PROFILE + FOLLOW + ANALYTICS ─────────────────────────────────
GET /profile/:username getProfile [token]
PUT /profile/update updateProfile [token]
GET /profile/:username/posts profilePosts [token]
POST /profile/follow/:id follow [token]
DELETE /profile/follow/:id unfollow [token]
GET /profile/analytics getAnalytics [token]

── NOTIFICATIONS ─────────────────────────────────────────────────
GET /notifications getNotifications [token]
POST /notifications/read-all markAllRead [token]
DELETE /notifications/:id deleteNotif [token]

── MESSAGES ─────────────────────────────────────────────────────
GET /conversations getConversations [token]
GET /conversations/:id getMessages [token]
POST /conversations/:userId sendMessage [token]
DELETE /conversations/:id deleteConversation [token]

── ADS ──────────────────────────────────────────────────────────
POST /ads/:id/impression trackImpression [token]
POST /ads/:id/click trackClick [token]

── CONFIG ───────────────────────────────────────────────────────
GET /config getConfig [public]
Returns: { name, bioMax, textMax, commentMax, mentionLimit,
accountTypes, reportReasons, theme }

SECTION 9 — ADMIN ROUTES (routes/admin.js)
BASE: /admin/api
Auth: Authorization: Bearer {adminJwt}

POST /auth/google adminGoogleAuth [public]
GET /dashboard getDashboard [adminAuth]

GET /users listUsers [adminAuth] ?search=&status=&page=
GET /users/:id getUser [adminAuth]
POST /users/:id/ban banUser [adminAuth]
POST /users/:id/unban unbanUser [adminAuth]
DELETE /users/:id deleteUser [adminAuth]

GET /posts listPosts [adminAuth] ?page=
DELETE /posts/:id deletePost [adminAuth]
POST /posts/:id/toggle togglePost [adminAuth]

GET /reports listReports [adminAuth] ?status=&page=
GET /reports/:id getReport [adminAuth]
POST /reports/:id/action actionReport [adminAuth]
POST /reports/:id/dismiss dismissReport [adminAuth]

GET /ads listAds [adminAuth]
POST /ads createAd [adminAuth]
PUT /ads/:id updateAd [adminAuth]
DELETE /ads/:id deleteAd [adminAuth]
POST /ads/:id/toggle toggleAd [adminAuth]

GET /announcements listAnnouncements [adminAuth]
POST /announcements createAnnouncement [adminAuth]
DELETE /announcements/:id deleteAnnouncement [adminAuth]

GET /settings getSettings [adminAuth]
POST /settings updateSettings [adminAuth]

SECTION 10 — ADMIN PANEL (React Pages)
Admin Auth Flow
Admin navigates to /admin →
React: check adminToken in localStorage
→ valid → /admin/dashboard
→ invalid/missing → /login page

On /login: same Google login button
→ POST /admin/api/auth/google
→ server checks: email === config.google.adminEmail
→ if match → return adminToken → store → redirect /admin/dashboard
→ if not → 403 Forbidden → toast "Not authorized"
Admin Layout (Desktop sidebar, Mobile top nav)
Desktop (>= 1024px):
┌──────────────────────────────────────────────────────────┐
│ [Sidebar 240px] [Content area fills remaining] │
│ App Name ┌─────────────────────────────────┐ │
│ ───────── │ Page content here │ │
│ Dashboard │ │ │
│ Users │ │ │
│ Posts+Reports │ │ │
│ Ads └─────────────────────────────────┘ │
│ Settings │
│ ───────── │
│ [Admin name] │
│ [Logout] │
└──────────────────────────────────────────────────────────┘

Mobile (< 1024px):
Top header with hamburger → opens side drawer
(shadcn Sheet component for drawer)
Admin Dashboard (/admin/dashboard)
Stats cards row:
[Total Users] [New Today] [Total Posts] [Active Ads] [Pending Reports]

Charts row:
[User Growth — Recharts Line — 30 days] [Report Status — Recharts Pie]

Ad Performance Table:
Title | Type | Impressions | Clicks | CTR% | Status | Actions
Admin Users (/admin/users)
Search input + Status filter (All / Active / Banned)

Table:
Avatar | Name | @Username | Account Type | Joined | Status | Actions

Actions: [View] [Ban/Unban] [Delete]

View → shadcn Dialog opens:
Full profile info + post count + report count + join date
[Ban with reason] or [Unban] button inside dialog
Admin Content (/admin/content)
shadcn Tabs: [Posts] [Reports]

Posts tab:
Table: User | Text preview | Has Image | Likes | Comments | Date | Active
Row actions: [Delete] [Toggle Active/Inactive]

Reports tab:
Filter: [Pending] [Actioned] [Dismissed]
Table: Reporter | Target | Reason | Date | Status
Row click → shadcn Dialog:
Shows: report details + target content preview
Admin note textarea
Buttons: [Ban User] [Delete Content] [Dismiss]
Admin Ads (/admin/ads)
[+ Create New Ad] button → opens shadcn Sheet form

Form (Sheet from right):
Type toggle: [YouTube] [Custom Image]

YouTube fields:
Title* | YouTube URL* | CTA Text* | CTA URL*

Custom fields:
Title* | Caption | [Upload Image] | CTA Text* | CTA URL\*

Both types:
Placement: ☑ Feed ☑ Explore ☑ Notifications
Start Date (optional) | End Date (optional)

[Save] [Cancel]

Ads list:
Table: Title | Type | Placement | Impressions | Clicks | CTR% | Status | Ends
Actions: [Edit] [Toggle] [Delete]
Admin Settings (/admin/settings)
Editable config form (reads from GET /admin/api/settings):

App: App Name | App Domain | Maintenance toggle
Profile: Bio max | Avatar max KB | Username min/max | Min age
Post: Text max | Image max KB
Comment: Text max
Notification: Auto-delete hours
Message: Text max
Ads: Enabled toggle | Feed min/max between | In notifications | In explore
Suggestions: Enabled | Every N posts | Users per card
Theme: Primary color picker | (preview updates live)

[Save Settings] → POST /admin/api/settings

SECTION 11 — RESPONSIVE DESIGN SYSTEM
Mobile (< 640px) — Android Native Feel

- Bottom navigation bar (64px height, 4 tabs: Home | Explore | Messages | Profile)
- Cards with 12px border radius (Material-like)
- Minimum touch target: 48px (accessibility)
- Full-width content, 16px side padding
- All modals/menus: bottom sheets (shadcn Sheet side="bottom")
- No hover effects (touch-first)
- Feed fills full width
- Status bar color: config.theme.primary
  Tablet (640px – 1024px)
- Still bottom navigation
- Feed max-width: 500px centered
- Cards slightly wider
  Desktop (>= 1024px)
- Left sidebar navigation (240px fixed)
- Feed max-width: 600px, centered in content area
- Right: "Suggested users" panel (240px, only on home + explore)
- Bottom sheets become centered Dialogs
- Context menus become Dropdown menus (not bottom sheets)
- Hover states enabled
- Admin panel: full sidebar always visible
  Tailwind Breakpoints (tailwind.config.js)
  jsscreens: {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  }
  // Mobile-first: default = mobile, lg: = desktop

SECTION 12 — REACT APP ARCHITECTURE
Routing (App.jsx)
/ (public check → redirect to login if no token)

Auth routes (no token required):
/login → Login.jsx
/setup/step1 → Step1.jsx [requires token, not profile-complete]
/setup/step2 → Step2.jsx
/setup/step3 → Step3.jsx

Protected routes (requires token + profile complete):
/ → Home.jsx
/explore → Explore.jsx
/notifications → Notifications.jsx
/messages → Messages.jsx
/chat/:userId → Chat.jsx
/profile → Profile.jsx (own)
/profile/:username → OtherProfile.jsx
/analytics → Analytics.jsx
/p/:postId → PostPage.jsx (share link landing)

Admin routes (requires adminToken):
/admin → redirect /admin/dashboard
/admin/dashboard → Dashboard.jsx
/admin/users → Users.jsx
/admin/content → Content.jsx
/admin/ads → Ads.jsx
/admin/settings → Settings.jsx
State Management (store/index.js — Zustand)
js// authStore: { user, token, adminToken, isAdmin }
// feedStore: { posts, page, hasMore, loading }
// notifStore: { notifications, unreadCount }
// chatStore: { conversations, messages, activeConvId }
// uiStore: { createPostOpen, theme }
API Layer (lib/api.js)
js// Axios instance with:
// baseURL: '/api/v1'
// interceptor: auto-attach Authorization: Bearer {token}
// interceptor: 401 → clear token → redirect /login
// interceptor: 503 maintenance → show maintenance screen

// All API functions exported:
export const authAPI = { googleLogin, logout, me, step1, step2, step3 }
export const feedAPI = { getFeed, getSuggestions }
export const postAPI = { create, get, delete, like, unlike, report }
export const commentAPI = { get, create, reply, like, unlike, delete }
export const profileAPI = { get, update, getPosts, follow, unfollow, analytics }
export const exploreAPI = { posts, users, search }
export const notifAPI = { get, readAll, delete }
export const chatAPI = { getConvs, getMessages, send, delete }
export const adAPI = { impression, click }
export const configAPI = { get }
export const adminAPI = { /_ all admin calls _/ }

SECTION 13 — SECURITY

1. JWT verification on every protected route (middleware)
2. Admin JWT uses separate secret (adminSecret) — cannot use user token for admin
3. Admin identified by email match (admin@example.com) — no bypass possible
4. Rate limiting per endpoint (express-rate-limit, values from config)
5. Image MIME type validated server-side (not just extension)
6. SQLite prepared statements everywhere (zero SQL injection risk)
7. User can only delete own posts/comments (ownership check in controller)
8. No self-follow, no self-message, no self-report (validated)
9. Banned users: middleware returns 403 on all protected routes
10. CORS restricted to config.app.domain in production
11. Input sanitization: trim + length-check all text fields
12. File upload: multer memory storage → validate → compress → save (no raw user files on disk)
13. WebSocket: token verified on connect, invalid → terminate immediately
14. Admin actions (ban/delete) are logged with timestamp

SECTION 14 — BUILD & DEPLOY (cPanel)
Build Process
bash# On your local machine or cPanel terminal:
npm run install:all # installs backend + frontend deps
npm run build # builds React app → client/dist/

# This produces:

client/dist/
index.html
assets/
main-xxxxx.js
main-xxxxx.css
...
cPanel Deployment Steps

1. Login cPanel → Node.js App → Create Application
   Node.js version: 18.x
   App mode: Production
   App root: /home/{user}/social-app
   App URL: yourdomain.com
   Entry point: server.js

2. Upload project via:
   Option A (recommended): Git → cPanel Git Version Control
   - Add repo URL → deploy latest
     Option B: File Manager → upload ZIP → extract

3. Open cPanel Terminal:
   cd ~/social-app
   npm install --production # backend deps only
   cd client && npm install && npm run build # build React
   cd ..

4. Create storage folders (if not in repo):
   mkdir -p data storage/avatars storage/posts storage/ads

5. Set folder permissions:
   chmod 755 data storage storage/avatars storage/posts storage/ads

6. Set .env file (File Manager or terminal):
   APP_NAME=MyApp
   APP_DOMAIN=https://yourdomain.com
   PORT=3000
   JWT_SECRET=your-32-char-random-string
   ADMIN_JWT_SECRET=another-32-char-string
   NODE_ENV=production

7. cPanel → Node.js App → Restart

8. Test endpoints:
   curl https://yourdomain.com/api/v1/config
   → should return { ok: true, data: { name: 'MyApp', ... } }

9. Visit: https://yourdomain.com
   → React app loads
   → Click "Continue with Google"
   → admin@example.com → goes to /admin/dashboard
   → any other account → goes to profile setup
   .htaccess (for cPanel proxy — if needed)
   apacheRewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^(._)$ http://localhost:3000/$1 [P,L]
   Header always set Access-Control-Allow-Origin "_"
   First Run Auto-Setup
   server.js starts →
   initDB() runs:
   → opens/creates data/app.db
   → runs all CREATE TABLE IF NOT EXISTS
   → checks admins table: if empty AND config.google.adminEmail set
   → admin will be auto-created on first Google login
   → creates storage folders if missing
   → logs startup message

SECTION 15 — QUICK LIMITS REFERENCE
SettingDefaultChange in config.jsApp nameSocialAppapp.nameApp domainlocalhostapp.domainAdmin emailadmin@example.comgoogle.adminEmailPrimary color#2563EB (Blue)theme.primaryBio max100 charsprofile.bioMaxAvatar max10 KBprofile.avatarMaxKbPost text max100 charspost.textMaxPost image max100 KBpost.imageMaxKbMax @mentions5post.mentionLimitComment max200 charscomment.textMaxDM message max500 charsmessage.textMaxNotification TTL2 hoursnotification.ttlHoursAds between posts2–5ads.feedMinBetween/MaxSuggestion every N5 postssuggestions.everyNPostsMin user age13 yearsprofile.minAgeYearsFeed per page20post.perPageSponsored label"Sponsored"ads.sponsoredLabelSidebar width240pxdesktop.sidebarWidthMobile nav height64pxmobile.bottomNavHeightCard radius12pxmobile.cardBorderRadiusReport reasons5reportReasons[]Account types6accountTypes[]

PRD FINAL v3.0 — Node.js + SQLite + React (shadcn + react-icons) + Mobile/Desktop Responsive
Admin via Google (admin@example.com) | Entry: server.js | Deploy: cPanel
