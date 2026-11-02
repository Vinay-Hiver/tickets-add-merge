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
export const timestampOf = (time) => {
  const [day, clock] = time.split(', ');
  return new Date(`${day}, 2026 ${clock}`).getTime() || 0;
};

const nowClock = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

/**
 * A ticket holding `emails`: every message from every email, newest first, plus the emails themselves (newest first)
 * for the ticket's Overview and email tabs. The card's time and preview come from the newest message.
 */
export const assembleTicket = (ticket, emails) => {
  const messages = emails
    .flatMap((c) => c.messages.map((m) => ({ ...m, id: `${c.id}-${m.id}` })))
    .sort((a, b) => timestampOf(b.time) - timestampOf(a.time));
  const newest = messages[0];
  return {
    ...ticket,
    mergedFrom: emails.map((c) => c.id),
    time: newest?.time ?? ticket.time,
    preview: newest ? newest.body.replace(/\s+/g, ' ').trim() : ticket.preview,
    threadCount: messages.length,
    messages,
    emails: [...emails].sort((a, b) => timestampOf(b.time) - timestampOf(a.time)),
  };
};

/**
 * The ticket made from merged emails. It takes the title (subject), sender and inbox view of the conversation picked
 * as the ticket title.
 */
export const buildMergedTicket = (conversations, primaryId) => {
  const primary = conversations.find((c) => c.id === primaryId) ?? conversations[0];
  return assembleTicket({
    ...primary,
    id: `ticket-${Date.now()}`,
    ticketId: `#TKT${Math.floor(100 + Math.random() * 900)}`,
    customerEmail: primary.messages[0]?.email,
    mergedAt: nowClock(),
  }, conversations);
};

/**
 * `ticket` with `conversation` added. A ticket that was never merged holds just its own conversation, so that becomes
 * its first email. The ticket keeps its id, ID, title, assignee and status.
 */
export const addToTicket = (ticket, conversation) => {
  const emails = ticket.emails ?? [{ ...ticket, ticketId: undefined }];
  return assembleTicket({
    ...ticket,
    customerEmail: ticket.customerEmail ?? ticket.messages[0]?.email,
    mergedAt: nowClock(),
  }, [...emails, conversation]);
};
