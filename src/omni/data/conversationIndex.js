// One searchable list of every conversation in every Shared Inbox, for the
// "Link conversations" search. Each entry has the same shape whatever its channel.

import { INITIAL_VIEWS_BY_INBOX } from './dummyViews';
import { conversationsData } from './emailConversations';
import { CHANNEL_CHATS } from './channelChats';
import { VOICE_CALLS, callerLabel } from './voiceCalls';

const channelOf = (inbox) => INITIAL_VIEWS_BY_INBOX[inbox]?.channel || 'email';

const email = conversationsData.map((c) => ({
  id: String(c.id),
  inbox: c.inbox,
  channel: 'email',
  ticketId: c.ticketId,
  view: c.type,
  name: c.sender,
  subject: c.subject,
  snippet: c.messages?.[0]?.body?.replace(/\s+/g, ' ') || c.preview,
  date: c.time,
  // Ticket ID and the senders' email addresses are searchable too.
  searchText: [c.ticketId, c.sender, c.subject, c.preview, ...(c.messages || []).flatMap((m) => [m.email, m.body])].filter(Boolean).join(' '),
}));

const chats = Object.entries(CHANNEL_CHATS).flatMap(([inbox, list]) =>
  list.map((c) => ({
    id: String(c.id),
    inbox,
    channel: channelOf(inbox),
    view: c.view,
    name: c.name,
    subject: c.preview,
    snippet: c.messages?.[c.messages.length - 1]?.text || '',
    date: c.date,
    searchText: [c.name, c.email, c.phone, ...(c.messages || []).map((m) => m.text)].join(' '),
  }))
);

const calls = VOICE_CALLS.map((c) => ({
  id: String(c.id),
  inbox: c.inbox,
  channel: 'voice',
  view: c.view,
  name: callerLabel(c),
  // Row 2 for Voice (linked-conversations-context.md 6.3): call direction + duration.
  subject: `${c.direction || 'Inbound'} call · ${c.status === 'ongoing' ? 'Ongoing' : c.duration}`,
  snippet: c.summary,
  date: c.time,
  searchText: [c.name, c.phone, c.summary].filter(Boolean).join(' '),
}));

/** The icon for a conversation: tickets use the ticket icon, everything else its channel's. */
export const iconFor = (c, channelIcons) => (c.ticketId ? 'ticket' : channelIcons[c.channel]);

// Every phone number in a conversation's search text, as digits only, so a number search ignores
// formatting: "5550110" matches "+1 (555) 0110".
const withPhoneDigits = (c) => ({ ...c, phoneDigits: (c.searchText.match(/\+?[\d][\d\s().-]{5,}\d/g) || []).map((p) => p.replace(/\D/g, '')).join(' ') });

// Only conversations from inboxes that exist in the sidebar.
export const CONVERSATION_INDEX = [...email, ...chats, ...calls].filter((c) => INITIAL_VIEWS_BY_INBOX[c.inbox]).map(withPhoneDigits);

export const conversationById = (id) => CONVERSATION_INDEX.find((c) => c.id === String(id));

/** Conversations whose text contains every word of `query` (case-insensitive). */
export function searchConversations(query, { inboxes, excludeId } = {}) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  // A word that looks like (part of) a phone number also matches its digits, whatever the formatting.
  const matches = (c, w) => {
    // A full ticket ID ("tkt#3") matches that ticket only, not TKT#30 or TKT#33.
    if (/^tkt#\d+$/.test(w)) return c.ticketId?.toLowerCase() === w;
    if (c.searchText.toLowerCase().includes(w)) return true;
    const digits = w.replace(/[\s().+-]/g, '');
    return /^\d{3,}$/.test(digits) && c.phoneDigits.includes(digits);
  };
  return CONVERSATION_INDEX.filter((c) =>
    c.id !== String(excludeId)
    && (!inboxes || inboxes.includes(c.inbox))
    && words.every((w) => matches(c, w))
  );
}
