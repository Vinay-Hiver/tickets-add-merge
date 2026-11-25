import React from 'react';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Tabs } from '../components/Tabs';
import { Icon } from '../icons/Icon';
import '../omni/components/MergeConversationsSheet.css';
import './description.css';

// /description.html: where a ticket's description goes once a ticket holds several conversations. Today the
// description shows as an email card at the top of the ticket's only thread; with many threads that has no home.
// Each option shows the merge side sheet (where the description is written) and the ticket view (where it's read).
// Typing in the sheet updates the ticket view next to it. Made-up data; nothing here touches the prototype.

const TICKET = { id: 'TKT#437', title: "Can't log in after SSO update" };
const DEFAULT_DESCRIPTION = 'Several Acme users can’t sign in since the SSO change on Feb 3. Tracking every report here until the IdP fix ships, then reply to all of them together.';

const CONVERSATIONS = [
  {
    id: 'c1', name: 'John Smith', email: 'john@acme.com', subject: 'SSO login fails', color: 'lightBlue', time: 'Feb 4',
    messages: [
      { from: 'John Smith', initial: 'J', color: 'lightBlue', time: 'Feb 4, 09:12 AM', body: 'Since this morning I get “Invalid SAML response” every time I try to sign in.' },
      { from: 'Michael Scott', initial: 'M', color: 'red', time: 'Feb 4, 10:03 AM', body: 'Thanks John, we’re looking into it. Does it happen in a private window too?' },
    ],
  },
  {
    id: 'c2', name: 'Amy Lee', email: 'amy@acme.com', subject: 'Locked out of dashboard', color: 'green', time: 'Feb 4',
    messages: [
      { from: 'Amy Lee', initial: 'A', color: 'green', time: 'Feb 4, 11:40 AM', body: 'The login page keeps sending me back to itself. I can’t reach the dashboard at all.' },
    ],
  },
  {
    id: 'c3', name: 'Raj Patel', email: 'raj@acme.com', subject: 'Login loop on mobile', color: 'orange', time: 'Feb 5',
    messages: [
      { from: 'Raj Patel', initial: 'R', color: 'orange', time: 'Feb 5, 08:25 AM', body: 'On the iOS app the sign-in spins forever after I pick our company SSO.' },
      { from: 'Michael Scott', initial: 'M', color: 'red', time: 'Feb 5, 09:10 AM', body: 'Got it Raj, this looks related to a wider SSO issue. I’ll keep you posted here.' },
    ],
  },
];

const OPTIONS = [
  {
    value: 'a', label: 'A · Under the title',
    summary: 'The description sits under the ticket title, above the tabs, so it reads the same whichever conversation is open. Folded to two lines; Show more opens it.',
    sheet: 'field', sheetHint: null,
  },
  {
    value: 'b', label: 'B · In the right panel',
    summary: 'The description is a ticket field in the right panel’s Ticket details, with the assignee and status. The threads stay as they are.',
    sheet: 'row', sheetHint: null,
  },
  {
    value: 'c', label: 'C · Pinned in every conversation',
    summary: 'The description is the ticket’s pinned card at the top of every conversation’s thread, like a pinned ticket note. It can be folded.',
    sheet: 'field', sheetHint: 'Pinned at the top of every conversation in the ticket',
  },
  {
    value: 'd', label: 'D · In the timeline, at the merge',
    summary: 'The description shows once in each thread, where the conversation joined the ticket: “Merged into TKT#437” with the description under it.',
    sheet: 'field', sheetHint: 'Shows in each conversation where it joined the ticket',
  },
];

/* ---------- Side sheet ---------- */

function DescriptionInput({ value, onChange, rows = 3 }) {
  return (
    <textarea
      className="dsc-input"
      placeholder="Add a description"
      aria-label="Description"
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function SheetRow({ icon, label, top, children }) {
  return (
    <div className={`mc-ticket-row${top ? ' mc-ticket-row--top' : ''}`}>
      <span className="mc-ticket-row__label"><Icon name={icon} size={14} />{label}</span>
      <div className="mc-ticket-row__value">{children}</div>
    </div>
  );
}

function Sheet({ option, description, setDescription }) {
  return (
    <div className="dsc-sheet">
      <header className="mc-header">
        <div><h2 className="mc-header__title">Merge conversations into a ticket</h2></div>
        <Icon name="close" size={16} />
      </header>
      <div className="mc-body">
        <section>
          <h3 className="mc-section-title">Ticket preview</h3>
          <div className="mc-card mc-ticket">
            <div className="dsc-title-select">
              <span className="dsc-title-select__text">{TICKET.title}</span>
              <Icon name="chevrondown" size={16} />
            </div>
            {/* A, C, D: a free-text area right under the title */}
            {option.sheet === 'field' && (
              <div className="dsc-field">
                <DescriptionInput value={description} onChange={setDescription} />
                {option.sheetHint && <p className="dsc-field__hint"><Icon name="info" size={12} />{option.sheetHint}</p>}
              </div>
            )}
            <div className="mc-ticket__fields">
              {/* B: one more ticket field, like Assignee and Status */}
              {option.sheet === 'row' && (
                <SheetRow icon="text" label="Description" top>
                  <DescriptionInput value={description} onChange={setDescription} rows={2} />
                </SheetRow>
              )}
              <SheetRow icon="assigned" label="Assignee"><Avatar initial="M" size="small" color="red" />Michael Scott</SheetRow>
              <SheetRow icon="flag" label="Status"><Icon name="openstatus" size={16} />Open</SheetRow>
            </div>
          </div>
        </section>
        <section>
          <h3 className="mc-section-title">Conversations in this ticket</h3>
          <div className="mc-emails">
            {CONVERSATIONS.map((c) => (
              <div key={c.id} className="mc-email">
                <div className="mc-email__top">
                  <span className="mc-email__name"><Icon name="mailbox" size={14} />{c.name}</span>
                  <span className="mc-email__time">{c.time}</span>
                </div>
                <div className="mc-email__bottom">
                  <span className="mc-email__subject">{c.subject}</span>
                  <span className="mc-email__preview">{c.messages[0].body}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <footer className="mc-footer">
        <Button variant="secondary" size="sm">Cancel</Button>
        <Button variant="primary" size="sm">Merge and create ticket</Button>
      </footer>
    </div>
  );
}

/* ---------- Ticket view ---------- */

// Folds long text to two lines with Show more / Show less
function Folded({ text, lines = 2 }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="dsc-folded">
      <p className={`dsc-folded__text${open ? '' : ' is-clamped'}`} style={{ WebkitLineClamp: open ? 'unset' : lines }}>{text}</p>
      <button type="button" className="dsc-link" onClick={() => setOpen((o) => !o)}>{open ? 'Show less' : 'Show more'}</button>
    </div>
  );
}

function EmailCard({ m }) {
  return (
    <div className="dsc-email">
      <div className="dsc-email__top">
        <Avatar initial={m.initial} color={m.color} />
        <span className="dsc-email__from">{m.from}</span>
        <span className="dsc-email__time">{m.time}</span>
      </div>
      <p className="dsc-email__body">{m.body}</p>
    </div>
  );
}

function TicketView({ option, description }) {
  const [open, setOpen] = React.useState('c1');
  const [pinOpen, setPinOpen] = React.useState(true);
  const convo = CONVERSATIONS.find((c) => c.id === open);
  const text = description.trim();
  const empty = <span className="dsc-empty">No description</span>;

  return (
    <div className="dsc-view">
      <div className="dsc-view__main">
        <div className="dsc-view__subject">
          <h2 className="dsc-view__title">{TICKET.title}</h2>
          <Icon name="vmore" size={16} />
        </div>
        {/* A: under the title, the same for every conversation */}
        {option.value === 'a' && text && (
          <div className="dsc-under-title">
            <Folded text={text} />
          </div>
        )}
        <div className="dsc-view__tabs">
          <Tabs value="conversation" onChange={() => {}} tabs={[{ value: 'conversation', label: 'Conversation' }, { value: 'slack', label: 'vip-support', icon: <Icon name="slack" size={14} /> }]} />
        </div>
        <div className="dsc-chips" role="tablist" aria-label="Conversations in this ticket">
          {CONVERSATIONS.map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={open === c.id} className="dsc-chip" onClick={() => setOpen(c.id)}>
              <Icon name="mailbox" size={14} />
              <span className="dsc-chip__label">{c.name} • {c.subject}</span>
            </button>
          ))}
        </div>
        <div className="dsc-thread">
          {/* C: the ticket's pinned card on top of every conversation */}
          {option.value === 'c' && text && (
            <div className="dsc-pinned">
              <button type="button" className="dsc-pinned__head" onClick={() => setPinOpen((o) => !o)} aria-expanded={pinOpen}>
                <Icon name="pin" size={14} />
                <span className="dsc-pinned__title">Ticket description</span>
                <span className="dsc-pinned__meta">Michael Scott · Feb 5</span>
                <Icon name={pinOpen ? 'chevrontop' : 'chevrondown'} size={14} />
              </button>
              {pinOpen && <p className="dsc-pinned__body">{text}</p>}
            </div>
          )}
          {convo.messages.map((m, i) => <EmailCard key={i} m={m} />)}
          {/* D: where this conversation joined the ticket */}
          {option.value === 'd' && (
            <div className="dsc-merge">
              <div className="dsc-merge__row">
                <span className="dsc-merge__line" />
                <span className="dsc-merge__label"><Icon name="ticket" size={14} />Michael Scott merged this conversation into {TICKET.id} · Feb 5, 09:30 AM</span>
                <span className="dsc-merge__line" />
              </div>
              {text && (
                <div className="dsc-merge__card">
                  <p className="dsc-merge__card-title">Ticket description</p>
                  <Folded text={text} lines={3} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <aside className="dsc-panel">
        <p className="dsc-panel__section">Ticket details</p>
        <div className="dsc-panel__rows">
          <div className="dsc-panel__row"><span className="dsc-panel__label"><Icon name="ticket" size={14} />Ticket ID</span><span className="dsc-panel__id">{TICKET.id}</span></div>
          <div className="dsc-panel__row"><span className="dsc-panel__label"><Icon name="assigned" size={14} />Assignee</span><span className="dsc-panel__value"><Avatar initial="M" size="small" color="red" />Michael Scott</span></div>
          <div className="dsc-panel__row"><span className="dsc-panel__label"><Icon name="flag" size={14} />Status</span><span className="dsc-panel__value"><Icon name="openstatus" size={16} />Open</span></div>
          {/* B: a ticket field */}
          {option.value === 'b' && (
            <div className="dsc-panel__row dsc-panel__row--top">
              <span className="dsc-panel__label"><Icon name="text" size={14} />Description</span>
              <span className="dsc-panel__value dsc-panel__value--text">{text ? <Folded text={text} lines={3} /> : empty}</span>
            </div>
          )}
          <div className="dsc-panel__row"><span className="dsc-panel__label"><Icon name="tag" size={14} />Tags</span><span className="dsc-panel__value dsc-empty">Empty</span></div>
        </div>
        <p className="dsc-panel__section dsc-panel__section--next">Conversation details</p>
        <div className="dsc-panel__rows">
          <div className="dsc-panel__row"><span className="dsc-panel__label"><Icon name="mailbox" size={14} />Contact</span><span className="dsc-panel__value">{convo.name}</span></div>
          <div className="dsc-panel__row"><span className="dsc-panel__label"><Icon name="clock" size={14} />Created</span><span className="dsc-panel__value">{convo.time}</span></div>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Page ---------- */

export default function Description() {
  const [value, setValue] = React.useState('a');
  const [description, setDescription] = React.useState(DEFAULT_DESCRIPTION);
  const option = OPTIONS.find((o) => o.value === value);
  return (
    <div className="dsc">
      <div className="dsc__top">
        <Tabs value={value} onChange={setValue} tabs={OPTIONS.map(({ value: v, label }) => ({ value: v, label }))} />
      </div>
      <p className="dsc__summary">{option.summary}</p>
      <div className="dsc__stage">
        <div className="dsc__col dsc__col--sheet">
          <p className="dsc__caption">Merge side sheet</p>
          <Sheet option={option} description={description} setDescription={setDescription} />
        </div>
        <div className="dsc__col dsc__col--view">
          <p className="dsc__caption">Merged ticket</p>
          <TicketView key={value} option={option} description={description} />
        </div>
      </div>
    </div>
  );
}
