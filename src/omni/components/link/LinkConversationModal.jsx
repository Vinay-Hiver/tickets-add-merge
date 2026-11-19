import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../../components/Button';
import { Checkbox } from '../../../components/Checkbox';
import { Input } from '../../../components/Input';
import { Popover } from '../../../components/Popover';
import { Icon } from '../../../icons/Icon';
import { INITIAL_VIEWS_BY_INBOX } from '../../data/dummyViews';
import { searchConversations, iconFor } from '../../data/conversationIndex';
import { useCurrentUser } from '../../CurrentUser';
import { useConversationFields } from '../../ConversationFields';
import './LinkConversationModal.css';
import '../modalMotion.css';
import { useModalExit } from '../modalMotion';

// Figma: Delete › "Link conversations" flow (node 6016:47590).

// Search runs across every inbox the user belongs to, narrowed with the Inbox
// filter (Figma: Delete › 6011:37981). This overrides linked-conversations-context.md 5.1
// at the user's request. Set to false to limit search to the current inbox and hide the filter.
export const CROSS_INBOX_LINKING = true;

export const CHANNEL_ICON = { email: 'emailinbox', chat: 'chatinbox', slack: 'slack', whatsapp: 'whatsapp', sms: 'sms', voice: 'voice' };

// Order of the channel groups in the Inbox filter, as in Figma.
const CHANNEL_GROUPS = [
  ['email', 'Email'], ['slack', 'Slack'], ['chat', 'Chat'], ['whatsapp', 'WhatsApp'], ['voice', 'Voice'], ['sms', 'SMS'],
];

const truncate = (text, max) => (text.length > max ? `${text.slice(0, max)}...` : text);

/** Wraps each occurrence of the query words in `text` in a yellow highlight. */
function Highlight({ text, words }) {
  if (!words.length || !text) return text || null;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(re).map((part, i) => (i % 2 === 1 ? <mark key={i} className="lc-hl">{part}</mark> : part));
}

function Chip({ icon, children }) {
  return (
    <span className="lc-chip">
      <Icon name={icon} size={14} />
      <span>{children}</span>
    </span>
  );
}

function ResultRow({ item, words, selected, onToggle, assigneeName }) {
  return (
    <div
      className={`lc-result${selected ? ' lc-result--selected' : ''}`}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(); } }}
    >
      <div className="lc-result__top">
        <div className="lc-result__who">
          <span className="lc-result__lead">
            <span className="lc-result__icon"><Icon name={iconFor(item, CHANNEL_ICON)} size={16} /></span>
            <span className="lc-result__check" onClick={(e) => e.stopPropagation()}>
              <Checkbox aria-label={`Select ${item.name}`} checked={selected} onChange={onToggle} />
            </span>
          </span>
          <span className="lc-result__name">{item.name}</span>
        </div>
        <div className="lc-result__chips">
          {assigneeName && <Chip icon="assigned">{assigneeName}</Chip>}
          <Chip icon={CHANNEL_ICON[item.channel]}>{item.inbox}</Chip>
        </div>
        <span className="lc-result__date">{item.date}</span>
      </div>
      <div className="lc-result__bottom">
        <span className="lc-result__subject">{item.ticketId && <strong className="lc-result__ticket">{item.ticketId}</strong>}<Highlight text={item.subject} words={words} /></span>
        <span className="lc-result__snippet"><Highlight text={item.snippet} words={words} /></span>
      </div>
    </div>
  );
}

/** One row of the Inbox filter: [icon] label ... [checkbox]. The whole row toggles. */
function FilterRow({ icon, label, checked, indeterminate, onToggle }) {
  return (
    <div className="lc-filter-panel__row" role="option" aria-selected={checked} onClick={onToggle}>
      {icon && <Icon name={icon} size={16} />}
      <span className="lc-filter-panel__text">{label}</span>
      <span className="lc-filter-panel__check" onClick={(e) => e.stopPropagation()}>
        <Checkbox aria-label={label} checked={checked} indeterminate={indeterminate} onChange={onToggle} />
      </span>
    </div>
  );
}

// Ticking inboxes edits a draft; Apply sets the filter, Cancel (or closing the list) drops the draft
// (Figma: Delete › 6018:47673).
function InboxFilter({ inboxes, selected, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [draft, setDraft] = React.useState(selected);
  const ref = React.useRef(null);

  const openList = () => { setDraft(selected); setQuery(''); setOpen(true); };
  const close = () => setOpen(false);
  const apply = () => { onChange(draft); close(); };

  const isAll = selected.length === 0 || selected.length === inboxes.length;
  const label = isAll
    ? 'Inbox'
    : `Inbox: ${truncate(selected[0], 9)}${selected.length > 1 ? ` +${selected.length - 1}` : ''}`;

  const toggle = (name) => setDraft((d) => (d.includes(name) ? d.filter((n) => n !== name) : [...d, name]));
  const shown = inboxes.filter((n) => n.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <button ref={ref} type="button" className="lc-filter" aria-haspopup="listbox" aria-expanded={open} onClick={() => (open ? close() : openList())}>
        <Icon name="sminbox" size={14} />
        <span className="lc-filter__label">{label}</span>
        <Icon name="chevrondown" size={14} />
      </button>
      <Popover open={open} onClose={close} anchorRef={ref} placement="bottom-end" gap={2}>
        <div className="lc-filter-panel" role="listbox" aria-multiselectable="true" aria-label="Inboxes">
          <Input search size="md" fullWidth placeholder="Search Inboxes" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="lc-filter-panel__list">
            {!query && (
              <FilterRow
                label="Select all"
                checked={draft.length === inboxes.length}
                indeterminate={draft.length > 0 && draft.length < inboxes.length}
                onToggle={() => setDraft(draft.length === inboxes.length ? [] : [...inboxes])}
              />
            )}
            {CHANNEL_GROUPS.map(([channel, title]) => {
              const names = shown.filter((n) => INITIAL_VIEWS_BY_INBOX[n].channel === channel);
              if (names.length === 0) return null;
              return (
                <div key={channel} className="lc-filter-panel__group">
                  <div className="lc-filter-panel__heading">{title.toUpperCase()}</div>
                  {names.map((name) => (
                    <FilterRow key={name} icon={CHANNEL_ICON[channel]} label={name} checked={draft.includes(name)} onToggle={() => toggle(name)} />
                  ))}
                </div>
              );
            })}
          </div>
          {/* Sticky at the bottom: the list above scrolls, the buttons stay put. */}
          <div className="lc-filter-panel__footer">
            <Button variant="secondary" size="sm" onClick={close}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={apply}>Apply</Button>
          </div>
        </div>
      </Popover>
    </>
  );
}

/**
 * Search conversations across the inboxes the current user belongs to, tick
 * one or more, and link them to `conversationId`.
 */
export default function LinkConversationModal({ conversationId, inboxName, alreadyLinked = [], onLink, onClose }) {
  const [closing, exit] = useModalExit();
  const close = () => exit(onClose);
  const { user } = useCurrentUser();
  const { assigneeNameOf } = useConversationFields();
  const inboxes = React.useMemo(
    () => Object.keys(INITIAL_VIEWS_BY_INBOX).filter((n) => !user.hiddenInboxes?.includes(n)),
    [user]
  );
  const [query, setQuery] = React.useState('');
  const [inboxFilter, setInboxFilter] = React.useState([]);
  const [selected, setSelected] = React.useState([]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.hot-popover, [data-popover]')) close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  const words = query.trim().split(/\s+/).filter(Boolean);
  const searchInboxes = CROSS_INBOX_LINKING ? (inboxFilter.length ? inboxFilter : inboxes) : [inboxName];
  const results = React.useMemo(() => searchConversations(query, {
    inboxes: searchInboxes,
    excludeId: conversationId,
  }).filter((c) => !alreadyLinked.includes(c.id)), [query, searchInboxes.join('|'), conversationId, alreadyLinked]);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const count = selected.length;

  return createPortal(
    <div className={`lc-backdrop${closing ? ' is-closing' : ''}`} onClick={close}>
      <div className="lc-modal" role="dialog" aria-modal="true" aria-label="Link conversations" onClick={(e) => e.stopPropagation()}>
        <div className="lc-modal__search">
          <Icon name="search" size={16} />
          <input
            className="lc-modal__input"
            autoFocus
            placeholder="Search conversations to link"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="lc-modal__body">
          <div className="lc-modal__content">
            {words.length === 0 ? (
              <div className="lc-modal__empty">
                <Icon name="search" size={24} className="lc-modal__empty-icon" />
                <p>Search conversations to link</p>
              </div>
            ) : (
              <>
                <div className="lc-modal__bar">
                  <span className={results.length ? 'lc-modal__count' : 'lc-modal__count lc-modal__count--none'}>
                    {results.length === 0 ? '0 Results' : `${results.length} result${results.length === 1 ? '' : 's'}`}
                  </span>
                  {CROSS_INBOX_LINKING && <InboxFilter inboxes={inboxes} selected={inboxFilter} onChange={setInboxFilter} />}
                </div>
                {results.length === 0 ? (
                  <div className="lc-modal__empty">
                    <p>{CROSS_INBOX_LINKING ? 'No conversations match in the selected inboxes' : 'No conversations match in this inbox'}</p>
                  </div>
                ) : (
                  <div className="lc-modal__results">
                    {results.map((item, i) => (
                      <React.Fragment key={item.id}>
                        {i > 0 && <div className="lc-modal__divider" />}
                        <ResultRow
                          item={item}
                          words={words}
                          selected={selected.includes(item.id)}
                          onToggle={() => toggle(item.id)}
                          assigneeName={assigneeNameOf(item.id)}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="lc-modal__actions">
            <Button variant="secondary" size="sm" onClick={close}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={count === 0} onClick={() => exit(() => onLink(selected))}>
              {count === 0 ? 'Link conversation' : `Link ${count} conversation${count === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
