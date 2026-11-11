// The Slack channels each conversation is shared to, shown as pills next to "Conversation" (Figma: Tickets Add/Merge ›
// 4089:1970). Picked from the conversation id so they stay the same: some have none, some one, some two.
const CHANNELS = ['l2-escalations-zap', 'l1-escalations-zap', 'billing-ops', 'vip-support', 'refunds', 'eng-bugs', 'ship-ops', 'cs-leads'];

const hash = (id) => {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};

export const slackChannelsFor = (id) => {
  const h = hash(id);
  const count = h % 3; // 0, 1 or 2 channels
  return Array.from({ length: count }, (_, i) => CHANNELS[(h + i * 3) % CHANNELS.length]);
};

// An email or a ticket that was never merged: its one Slack channel, shown as a tab next to "Conversation"
// (Figma 4026:14306).
const SINGLE = ['l2-escalations', 'billing-ops', 'vip-support', 'refunds', 'eng-bugs', 'ship-ops', 'cs-leads', 'onboarding'];
export const slackChannelFor = (id) => SINGLE[hash(id) % SINGLE.length];
