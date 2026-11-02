import React from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal, ModalText } from '../../components/Modal';
import { Popover } from '../../components/Popover';
import { Tag } from '../../components/Tag';
import { Tooltip } from '../../components/Tooltip';
import { Icon } from '../../icons/Icon';
import { sampleAssignees, statusOptions } from '../../patterns/RightPanel/data/options';
import { useConversationFields } from '../ConversationFields';
import { mergeCustomFields, mergeTags } from '../data/merge';
import { TAGS } from '../data/tags';
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

/** How many merged tags show before the "+X" button. */
const TAGS_SHOWN = 2;

function MergedTags({ values }) {
  const [expanded, setExpanded] = React.useState(false);
  const shown = expanded ? values : values.slice(0, TAGS_SHOWN);
  const hidden = values.length - shown.length;
  if (values.length === 0) return <span className="mc-empty">No tags</span>;
  return (
    <div className="mc-tags">
      {shown.map((value) => {
        const tag = TAGS.find((t) => t.value === value);
        return <Tag key={value} color={tag?.color}>{tag?.label ?? value}</Tag>;
      })}
      {hidden > 0 && (
        <button type="button" className="mc-tags__more" aria-label={`Show ${hidden} more tags`} onClick={() => setExpanded(true)}>+{hidden}</button>
      )}
    </div>
  );
}

function MergedCustomFields({ fields }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mc-cf">
      <p className="mc-cf__summary">
        {fields.length} {fields.length === 1 ? 'field' : 'fields'}
        <button type="button" className="mc-link" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? 'Hide' : 'View'}</button>
      </p>
      {/* Always rendered so it can slide open and closed */}
      <div className={`mc-cf__wrap${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <div className="mc-cf__clip">
          <div className="mc-cf__list">
            {fields.map((f) => (
              <div key={f.id} className="mc-cf__row">
                <span className="mc-cf__label"><Icon name={f.kind === 'number' ? 'hashnumber' : 'text'} size={14} /><span>{f.label}</span></span>
                <span className={`mc-cf__value${f.value ? '' : ' mc-cf__value--empty'}`}>{f.value || 'Empty'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Side sheet for "Merge conversations" in the bulk actions panel (Figma 4023:10700). `conversations` are the ticked
 * emails (all from one domain, so one inbox). Assignee and status come from the ticket title's conversation;
 * tags and custom fields are merged from all of them. Merge and Cancel both close it.
 */
export default function MergeConversationsSheet({ conversations, onClose, onMerge }) {
  const { assigneeOf, statusOf, tagsOf, customFieldsOf } = useConversationFields();
  const [titleId, setTitleId] = React.useState(conversations[0]?.id);
  const [closing, setClosing] = React.useState(false);
  // The confirm modal: hidden, showing ('in') or fading out ('out'). The sheet and the modal take turns: one fades
  // out completely before the other fades in (timings in the CSS), so both are never fully visible together.
  const [confirm, setConfirm] = React.useState('hidden');

  const exit = (fn) => { setClosing(true); setTimeout(fn, 320); }; // matches the exit animation in the CSS
  const openConfirm = () => setConfirm('in');
  const cancelConfirm = () => { setConfirm('out'); setTimeout(() => setConfirm('hidden'), 201); }; // the sheet fades back in 1ms after the modal has gone
  const dismiss = () => (confirm === 'in' ? cancelConfirm() : exit(onClose));
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const person = sampleAssignees.find((p) => p.value === assigneeOf(titleId));
  const personName = person?.label.replace(/ \(Me\)$/, '');
  const status = statusOptions.find((o) => o.value === statusOf(titleId)) ?? statusOptions[0];
  const tags = mergeTags(conversations, tagsOf);
  const customFields = mergeCustomFields(conversations, titleId, customFieldsOf);

  return createPortal(
    <div className={`mc-backdrop${closing ? ' is-closing' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <aside className={`mc-sheet${confirm !== 'hidden' ? ' is-faded' : ''}`} aria-hidden={confirm !== 'hidden'} role="dialog" aria-modal="true" aria-labelledby="mc-title">
        <header className="mc-header">
          <div>
            <h2 id="mc-title" className="mc-header__title">Merge conversations into a ticket</h2>
            <p className="mc-header__subtitle">Bring related conversations together in one place.</p>
          </div>
          <Button variant="ghost" size="sm" iconOnly aria-label="Close" onClick={() => exit(onClose)}>
            <Icon name="close" size={16} />
          </Button>
        </header>

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
              <div className="mc-ticket__divider" />
              <div className="mc-ticket__merged">
                <p className="mc-ticket__merged-title">Values combined from all conversations</p>
                <div className="mc-ticket__fields">
                  <TicketRow icon="tag" label="Tags">
                    <MergedTags values={tags} />
                  </TicketRow>
                  <TicketRow icon="text" label="Custom fields" top>
                    <MergedCustomFields fields={customFields} />
                  </TicketRow>
                </div>
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
      </aside>

      {/* Storybook › Modal › Destructive, on the same backdrop as the sheet */}
      {confirm !== 'hidden' && (
        <div className={`mc-confirm${confirm === 'out' ? ' is-leaving' : ''}`}>
          <Modal
            title="Merge conversations"
            onClose={cancelConfirm}
            actions={<>
              <Button variant="secondary" size="sm" onClick={cancelConfirm}>Cancel</Button>
              <Button variant="error" size="sm" onClick={() => exit(() => onMerge(titleId))}>Merge and create ticket</Button>
            </>}
          >
            <ModalText>You’re about to merge {conversations.length} conversations into a ticket. Once merged, they can’t be removed or split back out.</ModalText>
          </Modal>
        </div>
      )}
    </div>,
    document.body,
  );
}
