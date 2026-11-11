// The ticket shown on /option: TKT#512, three Shopify conversations merged into it, each with three or four emails.

const at = (text) => new Date(text.replace(',', ', 2026')).getTime(); // 'Nov 10, 09:30 AM' -> timestamp
const customer = (id, time, body) => ({ id, from: 'customer', time, at: at(time), body });
const agent = (id, time, body) => ({ id, from: 'agent', time, at: at(time), body });

export const AGENT = { name: 'Michael Scott', initial: 'M', avatarColor: 'var(--pastelLightBlueBorderDefault)' };
export const SUPPORT_NAME = 'Hiver Support';

export const TICKET = {
  id: 'option-ticket',
  ticketId: 'TKT#512',
  subject: 'Payout delayed for March',
  inbox: 'Email Support 01',
  slackChannel: 'payments',
  rt: { status: 'due', time: '6:00 PM today' },
  assignee: 'michael',
  status: 'open',
  tags: ['billing', 'urgent'],
  customFields: { 'order-number': '448210', 'plan-name': 'Business', seats: '25' },
  account: { name: 'Shopify', domain: 'shopify.com', contacts: 5, conversations: 11 },
  mergedAt: at('Nov 11, 11:20 AM'),
  mergedTime: 'Nov 11, 11:20 AM',
};

export const CONVERSATIONS = [
  {
    id: 'emma',
    customer: 'Emma Clarke',
    initial: 'E',
    avatarColor: 'var(--pastelRedBorderDefault)',
    email: 'emma.clarke@shopify.com',
    subject: 'Payout delayed for March',
    frt: { status: 'done', time: 'Nov 9, 10:05 AM' },
    oldAssignee: 'michael',
    oldStatus: 'pending',
    contactConversations: 4,
    messages: [
      customer('e1', 'Nov 9, 09:10 AM', "Hi team,\n\nOur March payout hasn't reached our bank account. It was due on Friday. Can you check what's holding it?\n\nEmma"),
      agent('e2', 'Nov 9, 10:05 AM', "Hi Emma,\n\nThanks for reaching out. I can see the payout was held for a routine review. I've asked the payments team to release it and will update you shortly.\n\nMichael"),
      customer('e3', 'Nov 10, 08:40 AM', "Hi Michael,\n\nThanks. Is there an expected date? Our suppliers are waiting on this.\n\nEmma"),
      agent('e4', 'Nov 10, 12:15 PM', "Hi Emma,\n\nThe review is done. The payout should land within two business days.\n\nMichael"),
    ],
  },
  {
    id: 'raj',
    customer: 'Raj Patel',
    initial: 'R',
    avatarColor: 'var(--pastelOrangeBorderDefault)',
    email: 'raj.patel@shopify.com',
    subject: 'Payout report shows the wrong amount',
    frt: { status: 'overdue', time: '3:30 PM yesterday' },
    oldAssignee: 'priya',
    oldStatus: 'open',
    contactConversations: 3,
    messages: [
      customer('r1', 'Nov 10, 11:30 AM', "Hello,\n\nThe payout report for March shows $12,480, but our sales report says $14,920. Which one is right?\n\nRaj"),
      customer('r2', 'Nov 10, 04:45 PM', "Adding the export from our dashboard for reference. The difference matches the orders from March 28 to 31.\n\nRaj"),
      customer('r3', 'Nov 11, 09:15 AM', "Following up, we need to close our books this week. Can someone confirm the right amount?\n\nRaj"),
    ],
  },
  {
    id: 'lena',
    customer: 'Lena Fischer',
    initial: 'L',
    avatarColor: 'var(--pastelPurpleBorderDefault)',
    email: 'lena.fischer@shopify.com',
    subject: 'Bank account verification stuck',
    frt: { status: 'done', time: 'Nov 10, 03:10 PM' },
    oldAssignee: 'daniel',
    oldStatus: 'open',
    contactConversations: 2,
    messages: [
      customer('l1', 'Nov 10, 02:20 PM', "Hi,\n\nWe changed our bank account last week and verification has said \"pending\" for five days. Could this be why payouts are late?\n\nLena"),
      agent('l2', 'Nov 10, 03:10 PM', "Hi Lena,\n\nYes, payouts pause while a new bank account is being verified. Could you send a bank letter or statement showing the account holder's name?\n\nMichael"),
      customer('l3', 'Nov 11, 10:30 AM', "Hi Michael,\n\nI've attached the bank letter. Please let me know if anything else is needed.\n\nLena"),
    ],
  },
];

// Notes and activity in the ticket's history. `conv` is the conversation they happened on (they show in its tab and on
// the Overview); `null` means the ticket itself, after the merge (Overview only).
const MICHAEL = { id: 'michael', name: 'Michael Scott' };
const JIM = { id: 'jim', name: 'Jim Halpert' };
const HIVER_AI = { id: 'hiver-ai', name: 'Hiver AI' };
const note = (id, conv, author, time, body) => ({
  type: 'note', id, conv, at: at(time),
  note: { id, authorId: author.id, author: author.name, initial: author.name.charAt(0), color: author.id === 'michael' ? 'red' : 'lightBlue', time, body },
});
const activity = (id, conv, time, row) => ({ type: 'activity', id, conv, at: at(time), row: { id, time, ...row } });

export const HISTORY = [
  activity('a1', 'emma', 'Nov 9, 09:11 AM', { kind: 'assignee', icon: 'assigned', verb: 'assigned to', object: MICHAEL, suffix: 'through auto assignment' }),
  note('n1', 'emma', MICHAEL, 'Nov 9, 09:40 AM', 'Payout was held by the risk review. @Jim Halpert can you check with the payments team before I reply?'),
  activity('a2', 'emma', 'Nov 9, 10:06 AM', { kind: 'status', icon: 'flag', actor: MICHAEL, verb: 'changed status to Pending' }),
  activity('a3', 'emma', 'Nov 9, 10:06 AM', { kind: 'tag-add', icon: 'tag', actor: MICHAEL, verb: 'applied Billing tag' }),
  activity('a4', 'raj', 'Nov 10, 11:31 AM', { kind: 'ai', icon: 'ai', actor: HIVER_AI, verb: 'set the topic to Payout discrepancy' }),
  activity('a5', 'raj', 'Nov 10, 11:31 AM', { kind: 'assignee', icon: 'assigned', actor: JIM, verb: 'assigned this conversation to', object: { id: 'priya', name: 'Priya Sharma' } }),
  note('n2', 'lena', JIM, 'Nov 10, 03:30 PM', 'Verification usually takes 3–5 days. I asked compliance to fast-track it once the bank letter is in.'),
  activity('a6', 'raj', 'Nov 10, 03:31 PM', { kind: 'sla', icon: 'clock', text: 'First response time overdue' }),
  activity('a7', 'lena', 'Nov 11, 10:31 AM', { kind: 'tag-add', icon: 'tag', actor: JIM, verb: 'applied Urgent tag' }),
  activity('a8', null, 'Nov 11, 11:21 AM', { kind: 'assignee', icon: 'assigned', actor: MICHAEL, verb: 'assigned this ticket to', object: MICHAEL }),
  activity('a9', null, 'Nov 11, 11:21 AM', { kind: 'status', icon: 'flag', actor: MICHAEL, verb: 'changed status to Open' }),
  note('n3', null, MICHAEL, 'Nov 11, 11:30 AM', "Merged these three, they're the same payout hold. Raj's gap is the March 28–31 orders still in review. @Jim Halpert I'll reply to all three once the payout is released."),
];
