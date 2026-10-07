const express = require('express');
const router = express.Router();
const multer = require('multer');
const { adminAuth } = require('../middleware');
const {
  adminGoogleAuth, getDashboard, listUsers, getUser, banUser, unbanUser, deleteUser,
  listPosts, deleteAdminPost, adminTogglePost,
  listReports, getReport, actionReport, dismissReport,
  listAds, createNewAd, updateExistingAd, adminDeleteAd, adminToggleAd,
  listAnnouncements, createNewAnnouncement, adminDeleteAnnouncement,
  getSettings, updateSettings, updateLimit,
  getAdminXp, adminEditUserXp, adminDeleteXpTx, toggleVerifyUser,
} = require('../controllers/admin');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/auth/google', adminGoogleAuth);
router.get('/dashboard', adminAuth, getDashboard);

router.get('/users', adminAuth, listUsers);
router.get('/users/:id', adminAuth, getUser);
router.post('/users/:id/verify', adminAuth, toggleVerifyUser);
router.post('/users/:id/ban', adminAuth, banUser);
router.post('/users/:id/unban', adminAuth, unbanUser);
router.delete('/users/:id', adminAuth, deleteUser);

router.get('/posts', adminAuth, listPosts);
router.delete('/posts/:id', adminAuth, deleteAdminPost);
router.post('/posts/:id/toggle', adminAuth, adminTogglePost);

router.get('/reports', adminAuth, listReports);
router.get('/reports/:id', adminAuth, getReport);
router.post('/reports/:id/action', adminAuth, actionReport);
router.post('/reports/:id/dismiss', adminAuth, dismissReport);

router.get('/ads', adminAuth, listAds);
router.post('/ads', adminAuth, upload.single('image'), createNewAd);
router.put('/ads/:id', adminAuth, updateExistingAd);
router.delete('/ads/:id', adminAuth, adminDeleteAd);
router.post('/ads/:id/toggle', adminAuth, adminToggleAd);

router.get('/announcements', adminAuth, listAnnouncements);
router.post('/announcements', adminAuth, createNewAnnouncement);
router.delete('/announcements/:id', adminAuth, adminDeleteAnnouncement);

router.get('/settings', adminAuth, getSettings);
router.post('/settings', adminAuth, updateSettings);
router.put('/limits', adminAuth, updateLimit);

// XP Management
router.get('/xp', adminAuth, getAdminXp);
router.put('/xp/user', adminAuth, adminEditUserXp);
router.delete('/xp/:id', adminAuth, adminDeleteXpTx);

module.exports = router;
