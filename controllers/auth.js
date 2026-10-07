const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const config = require('../config');
const {
  findUserByGoogleId, findUserByEmail, createUser, updateUser, findUserById,
  findAdminByEmail, findAdminByGoogleId, createAdmin, updateAdmin, usernameExists,
} = require('../db/database');

const googleClient = new OAuth2Client(config.google.clientId);

async function googleAuth(req, res) {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ ok: false, message: 'Missing idToken' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: config.google.clientId });
    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;

    // Admin check
    if (email === config.google.adminEmail) {
      let admin = await findAdminByEmail(email);
      if (!admin) {
        admin = await createAdmin({ google_id, email, name, last_login: new Date().toISOString() });
      } else {
        await updateAdmin(admin.id, { last_login: new Date().toISOString() });
      }
      const token = jwt.sign({ adminId: admin.id, role: admin.role }, config.jwt.adminSecret, { expiresIn: config.jwt.adminExpiry });
      return res.json({ ok: true, token, role: 'admin', redirectTo: '/admin/dashboard' });
    }

    let user = await findUserByEmail(email);
    if (!user) {
      let avatarPath = null;
      if (picture) {
        try {
          const axios = require('axios');
          const response = await axios.get(picture, { responseType: 'arraybuffer' });
          const { ImageService } = require('../services');
          const filename = `avatar_google_${Date.now()}.jpg`;
          await ImageService.save(response.data, config.storage.avatarsDir, filename);
          avatarPath = `avatars/${filename}`;
        } catch (e) {
          console.error('Failed to download google image', e);
        }
      }
      user = await createUser({ google_id, email, name, avatar: avatarPath });
    }
    const token = jwt.sign({ userId: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiry });
    res.json({
      ok: true, token,
      is_profile_complete: !!user.is_profile_complete,
      profile_step: user.profile_step || 1,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        avatar: user.avatar, 
        username: user.username, 
        is_profile_complete: !!user.is_profile_complete, 
        profile_step: user.profile_step || 1,
        is_verified: user.is_verified 
      },
    });
  } catch (e) {
    res.status(401).json({ ok: false, message: 'Invalid Google token' });
  }
}

function logout(req, res) {
  res.json({ ok: true, message: 'Logged out' });
}

async function me(req, res) {
  const user = await findUserById(req.userId);
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
  // Normalize SQLite integers to booleans for frontend consistency
  user.is_profile_complete = !!user.is_profile_complete;
  user.profile_step = user.profile_step || 1;
  res.json({ ok: true, user });
}

async function setupStep1(req, res) {
  try {
    const { name, username, date_of_birth, avatar } = req.body;
    const user = await findUserById(req.userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    
    if (!name || !username || !date_of_birth) {
      return res.status(400).json({ ok: false, message: 'Missing required fields' });
    }

    if (username.length < config.profile.usernameMin || username.length > config.profile.usernameMax) {
      return res.status(400).json({ ok: false, message: `Username must be ${config.profile.usernameMin}-${config.profile.usernameMax} characters` });
    }

    if (!new RegExp(config.profile.usernameRegex).test(username)) {
      return res.status(400).json({ ok: false, message: 'Invalid username format (letters, numbers, underscore only)' });
    }

    if (await usernameExists(username, user.id)) {
      return res.status(409).json({ ok: false, message: 'Username is already taken' });
    }

    const dob = new Date(date_of_birth);
    const age = (new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < config.profile.minAgeYears) {
      return res.status(400).json({ ok: false, message: `You must be at least ${config.profile.minAgeYears} years old` });
    }

    let avatarPath = user.avatar;
    if (avatar && avatar.startsWith('data:')) {
      try {
        const { ImageService } = require('../services');
        const filename = `avatar_${user.id}_${Date.now()}.jpg`;
        await ImageService.saveBase64(avatar, config.storage.avatarsDir, filename);
        avatarPath = `avatars/${filename}`;
      } catch (imgError) {
        // LOG the error but don't block the user from signing up
        console.error('CRITICAL: Avatar save failed:', imgError.message);
        // We proceed with the existing avatar (or null) so the user isn't stuck
      }
    }

    const updated = await updateUser(user.id, { 
      name: name.trim(), 
      username: username.trim(), 
      date_of_birth, 
      avatar: avatarPath, 
      profile_step: 2 
    });
    
    res.json({ ok: true, user: updated });
  } catch (error) {
    console.error('Setup Step 1 Error:', error);
    res.status(500).json({ ok: false, message: 'Internal server error during profile setup' });
  }
}

async function setupStep2(req, res) {
  const { bio, account_type } = req.body;
  const user = await findUserById(req.userId);
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
  if (bio && bio.length > config.profile.bioMax) return res.status(400).json({ ok: false, message: `Bio max ${config.profile.bioMax} chars` });
  if (account_type && !config.accountTypes.includes(account_type)) return res.status(400).json({ ok: false, message: 'Invalid account type' });
  const updated = await updateUser(user.id, { bio: bio || '', account_type: account_type || '', profile_step: 3 });
  res.json({ ok: true, user: updated });
}

async function setupStep3(req, res) {
  const user = await findUserById(req.userId);
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
  const updated = await updateUser(user.id, { is_profile_complete: 1 });
  res.json({ ok: true, user: updated });
}

function adminGoogleAuth(req, res) {
  // Same as googleAuth but routed through admin endpoint
  return googleAuth(req, res);
}

module.exports = {
  googleAuth, logout, me, setupStep1, setupStep2, setupStep3, adminGoogleAuth,
};
