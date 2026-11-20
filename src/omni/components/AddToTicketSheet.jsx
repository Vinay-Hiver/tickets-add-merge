import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal, ModalNote, ModalText } from '../../components/Modal';
import { Radio } from '../../components/Radio';
import { Tooltip } from '../../components/Tooltip';
import { Icon } from '../../icons/Icon';
import { statusOptions } from '../../patterns/RightPanel/data/options';
import { useConversationFields } from '../ConversationFields';
import { companyOf, domainOf } from '../data/companies';
import { FilterChip, PickCard } from './MergeConversationsSheet';
import { aiSuggest } from '../data/aiSuggest';
import './MergeConversationsSheet.css';

// Adding conversations to tickets, in the merge sheet's look. From a conversation (Figma: Tickets Add/Merge › 4030:19966):
// pick one ticket. From a ticket (4030:20282): pick one or more conversations. Both add in one step.

const dateOf = (time) => time.split(',')[0]; // 'Feb 4, 02:45 PM' -> 'Feb 4'

// A ticket to add to. Hovering turns its ticket icon into a radio button; pressing anywhere on the card picks it.
// `note`: an extra line at the bottom of the card (e.g. why the AI suggests it)
export function TicketCard({ ticket, selected, onSelect, note }) {
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
        <span className="mc-chip"><Icon name="assigned" size={12} />{assigneeNameOf(ticket.id) ?? 'Unassigned'}</span>
        <span className="mc-ticket-card__count">{count} {count === 1 ? 'conversation' : 'conversations'}</span>
      </div>
      {note}
    </div>
  );
}

// AI recommendations, above the rest of the list (hidden while searching): a violet box named "AI recommendations"
// with a line saying how many were found, an optional action (Select all) and a fold toggle; inside, the usual cards,
// each with why it's suggested at its bottom (AI icon + reason, in violet). Ticket → Add conversation (option C) and
// Add to an existing ticket (option A) on /ai-options.
// Why the AI suggests a card: the AI icon and the reason, in violet, at the card's bottom
const AiWhy = ({ reason }) => <p className="mc-ai__why"><Icon name="ai" size={14} /><span>{reason}</span></p>;
// The reason line for an item if the AI suggested it (so it stays on the card in search results too)
const whyFor = (suggested, item) => {
  const s = suggested.find((x) => x.item === item);
  return s ? <AiWhy reason={s.reason} /> : undefined;
};

function AiSuggestions({ suggestions, summary, action, children }) {
  const [open, setOpen] = React.useState(true);
  if (suggestions.length === 0) return null;
  return (
    <div className="mc-ai">
      <div className="mc-ai__head">
        <Icon name="ai" size={16} />
        <div className="mc-ai__copy">
          <p className="mc-ai__label">AI recommendations</p>
          <p className="mc-ai__summary">{summary}</p>
        </div>
        {action}
        <button type="button" className="mc-ai__toggle" aria-expanded={open} aria-label={open ? 'Hide recommendations' : 'Show recommendations'} onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? 'chevrontop' : 'chevrondown'} size={16} />
        </button>
      </div>
      {open && (
        <div className="mc-ai__list">
          {suggestions.map(({ item, reason }) => (
            <React.Fragment key={item.id}>
              {children(item, <AiWhy reason={reason} />)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// The side sheet both add flows use: header, a scrolling body and a footer. `footer` gets `exit` (plays the closing
// animation, then runs what it is given) and `ask` (shows the confirm modal described by `confirm`). As with merge, the
// sheet fades out before the modal fades in, and back again on Cancel (timings in MergeConversationsSheet.css).
function Sheet({ title, onClose, children, footer, confirm }) {
  const [closing, setClosing] = React.useState(false);
  const [phase, setPhase] = React.useState('hidden'); // the confirm modal: 'hidden', 'in' or 'out'
  const exit = (fn) => { setClosing(true); setTimeout(fn, 320); }; // matches the exit animation in the CSS
  const ask = () => setPhase('in');
  const cancel = () => { setPhase('out'); setTimeout(() => setPhase('hidden'), 101); };
  const dismiss = () => (phase === 'in' ? cancel() : exit(onClose));
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return createPortal(
    <div className={`mc-backdrop${closing ? ' is-closing' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <aside className={`mc-sheet${phase !== 'hidden' ? ' is-faded' : ''}`} aria-hidden={phase !== 'hidden'} role="dialog" aria-modal="true" aria-labelledby="att-title">
        <header className="mc-header">
          <div>
            <h2 id="att-title" className="mc-header__title">{title}</h2>
          </div>
          <Button variant="ghost" size="sm" iconOnly aria-label="Close" onClick={() => exit(onClose)}>
            <Icon name="close" size={16} />
          </Button>
        </header>
        <div className="mc-body mc-body--pick">{children}</div>
        {footer(exit, ask)}
      </aside>
      {/* Storybook › Modal › With note, on the same backdrop as the sheet */}
      {phase !== 'hidden' && confirm && (
        <div className={`mc-confirm${phase === 'out' ? ' is-leaving' : ''}`}>
          <Modal
            width={500}
            title={confirm.title}
            onClose={cancel}
            actions={<>
              <Button variant="secondary" size="sm" onClick={cancel}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => exit(confirm.onConfirm)}>{confirm.action}</Button>
            </>}
          >
            <ModalText>{confirm.body}</ModalText>
            <ModalNote>{confirm.note}</ModalNote>
          </Modal>
        </div>
      )}
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
  // AI suggestions show until a search starts; the recent list leaves them out
  const suggested = React.useMemo(() => aiSuggest([ticket], candidates), [ticket, candidates]);
  const shown = candidates.filter(matches).filter((c) => q || !suggested.some((s) => s.item === c));
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
      confirm={{
        title: 'Add to ticket',
        body: `You’re about to add ${picked.length} ${picked.length === 1 ? 'conversation' : 'conversations'} to ${ticket.ticketId}.`,
        note: `Note: Once merged, ${picked.length === 1 ? 'it' : 'they'} can’t be removed or split back out.`,
        action: 'Add to ticket',
        onConfirm: () => onAdd(candidates.filter((c) => picked.includes(c.id))),
      }}
      footer={(exit, ask) => (
        <footer className="mc-footer mc-footer--pick">
          <span className="mc-footer__count">{picked.length} {picked.length === 1 ? 'conversation' : 'conversations'} selected</span>
          <div className="mc-footer__actions">
            <Button variant="secondary" size="md" onClick={() => exit(onClose)}>Cancel</Button>
            <Button variant="primary" size="md" disabled={picked.length === 0} onClick={ask}>Add to ticket</Button>
          </div>
        </footer>
      )}
    >
      <section className="mc-pick-section mc-pick-section--into">
        <h3 className="mc-pick-label">Select one or more conversations to add to {ticket.ticketId}</h3>
        <div className="mc-card mc-pick">
          <Input search size="md" fullWidth placeholder="Search conversation" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search conversation" />
          {/* Finding a conversation to add: by who has it and where it stands (each card shows both) */}
          <div className="mc-filters">
            <FilterChip icon="assigned">Assignee</FilterChip>
            <FilterChip icon="flag">Status</FilterChip>
          </div>
          {!q && (
            <AiSuggestions
              suggestions={suggested}
              summary={<><strong>{suggested.length} {suggested.length === 1 ? 'conversation' : 'conversations'}</strong> {suggested.length === 1 ? 'looks' : 'look'} related to {ticket.ticketId}</>}
              action={(() => {
                const ids = suggested.map((x) => x.item.id);
                const all = ids.every((id) => picked.includes(id));
                return <Button variant="secondary" size="xs" onClick={() => setPicked((p) => (all ? p.filter((id) => !ids.includes(id)) : [...new Set([...p, ...ids])]))}>{all ? 'Clear' : 'Select all'}</Button>;
              })()}
            >
              {(c, note) => <PickCard conversation={c} selected={picked.includes(c.id)} onToggle={() => toggle(c.id)} note={note} />}
            </AiSuggestions>
          )}
          <div className="mc-pick__results">
            {/* The rest follow without a heading; a search gets "Results" */}
            {q && <p className="mc-pick__caption">Results</p>}
            {shown.length > 0 ? (
              <div className="mc-pick__list">
                {shown.map((c) => <PickCard key={c.id} conversation={c} selected={picked.includes(c.id)} onToggle={() => toggle(c.id)} note={whyFor(suggested, c)} />)}
              </div>
            ) : (q || suggested.length === 0) && (
              // Only when searching, or when there's nothing at all; not when the AI box holds them all
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

// `conversations`: one from a conversation's header, or several ticked in the list (all from one domain).
export default function AddToTicketSheet({ conversations, tickets, others = [], onClose, onAdd }) {
  const [conversation] = conversations;
  const many = conversations.length > 1;
  const [query, setQuery] = React.useState('');
  const [ticketId, setTicketId] = React.useState(null);

  const q = query.trim().toLowerCase();
  const matches = (t) => !q || `${t.ticketId} ${t.subject}`.toLowerCase().includes(q);
  const suggested = React.useMemo(() => aiSuggest(conversations, tickets), [conversations, tickets]);
  const shown = tickets.filter(matches).filter((t) => q || !suggested.some((s) => s.item === t));
  const domain = domainOf(conversation);
  // Searching for a ticket of another customer explains why it can't be used.
  const elsewhere = q && shown.length === 0 && others.some(matches);
  const empty = elsewhere
    ? `That ticket isn't for ${companyOf(conversation)} (${domain}). A conversation can only be added to a ticket from the same domain.`
    : q ? `No ticket for ${domain} matches "${query.trim()}".`
    : `There are no tickets for ${domain} in this inbox yet.`;

  return (
    <Sheet
      title={many ? 'Add conversations to a ticket' : 'Add conversation to a ticket'}
      onClose={onClose}
      confirm={{
        title: 'Add to ticket',
        body: `You’re about to add ${conversations.length} ${many ? 'conversations' : 'conversation'} to ${tickets.find((t) => t.id === ticketId)?.ticketId ?? 'this ticket'}.`,
        note: `Note: Once merged, ${many ? 'they' : 'it'} can’t be removed or split back out.`,
        action: 'Add to ticket',
        onConfirm: () => onAdd(ticketId),
      }}
      footer={(exit, ask) => (
        <footer className="mc-footer">
          <Button variant="secondary" size="md" onClick={() => exit(onClose)}>Cancel</Button>
          <Button variant="primary" size="md" disabled={ticketId == null} onClick={ask}>Add to ticket</Button>
        </footer>
      )}
    >
      <section className="mc-pick-section">
        <h3 className="mc-pick-label">Adding {conversations.length} {many ? 'conversations' : 'conversation'}</h3>
        {conversations.map((c) => <PickCard key={c.id} conversation={c} fixed />)}
      </section>
      <section className="mc-pick-section mc-pick-section--into">
        <h3 className="mc-pick-label mc-pick-label--info">
          Choose a ticket
          <Tooltip content={<>Only tickets from {companyOf(conversation)} ({domain}) are shown.<br />Once added, conversations can’t be removed.</>} placement="right" portal>
            <span className="mc-pick-info" tabIndex={0} aria-label="About these tickets"><Icon name="info" size={14} /></span>
          </Tooltip>
        </h3>
        <div className="mc-card mc-pick">
          <Input search size="md" fullWidth placeholder="Search by ticket ID or title" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search by ticket ID or title" />
          <div className="mc-filters">
            <FilterChip icon="flag">Status</FilterChip>
            <FilterChip icon="tag">Tag</FilterChip>
          </div>
          {!q && (
            <AiSuggestions
              suggestions={suggested}
              summary={<><strong>{suggested.length} {suggested.length === 1 ? 'ticket' : 'tickets'}</strong> that {suggested.length === 1 ? 'matches' : 'match'} {many ? 'these conversations' : 'this conversation'}</>}
            >
              {(t, note) => <TicketCard ticket={t} selected={ticketId === t.id} onSelect={() => setTicketId(t.id)} note={note} />}
            </AiSuggestions>
          )}
          <div className="mc-pick__results">
            {q && <p className="mc-pick__caption">Results</p>}
            {shown.length > 0 ? (
              <div className="mc-pick__list" role="radiogroup" aria-label="Tickets">
                {shown.map((t) => <TicketCard key={t.id} ticket={t} selected={ticketId === t.id} onSelect={() => setTicketId(t.id)} note={whyFor(suggested, t)} />)}
              </div>
            ) : (q || suggested.length === 0) && (
              // Only when searching, or when there's nothing at all; not when the AI box holds them all
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
