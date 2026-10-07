const config = require('../config');
const {
  createComment, getCommentsByPost, getCommentById, deleteComment, likeComment, unlikeComment, hasLikedComment,
  findUserById, findUserByUsername, updateUser, followUser, unfollowUser, isFollowing,
  getFollowers, getFollowing, getNotifications, markNotificationsRead, deleteNotification,
  getUserPosts, createNotification, getPostById, usernameExists, awardXP, getSetting, getXpTransactions, getXpByPost,
} = require('../db/database');
const { NotificationService } = require('../services');

// ── Comments ──────────────────────────────────────────────────
async function getPostComments(req, res) {
  const post = await getPostById(req.params.id);
  if (!post) return res.status(404).json({ ok: false, message: 'Post not found' });
  const comments = await getCommentsByPost(req.params.id);
  const map = {};
  const roots = [];
  for (const c of comments) {
    map[c.id] = { ...c, liked: await hasLikedComment(c.id, req.userId), replies: [] };
  }
  comments.forEach(c => {
    if (c.parent_id && map[c.parent_id]) map[c.parent_id].replies.push(map[c.id]);
    else if (!c.parent_id) roots.push(map[c.id]);
  });
  res.json({ ok: true, comments: roots });
}

async function addComment(req, res) {
  const { text } = req.body;
  const post = await getPostById(req.params.id);
  if (!post) return res.status(404).json({ ok: false, message: 'Post not found' });
  if (!text || text.length > config.comment.textMax) return res.status(400).json({ ok: false, message: `Max ${config.comment.textMax} chars` });
  const comment = await createComment({ post_id: post.id, user_id: req.userId, parent_id: null, text });
  NotificationService.commentPost(post.user_id, req.userId, post.id, text);
  // Award XP for commenting (only once per post)
  const xpSetting = await getSetting('xp_comment');
  const xpAmount = xpSetting ? parseInt(xpSetting.value) : 150;
  let xp_earned = 0;
  if (req.userId !== post.user_id) {
    const result = await awardXP(req.userId, 'comment', xpAmount, post.id);
    if (result !== null) xp_earned = xpAmount;
  }
  // Mention notifications
  const mentions = [...text.matchAll(/@([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  for (const username of mentions) {
    const mentioned = await findUserByUsername(username);
    if (mentioned && mentioned.id !== req.userId) {
      NotificationService.mention(mentioned.id, req.userId, post.id);
    }
  }
  const user = await findUserById(req.userId);
  res.json({ ok: true, comment: { ...comment, name: user.name, username: user.username, avatar: user.avatar, liked: false, replies: [] }, xp_earned });
}

async function addReply(req, res) {
  const { text } = req.body;
  const parent = await getCommentById(parseInt(req.params.id));
  if (!parent) return res.status(404).json({ ok: false, message: 'Comment not found' });
  if (!text || text.length > config.comment.replyMax) return res.status(400).json({ ok: false, message: `Max ${config.comment.replyMax} chars` });
  const comment = await createComment({ post_id: parent.post_id, user_id: req.userId, parent_id: parent.id, text });
  NotificationService.replyComment(parent.user_id, req.userId, parent.post_id, text);
  // Award XP for reply (only once per parent comment)
  const xpSetting = await getSetting('xp_comment');
  const xpAmount = xpSetting ? parseInt(xpSetting.value) : 150;
  let xp_earned = 0;
  if (req.userId !== parent.user_id) {
    await awardXP(req.userId, 'reply', xpAmount, parent.post_id);
    xp_earned = xpAmount;
  }
  // Mention notifications in reply
  const mentions = [...text.matchAll(/@([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  for (const username of mentions) {
    const mentioned = await findUserByUsername(username);
    if (mentioned && mentioned.id !== req.userId) {
      NotificationService.mention(mentioned.id, req.userId, parent.post_id);
    }
  }
  const user = await findUserById(req.userId);
  res.json({ ok: true, comment: { ...comment, name: user.name, username: user.username, avatar: user.avatar, liked: false }, xp_earned });
}

async function toggleCommentLike(req, res) {
  const commentId = parseInt(req.params.id);
  const liked = await hasLikedComment(commentId, req.userId);
  if (liked) { await unlikeComment(commentId, req.userId); res.json({ ok: true, liked: false }); }
  else { await likeComment(commentId, req.userId); res.json({ ok: true, liked: true }); }
}

async function removeComment(req, res) {
  const ok = await deleteComment(parseInt(req.params.id), req.userId);
  if (!ok) return res.status(403).json({ ok: false, message: 'Cannot delete' });
  res.json({ ok: true });
}

// ── Profile ───────────────────────────────────────────────────
async function getProfile(req, res) {
  const user = await findUserByUsername(req.params.username);
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
  const following = await isFollowing(req.userId, user.id);
  const posts = await getUserPosts(user.id, 20, 0);
  res.json({ ok: true, profile: { ...user, following, posts } });
}

async function updateProfile(req, res) {
  const { name, bio, about_html, account_type, show_dob, show_account_type, avatar } = req.body;
  const user = await findUserById(req.userId);
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (bio !== undefined) fields.bio = bio;
  if (about_html !== undefined) fields.about_html = about_html;
  if (account_type !== undefined) fields.account_type = account_type;
  if (show_dob !== undefined) fields.show_dob = show_dob ? 1 : 0;
  if (show_account_type !== undefined) fields.show_account_type = show_account_type ? 1 : 0;
  
  if (avatar !== undefined) {
    if (avatar && avatar.startsWith('data:')) {
      try {
        const { ImageService } = require('../services');
        const filename = `avatar_${user.id}_${Date.now()}.jpg`;
        await ImageService.saveBase64(avatar, config.storage.avatarsDir, filename);
        fields.avatar = `avatars/${filename}`;
      } catch (imgError) {
        console.error('Profile update avatar error:', imgError.message);
        // Don't update avatar if it fails, but allow other fields to update
      }
    } else {
      fields.avatar = avatar;
    }
  }
  
  const updated = await updateUser(user.id, fields);
  res.json({ ok: true, user: updated });
}

async function getProfilePosts(req, res) {
  const user = await findUserByUsername(req.params.username);
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
  const posts = await getUserPosts(user.id, 20, 0);
  res.json({ ok: true, posts });
}

// ── Follow ────────────────────────────────────────────────────
async function follow(req, res) {
  const targetId = parseInt(req.params.id);
  if (targetId === req.userId) return res.status(400).json({ ok: false, message: 'Cannot follow self' });
  const target = await findUserById(targetId);
  if (!target) return res.status(404).json({ ok: false, message: 'User not found' });
  await followUser(req.userId, targetId);
  NotificationService.follow(targetId, req.userId);
  // Award XP for following (only once per user)
  const xpSetting = await getSetting('xp_follow');
  const xpAmount = xpSetting ? parseInt(xpSetting.value) : 200;
  const result = await awardXP(req.userId, 'follow', xpAmount, targetId);
  const xp_earned = result !== null ? xpAmount : 0;
  res.json({ ok: true, following: true, xp_earned });
}

async function unfollow(req, res) {
  const targetId = parseInt(req.params.id);
  await unfollowUser(req.userId, targetId);
  res.json({ ok: true, following: false });
}

async function getFollowersList(req, res) {
  const userId = parseInt(req.params.userId);
  const followers = await getFollowers(userId);
  res.json({ ok: true, users: followers });
}

async function getFollowingList(req, res) {
  const userId = parseInt(req.params.userId);
  const following = await getFollowing(userId);
  res.json({ ok: true, users: following });
}

// ── Analytics ─────────────────────────────────────────────────
async function getAnalytics(req, res) {
  const { getPostReachByDay, getUserPostsFiltered } = require('../db/database');
  const { days, from, to } = req.query;

  let dayCount = parseInt(days) || 30;
  let fromDate = null, toDate = null;

  if (from && to) {
    fromDate = from;
    toDate = to;
    dayCount = null;
  }

  const posts = await getUserPosts(req.userId, 1000, 0);
  const totalReach = posts.reduce((s, p) => s + (p.reach_count || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.likes_count || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments_count || 0), 0);

  const reachData = await getPostReachByDay(req.userId, dayCount, fromDate, toDate);

  // XP analytics
  const user = await findUserById(req.userId);
  const xpHistory = await getXpTransactions(req.userId, 50);
  const xpByPost = await getXpByPost(req.userId);
  const xpPerLevel = (await getSetting('xp_per_level'))?.value || 1000;

  res.json({ ok: true, stats: { totalReach, totalLikes, totalComments, postsCount: posts.length, xp: user?.xp || 0 }, reachData, posts, xpHistory, xpByPost, xpPerLevel: Number(xpPerLevel) });
}

// ── Notifications ─────────────────────────────────────────────
async function getNotifs(req, res) {
  const notifs = await getNotifications(req.userId);
  res.json({ ok: true, notifications: notifs, unreadCount: notifs.filter(n => !n.is_read).length });
}

async function markAllRead(req, res) {
  await markNotificationsRead(req.userId);
  res.json({ ok: true });
}

async function removeNotif(req, res) {
  await deleteNotification(parseInt(req.params.id), req.userId);
  res.json({ ok: true });
}

// ── XP History ────────────────────────────────────────────────
async function getMyXP(req, res) {
  const user = await findUserById(req.userId);
  const history = await getXpTransactions(req.userId, 50);
  const xpPerLevel = (await getSetting('xp_per_level'))?.value || 1000;
  const maxLevel = (await getSetting('xp_max_level'))?.value || 100;
  res.json({ ok: true, xp: user?.xp || 0, history, xpPerLevel: Number(xpPerLevel), maxLevel: Number(maxLevel) });
}

async function getSystemLimits(req, res) {
  const { getAllSettings } = require('../db/database');
  const settings = await getAllSettings();
  const publicCategories = ['profile', 'posts', 'comments', 'xp', 'messages'];
  const limits = settings.filter(s => publicCategories.includes(s.category));
  res.json({ ok: true, limits });
}

module.exports = {
  getPostComments, addComment, addReply, toggleCommentLike, removeComment,
  getProfile, updateProfile, getProfilePosts, follow, unfollow,
  getFollowers: getFollowersList, getFollowing: getFollowingList,
  getAnalytics, getNotifs, markAllRead, removeNotif, getMyXP,
  getSystemLimits
};
