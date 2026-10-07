const path = require('path');
const config = require('../config');
const {
  getFeedPosts, getRecycledPosts, countAllPosts, createPost, getPostById, deletePost, likePost, unlikePost, hasLikedPost,
  getUserPosts, incrementPostViews, getActiveAds, findUserById, usernameExists, findUserByUsername,
  createReport, getUserPosts: getUserPostsRaw, awardXP, getSetting, getLeaderboard, isFollowing,
} = require('../db/database');
const { ImageService, FeedService, NotificationService } = require('../services');

function buildShareUrl(postId) {
  return `${config.app.domain}${config.post.shareUrlBase}${postId}`;
}

async function getFeed(req, res) {
  const { page = 1, recycle, seenIds } = req.query;
  const limit = config.post.perPage;
  const offset = (page - 1) * limit;

  let posts;
  let isRecycled = false;

  if (recycle === '1') {
    // Recycle mode: return random posts (loop), excluding recently seen ones
    const excludeArr = seenIds ? seenIds.split(',').map(Number).filter(Boolean) : [];
    posts = await getRecycledPosts(limit, excludeArr);
    isRecycled = true;
  } else {
    // Normal mode: newest first
    posts = await getFeedPosts(limit, offset);
  }

  for (const p of posts) {
    p.liked = await hasLikedPost(p.id, req.userId);
    p.following = p.user_id === req.userId ? undefined : await isFollowing(req.userId, p.user_id);
    await incrementPostViews(p.id, req.userId);
  }

  const ads = (await getActiveAds()).filter(a => JSON.parse(a.placement || '["feed"]').includes('feed'));
  const suggestions = [];
  const allUsers = posts.map(p => ({ id: p.user_id, name: p.name, username: p.username, avatar: p.avatar, is_verified: p.is_verified }));
  const unique = [];
  const seen = new Set();
  for (const u of allUsers) { if (!seen.has(u.id) && u.id !== req.userId) { seen.add(u.id); unique.push(u); } }
  for (let i = 0; i < unique.length; i += config.suggestions.usersPerCard) {
    suggestions.push(unique.slice(i, i + config.suggestions.usersPerCard));
  }

  const feed = FeedService.inject(posts, ads, suggestions);
  const totalPosts = await countAllPosts();
  const hasMore = !isRecycled && posts.length === limit;

  res.json({ ok: true, feed, hasMore, totalPosts, isRecycled });
}

async function getSuggestions(req, res) {
  const posts = await getFeedPosts(100, 0);
  const allUsers = posts.map(p => ({ id: p.user_id, name: p.name, username: p.username, avatar: p.avatar, account_type: p.account_type, is_verified: p.is_verified }));
  const unique = [];
  const seen = new Set();
  for (const u of allUsers) { if (!seen.has(u.id) && u.id !== req.userId) { seen.add(u.id); unique.push(u); } }
  res.json({ ok: true, users: unique.slice(0, config.suggestions.usersPerCard) });
}

async function createNewPost(req, res) {
  try {
    const { text } = req.body;
    const user = await findUserById(req.userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    
    // Check text length
    if (text && text.length > config.post.textMax) {
      return res.status(400).json({ ok: false, message: `Text too long (max ${config.post.textMax} characters)` });
    }

    let imagePath = null;
    if (req.file) {
      try {
        // Validation
        if (!config.post.allowedMimes.includes(req.file.mimetype)) {
          return res.status(400).json({ ok: false, message: 'Invalid image type. Use JPG/PNG.' });
        }

        const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
        const filename = `post_${user.id}_${Date.now()}.${ext}`;
        
        // Use our resilient ImageService (which now has fallback to fs.writeFileSync)
        const buf = await ImageService.compress(req.file.buffer, config.post.imageMaxKb, config.post.imageQuality, req.file.mimetype);
        await ImageService.save(buf, config.storage.postsDir, filename);
        
        imagePath = `posts/${filename}`;
      } catch (uploadErr) {
        console.error('CRITICAL: Post image processing failed:', uploadErr.message);
        // If image fails, we don't want to crash the whole request. 
        // We'll return an error so the user knows the image failed.
        return res.status(500).json({ ok: false, message: 'Could not process image. Please check folder permissions or try a different image.' });
      }
    }

    // Database operation
    const post = await createPost({ 
      user_id: req.userId, 
      text: text || null, 
      image: imagePath 
    });
    
    if (!post) {
      throw new Error('Database failed to create post entry');
    }

    post.share_url = buildShareUrl(post.id);
    
    // Notifications (Async - don't wait for them)
    if (text) {
      const mentions = [...text.matchAll(/@([a-zA-Z0-9_]+)/g)].map(m => m[1]);
      mentions.forEach(async (username) => {
        try {
          const mentioned = await findUserByUsername(username);
          if (mentioned && mentioned.id !== req.userId) {
            NotificationService.mention(mentioned.id, req.userId, post.id);
          }
        } catch (e) { console.error('Mention notification failed:', e); }
      });
    }

    res.json({ ok: true, post });
  } catch (error) {
    console.error('GLOBAL Post Creation Error:', error);
    res.status(500).json({ ok: false, message: 'Server error: Failed to create post. Please contact admin.' });
  }
}

async function getSinglePost(req, res) {
  const post = await getPostById(req.params.id);
  if (!post) return res.status(404).json({ ok: false, message: 'Post not found' });
  await incrementPostViews(post.id, req.userId);
  const user = await findUserById(post.user_id);
  const liked = await hasLikedPost(post.id, req.userId);
  res.json({ ok: true, post: { ...post, name: user.name, username: user.username, avatar: user.avatar, is_verified: user.is_verified, liked } });
}

async function removePost(req, res) {
  const ok = await deletePost(req.params.id, req.userId);
  if (!ok) return res.status(403).json({ ok: false, message: 'Cannot delete' });
  res.json({ ok: true });
}

async function toggleLike(req, res) {
  const post = await getPostById(req.params.id);
  if (!post) return res.status(404).json({ ok: false, message: 'Post not found' });
  const liked = await hasLikedPost(post.id, req.userId);
  if (liked) {
    await unlikePost(post.id, req.userId);
    res.json({ ok: true, liked: false, likes_count: Math.max(0, post.likes_count - 1) });
  } else {
    await likePost(post.id, req.userId);
    NotificationService.likePost(post.user_id, req.userId, post.id);
    // Award XP for liking (only once per post)
    const xpSetting = await getSetting('xp_like');
    const xpAmount = xpSetting ? parseInt(xpSetting.value) : 100;
    let xp_earned = 0;
    if (req.userId !== post.user_id) { // Don't award XP for liking own post
      const result = await awardXP(req.userId, 'like', xpAmount, post.id);
      if (result !== null) xp_earned = xpAmount; // null = already awarded (duplicate)
    }
    res.json({ ok: true, liked: true, likes_count: post.likes_count + 1, xp_earned });
  }
}

async function explorePosts(req, res) {
  const { page = 1 } = req.query;
  const limit = config.explore.postsPerPage;
  const offset = (page - 1) * limit;
  const posts = await getFeedPosts(limit, offset);
  for (const p of posts) {
    p.liked = await hasLikedPost(p.id, req.userId);
    p.following = p.user_id === req.userId ? undefined : await isFollowing(req.userId, p.user_id);
    await incrementPostViews(p.id, req.userId);
  }
  res.json({ ok: true, posts });
}

async function exploreUsers(req, res) {
  const { page = 1 } = req.query;
  const limit = config.explore.usersPerPage;
  const offset = (page - 1) * limit;
  const { getAllUsers, isFollowing } = require('../db/database');
  const users = await getAllUsers('active', null, limit, offset, true);
  // Attach following status so frontend can show correct button
  for (const u of users) {
    if (u.id === req.userId) { u.isSelf = true; u.following = false; continue; }
    u.following = await isFollowing(req.userId, u.id);
  }
  res.json({ ok: true, users });
}

async function search(req, res) {
  const { q } = req.query;
  if (!q || q.length < config.explore.searchMinChars) return res.status(400).json({ ok: false, message: `Min ${config.explore.searchMinChars} chars` });
  const { getAllUsers } = require('../db/database');
  
  const users = await getAllUsers(null, q, 30, 0);
  const posts = await getFeedPosts(100, 0);
  const filtered = posts.filter(p => (p.text && p.text.toLowerCase().includes(q.toLowerCase())) || (p.username && p.username.toLowerCase().includes(q.toLowerCase()))).slice(0, 30);
  for (const p of filtered) {
    p.liked = await hasLikedPost(p.id, req.userId);
    p.following = p.user_id === req.userId ? undefined : await isFollowing(req.userId, p.user_id);
  }
  res.json({ ok: true, users, posts: filtered });
}

async function reportPost(req, res) {
  const { target_id, reason } = req.body;
  if (!target_id || !reason) return res.status(400).json({ ok: false, message: 'Missing fields' });
  const valid = config.reportReasons.map(r => r.key);
  if (!valid.includes(reason)) return res.status(400).json({ ok: false, message: 'Invalid reason' });
  const report = await createReport({ reporter_id: req.userId, target_type: 'post', target_id, reason });
  res.json({ ok: true, report });
}

async function getLeaderboardData(req, res) {
  const { page = 1 } = req.query;
  const limit = 50;
  const offset = (page - 1) * limit;
  const users = await getLeaderboard(limit, offset);
  const xpPerLevel = (await getSetting('xp_per_level'))?.value || 1000;
  const maxLevel = (await getSetting('xp_max_level'))?.value || 100;
  res.json({ ok: true, users, xpPerLevel: Number(xpPerLevel), maxLevel: Number(maxLevel) });
}

module.exports = {
  getFeed, getSuggestions, createNewPost, getSinglePost, removePost, toggleLike,
  explorePosts, exploreUsers, search, reportPost, getLeaderboardData,
};
