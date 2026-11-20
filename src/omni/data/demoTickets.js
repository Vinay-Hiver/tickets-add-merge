import { recent } from './relativeTime';

// Demo only: two more Airbnb tickets in Email Support 01, so "Add to an existing ticket" from an Airbnb email has
// tickets below the AI recommendations. They're about other topics (billing, shipping), so the AI doesn't suggest them.
// They only appear in that sheet's ticket list, not in the inbox.
export const demoTickets = [
  {
    id: 9001,
    ticketId: 'TKT#36',
    inbox: 'Email Support 01',
    type: 'Mine',
    sender: 'Nina Patel',
    time: recent('Feb 3, 03:30 PM'),
    subject: 'Update billing contact for invoices',
    preview: 'Please send our invoices to finance@airbnb.com from next month.',
    messages: [{ id: 'm1', sender: 'Nina Patel', email: 'nina.patel@airbnb.com', time: recent('Feb 3, 03:30 PM'), body: 'Please send our invoices to finance@airbnb.com from next month.' }],
  },
  {
    id: 9002,
    ticketId: 'TKT#39',
    inbox: 'Email Support 01',
    type: 'Mine',
    sender: 'Omar Haddad',
    time: recent('Feb 2, 10:15 AM'),
    subject: 'Shipping address for hardware order',
    preview: 'Our office moved; the card readers should go to the new address.',
    messages: [{ id: 'm1', sender: 'Omar Haddad', email: 'omar.haddad@airbnb.com', time: recent('Feb 2, 10:15 AM'), body: 'Our office moved; the card readers should go to the new address.' }],
  },
];
