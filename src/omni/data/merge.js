import { CUSTOM_FIELDS } from './customFields';

// How merging emails into a ticket combines their values. The merge side sheet previews these,
// and App uses them to build the ticket.

// Tags: every tag on any of the conversations (a union), in the order the conversations are listed.
export const mergeTags = (conversations, tagsOf) => [...new Set(conversations.flatMap((c) => tagsOf(c.id)))];

// Custom fields: the ticket title's conversation wins; a field it leaves empty takes the first value
// another conversation has for it.
export const mergeCustomFields = (conversations, primaryId, customFieldsOf) => {
  const ordered = [conversations.find((c) => c.id === primaryId), ...conversations.filter((c) => c.id !== primaryId)].filter(Boolean);
  return CUSTOM_FIELDS.map((field) => ({
    ...field,
    value: ordered.map((c) => customFieldsOf(c.id)[field.id]).find((v) => v !== undefined && v !== ''),
  }));
};

// 'Feb 4, 02:45 PM' -> a timestamp, so messages can be ordered (the dummy data has no year).
const timestampOf = (time) => {
  const [day, clock] = time.split(', ');
  return new Date(`${day}, 2026 ${clock}`).getTime() || 0;
};

/**
 * The ticket made from merged emails. It takes the title (subject), sender and inbox view of the conversation picked
 * as the ticket title, and every message from every email, newest first.
 */
export const buildMergedTicket = (conversations, primaryId) => {
  const primary = conversations.find((c) => c.id === primaryId) ?? conversations[0];
  const messages = conversations
    .flatMap((c) => c.messages.map((m) => ({ ...m, id: `${c.id}-${m.id}` })))
    .sort((a, b) => timestampOf(b.time) - timestampOf(a.time));
  const newest = messages[0];
  return {
    ...primary,
    id: `ticket-${Date.now()}`,
    ticketId: `#TKT${Math.floor(100 + Math.random() * 900)}`,
    mergedFrom: conversations.map((c) => c.id),
    customerEmail: primary.messages[0]?.email,
    time: newest?.time ?? primary.time,
    preview: newest ? newest.body.replace(/\s+/g, ' ').trim() : primary.preview,
    threadCount: messages.length,
    messages,
    // The merged emails, each with its own thread, newest first: the ticket's Overview and email tabs show these.
    emails: [...conversations].sort((a, b) => timestampOf(b.time) - timestampOf(a.time)),
  };
};
