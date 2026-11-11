import { timestampOf } from './merge';
import { companyOf } from './companies';
import { conversationsData } from './emailConversations';

// Which email conversations are past their first response time (FRT), for the list's FRT chip and the right panel's
// FRT alert: one conversation from each customer (company) in each view of each inbox (Mine, Unassigned): the first one
// that isn't a ticket and has no reply yet.

const FRT_TARGET_HOURS = 2;

const OVERDUE_IDS = new Set();
const seen = new Map();
const unanswered = (c) => !c.messages.some((m) => m.email === 'support@hiver.com');
// Conversations nobody has replied to come first, so the overdue one is one still waiting for a first response.
[...conversationsData.filter(unanswered), ...conversationsData.filter((c) => !unanswered(c))].forEach((c) => {
  const customer = `${c.inbox}|${c.type}|${companyOf(c)}`;
  // Stripe in Email Support 01 → Mine gets two, so merging them shows "FRT • 2" on the ticket
  const limit = customer === 'Email Support 01|Mine|Stripe' ? 2 : 1;
  if (c.ticketId || (seen.get(customer) ?? 0) >= limit) return;
  seen.set(customer, (seen.get(customer) ?? 0) + 1);
  OVERDUE_IDS.add(c.id);
});

/**
 * How many conversations on a list card are past their FRT: for a merged ticket, its conversations that are; for an
 * email, 1 or 0.
 */
export const frtCountOf = (c) => {
  if (!c) return 0;
  if (c.emails) return c.emails.filter((e) => OVERDUE_IDS.has(e.id)).length;
  return frtOf(c) ? 1 : 0;
};

/** The conversation's FRT when it's overdue ({ status, time }), otherwise null. Due two hours after its first email. */
export const frtOf = (c) => {
  if (!c || c.emails || c.ticketId) return null;
  if (!OVERDUE_IDS.has(c.id)) return null;
  const due = new Date(timestampOf(c.messages?.[0]?.time ?? c.time) + FRT_TARGET_HOURS * 3600 * 1000);
  const day = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const clock = due.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { status: 'overdue', time: `${day}, ${clock}` };
};
