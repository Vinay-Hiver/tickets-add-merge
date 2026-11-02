import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Radio } from '../../components/Radio';
import { Icon } from '../../icons/Icon';
import { statusOptions } from '../../patterns/RightPanel/data/options';
import { useConversationFields } from '../ConversationFields';
import { companyOf, domainOf } from '../data/companies';
import { FilterChip, PickCard } from './MergeConversationsSheet';
import './MergeConversationsSheet.css';

// Adding conversations to tickets, in the merge sheet's look. From a conversation (Figma: Tickets Add/Merge › 4030:19966):
// pick one ticket. From a ticket (4030:20282): pick one or more conversations. Both add in one step.

const dateOf = (time) => time.split(',')[0]; // 'Feb 4, 02:45 PM' -> 'Feb 4'

// A ticket to add to. Hovering turns its ticket icon into a radio button; pressing anywhere on the card picks it.
function TicketCard({ ticket, selected, onSelect }) {
  const { statusOf, assigneeNameOf } = useConversationFields();
  const status = statusOptions.find((o) => o.value === statusOf(ticket.id)) ?? statusOptions[0];
  const count = ticket.emails?.length ?? 1;
  return (
    <div
      className={`mc-pick-card mc-ticket-card${selected ? ' is-selected' : ''}`}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onSelect(); } }}
    >
      <div className="mc-pick-card__top">
        <span className="mc-pick-card__name">
          <span className="mc-pick-card__lead">
            <span className="mc-pick-card__icon"><Icon name="ticket" size={14} /></span>
            <span className="mc-pick-card__check" onClick={(e) => e.stopPropagation()}>
              <Radio checked={selected} onChange={onSelect} aria-label={`Add to ${ticket.ticketId}`} />
            </span>
          </span>
          <span className="mc-ticket-card__title">{ticket.ticketId} {ticket.subject}</span>
        </span>
        <span className="mc-ticket-card__date">{dateOf(ticket.time)}</span>
      </div>
      <div className="mc-pick-card__chips">
        <span className="mc-chip"><Icon name={status.icon} size={12} />{status.label}</span>
        <span className="mc-chip"><Icon name="user" size={12} />{assigneeNameOf(ticket.id) ?? 'Unassigned'}</span>
        <span className="mc-ticket-card__count">{count} {count === 1 ? 'conversation' : 'conversations'}</span>
      </div>
    </div>
  );
}

// The side sheet both add flows use: header, a scrolling body and a footer. `footer` gets `exit`, which plays the
// closing animation and then runs what it is given.
function Sheet({ title, onClose, children, footer }) {
  const [closing, setClosing] = React.useState(false);
  const exit = (fn) => { setClosing(true); setTimeout(fn, 320); }; // matches the exit animation in the CSS
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') exit(onClose); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div className={`mc-backdrop${closing ? ' is-closing' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) exit(onClose); }}>
      <aside className="mc-sheet" role="dialog" aria-modal="true" aria-labelledby="att-title">
        <header className="mc-header">
          <div>
            <h2 id="att-title" className="mc-header__title">{title}</h2>
            <p className="mc-header__subtitle">Bring related conversations together in one place.</p>
          </div>
          <Button variant="ghost" size="sm" iconOnly aria-label="Close" onClick={() => exit(onClose)}>
            <Icon name="close" size={16} />
          </Button>
        </header>
        <div className="mc-body mc-body--pick">{children}</div>
        {footer(exit)}
      </aside>
    </div>,
    document.body,
  );
}

/**
 * From a ticket's header (Figma 4030:20282): pick one or more conversations (same inbox, same domain) and add them all
 * to the ticket.
 */
export function AddConversationsSheet({ ticket, candidates, others = [], onClose, onAdd }) {
  const [query, setQuery] = React.useState('');
  const [picked, setPicked] = React.useState([]);
  const toggle = (id) => setPicked((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const q = query.trim().toLowerCase();
  const matches = (c) => !q || `${c.messages?.[0]?.sender ?? c.sender} ${c.messages?.[0]?.email ?? ''} ${c.subject} ${c.preview}`.toLowerCase().includes(q);
  const shown = candidates.filter(matches);
  const domain = domainOf(ticket);
  const elsewhere = q && shown.length === 0 && others.some(matches);
  const empty = elsewhere
    ? `That conversation isn't from ${companyOf(ticket)} (${domain}). Only conversations from the same domain can be added to this ticket.`
    : q ? `No conversation from ${domain} matches "${query.trim()}".`
    : `There are no other conversations from ${domain} in this inbox.`;

  return (
    <Sheet
      title={`Add conversation to Ticket - ${ticket.ticketId}`}
      onClose={onClose}
      footer={(exit) => (
        <footer className="mc-footer mc-footer--pick">
          <span className="mc-footer__count">{picked.length} {picked.length === 1 ? 'conversation' : 'conversations'} selected</span>
          <div className="mc-footer__actions">
            <Button variant="secondary" size="md" onClick={() => exit(onClose)}>Cancel</Button>
            <Button variant="primary" size="md" disabled={picked.length === 0} onClick={() => exit(() => onAdd(candidates.filter((c) => picked.includes(c.id))))}>Add to ticket</Button>
          </div>
        </footer>
      )}
    >
      <section className="mc-pick-section mc-pick-section--into">
        <h3 className="mc-pick-label">Search for a conversation to add it to {ticket.ticketId}</h3>
        <div className="mc-card mc-pick">
          <Input search size="md" fullWidth placeholder="Search conversation" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search conversation" />
          <div className="mc-filters">
            <FilterChip>From</FilterChip>
            <FilterChip>To</FilterChip>
            <FilterChip icon="flag">Status</FilterChip>
            <FilterChip icon="tag">Tag</FilterChip>
          </div>
          <div className="mc-pick__results">
            <p className="mc-pick__caption">{q ? 'Results' : 'Recent conversations'}</p>
            {shown.length > 0 ? (
              <div className="mc-pick__list">
                {shown.map((c) => <PickCard key={c.id} conversation={c} selected={picked.includes(c.id)} onToggle={() => toggle(c.id)} />)}
              </div>
            ) : (
              <p className={`mc-pick__empty${elsewhere ? ' mc-pick__empty--error' : ''}`}>
                {elsewhere && <Icon name="alerttriangle" size={14} />}{empty}
              </p>
            )}
          </div>
        </div>
      </section>
    </Sheet>
  );
}

export default function AddToTicketSheet({ conversation, tickets, others = [], onClose, onAdd }) {
  const [query, setQuery] = React.useState('');
  const [ticketId, setTicketId] = React.useState(null);

  const q = query.trim().toLowerCase();
  const matches = (t) => !q || `${t.ticketId} ${t.subject}`.toLowerCase().includes(q);
  const shown = tickets.filter(matches);
  const domain = domainOf(conversation);
  // Searching for a ticket of another customer explains why it can't be used.
  const elsewhere = q && shown.length === 0 && others.some(matches);
  const empty = elsewhere
    ? `That ticket isn't for ${companyOf(conversation)} (${domain}). A conversation can only be added to a ticket from the same domain.`
    : q ? `No ticket for ${domain} matches "${query.trim()}".`
    : `There are no tickets for ${domain} in this inbox yet.`;

  return (
    <Sheet
      title="Add conversation to a ticket"
      onClose={onClose}
      footer={(exit) => (
        <footer className="mc-footer">
          <Button variant="secondary" size="md" onClick={() => exit(onClose)}>Cancel</Button>
          <Button variant="primary" size="md" disabled={ticketId == null} onClick={() => exit(() => onAdd(ticketId))}>Add to ticket</Button>
        </footer>
      )}
    >
      <section className="mc-pick-section">
        <h3 className="mc-pick-label">Add conversation</h3>
        <PickCard conversation={conversation} fixed />
      </section>
      <section className="mc-pick-section mc-pick-section--into">
        <h3 className="mc-pick-label">Add it to this ticket</h3>
        <div className="mc-card mc-pick">
          <Input search size="md" fullWidth placeholder="Search tickets" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search tickets" />
          <div className="mc-filters">
            <FilterChip>From</FilterChip>
            <FilterChip>To</FilterChip>
            <FilterChip icon="flag">Status</FilterChip>
            <FilterChip icon="tag">Tag</FilterChip>
          </div>
          <div className="mc-pick__results">
            <p className="mc-pick__caption">{q ? 'Results' : 'Recent tickets'}</p>
            {shown.length > 0 ? (
              <div className="mc-pick__list" role="radiogroup" aria-label="Tickets">
                {shown.map((t) => <TicketCard key={t.id} ticket={t} selected={ticketId === t.id} onSelect={() => setTicketId(t.id)} />)}
              </div>
            ) : (
              <p className={`mc-pick__empty${elsewhere ? ' mc-pick__empty--error' : ''}`}>
                {elsewhere && <Icon name="alerttriangle" size={14} />}{empty}
              </p>
            )}
          </div>
        </div>
      </section>
    </Sheet>
  );
}
