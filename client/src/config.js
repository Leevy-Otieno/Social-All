// Client-side config — fetched from server on load
// Source of truth: server config.js → /api/v1/config
let appConfig = {
  name: 'YouBGram',
  bioMax: 200,
  textMax: 280,
  commentMax: 200,
  replyMax: 200,
  mentionLimit: 5,
  accountTypes: ['Creator', 'Freelancer', 'Business Owner', 'Student', 'Professional', 'Other'],
  reportReasons: [
    { key: 'spam',         label: 'Spam or misleading' },
    { key: 'inappropriate',label: 'Inappropriate content' },
    { key: 'harassment',   label: 'Harassment or bullying' },
    { key: 'hate_speech',  label: 'Hate speech' },
    { key: 'other',        label: 'Something else' },
  ],
  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
  },
  theme: {
    primary:        '#2563EB',
    primaryHover:   '#1D4ED8',
    primaryLight:   '#DBEAFE',
    accent:         '#0EA5E9',
    background:     '#FFFFFF',
    surface:        '#F8FAFC',
    border:         '#E2E8F0',
    textPrimary:    '#0F172A',
    textSecondary:  '#64748B',
    textMuted:      '#94A3B8',
    danger:         '#EF4444',
    success:        '#22C55E',
    warning:        '#F59E0B',
    sponsoredBg:    '#FEF9C3',
    sponsoredText:  '#92400E',
    darkSurface:    '#0F172A',
    darkText:       '#F1F5F9',
  },
  // ── Ad placements & display limits ──────────────────────────────
  ads: {
    enabled: true,
    sponsoredLabel: 'Sponsored',
    // How often ads appear in each context
    placements: {
      feed:          { everyN: 5,  size: 'full'    },  // Full-width card in feed
      notifications: { everyN: 5,  size: 'compact' },  // Compact banner in notifications
      explore:       { everyN: 8,  size: 'compact' },  // Compact in explore grid
      profile:       { everyN: 10, size: 'compact' },  // Compact on profile pages
    },
  },
};

export function setConfig(c) {
  appConfig = { ...appConfig, ...c };
}

export function getConfig() {
  return appConfig;
}
