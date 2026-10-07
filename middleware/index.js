const jwt = require('jsonwebtoken');
const config = require('../config');
const { findUserById, findAdminByGoogleId } = require('../db/database');
const rateLimit = require('express-rate-limit');

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.userId = decoded.userId;
    
    // Non-blocking activity tracking
    const { dbRun } = require('../db/database');
    dbRun("UPDATE users SET last_active_at=datetime('now') WHERE id=?", [decoded.userId]).catch(() => {});
    
    next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Invalid token' });
  }
}

function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwt.adminSecret);
    req.adminId = decoded.adminId;
    next();
  } catch {
    return res.status(403).json({ ok: false, message: 'Forbidden' });
  }
}

async function profileComplete(req, res, next) {
  const user = await findUserById(req.userId);
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
  if (!user.is_profile_complete) {
    return res.status(403).json({ ok: false, message: 'Profile incomplete', step: user.profile_step });
  }
  req.user = user;
  next();
}

async function bannedCheck(req, res, next) {
  const user = await findUserById(req.userId);
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
  if (user.is_banned) {
    return res.status(403).json({ ok: false, message: 'Account banned', reason: user.ban_reason });
  }
  req.user = user;
  next();
}

function createRateLimiter(windowMs, max) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ ok: false, message: 'Too many requests' }),
  });
}

module.exports = {
  verifyToken,
  adminAuth,
  profileComplete,
  bannedCheck,
  createRateLimiter,
};
