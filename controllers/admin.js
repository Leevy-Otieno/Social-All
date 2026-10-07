const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const config = require('../config');
const {
  findAdminByEmail, findAdminByGoogleId, createAdmin, updateAdmin,
  getAllUsers, countUsers, countPosts, countReports,
  getReports, getReportById, updateReport,
  getAllAds, createAd, updateAd, deleteAd, toggleAdActive,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
  findUserById, updateUser, getPostById, adminDeletePost, togglePostActive, getFeedPosts, getUserPosts,
  getAllSettings, upsertSetting, deleteSetting, applySettingsToConfig,
  getAllXpTransactions, deleteXpTransaction, setUserXP, getLeaderboard,
} = require('../db/database');
const { NotificationService } = require('../services');

const googleClient = new OAuth2Client(config.google.clientId);

async function adminGoogleAuth(req, res) {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ ok: false, message: 'Missing idToken' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: config.google.clientId });
    const payload = ticket.getPayload();
    const { sub: google_id, email, name } = payload;
    if (email !== config.google.adminEmail) return res.status(403).json({ ok: false, message: 'Not authorized' });
    let admin = await findAdminByEmail(email);
    if (!admin) admin = await createAdmin({ google_id, email, name, last_login: new Date().toISOString() });
    else await updateAdmin(admin.id, { last_login: new Date().toISOString() });
    const token = jwt.sign({ adminId: admin.id, role: admin.role }, config.jwt.adminSecret, { expiresIn: config.jwt.adminExpiry });
    res.json({ ok: true, token, role: admin.role });
  } catch (e) {
    res.status(401).json({ ok: false, message: 'Invalid token' });
  }
}

async function getDashboard(req, res) {
  const totalUsers = await countUsers();
  const allUsers = await getAllUsers(null, null, 1000, 0);
  const newToday = allUsers.filter(u => u.created_at && u.created_at.startsWith(new Date().toISOString().slice(0, 10))).length;
  const totalPosts = await countPosts();
  const allAds = await getAllAds();
  const activeAds = allAds.filter(a => a.is_active).length;
  const pendingReports = await countReports('pending');
  const days = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days[d.toISOString().slice(0, 10)] = 0;
  }
  const growthUsers = await getAllUsers(null, null, 10000, 0);
  growthUsers.forEach(u => {
    const d = u.created_at ? u.created_at.slice(0, 10) : null;
    if (d && days.hasOwnProperty(d)) days[d]++;
  });
  const userGrowth = Object.keys(days).map(k => ({ date: k, users: days[k] }));
  const reports = await getReports();
  const statusCounts = { pending: 0, actioned: 0, dismissed: 0 };
  reports.forEach(r => { if (statusCounts[r.status] !== undefined) statusCounts[r.status]++; });
  const reportPie = Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] }));
  res.json({ ok: true, stats: { totalUsers, newToday, totalPosts, activeAds, pendingReports }, userGrowth, reportPie });
}

async function listUsers(req, res) {
  const { search, status, page = 1 } = req.query;
  const limit = config.admin.itemsPerPage;
  const offset = (page - 1) * limit;
  const users = await getAllUsers(status, search, limit, offset);
  const total = await countUsers(status);
  res.json({ ok: true, users, total, page, pages: Math.ceil(total / limit) });
}

async function getUser(req, res) {
  const user = await findUserById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
  const posts = await getUserPosts(req.params.id, 100, 0); // Get up to 100 posts
  res.json({ ok: true, user, posts });
}

async function banUser(req, res) {
  const { reason } = req.body;
  await updateUser(req.params.id, { is_banned: 1, ban_reason: reason || 'Violation' });
  res.json({ ok: true });
}

async function unbanUser(req, res) {
  await updateUser(req.params.id, { is_banned: 0, ban_reason: null });
  res.json({ ok: true });
}

async function toggleVerifyUser(req, res) {
  const user = await findUserById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
  const is_verified = user.is_verified ? 0 : 1;
  await updateUser(req.params.id, { is_verified });
  if (is_verified) {
    await NotificationService.send(user.id, {
      type: 'system',
      message: 'Congratulations! Your account has been verified. You now have a blue tick! 🎉',
    });
  }
  res.json({ ok: true, is_verified });
}

async function deleteUser(req, res) {
  const { hardDeleteUser } = require('../db/database');
  await hardDeleteUser(req.params.id);
  res.json({ ok: true, message: 'User and all associated data deleted permanently.' });
}

async function listPosts(req, res) {
  const { page = 1 } = req.query;
  const limit = config.admin.itemsPerPage;
  const offset = (page - 1) * limit;
  const posts = await getFeedPosts(limit, offset);
  const total = await countPosts();
  res.json({ ok: true, posts, total, page, pages: Math.ceil(total / limit) });
}

async function deleteAdminPost(req, res) {
  await adminDeletePost(req.params.id);
  res.json({ ok: true });
}

async function adminTogglePost(req, res) {
  const post = await togglePostActive(req.params.id);
  res.json({ ok: true, post });
}

async function listReports(req, res) {
  const { status, page = 1 } = req.query;
  const limit = config.admin.itemsPerPage;
  const offset = (page - 1) * limit;
  const allReports = await getReports(status);
  const reports = allReports.slice(offset, offset + limit);
  const total = await countReports(status);
  res.json({ ok: true, reports, total, page, pages: Math.ceil(total / limit) });
}

async function getReport(req, res) {
  const report = await getReportById(req.params.id);
  if (!report) return res.status(404).json({ ok: false, message: 'Not found' });
  res.json({ ok: true, report });
}

async function actionReport(req, res) {
  const { admin_note } = req.body;
  const report = await updateReport(req.params.id, { status: 'actioned', admin_note, reviewed_at: new Date().toISOString() });
  res.json({ ok: true, report });
}

async function dismissReport(req, res) {
  const { admin_note } = req.body;
  const report = await updateReport(req.params.id, { status: 'dismissed', admin_note, reviewed_at: new Date().toISOString() });
  res.json({ ok: true, report });
}

async function listAds(req, res) {
  const ads = await getAllAds();
  res.json({ ok: true, ads });
}

async function createNewAd(req, res) {
  const { type, title, caption, youtube_url, cta_text, cta_url, placement, starts_at, ends_at } = req.body;
  let image = null;
  if (req.file) {
    const { ImageService } = require('../services');
    const buf = await ImageService.compress(req.file.buffer, config.ads.imageMaxKb, 85, req.file.mimetype);
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filename = `ad_${Date.now()}.${ext}`;
    await ImageService.save(buf, config.storage.adsDir, filename);
    image = `ads/${filename}`;
  }
  const ad = await createAd({ type, title, caption: caption || null, image, youtube_url: youtube_url || null, cta_text: cta_text || 'Learn More', cta_url, placement: JSON.stringify(placement || ['feed']), starts_at: starts_at || null, ends_at: ends_at || null });
  res.json({ ok: true, ad });
}

async function updateExistingAd(req, res) {
  const fields = req.body;
  if (fields.placement) fields.placement = JSON.stringify(fields.placement);
  const ad = await updateAd(req.params.id, fields);
  res.json({ ok: true, ad });
}

async function adminDeleteAd(req, res) {
  await deleteAd(req.params.id);
  res.json({ ok: true });
}

async function adminToggleAd(req, res) {
  const ad = await toggleAdActive(req.params.id);
  res.json({ ok: true, ad });
}

async function listAnnouncements(req, res) {
  const announcements = await getAnnouncements();
  res.json({ ok: true, announcements });
}

async function createNewAnnouncement(req, res) {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ ok: false, message: 'Missing fields' });
  const a = await createAnnouncement({ title, message });
  res.json({ ok: true, announcement: a });
}

async function adminDeleteAnnouncement(req, res) {
  await deleteAnnouncement(req.params.id);
  res.json({ ok: true });
}

async function getSettings(req, res) {
  const settings = await getAllSettings();
  // Group by category for the frontend
  const grouped = {};
  for (const s of settings) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }
  res.json({ ok: true, settings, grouped, config: {
    app: { name: config.app.name, domain: config.app.domain, maintenance: config.app.maintenance },
    profile: { bioMax: config.profile.bioMax, avatarMaxKb: config.profile.avatarMaxKb, usernameMin: config.profile.usernameMin, usernameMax: config.profile.usernameMax, minAge: config.profile.minAgeYears },
    post: { textMax: config.post.textMax, imageMaxKb: config.post.imageMaxKb },
    comment: { textMax: config.comment.textMax },
    notification: { ttlHours: config.notification.ttlHours },
    message: { textMax: config.message.textMax },
    ads: { enabled: config.ads.enabled, feedMinBetween: config.ads.feedMinBetween, feedMaxBetween: config.ads.feedMaxBetween, inNotifications: config.ads.inNotifications, inExplore: config.ads.inExplore },
    suggestions: { enabled: config.suggestions.enabled, everyNPosts: config.suggestions.everyNPosts, usersPerCard: config.suggestions.usersPerCard },
    theme: config.theme,
  }});
}

async function updateSettings(req, res) {
  const { limits } = req.body;
  if (limits && Array.isArray(limits)) {
    for (const item of limits) {
      if (item.key && item.value !== undefined) {
        await upsertSetting(item);
      }
    }
    await applySettingsToConfig();
  }
  res.json({ ok: true, message: 'Settings saved and applied!' });
}

async function updateLimit(req, res) {
  const { key, value, label, category, type } = req.body;
  if (!key) return res.status(400).json({ ok: false, message: 'Key required' });
  const setting = await upsertSetting({ key, value, label, category, type });
  await applySettingsToConfig();
  res.json({ ok: true, setting });
}

// ── XP Admin ────────────────────────────────────────────────────
async function getAdminXp(req, res) {
  const { page = 1 } = req.query;
  const limit = 50;
  const offset = (page - 1) * limit;
  const transactions = await getAllXpTransactions(limit, offset);
  const leaderboard = await getLeaderboard(20, 0);
  res.json({ ok: true, transactions, leaderboard });
}

async function adminEditUserXp(req, res) {
  const { userId, xp } = req.body;
  if (!userId || xp == null) return res.status(400).json({ ok: false, message: 'userId and xp required' });
  await setUserXP(userId, parseInt(xp));
  const user = await findUserById(userId);
  res.json({ ok: true, user });
}

async function adminDeleteXpTx(req, res) {
  const id = parseInt(req.params.id);
  const ok = await deleteXpTransaction(id);
  if (!ok) return res.status(404).json({ ok: false, message: 'Transaction not found' });
  res.json({ ok: true });
}

module.exports = {
  adminGoogleAuth, getDashboard, listUsers, getUser, banUser, unbanUser, deleteUser,
  listPosts, deleteAdminPost, adminTogglePost,
  listReports, getReport, actionReport, dismissReport,
  listAds, createNewAd, updateExistingAd, adminDeleteAd, adminToggleAd,
  listAnnouncements, createNewAnnouncement, adminDeleteAnnouncement,
  getSettings, updateSettings, updateLimit,
  getAdminXp, adminEditUserXp, adminDeleteXpTx,
  toggleVerifyUser,
};
