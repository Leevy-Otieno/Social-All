const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const cors = require('cors');
const config = require('./config');
const { initDB, applySettingsToConfig } = require('./db/database');

// ── Init DB ───────────────────────────────────────────────────
initDB();
// Apply persisted admin limits to in-memory config after DB is ready
setTimeout(() => applySettingsToConfig().catch(console.error), 1000);

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
  } catch {
    ws.terminate();
  }
});
app.set('wsClients', clients);

// ── Middleware ─────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://youbgram.ybtshop.com',
  'http://youbgram.ybtshop.com',
  'https://www.youbgram.ybtshop.com',
  config.app.domain
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Maintenance check
app.use((req, res, next) => {
  if (config.app.maintenance && !req.path.startsWith('/admin/api') && !req.path.startsWith('/api')) {
    return res.status(503).json({ ok: false, message: config.app.maintenanceMsg });
  }
  next();
});

// ── SEO & Meta Injection ──────────────────────────────────────
let distPath = path.join(__dirname, 'client/dist');
if (!fs.existsSync(distPath)) {
  distPath = path.join(__dirname, 'dist');
}

const dbAPI = require('./db/database');

async function injectSEOMeta(req, res, next) {
  // Only inject for HTML requests (SPA routes)
  const isSPA = !req.path.startsWith('/api') && !req.path.startsWith('/admin/api') && !req.path.startsWith('/storage') && !req.path.includes('.');
  if (!isSPA) return next();

  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) return next();

  let html = fs.readFileSync(indexPath, 'utf8');
  let title = "YouBGram — AI Developers & Vibe Coding Community";
  let desc = "Join YouBGram, the premier social network for AI developers, model builders, and the coding community. Share reels, posts, and connect with fellow programmers.";
  let image = "https://youbgram.ybtshop.com/icon.png";
  let canonical = `https://youbgram.ybtshop.com${req.path}`;
  let schema = null;

  try {
    if (req.path.startsWith('/p/')) {
      const postId = req.path.split('/')[2];
      const post = await dbAPI.getPostById(postId);
      if (post) {
        const user = await dbAPI.findUserById(post.user_id);
        title = `${post.text?.slice(0, 50) || 'Post'} by ${user?.name || 'User'} — YouBGram`;
        desc = post.text?.slice(0, 155) || `View this post on YouBGram.`;
        if (post.image) image = `https://youbgram.ybtshop.com/storage/posts/${post.image}`;
      }
    } else if (req.path.startsWith('/profile/')) {
      const username = req.path.split('/')[2];
      const user = await dbAPI.findUserByUsername(username);
      if (user) {
        title = `${user.name} (@${user.username}) — YouBGram`;
        desc = user.bio?.slice(0, 155) || `Connect with ${user.name} on YouBGram.`;
        if (user.avatar) image = `https://youbgram.ybtshop.com/storage/avatars/${user.avatar}`;
      }
    }
  } catch (e) { console.error("SEO Injection Error:", e); }

  html = html.replace(/__TITLE__/g, title)
             .replace(/__DESCRIPTION__/g, desc)
             .replace(/__IMAGE__/g, image)
             .replace(/__CANONICAL__/g, canonical);

  res.send(html);
}

// ── Routes ──────────────────────────────────────────────────────
app.use('/storage', express.static(path.join(__dirname, 'storage')));

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: https://youbgram.ybtshop.com/sitemap.xml`);
});

app.use('/api/v1', require('./routes/api'));
app.use('/admin/api', require('./routes/admin'));

// Catch-all for SPA with SEO injection
app.get('*', injectSEOMeta);

// Serve static files from dist
app.use(express.static(distPath));

// Final fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Cron Jobs ─────────────────────────────────────────────────
const { cleanupNotifications, deactivateExpiredAds, autoDeleteInactiveUsers } = require('./jobs/index');
cron.schedule('*/5 * * * *', () => cleanupNotifications().catch(console.error));
cron.schedule('0 * * * *', () => deactivateExpiredAds().catch(console.error));
cron.schedule('0 0 * * *', () => autoDeleteInactiveUsers().catch(console.error));

// ── Start ───────────────────────────────────────────────────────
server.listen(config.app.port, () => {
  console.log(`\n🚀 ${config.app.name} running at ${config.app.domain}`);
});
