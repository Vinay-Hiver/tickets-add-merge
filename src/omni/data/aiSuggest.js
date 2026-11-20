// Stand-in for the AI that suggests what to add: conversations for a ticket, or tickets for a conversation. It ranks
// by what they share (the same contact, the same topic) and says why in one short line. When nothing is related, it
// falls back to the customer's latest ones, so there's always a suggestion to show.

// Topics the AI recognises, by the words that point to them
const TOPICS = [
  ['sign-in problems', /\b(log ?in|login|sign(ing)? ?in|sso|password|2fa|two-factor|auth\w*|locked out|access)\b/],
  ['billing and refunds', /\b(refund\w*|charg\w*|billing|invoice\w*|payment\w*|subscription|plan|seats?|cancel\w*|return\w*)\b/],
  ['reports and exports', /\b(export\w*|csv|reports?|dashboard\w*|charts?|analytics)\b/],
  ['the API and webhooks', /\b(api|webhooks?|endpoint\w*|integration\w*|token\w*)\b/],
  ['the app not loading', /\b(blank screen|crash\w*|not loading|slow\w*|freez\w*|app)\b/],
  ['shipping and orders', /\b(ship\w*|order\w*|deliver\w*|tracking|package)\b/],
];

const textOf = (c) => [c.subject, c.preview, c.messages?.[0]?.body, ...(c.emails ?? []).flatMap((e) => [e.subject, e.preview])]
  .filter(Boolean).join(' ').toLowerCase();
const topicsOf = (c) => { const t = textOf(c); return TOPICS.filter(([, re]) => re.test(t)).map(([name]) => name); };
const contactsOf = (c) => new Set([c, ...(c.emails ?? [])].map((x) => x.messages?.[0]?.email).filter(Boolean));

/**
 * Up to `limit` of `items` most related to `targets` (one or more conversations or tickets), best first, each as
 * { item, reason }.
 */
export function aiSuggest(targets, items, limit = 2) {
  const topics = new Set(targets.flatMap(topicsOf));
  const contacts = new Set(targets.flatMap((t) => [...contactsOf(t)]));
  const ranked = items.map((item, i) => {
    const shared = topicsOf(item).filter((t) => topics.has(t));
    const sameContact = [...contactsOf(item)].some((e) => contacts.has(e));
    const reason = sameContact && shared.length ? `Same contact, also about ${shared[0]}`
      : sameContact ? 'Same contact'
      : shared.length ? `Also about ${shared[0]}`
      : 'Recent from the same customer';
    return { item, reason, score: shared.length * 2 + (sameContact ? 3 : 0), i };
  });
  return ranked.sort((a, b) => b.score - a.score || a.i - b.i).slice(0, limit).map(({ item, reason }) => ({ item, reason }));
}
