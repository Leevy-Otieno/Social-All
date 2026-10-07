const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { createNotification, findUserById, findUserByUsername } = require('../db/database');

const ImageService = {
  async compress(buffer, maxKb, quality, mimeType) {
    try {
      const maxBytes = maxKb * 1024;
      let img = sharp(buffer);
      const meta = await img.metadata();
      if (meta.width > 1200) img = img.resize(1200, null, { withoutEnlargement: true });
      const fmt = mimeType === 'image/png' ? 'png' : 'jpeg';
      let out = await img.toFormat(fmt, fmt === 'jpeg' ? { quality } : {}).toBuffer();
      if (out.length > maxBytes && fmt === 'jpeg') {
        let q = quality;
        while (out.length > maxBytes && q > 20) {
          q -= 5;
          out = await img.toFormat('jpeg', { quality: q }).toBuffer();
        }
      }
      return out;
    } catch (e) {
      console.warn('Image compression failed, using original buffer:', e.message);
      return buffer; // Return original if sharp fails
    }
  },

  async save(buffer, dir, filename) {
    const dirPath = path.join(__dirname, '..', dir);
    fs.mkdirSync(dirPath, { recursive: true });
    const filePath = path.join(dirPath, filename);
    
    try {
      // Try processing with sharp first (strips metadata, optimizes)
      await sharp(buffer).toFile(filePath);
    } catch (e) {
      console.warn('Sharp failed, falling back to direct write:', e.message);
      // Fallback: Direct write if sharp dependencies are missing on the host
      fs.writeFileSync(filePath, buffer);
    }
    
    return filePath;
  },

  async saveBase64(base64, dir, filename) {
    const buffer = Buffer.from(base64.split(',')[1], 'base64');
    return await this.save(buffer, dir, filename);
  },

  getUrl(relativePath) {
    if (!relativePath) return null;
    return `${config.app.domain}${config.storage.publicUrl}/${relativePath}`;
  },
};

const NotificationService = {
  async send(userId, { actorId, type, targetType, targetId, message }) {
    return await createNotification({ user_id: userId, actor_id: actorId, type, target_type: targetType, target_id: targetId, message });
  },

  async likePost(postOwnerId, actorId, postId) {
    if (postOwnerId === actorId) return;
    const actor = await findUserById(actorId);
    if (!actor) return;
    await this.send(postOwnerId, { actorId, type: 'like', targetType: 'post', targetId: postId, message: `${actor.name} liked your post` });
  },

  async commentPost(postOwnerId, actorId, postId, text) {
    if (postOwnerId === actorId) return;
    const actor = await findUserById(actorId);
    if (!actor) return;
    await this.send(postOwnerId, { actorId, type: 'comment', targetType: 'post', targetId: postId, message: `${actor.name} commented: ${text.slice(0, 40)}` });
  },

  async replyComment(commentOwnerId, actorId, postId, text) {
    if (commentOwnerId === actorId) return;
    const actor = await findUserById(actorId);
    if (!actor) return;
    await this.send(commentOwnerId, { actorId, type: 'reply', targetType: 'comment', targetId: postId, message: `${actor.name} replied: ${text.slice(0, 40)}` });
  },

  async follow(followedId, actorId) {
    if (followedId === actorId) return;
    const actor = await findUserById(actorId);
    if (!actor) return;
    await this.send(followedId, { actorId, type: 'follow', targetType: 'user', targetId: actorId, message: `${actor.name} started following you` });
  },

  async mention(mentionedUserId, actorId, postId) {
    if (mentionedUserId === actorId) return;
    const actor = await findUserById(actorId);
    if (!actor) return;
    await this.send(mentionedUserId, { actorId, type: 'mention', targetType: 'post', targetId: postId, message: `${actor.name} mentioned you in a post` });
  },
};

const FeedService = {
  inject(items, ads, suggestions) {
    const result = [];
    let nextAd = Math.floor(Math.random() * (config.ads.feedMaxBetween - config.ads.feedMinBetween + 1)) + config.ads.feedMinBetween;
    let nextSuggestion = config.suggestions.everyNPosts;
    let adIdx = 0;
    let sugIdx = 0;

    items.forEach((item, idx) => {
      result.push({ type: 'post', data: item });
      if (idx + 1 === nextSuggestion && suggestions[sugIdx] && config.suggestions.enabled) {
        result.push({ type: 'suggestion', data: { users: suggestions[sugIdx] } });
        sugIdx++;
        nextSuggestion += config.suggestions.everyNPosts;
      }
      if (idx + 1 === nextAd && ads[adIdx] && config.ads.enabled) {
        result.push({ type: 'ad', data: ads[adIdx] });
        adIdx++;
        nextAd += Math.floor(Math.random() * (config.ads.feedMaxBetween - config.ads.feedMinBetween + 1)) + config.ads.feedMinBetween;
      }
    });
    return result;
  },
};

module.exports = { ImageService, NotificationService, FeedService };
