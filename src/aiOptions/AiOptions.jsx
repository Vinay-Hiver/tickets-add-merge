import React from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Tabs } from '../components/Tabs';
import { Icon } from '../icons/Icon';
import { FilterChip, PickCard } from '../omni/components/MergeConversationsSheet';
import { TicketCard } from '../omni/components/AddToTicketSheet';
import '../omni/components/MergeConversationsSheet.css';
import './aiOptions.css';

// Options for showing AI recommendations in the two add sheets, side by side for comparison. Each option is the real
// sheet body (search, filters, cards from the product) with a different treatment for the suggestions. The data is
// made up for the page; every option handles any number of suggestions (0, 2, 3 or 10).

const conv = (id, sender, email, subject, preview, time) => ({ id, subject, preview, time, messages: [{ sender, email }] });

// 1. Adding conversations to TKT#3 "Refund status"
const TICKET = { id: 'ai-t3', ticketId: 'TKT#3', subject: 'Refund status', time: 'Feb 4, 11:30 AM' };
const CONVO_SUGGESTED = [
  { item: conv('ai-c1', 'Emily Watson', 'emily@shopify.com', 'Refund still not received', 'It has been 10 days since you approved my refund.', 'Feb 5, 09:20 AM'), match: 'High match', reason: 'Same contact, same refund' },
  { item: conv('ai-c2', 'Emily Watson', 'emily@shopify.com', 'Order #4521 return label', 'Can you resend the return label for order #4521?', 'Feb 4, 04:10 PM'), match: 'High match', reason: 'Mentions order #4521, like the ticket' },
  { item: conv('ai-c3', 'Tom Reed', 'tom@shopify.com', 'Charged twice for one order', 'My card shows two charges for the same order.', 'Feb 4, 01:05 PM'), match: 'Possible match', reason: 'Also about billing and refunds' },
];
const CONVO_RECENT = [
  conv('ai-c4', "Liam O'Brien", 'liam@shopify.com', 'Add two seats to our plan', 'We have two designers joining next week.', 'Feb 3, 05:15 PM'),
  conv('ai-c5', 'Priya Nair', 'priya@shopify.com', 'SSO users missing from directory', 'New hires are not showing up after the sync.', 'Feb 3, 02:40 PM'),
  conv('ai-c6', 'Rachel Green', 'rachel@shopify.com', 'Copy of January invoice', 'Could you resend the January invoice?', 'Feb 2, 09:55 AM'),
];

// 2. Adding the conversation "Refund still not received" to a ticket
const SOURCE = CONVO_SUGGESTED[0].item;
const tkt = (id, ticketId, subject, time, emails = 1) => ({ id, ticketId, subject, time, emails: Array.from({ length: emails }, (_, i) => ({ id: `${id}-${i}` })) });
const TICKET_SUGGESTED = [
  { item: tkt('ai-t3', 'TKT#3', 'Refund status', 'Feb 4', 2), match: 'High match', reason: 'Same contact, same refund' },
  { item: tkt('ai-t12', 'TKT#12', 'Return shipping refund', 'Feb 3', 3), match: 'Possible match', reason: 'Also about refunds' },
  { item: tkt('ai-t15', 'TKT#15', 'Membership cancellation refund', 'Feb 1'), match: 'Possible match', reason: 'Also about refunds' },
];
const TICKET_RECENT = [
  tkt('ai-t21', 'TKT#21', 'Two-factor codes not arriving', 'Feb 3'),
  tkt('ai-t7', 'TKT#7', 'API documentation question', 'Feb 2', 2),
  tkt('ai-t18', 'TKT#18', 'Export to CSV fails', 'Jan 30'),
];

/* ---------- shared bits ---------- */

// Why it's suggested, inside the card at the bottom: the AI icon, then the reason, in the AI violet
const Why = ({ reason }) => (
  <p className="aio-why"><Icon name="ai" size={14} /><span className="aio-why__text">{reason}</span></p>
);

// The sheet as it looks in the product (header, body, footer), framed for the page
function Sheet({ title, footer, children }) {
  return (
    <div className="aio-sheet">
      <header className="mc-header"><div><h2 className="mc-header__title">{title}</h2></div><Icon name="close" size={16} /></header>
      <div className="mc-body mc-body--pick">{children}</div>
      {footer}
    </div>
  );
}

// Search: while there's a query, the suggestion treatment gives way to plain results from every conversation,
// suggestions included (flagged with their match). Selection is shared, so a ticked card stays ticked.
const convoText = (c) => `${c.messages[0].sender} ${c.messages[0].email} ${c.subject} ${c.preview}`.toLowerCase();
function ConvoResults({ q, picked, toggle }) {
  const found = [...CONVO_SUGGESTED, ...CONVO_RECENT.map((item) => ({ item }))].filter(({ item }) => convoText(item).includes(q));
  if (!found.length) return <p className="mc-pick__empty">No conversation from shopify.com matches “{q}”.</p>;
  return (
    <List caption="Results">
      {found.map((s) => (s.match ? (
        <div key={s.item.id} className="aio-flagged">
          <PickCard conversation={s.item} selected={picked.includes(s.item.id)} onToggle={() => toggle(s.item.id)} note={<Why reason={s.reason} />} />
        </div>
      ) : <PickCard key={s.item.id} conversation={s.item} selected={picked.includes(s.item.id)} onToggle={() => toggle(s.item.id)} />))}
    </List>
  );
}

function ConvoSheet({ label, children, picked, toggle }) {
  const [query, setQuery] = React.useState('');
  const q = query.trim().toLowerCase();
  return (
    <Sheet
      title={`Add conversation to Ticket - ${TICKET.ticketId}`}
      footer={(
        <footer className="mc-footer mc-footer--pick">
          <span className="mc-footer__count">{picked.length} {picked.length === 1 ? 'conversation' : 'conversations'} selected</span>
          <div className="mc-footer__actions"><Button variant="secondary" size="sm">Cancel</Button><Button variant="primary" size="sm" disabled={!picked.length}>Add to ticket</Button></div>
        </footer>
      )}
    >
      <section className="mc-pick-section mc-pick-section--into">
        <h3 className="mc-pick-label">{label ?? `Select one or more conversations to add to ${TICKET.ticketId}`}</h3>
        <div className="mc-card mc-pick">
          <Input search size="md" fullWidth placeholder="Search conversation" aria-label="Search conversation" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="mc-filters"><FilterChip icon="assigned">Assignee</FilterChip><FilterChip icon="flag">Status</FilterChip></div>
          {q ? <ConvoResults q={q} picked={picked} toggle={toggle} /> : children}
        </div>
      </section>
    </Sheet>
  );
}

const ticketText = (t) => `${t.ticketId} ${t.subject}`.toLowerCase();
function TicketResults({ q, ticketId, setTicketId }) {
  const found = [...TICKET_SUGGESTED, ...TICKET_RECENT.map((item) => ({ item }))].filter(({ item }) => ticketText(item).includes(q));
  if (!found.length) return <p className="mc-pick__empty">No ticket for shopify.com matches “{q}”.</p>;
  return (
    <List caption="Results">
      {found.map((s) => (s.match ? (
        <div key={s.item.id} className="aio-flagged">
          <TicketCard ticket={s.item} selected={ticketId === s.item.id} onSelect={() => setTicketId(s.item.id)} note={<Why reason={s.reason} />} />
        </div>
      ) : <TicketCard key={s.item.id} ticket={s.item} selected={ticketId === s.item.id} onSelect={() => setTicketId(s.item.id)} />))}
    </List>
  );
}

function TicketSheet({ children, ticketId, setTicketId }) {
  const [query, setQuery] = React.useState('');
  const q = query.trim().toLowerCase();
  return (
    <Sheet
      title="Add conversation to a ticket"
      footer={<footer className="mc-footer"><Button variant="secondary" size="sm">Cancel</Button><Button variant="primary" size="sm" disabled={ticketId == null}>Add to ticket</Button></footer>}
    >
      <section className="mc-pick-section">
        <h3 className="mc-pick-label">Adding 1 conversation</h3>
        <PickCard conversation={SOURCE} fixed />
      </section>
      <section className="mc-pick-section mc-pick-section--into">
        <h3 className="mc-pick-label">Choose a ticket</h3>
        <div className="mc-card mc-pick">
          <Input search size="md" fullWidth placeholder="Search by ticket ID or title" aria-label="Search by ticket ID or title" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="mc-filters"><FilterChip icon="flag">Status</FilterChip><FilterChip icon="tag">Tag</FilterChip></div>
          {q ? <TicketResults q={q} ticketId={ticketId} setTicketId={setTicketId} /> : children}
        </div>
      </section>
    </Sheet>
  );
}

const List = ({ caption, children }) => (
  <div className="mc-pick__results">
    {caption && <p className="mc-pick__caption">{caption}</p>}
    <div className="mc-pick__list">{children}</div>
  </div>
);

const usePicked = () => {
  const [picked, setPicked] = React.useState([]);
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return [picked, toggle, setPicked];
};

/* ---------- 1. conversations for a ticket ---------- */
// The suggestions, then the rest of the customer's conversations, with no heading over the rest.

// A: the suggestions in their own box, above the other conversations
function ConvoA() {
  const [picked, toggle] = usePicked();
  return (
    <ConvoSheet picked={picked} toggle={toggle}>
      <div className="mc-ai aio-section">
        <p className="mc-ai__title"><Icon name="ai" size={14} />Suggested by AI<span className="aio-count">{CONVO_SUGGESTED.length}</span></p>
        <div className="mc-pick__list">
          {CONVO_SUGGESTED.map((s) => (
            <div key={s.item.id} className="mc-ai__item">
              <PickCard conversation={s.item} selected={picked.includes(s.item.id)} onToggle={() => toggle(s.item.id)} note={<Why reason={s.reason} />} />
            </div>
          ))}
        </div>
      </div>
      <List>
        {CONVO_RECENT.map((c) => <PickCard key={c.id} conversation={c} selected={picked.includes(c.id)} onToggle={() => toggle(c.id)} />)}
      </List>
    </ConvoSheet>
  );
}

// B: one ranked list; suggestions lead it, each flagged with its match and reason
function ConvoB() {
  const [picked, toggle] = usePicked();
  return (
    <ConvoSheet picked={picked} toggle={toggle}>
      <List caption="Conversations, most related first">
        {CONVO_SUGGESTED.map((s) => (
          <div key={s.item.id} className="aio-flagged">
            <PickCard conversation={s.item} selected={picked.includes(s.item.id)} onToggle={() => toggle(s.item.id)} note={<Why reason={s.reason} />} />
          </div>
        ))}
        {CONVO_RECENT.map((c) => <PickCard key={c.id} conversation={c} selected={picked.includes(c.id)} onToggle={() => toggle(c.id)} />)}
      </List>
    </ConvoSheet>
  );
}

// C: a summary banner with "Select all"; the list of suggestions folds away
function ConvoC() {
  const [picked, toggle, setPicked] = usePicked();
  const [open, setOpen] = React.useState(true);
  const ids = CONVO_SUGGESTED.map((s) => s.item.id);
  const all = ids.every((id) => picked.includes(id));
  return (
    <ConvoSheet picked={picked} toggle={toggle}>
      <div className="aio-banner">
        <div className="aio-banner__head">
          <Icon name="ai" size={16} />
          {/* "AI recommendations" names the box; the line under it says what was found */}
          <div className="aio-banner__copy">
            <p className="aio-banner__label">AI recommendations</p>
            <p className="aio-banner__text"><strong>{CONVO_SUGGESTED.length} conversations</strong> look related to {TICKET.ticketId}</p>
          </div>
          <Button variant="secondary" size="xs" onClick={() => setPicked(all ? picked.filter((id) => !ids.includes(id)) : [...new Set([...picked, ...ids])])}>{all ? 'Clear' : 'Select all'}</Button>
          <button type="button" className="aio-banner__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'chevrontop' : 'chevrondown'} size={16} />
          </button>
        </div>
        {open && (
          <div className="aio-rows">
            {/* The product's own cards (status, assignee and all), each with why it's suggested */}
            {CONVO_SUGGESTED.map((s) => (
              <div key={s.item.id} className="mc-ai__item">
                <PickCard conversation={s.item} selected={picked.includes(s.item.id)} onToggle={() => toggle(s.item.id)} note={<Why reason={s.reason} />} />
              </div>
            ))}
          </div>
        )}
      </div>
      <List>
        {CONVO_RECENT.map((c) => <PickCard key={c.id} conversation={c} selected={picked.includes(c.id)} onToggle={() => toggle(c.id)} />)}
      </List>
    </ConvoSheet>
  );
}

// D: tabs, Suggested first
function ConvoD() {
  const [picked, toggle] = usePicked();
  const [tab, setTab] = React.useState('suggested');
  return (
    <ConvoSheet picked={picked} toggle={toggle}>
      <Tabs variant="filled" value={tab} onChange={setTab} tabs={[{ value: 'suggested', label: `Suggested (${CONVO_SUGGESTED.length})` }, { value: 'recent', label: 'Recent' }]} />
      {tab === 'suggested' ? (
        <List>
          {CONVO_SUGGESTED.map((s) => (
            <div key={s.item.id} className="aio-flagged">
              <PickCard conversation={s.item} selected={picked.includes(s.item.id)} onToggle={() => toggle(s.item.id)} note={<Why reason={s.reason} />} />
            </div>
          ))}
        </List>
      ) : (
        <List>{CONVO_RECENT.map((c) => <PickCard key={c.id} conversation={c} selected={picked.includes(c.id)} onToggle={() => toggle(c.id)} />)}</List>
      )}
    </ConvoSheet>
  );
}

/* ---------- 2. tickets for a conversation ---------- */

// A: the same box as 1C (named "AI recommendations", folds away, reasons inside the cards), without "Select all"
// since one ticket is picked
function TicketA() {
  const [ticketId, setTicketId] = React.useState(null);
  const [open, setOpen] = React.useState(true);
  return (
    <TicketSheet ticketId={ticketId} setTicketId={setTicketId}>
      <div className="aio-banner">
        <div className="aio-banner__head">
          <Icon name="ai" size={16} />
          <div className="aio-banner__copy">
            <p className="aio-banner__label">AI recommendations</p>
            <p className="aio-banner__text"><strong>{TICKET_SUGGESTED.length} tickets</strong> that match this conversation</p>
          </div>
          <button type="button" className="aio-banner__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'chevrontop' : 'chevrondown'} size={16} />
          </button>
        </div>
        {open && (
          <div className="aio-rows">
            {TICKET_SUGGESTED.map((s) => (
              <div key={s.item.id} className="mc-ai__item">
                <TicketCard ticket={s.item} selected={ticketId === s.item.id} onSelect={() => setTicketId(s.item.id)} note={<Why reason={s.reason} />} />
              </div>
            ))}
          </div>
        )}
      </div>
      <List>
        {TICKET_RECENT.map((t) => <TicketCard key={t.id} ticket={t} selected={ticketId === t.id} onSelect={() => setTicketId(t.id)} />)}
      </List>
    </TicketSheet>
  );
}

// B: one best match, called out, with the rest below
function TicketB() {
  const [ticketId, setTicketId] = React.useState(null);
  const [best, ...rest] = TICKET_SUGGESTED;
  return (
    <TicketSheet ticketId={ticketId} setTicketId={setTicketId}>
      <div className="aio-best">
        <p className="aio-best__label"><Icon name="ai" size={14} />Best match</p>
        <TicketCard ticket={best.item} selected={ticketId === best.item.id} onSelect={() => setTicketId(best.item.id)} note={<Why reason={best.reason} />} />
      </div>
      <List caption="Other suggestions">
        {rest.map((s) => (
          <div key={s.item.id} className="aio-flagged">
            <TicketCard ticket={s.item} selected={ticketId === s.item.id} onSelect={() => setTicketId(s.item.id)} note={<Why reason={s.reason} />} />
          </div>
        ))}
      </List>
      <List>
        {TICKET_RECENT.map((t) => <TicketCard key={t.id} ticket={t} selected={ticketId === t.id} onSelect={() => setTicketId(t.id)} />)}
      </List>
    </TicketSheet>
  );
}

// C: the summary banner, as in 1C: "AI recommendations", how many look related, and the suggested tickets (the
// product's cards, each with why) folding away; then the customer's other tickets. No "Select all": one ticket is picked.
function TicketC() {
  const [ticketId, setTicketId] = React.useState(null);
  const [open, setOpen] = React.useState(true);
  return (
    <TicketSheet ticketId={ticketId} setTicketId={setTicketId}>
      <div className="aio-banner">
        <div className="aio-banner__head">
          <Icon name="ai" size={16} />
          <div className="aio-banner__copy">
            <p className="aio-banner__label">AI recommendations</p>
            <p className="aio-banner__text"><strong>{TICKET_SUGGESTED.length} tickets</strong> that match this conversation</p>
          </div>
          <button type="button" className="aio-banner__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'chevrontop' : 'chevrondown'} size={16} />
          </button>
        </div>
        {open && (
          <div className="aio-rows">
            {TICKET_SUGGESTED.map((s) => (
              <div key={s.item.id} className="mc-ai__item">
                <TicketCard ticket={s.item} selected={ticketId === s.item.id} onSelect={() => setTicketId(s.item.id)} note={<Why reason={s.reason} />} />
              </div>
            ))}
          </div>
        )}
      </div>
      <List>
        {TICKET_RECENT.map((t) => <TicketCard key={t.id} ticket={t} selected={ticketId === t.id} onSelect={() => setTicketId(t.id)} />)}
      </List>
    </TicketSheet>
  );
}

function TicketD() {
  const [ticketId, setTicketId] = React.useState(null);
  const [tab, setTab] = React.useState('suggested');
  return (
    <TicketSheet ticketId={ticketId} setTicketId={setTicketId}>
      <Tabs variant="filled" value={tab} onChange={setTab} tabs={[{ value: 'suggested', label: `Suggested (${TICKET_SUGGESTED.length})` }, { value: 'recent', label: 'Recent' }]} />
      {tab === 'suggested' ? (
        <List>
          {TICKET_SUGGESTED.map((s) => (
            <div key={s.item.id} className="aio-flagged">
              <TicketCard ticket={s.item} selected={ticketId === s.item.id} onSelect={() => setTicketId(s.item.id)} note={<Why reason={s.reason} />} />
            </div>
          ))}
        </List>
      ) : (
        <List>{TICKET_RECENT.map((t) => <TicketCard key={t.id} ticket={t} selected={ticketId === t.id} onSelect={() => setTicketId(t.id)} />)}</List>
      )}
    </TicketSheet>
  );
}

/* ---------- page ---------- */

const FLOWS = [
  {
    title: '1. Ticket → Add conversation',
    sub: 'AI suggests conversations to add to the ticket. Several can be picked.',
    options: [
      { key: 'A', name: 'Suggested section', note: 'A separate box above the other conversations. Clear and familiar; the box grows with more suggestions, so cap it (e.g. 3 + "Show more").', el: <ConvoA /> },
      { key: 'B', name: 'Ranked list, flagged', note: 'One list, most related first; suggestions carry a match level and reason. Scales to any number: the ranking does the work, no extra box.', el: <ConvoB /> },
      { key: 'C', name: 'Summary banner', note: 'One line says how many look related, with "Select all" and a compact list that folds away. Best when there are many, or to add them in one go.', el: <ConvoC /> },
      { key: 'D', name: 'Tabs', note: 'Suggested and Recent on separate tabs, Suggested first. Keeps each list short; the count on the tab scales; hides the rest behind a click.', el: <ConvoD /> },
    ],
  },
  {
    title: '2. Conversation → Add to an existing ticket',
    sub: 'AI suggests tickets to add the conversation to. One is picked.',
    options: [
      { key: 'A', name: 'Suggested section', note: 'The same box as 1C: "AI recommendations", folds away, reasons inside the cards. No "Select all", as one ticket is picked.', el: <TicketA /> },
      { key: 'B', name: 'Best match', note: 'Since only one ticket is picked, the top suggestion is called out on its own, with the others below. Strong when the AI is confident.', el: <TicketB /> },
      { key: 'C', name: 'Summary banner', note: 'Same as 1C: "AI recommendations", how many look related, and the suggested tickets folding away. No "Select all", since one ticket is picked.', el: <TicketC /> },
      { key: 'D', name: 'Tabs', note: 'Suggested and Recent on separate tabs, Suggested first.', el: <TicketD /> },
    ],
  },
];

export default function AiOptions() {
  return (
    <main className="aio">
      <header className="aio__head">
        <h1 className="aio__title">AI recommendations in the add sheets</h1>
        <p className="aio__sub">Four ways to show them in each sheet. Search and filters stay as they are; every option is clickable.</p>
      </header>
      {FLOWS.map((f) => (
        <section key={f.title} className="aio__flow">
          <h2 className="aio__flow-title">{f.title}</h2>
          <p className="aio__flow-sub">{f.sub}</p>
          <div className="aio__grid">
            {f.options.map((o) => (
              <article key={o.key} className="aio__option">
                <h3 className="aio__option-title"><span className="aio__key">{o.key}</span>{o.name}</h3>
                <p className="aio__note">{o.note}</p>
                {o.el}
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
