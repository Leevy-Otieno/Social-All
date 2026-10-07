const config = require('../config');
const {
  getConversations, getConversation, createConversation, getMessages, createMessage,
  markMessagesRead, deleteConversation, findUserById, trackAdEvent,
} = require('../db/database');

async function getConversationsList(req, res) {
  const convs = await getConversations(req.userId);
  res.json({ ok: true, conversations: convs });
}

async function getConversationMessages(req, res) {
  const convId = parseInt(req.params.id);
  const messages = await getMessages(convId, 50, 0);
  await markMessagesRead(convId, req.userId);
  res.json({ ok: true, messages });
}

async function sendMessage(req, res) {
  const { userId } = req.params;
  const { text } = req.body;
  const targetId = parseInt(userId);
  if (targetId === req.userId) return res.status(400).json({ ok: false, message: 'Cannot message self' });
  if (!text || text.length > config.message.textMax) return res.status(400).json({ ok: false, message: `Max ${config.message.textMax} chars` });

  let conv = await getConversation(req.userId, targetId);
  if (!conv) conv = await createConversation(req.userId, targetId);

  const msg = await createMessage({ conversation_id: conv.id, sender_id: req.userId, text });

  // WebSocket push
  const clients = req.app.get('wsClients');
  const ws = clients.get(String(targetId));
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type: 'message', conversation_id: conv.id, message: msg }));
  }

  const user = await findUserById(req.userId);
  res.json({ ok: true, message: { ...msg, name: user.name, username: user.username, avatar: user.avatar } });
}

async function removeConversation(req, res) {
  const ok = await deleteConversation(parseInt(req.params.id), req.userId);
  if (!ok) return res.status(403).json({ ok: false, message: 'Cannot delete' });
  res.json({ ok: true });
}

async function trackAdImpression(req, res) {
  await trackAdEvent(parseInt(req.params.id), 'impression', req.userId);
  res.json({ ok: true });
}

async function trackAdClick(req, res) {
  await trackAdEvent(parseInt(req.params.id), 'click', req.userId);
  res.json({ ok: true });
}

async function getAppConfig(req, res) {
  res.json({
    ok: true,
    data: {
      name: config.app.name,
      bioMax: config.profile.bioMax,
      textMax: config.post.textMax,
      commentMax: config.comment.textMax,
      mentionLimit: config.post.mentionLimit,
      accountTypes: config.accountTypes,
      reportReasons: config.reportReasons,
      theme: config.theme,
      google: { clientId: config.google.clientId },
    },
  });
}

module.exports = {
  getConversationsList, getConversationMessages, sendMessage, removeConversation,
  trackAdImpression, trackAdClick, getAppConfig,
};
