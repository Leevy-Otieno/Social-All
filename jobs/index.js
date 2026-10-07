const { cleanupExpiredNotifications, getAllAds, updateAd } = require('../db/database');

async function cleanupNotifications() {
  const count = await cleanupExpiredNotifications();
  console.log(`[Cron] Cleaned ${count} expired notifications`);
}

async function deactivateExpiredAds() {
  const ads = await getAllAds();
  const now = new Date().toISOString();
  let count = 0;
  for (const ad of ads) {
    if (ad.is_active && ad.ends_at && ad.ends_at < now) {
      await updateAd(ad.id, { is_active: 0 });
      count++;
    }
  }
  console.log(`[Cron] Deactivated ${count} expired ads`);
}

async function autoDeleteInactiveUsers() {
  const { dbAll, hardDeleteUser } = require('../db/database');
  // Find users inactive for more than 5 days
  const inactiveUsers = await dbAll("SELECT id, name FROM users WHERE last_active_at < datetime('now', '-5 days')");
  let count = 0;
  for (const user of inactiveUsers) {
    await hardDeleteUser(user.id);
    count++;
  }
  if (count > 0) {
    console.log(`[Cron] Auto-deleted ${count} inactive users (5+ days inactive)`);
  }
}

module.exports = { cleanupNotifications, deactivateExpiredAds, autoDeleteInactiveUsers };
