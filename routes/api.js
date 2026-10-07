const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../config');
const { verifyToken, profileComplete, bannedCheck, createRateLimiter } = require('../middleware');
const { googleAuth, logout, me, setupStep1, setupStep2, setupStep3 } = require('../controllers/auth');
const { getFeed, getSuggestions, createNewPost, getSinglePost, removePost, toggleLike, explorePosts, exploreUsers, search, reportPost, getLeaderboardData } = require('../controllers/posts');
const { getPostComments, addComment, addReply, toggleCommentLike, removeComment, getProfile, updateProfile, getProfilePosts, follow, unfollow, getFollowers, getFollowing, getAnalytics, getNotifs, markAllRead, removeNotif, getMyXP, getSystemLimits } = require('../controllers/social');
const { getConversationsList, getConversationMessages, sendMessage, removeConversation, trackAdImpression, trackAdClick, getAppConfig } = require('../controllers/chat');

const upload = multer({ storage: multer.memoryStorage() });

// Auth (public)
router.post('/auth/google', createRateLimiter(15 * 60 * 1000, config.rateLimit.auth), googleAuth);
router.post('/auth/logout', verifyToken, logout);
router.get('/auth/me', verifyToken, me);
router.post('/auth/setup/step1', verifyToken, setupStep1);
router.post('/auth/setup/step2', verifyToken, setupStep2);
router.post('/auth/setup/step3', verifyToken, setupStep3);

// Feed + Posts (protected, profile complete)
router.get('/feed', verifyToken, bannedCheck, profileComplete, getFeed);
router.get('/feed/suggestions', verifyToken, bannedCheck, profileComplete, getSuggestions);
router.post('/posts', verifyToken, bannedCheck, profileComplete, upload.single('image'), createRateLimiter(60 * 1000, config.rateLimit.postCreate), createNewPost);
router.get('/posts/:id', verifyToken, bannedCheck, profileComplete, getSinglePost);
router.delete('/posts/:id', verifyToken, bannedCheck, profileComplete, removePost);
router.post('/posts/:id/like', verifyToken, bannedCheck, profileComplete, toggleLike);
router.delete('/posts/:id/like', verifyToken, bannedCheck, profileComplete, toggleLike);
router.post('/reports', verifyToken, bannedCheck, profileComplete, reportPost);

// Explore
router.get('/explore/posts', verifyToken, bannedCheck, profileComplete, explorePosts);
router.get('/explore/users', verifyToken, bannedCheck, profileComplete, exploreUsers);
router.get('/explore/search', verifyToken, bannedCheck, profileComplete, createRateLimiter(60 * 1000, config.rateLimit.search), search);

// Leaderboard + XP
router.get('/leaderboard', verifyToken, bannedCheck, profileComplete, getLeaderboardData);
router.get('/xp/me', verifyToken, bannedCheck, profileComplete, getMyXP);

// Comments
router.get('/posts/:id/comments', verifyToken, bannedCheck, profileComplete, getPostComments);
router.post('/posts/:id/comments', verifyToken, bannedCheck, profileComplete, addComment);
router.post('/comments/:id/replies', verifyToken, bannedCheck, profileComplete, addReply);
router.post('/comments/:id/like', verifyToken, bannedCheck, profileComplete, toggleCommentLike);
router.delete('/comments/:id/like', verifyToken, bannedCheck, profileComplete, toggleCommentLike);
router.delete('/comments/:id', verifyToken, bannedCheck, profileComplete, removeComment);

// Profile + Follow + Analytics
router.put('/profile/update', verifyToken, bannedCheck, profileComplete, updateProfile);
router.get('/profile/analytics', verifyToken, bannedCheck, profileComplete, getAnalytics);
router.post('/profile/follow/:id', verifyToken, bannedCheck, profileComplete, follow);
router.delete('/profile/follow/:id', verifyToken, bannedCheck, profileComplete, unfollow);
router.get('/profile/:username', verifyToken, bannedCheck, profileComplete, getProfile);
router.get('/profile/:username/posts', verifyToken, bannedCheck, profileComplete, getProfilePosts);
router.get('/profile/:userId/followers', verifyToken, bannedCheck, profileComplete, getFollowers);
router.get('/profile/:userId/following', verifyToken, bannedCheck, profileComplete, getFollowing);

// Notifications
router.get('/notifications', verifyToken, bannedCheck, profileComplete, getNotifs);
router.post('/notifications/read-all', verifyToken, bannedCheck, profileComplete, markAllRead);
router.delete('/notifications/:id', verifyToken, bannedCheck, profileComplete, removeNotif);

// Messages
router.get('/conversations', verifyToken, bannedCheck, profileComplete, getConversationsList);
router.get('/conversations/:id', verifyToken, bannedCheck, profileComplete, getConversationMessages);
router.post('/conversations/:userId', verifyToken, bannedCheck, profileComplete, createRateLimiter(60 * 1000, config.rateLimit.messageSend), sendMessage);
router.delete('/conversations/:id', verifyToken, bannedCheck, profileComplete, removeConversation);

// Ads
router.post('/ads/:id/impression', verifyToken, bannedCheck, profileComplete, trackAdImpression);
router.post('/ads/:id/click', verifyToken, bannedCheck, profileComplete, trackAdClick);

// Config (public)
router.get('/config', getAppConfig);
router.get('/system-limits', verifyToken, bannedCheck, getSystemLimits);

module.exports = router;
