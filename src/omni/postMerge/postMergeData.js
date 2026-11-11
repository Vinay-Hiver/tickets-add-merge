// The one ticket shown on /post-merge: TKT#476, four conversations from PayPal merged into it.
// Each conversation keeps its own first response time (FRT); the ticket has one resolution time (RT).
// Two conversations are past their FRT, one is due soon and one was answered in time.

const at = (text) => new Date(`${text.replace(',', ', 2026')}`).getTime(); // 'Nov 10, 09:30 AM' -> timestamp

const msg = (id, from, time, body, extra = {}) => ({ id, from, time, at: at(time), body, ...extra });

const AGENT = { name: 'Michael Scott', initial: 'M', avatarColor: 'var(--pastelLightBlueBorderDefault)' };

export const SUPPORT = { name: 'Hiver Support', email: 'support@hiver.com', agent: AGENT };

export const TICKET = {
  id: 'pm-ticket',
  ticketId: 'TKT#476',
  subject: "Reports won't export to CSV",
  inbox: 'Email Support 01',
  slackChannel: 'onboarding',
  // One resolution time for the whole ticket
  rt: { status: 'due', time: '6:00 PM today' },
  assignee: 'michael',
  status: 'open',
  tags: ['bug', 'vip'],
  customFields: { 'order-number': '986693', 'plan-name': 'Enterprise', seats: '50' },
  account: { name: 'PayPal', domain: 'paypal.com', contacts: 6, conversations: 14 },
};

// `startsFrt` marks the customer email that started the conversation's first response clock.
export const CONVERSATIONS = [
  {
    id: 'sarah',
    customer: 'Sarah Miller',
    initial: 'S',
    color: 'red',
    avatarColor: 'var(--pastelRedBorderDefault)',
    email: 'sarah.miller@paypal.com',
    subject: "Reports won't export to CSV",
    frt: { status: 'done', time: 'Nov 10, 10:12 AM' },
    oldAssignee: 'michael',
    oldStatus: 'pending',
    contactConversations: 5,
    messages: [
      msg('s1', 'customer', 'Nov 10, 09:30 AM', "Hi,\n\nThe export button on the Reports page spins and nothing downloads. We need the monthly CSV for our finance close this week.\n\nThanks,\nSarah", { startsFrt: true }),
      msg('s2', 'agent', 'Nov 10, 10:12 AM', "Hi Sarah,\n\nThanks for flagging this. We can see the export job timing out for large date ranges. Could you try exporting a single week while we look into it?\n\nMichael"),
      msg('s3', 'customer', 'Nov 11, 09:05 AM', "Hi Michael,\n\nA single week works, but the full month still fails. Any update on a fix?\n\nSarah"),
    ],
  },
  {
    id: 'kevin',
    customer: 'Kevin Park',
    initial: 'K',
    color: 'orange',
    avatarColor: 'var(--pastelOrangeBorderDefault)',
    email: 'kevin.park@paypal.com',
    subject: 'CSV export failing for our team',
    frt: { status: 'overdue', time: '6:40 PM yesterday' },
    oldAssignee: 'priya',
    oldStatus: 'open',
    contactConversations: 3,
    messages: [
      msg('k1', 'customer', 'Nov 10, 02:40 PM', "Hello,\n\nSeveral of us on the payments team can't export reports to CSV since this morning. Is there an outage?\n\nKevin Park", { startsFrt: true }),
    ],
  },
  {
    id: 'priya',
    customer: 'Priya Nair',
    initial: 'P',
    color: 'purple',
    avatarColor: 'var(--pastelPurpleBorderDefault)',
    email: 'priya.nair@paypal.com',
    subject: 'Export button not responding',
    frt: { status: 'overdue', time: '8:15 PM yesterday' },
    oldAssignee: 'none',
    oldStatus: 'open',
    contactConversations: 2,
    messages: [
      msg('p1', 'customer', 'Nov 10, 04:15 PM', "Hi team,\n\nClicking Export on any report does nothing for me. I've tried Chrome and Safari.\n\nPriya", { startsFrt: true }),
      msg('p2', 'customer', 'Nov 11, 08:50 AM', "Following up on this, we have an audit tomorrow and need these exports. Can someone help?\n\nPriya"),
    ],
  },
  {
    id: 'david',
    customer: 'David Chen',
    initial: 'D',
    color: 'green',
    avatarColor: 'var(--pastelGreenBorderDefault)',
    email: 'david.chen@paypal.com',
    subject: 'Scheduled report emails are empty',
    frt: { status: 'due', time: '1:40 PM today' },
    oldAssignee: 'daniel',
    oldStatus: 'open',
    contactConversations: 4,
    messages: [
      msg('d1', 'customer', 'Nov 11, 09:40 AM', "Hi,\n\nOur scheduled weekly report arrived this morning with an empty CSV attached. Is this related to the export issue?\n\nDavid", { startsFrt: true }),
    ],
  },
];

// Most urgent first: past FRT, then due, then answered.
const URGENCY = { overdue: 0, due: 1, upcoming: 2, done: 3 };
export const BY_URGENCY = [...CONVERSATIONS].sort((a, b) => URGENCY[a.frt.status] - URGENCY[b.frt.status] || a.messages[0].at - b.messages[0].at);

export const MERGE_EVENT = {
  at: at('Nov 11, 10:02 AM'),
  time: 'Nov 11, 10:02 AM',
  text: `${CONVERSATIONS.length} conversations merged into ${TICKET.ticketId}`,
};

// The approaches compared on the page: what each is, where the idea comes from, how FRT shows and what it costs.
export const APPROACHES = [
  {
    id: 'panel-list',
    name: 'Conversations in the right panel',
    summary: 'One timeline in the middle. The right panel lists the ticket\'s conversations under the ticket, each with its FRT. Picking one opens its details in place and highlights its emails.',
    inspiredBy: 'Freshdesk parent–child tickets, Linear sub-issues, Zendesk side conversations',
    frt: 'Every conversation\'s FRT is visible at once in the panel list, most urgent first. Emails that started an FRT clock carry the ⚡FRT pill.',
    cost: 'No extra row in the middle pane.',
    tradeoffs: ['The panel gets long with 15–20 conversations (show the urgent ones and "Show all").', 'Ticket fields and conversation details compete for the same panel.'],
  },
  {
    id: 'focus',
    name: 'Panel follows the email you\'re on',
    summary: 'One timeline. Clicking any email makes its conversation the one in focus: its emails get a blue edge and the right panel shows its FRT and contact. Step through conversations with ‹ ›.',
    inspiredBy: 'Front, Gmail threads, Slack threads opening in the side pane',
    frt: 'A "⚡ 2 FRT overdue" control in the existing tab row jumps to each breached conversation. The ⚡FRT pill sits on the emails themselves.',
    cost: 'No extra row: the jump control uses the empty right side of the Conversation / Slack row.',
    tradeoffs: ['You only see one conversation\'s FRT in the panel at a time.', 'Focus changes on click, which needs to be learned.'],
  },
  {
    id: 'grouped',
    name: 'Grouped by conversation',
    summary: 'The middle pane groups emails under one header per conversation, most urgent first. All folded is the overview; open the ones you\'re working on. The header stays pinned while you read its emails.',
    inspiredBy: 'GitHub pull request files (pinned file headers), Gmail grouped threads, Help Scout',
    frt: 'Each conversation header carries its FRT pill, so breaches read as a list without opening anything.',
    cost: 'One 44px header per conversation, only while you scroll through it.',
    tradeoffs: ['Emails are no longer in one time order across conversations.', 'Many open groups make a long page.'],
  },
  {
    id: 'switcher',
    name: 'Switcher in the tab row',
    summary: 'The tabs fold into one menu at the right of the Conversation / Slack row: "All conversations" is the overview timeline; picking one shows only its emails and its details in the panel.',
    inspiredBy: 'Slack channel switcher, Notion and Linear view menus',
    frt: 'The menu button shows a red ⚡ count, and every row in the menu has its FRT pill. With "All", the panel lists the conversations with their FRT.',
    cost: 'No extra row: it lives in the existing tab row.',
    tradeoffs: ['Breaches are one click away instead of always on screen.', 'Closest to the old tabs, so the per-conversation view is familiar.'],
  },
  {
    id: 'rail',
    name: 'Conversation rail',
    summary: 'A narrow rail at the left of the thread: "All" on top, then one avatar per conversation. Picking one shows only its emails and its details in the panel.',
    inspiredBy: 'Slack and Discord workspace rails, Figma pages',
    frt: 'A ⚡ badge on the avatar of every conversation past or near its FRT; hover for the details.',
    cost: 'Uses 56px of width instead of any height.',
    tradeoffs: ['Avatars alone need a hover to tell conversations apart.', 'Takes width, which is also short on small screens.'],
  },
];
