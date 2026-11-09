import React from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { Input } from '../../components/Input';
import { Modal, ModalNote, ModalText } from '../../components/Modal';
import { Popover } from '../../components/Popover';
import { Tooltip } from '../../components/Tooltip';
import { Icon } from '../../icons/Icon';
import { sampleAssignees, statusOptions } from '../../patterns/RightPanel/data/options';
import { useConversationFields } from '../ConversationFields';
import { companyOf, domainOf } from '../data/companies';
import './MergeConversationsSheet.css';

// Figma: Tickets Add/Merge › Merge conversations side sheet (4015:129) and its ticket title list (4020:9048).

const dateOf = (time) => time.split(',')[0]; // 'Feb 4, 02:45 PM' -> 'Feb 4'
const customerOf = (c) => c.messages?.[0]?.sender ?? c.sender;
const startedOn = (c) => dateOf(c.messages?.[0]?.time ?? c.time);

// The Ticket title field: picking a conversation makes its subject, assignee and status the ticket's.
// The list follows Figma 4020:9048 without its search (only a handful of emails are merged at once).
function TicketTitleSelect({ conversations, value, onChange }) {
  const { statusOf, assigneeNameOf } = useConversationFields();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  const current = conversations.find((c) => c.id === value);
  const close = () => setOpen(false);
  const choose = (id) => { onChange(id); close(); };

  return (
    <>
      {/* The HOT dropdown field: a read-only Input with a chevron (Storybook › Input › Affixes) */}
      <div ref={ref} className="mc-select" onClick={() => setOpen((o) => !o)}>
        <Input
          label="Ticket title" size="md" fullWidth readOnly value={current?.subject ?? ''}
          helperText="Status and assignee come from the conversation you pick."
          suffix={<Icon name="chevrondown" size={16} />} aria-haspopup="listbox" aria-expanded={open}
        />
      </div>
      <Popover open={open} onClose={close} anchorRef={ref} matchAnchorWidth>
        <div className="mc-title-list" role="listbox" aria-label="Ticket title">
          {conversations.map((c) => {
            const status = statusOptions.find((o) => o.value === statusOf(c.id)) ?? statusOptions[0];
            return (
              <div
                key={c.id}
                role="option"
                aria-selected={c.id === value}
                tabIndex={0}
                className={`mc-title-option${c.id === value ? ' is-selected' : ''}`}
                onClick={() => choose(c.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(c.id); } }}
              >
                <div className="mc-title-option__text">
                  <span className="mc-title-option__subject">{c.subject}</span>
                  <span className="mc-title-option__meta">{customerOf(c)} • {startedOn(c)}</span>
                </div>
                <div className="mc-title-option__chips">
                  <span className="mc-chip"><Icon name={status.icon} size={12} />{status.label}</span>
                  <span className="mc-chip"><Icon name="user" size={12} />{assigneeNameOf(c.id) ?? 'Unassigned'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Popover>
    </>
  );
}

function TicketRow({ icon, label, children, top }) {
  return (
    <div className={`mc-ticket-row${top ? ' mc-ticket-row--top' : ''}`}>
      <span className="mc-ticket-row__label"><Icon name={icon} size={14} />{label}</span>
      <div className="mc-ticket-row__value">{children}</div>
    </div>
  );
}

// Step 1, when merging from an open conversation (Figma 4029:19413): the conversation being merged, then the
// conversations it can merge into. Hovering a card turns its mail icon into a checkbox and its date into an
// open-in-new-tab button. A fixed card (the conversation being merged or added) only gets the open button.
export function PickCard({ conversation: c, fixed, selected, onToggle }) {
  const { statusOf, assigneeNameOf } = useConversationFields();
  const status = statusOptions.find((o) => o.value === statusOf(c.id)) ?? statusOptions[0];
  const classes = ['mc-pick-card', fixed && 'mc-pick-card--fixed', selected && 'is-selected'].filter(Boolean).join(' ');
  const interactive = fixed ? {} : {
    role: 'checkbox',
    'aria-checked': selected,
    tabIndex: 0,
    onClick: onToggle,
    onKeyDown: (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(); } },
  };
  return (
    <div className={classes} {...interactive}>
      <div className="mc-pick-card__top">
        <span className="mc-pick-card__name">
          <span className="mc-pick-card__lead">
            <span className="mc-pick-card__icon"><Icon name="mailbox" size={14} /></span>
            {!fixed && (
              <span className="mc-pick-card__check" onClick={(e) => e.stopPropagation()}>
                <Checkbox checked={!!selected} onChange={onToggle} aria-label={`Select ${c.subject}`} />
              </span>
            )}
          </span>
          {customerOf(c)}
        </span>
        <span className="mc-pick-card__date">{dateOf(c.time)}</span>
        {/* No action yet: opening in a new tab is left to development */}
        <Tooltip content="Open conversation in a new tab" placement="left">
          <button type="button" className="mc-email__open" aria-label="Open conversation in a new tab" onClick={(e) => e.stopPropagation()}>
            <Icon name="newtab" size={14} />
          </button>
        </Tooltip>
      </div>
      <div className="mc-email__bottom">
        <span className="mc-email__subject">{c.subject}</span>
        <span className="mc-email__preview">{c.preview}</span>
      </div>
      <div className="mc-pick-card__chips">
        <span className="mc-chip"><Icon name={status.icon} size={12} />{status.label}</span>
        <span className="mc-chip"><Icon name="user" size={12} />{assigneeNameOf(c.id) ?? 'Unassigned'}</span>
      </div>
    </div>
  );
}

/** A filter chip from the design. The filters don't filter yet. */
export function FilterChip({ icon, children }) {
  return (
    <button type="button" className="mc-filter">
      {icon && <Icon name={icon} size={14} />}
      {children}
      <Icon name="chevrondown" size={14} />
    </button>
  );
}

function PickStep({ source, candidates, others, onCancel, onNext }) {
  const [query, setQuery] = React.useState('');
  const [picked, setPicked] = React.useState([]);
  const toggle = (id) => setPicked((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const q = query.trim().toLowerCase();
  const matches = (c) => !q || `${customerOf(c)} ${c.messages?.[0]?.email ?? ''} ${c.subject} ${c.preview}`.toLowerCase().includes(q);
  const shown = candidates.filter(matches);
  const domain = domainOf(source);
  // Searching for a conversation from another customer explains why it can't be merged.
  const elsewhere = q && shown.length === 0 && others.some(matches);
  const empty = elsewhere
    ? `That conversation isn't from ${companyOf(source)} (${domain}). Only conversations from the same domain can be merged.`
    : q ? `No conversation from ${domain} matches "${query.trim()}".`
    : `There are no other conversations from ${domain} in this inbox.`;

  return (
    <>
      <div className="mc-body mc-body--pick">
        <section className="mc-pick-section">
          <h3 className="mc-pick-label">Merge conversation</h3>
          <PickCard conversation={source} fixed />
        </section>
        <section className="mc-pick-section mc-pick-section--into">
          <h3 className="mc-pick-label">Merge into</h3>
          <div className="mc-card mc-pick">
            <Input search size="md" fullWidth placeholder="Search conversation" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search conversation" />
            <div className="mc-filters">
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
      </div>
      <footer className="mc-footer mc-footer--pick">
        <span className="mc-footer__count">{picked.length} {picked.length === 1 ? 'conversation' : 'conversations'} selected</span>
        <div className="mc-footer__actions">
          <Button variant="secondary" size="md" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="md" disabled={picked.length === 0} onClick={() => onNext([source, ...candidates.filter((c) => picked.includes(c.id))])}>Next</Button>
        </div>
      </footer>
    </>
  );
}

/**
 * Side sheet for "Merge conversations" in the bulk actions panel (Figma 4023:10700). `conversations` are the ticked
 * emails (all from one domain, so one inbox). Assignee and status come from the ticket title's conversation;
 * tags and custom fields are still merged from all of them on Merge (not shown here). Merge and Cancel both close it.
 */
export default function MergeConversationsSheet({ conversations: preselected, source, candidates = [], others = [], onClose, onMerge }) {
  const { assigneeOf, statusOf } = useConversationFields();
  // Merging from an open conversation (`source`) starts with step 1, picking what to merge it with. Merging ticked cards
  // from the list starts straight at the ticket preview.
  const [picked, setPicked] = React.useState(source ? null : preselected);
  const conversations = picked ?? [];
  const [titleId, setTitleId] = React.useState(preselected?.[0]?.id ?? source?.id);
  const [closing, setClosing] = React.useState(false);
  // The confirm modal: hidden, showing ('in') or fading out ('out'). The sheet and the modal take turns: one fades
  // out completely before the other fades in (timings in the CSS), so both are never fully visible together.
  const [confirm, setConfirm] = React.useState('hidden');

  const exit = (fn) => { setClosing(true); setTimeout(fn, 320); }; // matches the exit animation in the CSS
  const openConfirm = () => setConfirm('in');
  const cancelConfirm = () => { setConfirm('out'); setTimeout(() => setConfirm('hidden'), 101); }; // the sheet fades back in 1ms after the modal has gone
  const dismiss = () => (confirm === 'in' ? cancelConfirm() : exit(onClose));
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const person = sampleAssignees.find((p) => p.value === assigneeOf(titleId));
  const personName = person?.label.replace(/ \(Me\)$/, '');
  const status = statusOptions.find((o) => o.value === statusOf(titleId)) ?? statusOptions[0];

  return createPortal(
    <div className={`mc-backdrop${closing ? ' is-closing' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <aside className={`mc-sheet${confirm !== 'hidden' ? ' is-faded' : ''}`} aria-hidden={confirm !== 'hidden'} role="dialog" aria-modal="true" aria-labelledby="mc-title">
        <header className="mc-header">
          <div>
            <h2 id="mc-title" className="mc-header__title">Merge conversations into a ticket</h2>
          </div>
          <Button variant="ghost" size="sm" iconOnly aria-label="Close" onClick={() => exit(onClose)}>
            <Icon name="close" size={16} />
          </Button>
        </header>

        {picked === null ? (
          <PickStep source={source} candidates={candidates} others={others} onCancel={() => exit(onClose)} onNext={(list) => { setTitleId(source.id); setPicked(list); }} />
        ) : (
        <>
        <div className="mc-body">
          <section>
            <h3 className="mc-section-title">Ticket preview</h3>
            <div className="mc-card mc-ticket">
              <TicketTitleSelect conversations={conversations} value={titleId} onChange={setTitleId} />
              <div className="mc-ticket__fields">
                <TicketRow icon="assigned" label="Assignee">
                  {person ? <><Avatar initial={personName[0]} size="small" color={person.color} showStatus />{personName}</> : 'Unassigned'}
                </TicketRow>
                <TicketRow icon="flag" label="Status">
                  <Icon name={status.icon} size={16} />{status.label}
                </TicketRow>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mc-section-title">Conversations in this ticket</h3>
            <p className="mc-section-subtitle">Each keeps its own thread, replies and notes.</p>
            <div className="mc-emails">
              {conversations.map((c) => (
                <div key={c.id} className="mc-email">
                  <div className="mc-email__top">
                    <span className="mc-email__name"><Icon name="mailbox" size={14} />{customerOf(c)}</span>
                    {/* The date gives way to the open button on hover */}
                    <span className="mc-email__time">{dateOf(c.time)}</span>
                    {/* No action yet: opening in a new tab is left to development */}
                    <Tooltip content="Open conversation in a new tab" placement="left">
                      <button type="button" className="mc-email__open" aria-label="Open conversation in a new tab">
                        <Icon name="newtab" size={14} />
                      </button>
                    </Tooltip>
                  </div>
                  <div className="mc-email__bottom">
                    <span className="mc-email__subject">{c.subject}</span>
                    <span className="mc-email__preview">{c.preview}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="mc-footer">
          <Button variant="secondary" size="md" onClick={() => exit(onClose)}>Cancel</Button>
          <Button variant="primary" size="md" onClick={openConfirm}>Merge</Button>
        </footer>
        </>
        )}
      </aside>

      {/* Storybook › Modal › With note, on the same backdrop as the sheet */}
      {confirm !== 'hidden' && (
        <div className={`mc-confirm${confirm === 'out' ? ' is-leaving' : ''}`}>
          <Modal
            width={500}
            title="Merge conversations"
            onClose={cancelConfirm}
            actions={<>
              <Button variant="secondary" size="sm" onClick={cancelConfirm}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => exit(() => onMerge(titleId, conversations))}>Merge and create ticket</Button>
            </>}
          >
            <ModalText>You’re about to merge {conversations.length} conversations into a ticket.</ModalText>
            <ModalNote>Note: Once merged, they can’t be removed or split back out.</ModalNote>
          </Modal>
        </div>
      )}
    </div>,
    document.body,
  );
}
