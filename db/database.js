const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config');

const DB_PATH = path.join(__dirname, '..', 'data', 'app.db');
let db = null;

function initDB() {
  // Ensure database directory exists
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  // Ensure storage directories exist
  const storageDirs = [
    path.join(__dirname, '..', config.storage.avatarsDir),
    path.join(__dirname, '..', config.storage.postsDir),
    path.join(__dirname, '..', config.storage.adsDir)
  ];
  storageDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created storage directory: ${dir}`);
    }
  });

  db = new sqlite3.Database(DB_PATH);
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, google_id TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, username TEXT UNIQUE NOT NULL, avatar TEXT, bio TEXT, about_html TEXT, account_type TEXT, date_of_birth TEXT, show_dob INTEGER DEFAULT 0, show_account_type INTEGER DEFAULT 1, is_profile_complete INTEGER DEFAULT 0, profile_step INTEGER DEFAULT 1, is_active INTEGER DEFAULT 1, is_banned INTEGER DEFAULT 0, ban_reason TEXT, followers_count INTEGER DEFAULT 0, following_count INTEGER DEFAULT 0, posts_count INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS follows (id INTEGER PRIMARY KEY AUTOINCREMENT, follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT DEFAULT (datetime('now')), UNIQUE(follower_id, following_id));
    CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT, image TEXT, share_url TEXT, likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, views_count INTEGER DEFAULT 0, reach_count INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS post_mentions (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, mentioned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS post_likes (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT DEFAULT (datetime('now')), UNIQUE(post_id, user_id));
    CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, text TEXT NOT NULL, likes_count INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS comment_likes (id INTEGER PRIMARY KEY AUTOINCREMENT, comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT DEFAULT (datetime('now')), UNIQUE(comment_id, user_id));
    CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, actor_id INTEGER, type TEXT NOT NULL, target_type TEXT, target_id INTEGER, message TEXT, is_read INTEGER DEFAULT 0, expires_at TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, user_one_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, user_two_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, last_message_id INTEGER, last_message_at TEXT DEFAULT (datetime('now')), created_at TEXT DEFAULT (datetime('now')), UNIQUE(user_one_id, user_two_id));
    CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL, is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS ads (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, title TEXT NOT NULL, caption TEXT, image TEXT, youtube_url TEXT, cta_text TEXT DEFAULT 'Learn More', cta_url TEXT NOT NULL, placement TEXT DEFAULT '["feed"]', is_active INTEGER DEFAULT 1, impressions INTEGER DEFAULT 0, clicks INTEGER DEFAULT 0, starts_at TEXT, ends_at TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, target_type TEXT NOT NULL, target_id INTEGER NOT NULL, reason TEXT NOT NULL, status TEXT DEFAULT 'pending', admin_note TEXT, reviewed_at TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, google_id TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT DEFAULT 'super_admin', last_login TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS system_announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, message TEXT NOT NULL, is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS ad_events (id INTEGER PRIMARY KEY AUTOINCREMENT, ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE, event_type TEXT NOT NULL, user_id INTEGER, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS post_views (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, viewer_id INTEGER, created_at TEXT DEFAULT (datetime('now')));
    CREATE INDEX IF NOT EXISTS idx_posts_random ON posts(is_active, created_at);
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, expires_at);
    CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_follow_pair ON follows(follower_id, following_id);
    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, parent_id);
    CREATE INDEX IF NOT EXISTS idx_post_likes ON post_likes(post_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id, is_active, created_at);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL, label TEXT, category TEXT DEFAULT 'general', type TEXT DEFAULT 'number', updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS xp_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, action TEXT NOT NULL, xp_amount INTEGER NOT NULL, source_id INTEGER, created_at TEXT DEFAULT (datetime('now')));
    CREATE INDEX IF NOT EXISTS idx_xp_user ON xp_transactions(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_xp_source ON xp_transactions(source_id, action);
  `);
  // Migrations: add columns if missing (safe to run multiple times)
  db.run(`ALTER TABLE users ADD COLUMN about_html TEXT`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN last_active_at TEXT DEFAULT (datetime('now'))`, () => {});

  // Seed default limits — INSERT OR IGNORE ensures new keys are added without overwriting existing values
  db.serialize(() => {
    const defaults = [
      // ── Profile & Users ──
      { key: 'profile_username_min', value: String(config.profile.usernameMin), label: 'Username Min Length', category: 'profile', type: 'number' },
      { key: 'profile_username_max', value: String(config.profile.usernameMax), label: 'Username Max Length', category: 'profile', type: 'number' },
      { key: 'profile_name_max', value: String(config.profile.nameMax), label: 'Display Name Max (chars)', category: 'profile', type: 'number' },
      { key: 'profile_bio_max', value: String(config.profile.bioMax), label: 'Bio Max (chars)', category: 'profile', type: 'number' },
      { key: 'profile_avatar_max_kb', value: String(config.profile.avatarMaxKb), label: 'Avatar Max Size (KB)', category: 'profile', type: 'number' },
      { key: 'profile_avatar_quality', value: String(config.profile.avatarQuality), label: 'Avatar Quality (%)', category: 'profile', type: 'number' },
      { key: 'profile_min_age', value: String(config.profile.minAgeYears), label: 'Minimum Age (years)', category: 'profile', type: 'number' },
      { key: 'profile_max_follow_per_day', value: '100', label: 'Max Follow Per Day', category: 'profile', type: 'number' },
      // ── Posts & Content ──
      { key: 'post_text_max', value: String(config.post.textMax), label: 'Post Text Max (chars)', category: 'posts', type: 'number' },
      { key: 'post_image_max_kb', value: String(config.post.imageMaxKb), label: 'Post Image Max Size (KB)', category: 'posts', type: 'number' },
      { key: 'post_image_quality', value: String(config.post.imageQuality), label: 'Post Image Quality (%)', category: 'posts', type: 'number' },
      { key: 'post_max_images', value: String(config.post.maxImages), label: 'Images Per Post', category: 'posts', type: 'number' },
      { key: 'post_mention_limit', value: String(config.post.mentionLimit), label: 'Mentions Per Post', category: 'posts', type: 'number' },
      { key: 'post_per_page', value: String(config.post.perPage), label: 'Posts Per Page (feed)', category: 'posts', type: 'number' },
      { key: 'post_daily_limit', value: '10', label: 'Daily Post Limit', category: 'posts', type: 'number' },
      // ── Comments ──
      { key: 'comment_text_max', value: String(config.comment.textMax), label: 'Comment Max (chars)', category: 'comments', type: 'number' },
      { key: 'comment_reply_max', value: String(config.comment.replyMax), label: 'Reply Max (chars)', category: 'comments', type: 'number' },
      { key: 'comment_per_page', value: String(config.comment.perPage), label: 'Comments Per Page', category: 'comments', type: 'number' },
      // ── Ads Engine ──
      { key: 'ads_feed_min', value: String(config.ads.feedMinBetween), label: 'Ads Min Gap In Feed', category: 'ads', type: 'number' },
      { key: 'ads_feed_max', value: String(config.ads.feedMaxBetween), label: 'Ads Max Gap In Feed', category: 'ads', type: 'number' },
      { key: 'ads_image_max_kb', value: String(config.ads.imageMaxKb), label: 'Ad Image Max Size (KB)', category: 'ads', type: 'number' },
      // ── Notifications ──
      { key: 'notification_ttl_hours', value: String(config.notification.ttlHours), label: 'Notification Auto-Delete (hours)', category: 'notifications', type: 'number' },
      { key: 'notification_per_page', value: String(config.notification.perPage), label: 'Notifications Per Page', category: 'notifications', type: 'number' },
      // ── Messages & DMs ──
      { key: 'message_text_max', value: String(config.message.textMax), label: 'Message Max (chars)', category: 'messages', type: 'number' },
      { key: 'message_per_page', value: String(config.message.perPage), label: 'Messages Per Page', category: 'messages', type: 'number' },
      { key: 'message_daily_limit', value: '50', label: 'Daily DM Limit', category: 'messages', type: 'number' },
      // ── Explore ──
      { key: 'explore_posts_per_page', value: String(config.explore.postsPerPage), label: 'Explore Posts Per Page', category: 'explore', type: 'number' },
      { key: 'explore_users_per_page', value: String(config.explore.usersPerPage), label: 'Explore Users Per Page', category: 'explore', type: 'number' },
      { key: 'explore_search_min_chars', value: String(config.explore.searchMinChars), label: 'Search Min Characters', category: 'explore', type: 'number' },
      // ── Feed Suggestions ──
      { key: 'suggestions_every_n_posts', value: String(config.suggestions.everyNPosts), label: 'Show Suggestions Every N Posts', category: 'suggestions', type: 'number' },
      { key: 'suggestions_users_per_card', value: String(config.suggestions.usersPerCard), label: 'Users Per Suggestion Card', category: 'suggestions', type: 'number' },
      // ── Rate Limits ──
      { key: 'rate_global', value: String(config.rateLimit.global), label: 'Global Rate Limit (req/min)', category: 'rate_limits', type: 'number' },
      { key: 'rate_post_create', value: String(config.rateLimit.postCreate), label: 'Post Create Rate (per min)', category: 'rate_limits', type: 'number' },
      { key: 'rate_message_send', value: String(config.rateLimit.messageSend), label: 'Message Send Rate (per min)', category: 'rate_limits', type: 'number' },
      { key: 'rate_search', value: String(config.rateLimit.search), label: 'Search Rate (per min)', category: 'rate_limits', type: 'number' },
      { key: 'rate_auth', value: String(config.rateLimit.auth), label: 'Auth Rate (per min)', category: 'rate_limits', type: 'number' },
      // ── Admin ──
      { key: 'admin_items_per_page', value: String(config.admin.itemsPerPage), label: 'Admin Items Per Page', category: 'admin', type: 'number' },
      // ── XP System ──
      { key: 'xp_like', value: '100', label: 'XP Per Like', category: 'xp', type: 'number' },
      { key: 'xp_comment', value: '150', label: 'XP Per Comment', category: 'xp', type: 'number' },
      { key: 'xp_follow', value: '200', label: 'XP Per Follow', category: 'xp', type: 'number' },
      { key: 'xp_per_level', value: '1000', label: 'XP Per Level', category: 'xp', type: 'number' },
      { key: 'xp_max_level', value: '100', label: 'Max Level', category: 'xp', type: 'number' },
    ];
    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value, label, category, type) VALUES (?,?,?,?,?)');
    for (const d of defaults) stmt.run(d.key, d.value, d.label, d.category, d.type);
    stmt.finalize();
  });
}

function getDB() { return db; }

// Helper functions for async/await
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Users
async function findUserByGoogleId(gid) { return await dbGet('SELECT * FROM users WHERE google_id=?', [gid]); }
async function findUserByEmail(email) { return await dbGet('SELECT * FROM users WHERE email=?', [email]); }
async function findUserById(id) { return await dbGet('SELECT * FROM users WHERE id=?', [id]); }
async function findUserByUsername(un) { return await dbGet('SELECT * FROM users WHERE username=? COLLATE NOCASE', [un]); }

async function createUser({google_id, email, name, avatar}) {
  let base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
  let un = base, s = Math.floor(Math.random() * 1000);
  while (await dbGet('SELECT 1 FROM users WHERE username=?', [un])) { un = `${base}${s}`; s++; }
  const r = await dbRun('INSERT INTO users (google_id, email, name, username, avatar) VALUES (?,?,?,?,?)', [google_id, email, name, un, avatar]);
  return await dbGet('SELECT * FROM users WHERE id=?', [r.lastID]);
}

async function updateUser(id, fields) {
  const ok = ['name', 'username', 'avatar', 'bio', 'about_html', 'account_type', 'date_of_birth', 'show_dob', 'show_account_type', 'is_profile_complete', 'profile_step', 'is_active', 'is_banned', 'ban_reason', 'followers_count', 'following_count', 'posts_count', 'is_verified', 'last_active_at'];
  const k = Object.keys(fields).filter(x => ok.includes(x));
  if (!k.length) return null;
  const s = k.map(x => `${x}=?`).join(',');
  const v = k.map(x => fields[x]);
  await dbRun(`UPDATE users SET ${s}, updated_at=datetime('now') WHERE id=?`, [...v, id]);
  return await dbGet('SELECT * FROM users WHERE id=?', [id]);
}

async function hardDeleteUser(id) {
  return await dbRun('DELETE FROM users WHERE id=?', [id]);
}

async function usernameExists(un, excl) {
  const q = excl ? await dbGet('SELECT 1 FROM users WHERE username=? COLLATE NOCASE AND id!=?', [un, excl]) : await dbGet('SELECT 1 FROM users WHERE username=? COLLATE NOCASE', [un]);
  return !!q;
}

// Admins
async function findAdminByEmail(email) { return await dbGet('SELECT * FROM admins WHERE email=?', [email]); }
async function findAdminByGoogleId(gid) { return await dbGet('SELECT * FROM admins WHERE google_id=?', [gid]); }

async function createAdmin(fields) {
  const k = Object.keys(fields);
  const c = k.join(',');
  const p = k.map(() => '?').join(',');
  const r = await dbRun(`INSERT INTO admins (${c}) VALUES (${p})`, Object.values(fields));
  return await dbGet('SELECT * FROM admins WHERE id=?', [r.lastID]);
}

async function updateAdmin(id, fields) {
  const k = Object.keys(fields);
  if (!k.length) return null;
  const s = k.map(x => `${x}=?`).join(',');
  await dbRun(`UPDATE admins SET ${s} WHERE id=?`, [...Object.values(fields), id]);
  return await dbGet('SELECT * FROM admins WHERE id=?', [id]);
}

// Follows
async function followUser(fid, tid) {
  try {
    await dbRun('INSERT INTO follows (follower_id, following_id) VALUES (?,?)', [fid, tid]);
    await dbRun('UPDATE users SET following_count=following_count+1 WHERE id=?', [fid]);
    await dbRun('UPDATE users SET followers_count=followers_count+1 WHERE id=?', [tid]);
  } catch (e) {}
}

async function unfollowUser(fid, tid) {
  const r = await dbRun('DELETE FROM follows WHERE follower_id=? AND following_id=?', [fid, tid]);
  if (r.changes > 0) {
    await dbRun('UPDATE users SET following_count=following_count-1 WHERE id=?', [fid]);
    await dbRun('UPDATE users SET followers_count=followers_count-1 WHERE id=?', [tid]);
  }
}

async function isFollowing(fid, tid) {
  const r = await dbGet('SELECT 1 FROM follows WHERE follower_id=? AND following_id=?', [fid, tid]);
  return !!r;
}

async function getFollowers(uid, lim = 50) {
  return await dbAll('SELECT u.* FROM users u JOIN follows f ON u.id=f.follower_id WHERE f.following_id=? ORDER BY f.created_at DESC LIMIT ?', [uid, lim]);
}

async function getFollowing(uid, lim = 50) {
  return await dbAll('SELECT u.* FROM users u JOIN follows f ON u.id=f.following_id WHERE f.follower_id=? ORDER BY f.created_at DESC LIMIT ?', [uid, lim]);
}

// Posts
async function createPost({ user_id, text, image }) {
  const r = await dbRun('INSERT INTO posts (user_id, text, image) VALUES (?,?,?)', [user_id, text || null, image || null]);
  await dbRun('UPDATE users SET posts_count=posts_count+1 WHERE id=?', [user_id]);
  return await dbGet('SELECT * FROM posts WHERE id=?', [r.lastID]);
}

async function getPostById(id) { return await dbGet('SELECT * FROM posts WHERE id=?', [id]); }

async function getFeedPosts(lim = 20, off = 0) {
  return await dbAll('SELECT p.*, u.name, u.username, u.avatar, u.is_verified FROM posts p JOIN users u ON p.user_id=u.id WHERE p.is_active=1 ORDER BY p.created_at DESC LIMIT ? OFFSET ?', [lim, off]);
}

// Get recycled posts in random order (for infinite loop when fresh posts run out)
async function getRecycledPosts(lim = 20, excludeIds = []) {
  if (excludeIds.length > 0) {
    const placeholders = excludeIds.map(() => '?').join(',');
    return await dbAll(`SELECT p.*, u.name, u.username, u.avatar, u.is_verified FROM posts p JOIN users u ON p.user_id=u.id WHERE p.is_active=1 AND p.id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT ?`, [...excludeIds, lim]);
  }
  return await dbAll('SELECT p.*, u.name, u.username, u.avatar, u.is_verified FROM posts p JOIN users u ON p.user_id=u.id WHERE p.is_active=1 ORDER BY RANDOM() LIMIT ?', [lim]);
}

async function countAllPosts() {
  const row = await dbGet('SELECT COUNT(*) as count FROM posts WHERE is_active=1');
  return row?.count || 0;
}

async function getUserPosts(uid, lim = 20, off = 0) {
  return await dbAll('SELECT p.*, u.name, u.username, u.avatar, u.is_verified FROM posts p JOIN users u ON p.user_id=u.id WHERE p.user_id=? AND p.is_active=1 ORDER BY p.created_at DESC LIMIT ? OFFSET ?', [uid, lim, off]);
}

async function deletePost(id, uid) {
  const p = await dbGet('SELECT * FROM posts WHERE id=?', [id]);
  if (!p || p.user_id !== uid) return false;
  await dbRun('DELETE FROM posts WHERE id=?', [id]);
  await dbRun('UPDATE users SET posts_count=posts_count-1 WHERE id=?', [uid]);
  return true;
}

async function adminDeletePost(id) {
  const p = await dbGet('SELECT * FROM posts WHERE id=?', [id]);
  if (!p) return false;
  await dbRun('DELETE FROM posts WHERE id=?', [id]);
  await dbRun('UPDATE users SET posts_count=posts_count-1 WHERE id=?', [p.user_id]);
  return true;
}

async function togglePostActive(id) {
  await dbRun('UPDATE posts SET is_active=1-is_active WHERE id=?', [id]);
  return await dbGet('SELECT * FROM posts WHERE id=?', [id]);
}

async function likePost(pid, uid) {
  try {
    await dbRun('INSERT INTO post_likes (post_id, user_id) VALUES (?,?)', [pid, uid]);
    await dbRun('UPDATE posts SET likes_count=likes_count+1 WHERE id=?', [pid]);
  } catch (e) {}
}

async function unlikePost(pid, uid) {
  const r = await dbRun('DELETE FROM post_likes WHERE post_id=? AND user_id=?', [pid, uid]);
  if (r.changes > 0) await dbRun('UPDATE posts SET likes_count=likes_count-1 WHERE id=?', [pid]);
}

async function hasLikedPost(pid, uid) {
  const r = await dbGet('SELECT 1 FROM post_likes WHERE post_id=? AND user_id=?', [pid, uid]);
  return !!r;
}

async function incrementPostViews(id, uid = null) {
  await dbRun('UPDATE posts SET views_count=views_count+1, reach_count=reach_count+1 WHERE id=?', [id]);
  await dbRun('INSERT INTO post_views (post_id, viewer_id) VALUES (?,?)', [id, uid]);
}

async function getPostReachByDay(uid, days = 30, fromDate = null, toDate = null) {
  if (fromDate && toDate) {
    return await dbAll(`
      SELECT date(v.created_at) as date, count(*) as reach 
      FROM post_views v 
      JOIN posts p ON v.post_id = p.id 
      WHERE p.user_id = ? 
      AND date(v.created_at) >= ? AND date(v.created_at) <= ?
      GROUP BY date(v.created_at) 
      ORDER BY date(v.created_at) ASC
    `, [uid, fromDate, toDate]);
  }
  const d = days || 30;
  return await dbAll(`
    SELECT date(v.created_at) as date, count(*) as reach 
    FROM post_views v 
    JOIN posts p ON v.post_id = p.id 
    WHERE p.user_id = ? 
    AND v.created_at >= date('now', ?) 
    GROUP BY date(v.created_at) 
    ORDER BY date(v.created_at) ASC
  `, [uid, `-${d} days`]);
}

// Comments
async function createComment({ post_id, user_id, parent_id, text }) {
  const r = await dbRun('INSERT INTO comments (post_id, user_id, parent_id, text) VALUES (?,?,?,?)', [post_id, user_id, parent_id || null, text]);
  await dbRun('UPDATE posts SET comments_count=comments_count+1 WHERE id=?', [post_id]);
  return await dbGet('SELECT * FROM comments WHERE id=?', [r.lastID]);
}

async function getCommentsByPost(pid) {
  return await dbAll('SELECT c.*, u.name, u.username, u.avatar, u.is_verified FROM comments c JOIN users u ON c.user_id=u.id WHERE c.post_id=? AND c.is_active=1 ORDER BY c.created_at DESC', [pid]);
}

async function getCommentById(id) {
  return await dbGet('SELECT * FROM comments WHERE id=? AND is_active=1', [id]);
}

async function deleteComment(id, uid) {
  const c = await dbGet('SELECT * FROM comments WHERE id=?', [id]);
  if (!c || c.user_id !== uid) return false;
  await dbRun('UPDATE comments SET is_active=0 WHERE id=?', [id]);
  await dbRun('UPDATE posts SET comments_count=comments_count-1 WHERE id=?', [c.post_id]);
  return true;
}

async function likeComment(cid, uid) {
  try {
    await dbRun('INSERT INTO comment_likes (comment_id, user_id) VALUES (?,?)', [cid, uid]);
    await dbRun('UPDATE comments SET likes_count=likes_count+1 WHERE id=?', [cid]);
  } catch (e) {}
}

async function unlikeComment(cid, uid) {
  const r = await dbRun('DELETE FROM comment_likes WHERE comment_id=? AND user_id=?', [cid, uid]);
  if (r.changes > 0) await dbRun('UPDATE comments SET likes_count=likes_count-1 WHERE id=?', [cid]);
}

async function hasLikedComment(cid, uid) {
  const r = await dbGet('SELECT 1 FROM comment_likes WHERE comment_id=? AND user_id=?', [cid, uid]);
  return !!r;
}

// Notifications
async function createNotification({ user_id, actor_id, type, target_type, target_id, message }) {
  const ttl = config.notification.ttlHours;
  const r = await dbRun(`INSERT INTO notifications (user_id, actor_id, type, target_type, target_id, message, expires_at) VALUES (?,?,?,?,?,?,datetime('now','+${ttl} hours'))`, [user_id, actor_id || null, type, target_type || null, target_id || null, message]);
  return await dbGet('SELECT * FROM notifications WHERE id=?', [r.lastID]);
}

async function getNotifications(uid) {
  return await dbAll('SELECT n.*, u.name AS actor_name, u.username AS actor_username, u.avatar AS actor_avatar, u.is_verified AS actor_is_verified FROM notifications n LEFT JOIN users u ON n.actor_id=u.id WHERE n.user_id=? AND n.expires_at>datetime("now") ORDER BY n.created_at DESC', [uid]);
}

async function markNotificationsRead(uid) {
  await dbRun('UPDATE notifications SET is_read=1 WHERE user_id=?', [uid]);
}

async function deleteNotification(id, uid) {
  await dbRun('DELETE FROM notifications WHERE id=? AND user_id=?', [id, uid]);
}

async function cleanupExpiredNotifications() {
  const r = await dbRun("DELETE FROM notifications WHERE expires_at<datetime('now')");
  return r.changes;
}

// Conversations/Messages
async function getConversation(a, b) {
  return await dbGet('SELECT * FROM conversations WHERE (user_one_id=? AND user_two_id=?) OR (user_one_id=? AND user_two_id=?)', [a, b, b, a]);
}

async function createConversation(a, b) {
  try {
    const r = await dbRun('INSERT INTO conversations (user_one_id, user_two_id) VALUES (?,?)', [Math.min(a, b), Math.max(a, b)]);
    return await dbGet('SELECT * FROM conversations WHERE id=?', [r.lastID]);
  } catch (e) {
    return await getConversation(a, b);
  }
}

async function getConversations(uid) {
  return await dbAll('SELECT c.*, CASE WHEN c.user_one_id=? THEN c.user_two_id ELSE c.user_one_id END AS other_user_id, u.name AS other_name, u.username AS other_username, u.avatar AS other_avatar, u.is_verified AS other_is_verified, m.text AS last_message_text, m.created_at AS last_message_time FROM conversations c JOIN users u ON u.id=(CASE WHEN c.user_one_id=? THEN c.user_two_id ELSE c.user_one_id END) LEFT JOIN messages m ON m.id=c.last_message_id WHERE c.user_one_id=? OR c.user_two_id=? ORDER BY c.last_message_at DESC', [uid, uid, uid, uid]);
}

async function getMessages(cid, lim = 50, off = 0) {
  const rows = await dbAll('SELECT m.*, u.name, u.username, u.avatar, u.is_verified FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.conversation_id=? ORDER BY m.created_at DESC LIMIT ? OFFSET ?', [cid, lim, off]);
  return rows.reverse();
}

async function createMessage({ conversation_id, sender_id, text }) {
  const r = await dbRun('INSERT INTO messages (conversation_id, sender_id, text) VALUES (?,?,?)', [conversation_id, sender_id, text]);
  await dbRun('UPDATE conversations SET last_message_id=?, last_message_at=datetime("now") WHERE id=?', [r.lastID, conversation_id]);
  return await dbGet('SELECT * FROM messages WHERE id=?', [r.lastID]);
}

async function markMessagesRead(cid, uid) {
  await dbRun('UPDATE messages SET is_read=1 WHERE conversation_id=? AND sender_id!=?', [cid, uid]);
}

async function deleteConversation(cid, uid) {
  const c = await dbGet('SELECT * FROM conversations WHERE id=?', [cid]);
  if (!c || (c.user_one_id !== uid && c.user_two_id !== uid)) return false;
  await dbRun('DELETE FROM conversations WHERE id=?', [cid]);
  return true;
}

// Ads
async function getActiveAds() {
  return await dbAll('SELECT * FROM ads WHERE is_active=1 AND (starts_at IS NULL OR starts_at<=datetime("now")) AND (ends_at IS NULL OR ends_at>=datetime("now"))');
}

async function getAdById(id) { return await dbGet('SELECT * FROM ads WHERE id=?', [id]); }

async function createAd(fields) {
  const k = Object.keys(fields);
  const c = k.join(',');
  const p = k.map(() => '?').join(',');
  const r = await dbRun(`INSERT INTO ads (${c}) VALUES (${p})`, Object.values(fields));
  return await dbGet('SELECT * FROM ads WHERE id=?', [r.lastID]);
}

async function updateAd(id, fields) {
  const k = Object.keys(fields);
  if (!k.length) return null;
  const s = k.map(x => `${x}=?`).join(',');
  await dbRun(`UPDATE ads SET ${s}, updated_at=datetime('now') WHERE id=?`, [...Object.values(fields), id]);
  return await dbGet('SELECT * FROM ads WHERE id=?', [id]);
}

async function deleteAd(id) {
  await dbRun('DELETE FROM ads WHERE id=?', [id]);
}

async function toggleAdActive(id) {
  await dbRun('UPDATE ads SET is_active=1-is_active WHERE id=?', [id]);
  return await dbGet('SELECT * FROM ads WHERE id=?', [id]);
}

async function trackAdEvent(aid, et, uid) {
  await dbRun('INSERT INTO ad_events (ad_id, event_type, user_id) VALUES (?,?,?)', [aid, et, uid || null]);
  if (et === 'impression') await dbRun('UPDATE ads SET impressions=impressions+1 WHERE id=?', [aid]);
  else if (et === 'click') await dbRun('UPDATE ads SET clicks=clicks+1 WHERE id=?', [aid]);
}

async function getAllAds() {
  return await dbAll('SELECT * FROM ads ORDER BY created_at DESC');
}

// Reports
async function createReport({ reporter_id, target_type, target_id, reason }) {
  const r = await dbRun('INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?,?,?,?)', [reporter_id, target_type, target_id, reason]);
  return await dbGet('SELECT * FROM reports WHERE id=?', [r.lastID]);
}

async function getReports(st) {
  if (st) return await dbAll('SELECT r.*, u.name AS reporter_name, u.username AS reporter_username FROM reports r JOIN users u ON r.reporter_id=u.id WHERE r.status=? ORDER BY r.created_at DESC', [st]);
  return await dbAll('SELECT r.*, u.name AS reporter_name, u.username AS reporter_username FROM reports r JOIN users u ON r.reporter_id=u.id ORDER BY r.created_at DESC');
}

async function getReportById(id) {
  return await dbGet('SELECT r.*, u.name AS reporter_name, u.username AS reporter_username FROM reports r JOIN users u ON r.reporter_id=u.id WHERE r.id=?', [id]);
}

async function updateReport(id, fields) {
  const k = Object.keys(fields);
  if (!k.length) return null;
  const s = k.map(x => `${x}=?`).join(',');
  await dbRun(`UPDATE reports SET ${s} WHERE id=?`, [...Object.values(fields), id]);
  return await dbGet('SELECT * FROM reports WHERE id=?', [id]);
}

// Admin queries
async function getAllUsers(st, search, lim = 25, off = 0, random = false) {
  let q = 'SELECT * FROM users WHERE 1=1', p = [];
  if (st === 'active') q += ' AND is_active=1 AND is_banned=0';
  else if (st === 'banned') q += ' AND is_banned=1';
  if (search) {
    q += ' AND (name LIKE ? OR username LIKE ? OR email LIKE ?)';
    p.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (random) q += ' ORDER BY RANDOM()';
  else q += ' ORDER BY created_at DESC';
  q += ' LIMIT ? OFFSET ?';
  p.push(lim, off);
  return await dbAll(q, p);
}

async function countUsers(st) {
  let q = 'SELECT COUNT(*) AS c FROM users WHERE 1=1';
  if (st === 'active') q += ' AND is_active=1 AND is_banned=0';
  else if (st === 'banned') q += ' AND is_banned=1';
  const r = await dbGet(q);
  return r.c;
}

async function countPosts() {
  const r = await dbGet('SELECT COUNT(*) AS c FROM posts');
  return r.c;
}

async function countReports(st) {
  const r = st ? await dbGet('SELECT COUNT(*) AS c FROM reports WHERE status=?', [st]) : await dbGet('SELECT COUNT(*) AS c FROM reports');
  return r.c;
}

// Announcements
async function getAnnouncements() {
  return await dbAll('SELECT * FROM system_announcements ORDER BY created_at DESC');
}

async function createAnnouncement({ title, message }) {
  const r = await dbRun('INSERT INTO system_announcements (title, message) VALUES (?,?)', [title, message]);
  return await dbGet('SELECT * FROM system_announcements WHERE id=?', [r.lastID]);
}

async function deleteAnnouncement(id) {
  await dbRun('DELETE FROM system_announcements WHERE id=?', [id]);
}

// ── Settings (Admin Limits) ─────────────────────────────────────────
async function getAllSettings() {
  return await dbAll('SELECT * FROM settings ORDER BY category, key');
}

async function getSetting(key) {
  return await dbGet('SELECT * FROM settings WHERE key=?', [key]);
}

async function upsertSetting({ key, value, label, category, type }) {
  const existing = await dbGet('SELECT * FROM settings WHERE key=?', [key]);
  if (existing) {
    await dbRun("UPDATE settings SET value=?, label=COALESCE(?,label), category=COALESCE(?,category), type=COALESCE(?,type), updated_at=datetime('now') WHERE key=?", [String(value), label || null, category || null, type || null, key]);
  } else {
    await dbRun('INSERT INTO settings (key, value, label, category, type) VALUES (?,?,?,?,?)', [key, String(value), label || key, category || 'general', type || 'number']);
  }
  return await dbGet('SELECT * FROM settings WHERE key=?', [key]);
}

async function deleteSetting(key) {
  await dbRun('DELETE FROM settings WHERE key=?', [key]);
}

// Apply DB settings back to in-memory config
async function applySettingsToConfig() {
  try {
    const all = await getAllSettings();
    const m = {};
    for (const s of all) m[s.key] = s.value;
    // Profile
    if (m.profile_username_min) config.profile.usernameMin = Number(m.profile_username_min);
    if (m.profile_username_max) config.profile.usernameMax = Number(m.profile_username_max);
    if (m.profile_name_max) config.profile.nameMax = Number(m.profile_name_max);
    if (m.profile_bio_max) config.profile.bioMax = Number(m.profile_bio_max);
    if (m.profile_avatar_max_kb) config.profile.avatarMaxKb = Number(m.profile_avatar_max_kb);
    if (m.profile_avatar_quality) config.profile.avatarQuality = Number(m.profile_avatar_quality);
    if (m.profile_min_age) config.profile.minAgeYears = Number(m.profile_min_age);
    // Posts
    if (m.post_text_max) config.post.textMax = Number(m.post_text_max);
    if (m.post_image_max_kb) config.post.imageMaxKb = Number(m.post_image_max_kb);
    if (m.post_image_quality) config.post.imageQuality = Number(m.post_image_quality);
    if (m.post_max_images) config.post.maxImages = Number(m.post_max_images);
    if (m.post_mention_limit) config.post.mentionLimit = Number(m.post_mention_limit);
    if (m.post_per_page) config.post.perPage = Number(m.post_per_page);
    // Comments
    if (m.comment_text_max) config.comment.textMax = Number(m.comment_text_max);
    if (m.comment_reply_max) config.comment.replyMax = Number(m.comment_reply_max);
    if (m.comment_per_page) config.comment.perPage = Number(m.comment_per_page);
    // Ads
    if (m.ads_feed_min) config.ads.feedMinBetween = Number(m.ads_feed_min);
    if (m.ads_feed_max) config.ads.feedMaxBetween = Number(m.ads_feed_max);
    if (m.ads_image_max_kb) config.ads.imageMaxKb = Number(m.ads_image_max_kb);
    // Notifications
    if (m.notification_ttl_hours) config.notification.ttlHours = Number(m.notification_ttl_hours);
    if (m.notification_per_page) config.notification.perPage = Number(m.notification_per_page);
    // Messages
    if (m.message_text_max) config.message.textMax = Number(m.message_text_max);
    if (m.message_per_page) config.message.perPage = Number(m.message_per_page);
    // Explore
    if (m.explore_posts_per_page) config.explore.postsPerPage = Number(m.explore_posts_per_page);
    if (m.explore_users_per_page) config.explore.usersPerPage = Number(m.explore_users_per_page);
    if (m.explore_search_min_chars) config.explore.searchMinChars = Number(m.explore_search_min_chars);
    // Suggestions
    if (m.suggestions_every_n_posts) config.suggestions.everyNPosts = Number(m.suggestions_every_n_posts);
    if (m.suggestions_users_per_card) config.suggestions.usersPerCard = Number(m.suggestions_users_per_card);
    // Rate limits
    if (m.rate_global) config.rateLimit.global = Number(m.rate_global);
    if (m.rate_post_create) config.rateLimit.postCreate = Number(m.rate_post_create);
    if (m.rate_message_send) config.rateLimit.messageSend = Number(m.rate_message_send);
    if (m.rate_search) config.rateLimit.search = Number(m.rate_search);
    if (m.rate_auth) config.rateLimit.auth = Number(m.rate_auth);
    // Admin
    if (m.admin_items_per_page) config.admin.itemsPerPage = Number(m.admin_items_per_page);
  } catch (e) { console.error('Failed to apply settings:', e); }
}

// ── XP System ────────────────────────────────────────────────────
async function awardXP(userId, action, xpAmount, sourceId = null) {
  if (xpAmount <= 0) return null;
  // Prevent duplicate XP: check if already awarded for same action + source
  if (sourceId !== null) {
    const existing = await dbGet(
      'SELECT id FROM xp_transactions WHERE user_id=? AND action=? AND source_id=?',
      [userId, action, sourceId]
    );
    if (existing) return null; // Already awarded, skip
  }
  await dbRun('INSERT INTO xp_transactions (user_id, action, xp_amount, source_id) VALUES (?,?,?,?)', [userId, action, xpAmount, sourceId]);
  await dbRun('UPDATE users SET xp = xp + ? WHERE id = ?', [xpAmount, userId]);
  const user = await dbGet('SELECT xp FROM users WHERE id=?', [userId]);
  return user?.xp || 0;
}

async function removeXP(userId, amount) {
  await dbRun('UPDATE users SET xp = MAX(0, xp - ?) WHERE id = ?', [amount, userId]);
}

async function setUserXP(userId, newXp) {
  await dbRun('UPDATE users SET xp = ? WHERE id = ?', [Math.max(0, newXp), userId]);
}

async function getLeaderboard(limit = 50, offset = 0) {
  return await dbAll('SELECT id, name, username, avatar, account_type, xp, posts_count, followers_count, is_verified FROM users WHERE is_active=1 AND is_profile_complete=1 ORDER BY xp DESC LIMIT ? OFFSET ?', [limit, offset]);
}

async function getXpTransactions(userId, limit = 50) {
  return await dbAll('SELECT * FROM xp_transactions WHERE user_id=? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
}

async function getAllXpTransactions(limit = 100, offset = 0) {
  return await dbAll(`SELECT x.*, u.name, u.username, u.avatar FROM xp_transactions x JOIN users u ON x.user_id=u.id ORDER BY x.created_at DESC LIMIT ? OFFSET ?`, [limit, offset]);
}

async function deleteXpTransaction(id) {
  const tx = await dbGet('SELECT * FROM xp_transactions WHERE id=?', [id]);
  if (!tx) return false;
  await dbRun('UPDATE users SET xp = MAX(0, xp - ?) WHERE id = ?', [tx.xp_amount, tx.user_id]);
  await dbRun('DELETE FROM xp_transactions WHERE id=?', [id]);
  return true;
}

async function getXpByPost(userId) {
  return await dbAll(`SELECT source_id, action, SUM(xp_amount) as total_xp, COUNT(*) as count FROM xp_transactions WHERE user_id=? AND source_id IS NOT NULL GROUP BY source_id, action ORDER BY total_xp DESC`, [userId]);
}

module.exports = {
  initDB, getDB, dbRun, dbGet, dbAll,
  findUserByGoogleId, findUserByEmail, findUserById, findUserByUsername, createUser, updateUser, hardDeleteUser, usernameExists,
  findAdminByEmail, findAdminByGoogleId, createAdmin, updateAdmin,
  followUser, unfollowUser, isFollowing, getFollowers, getFollowing,
  createPost, getPostById, getFeedPosts, getRecycledPosts, countAllPosts, getUserPosts, deletePost, adminDeletePost, togglePostActive,
  likePost, unlikePost, hasLikedPost, incrementPostViews, getPostReachByDay,
  createComment, getCommentsByPost, getCommentById, deleteComment, likeComment, unlikeComment, hasLikedComment,
  createNotification, getNotifications, markNotificationsRead, deleteNotification, cleanupExpiredNotifications,
  getConversation, createConversation, getConversations, getMessages, createMessage, markMessagesRead, deleteConversation,
  getActiveAds, getAdById, createAd, updateAd, deleteAd, toggleAdActive, trackAdEvent, getAllAds,
  createReport, getReports, getReportById, updateReport,
  getAllUsers, countUsers, countPosts, countReports,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
  getAllSettings, getSetting, upsertSetting, deleteSetting, applySettingsToConfig,
  awardXP, removeXP, setUserXP, getLeaderboard, getXpTransactions, getAllXpTransactions, deleteXpTransaction, getXpByPost,
};
