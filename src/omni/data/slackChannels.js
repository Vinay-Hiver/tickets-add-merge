// The Slack channel each email conversation is shared to, shown as a tab next to "Conversation"
// (Figma: Tickets Add/Merge › 4026:14306). Short names, picked from the conversation id so they stay the same.
const CHANNELS = ['l2-escalations', 'billing-ops', 'vip-support', 'refunds', 'eng-bugs', 'ship-ops', 'cs-leads', 'onboarding'];

export const slackChannelFor = (id) => {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CHANNELS[h % CHANNELS.length];
};
