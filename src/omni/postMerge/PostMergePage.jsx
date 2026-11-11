import React from 'react';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { ListAvatar, ListIcon, ListItem } from '../../components/List';
import { Popover } from '../../components/Popover';
import { SlaAlert, SlaPill } from '../../components/Sla';
import { slaMessage } from '../../components/Sla/sla';
import { Switch } from '../../components/Switch';
import { Tabs } from '../../components/Tabs';
import { Tooltip } from '../../components/Tooltip';
import { Icon } from '../../icons/Icon';
import { ArrowMerge } from '../../icons/ArrowMerge';
import { MessagePlusSquare } from '../../icons/MessagePlusSquare';
import { TicketRightPanel } from '../../patterns/RightPanel/ChannelRightPanel';
import { ActivityGroup } from '../components/notes/EmailNotes';
import { CUSTOM_FIELDS } from '../data/customFields';
import { TAGS } from '../data/tags';
import { APPROACHES, BY_URGENCY, CONVERSATIONS, MERGE_EVENT, SUPPORT, TICKET } from './postMergeData';
import '../components/ConversationDetail.css';
import './PostMergePage.css';

// /post-merge: ways to show a merged ticket without the Overview / conversation tabs, while every conversation keeps
// its own right panel (first response time, contact) and the ticket keeps one (resolution time, fields).
// One ticket (TKT#476): four conversations, two past their FRT. Pick an approach in the bar at the top.

const byId = (id) => CONVERSATIONS.find((c) => c.id === id);
const breached = (c) => c.frt.status === 'overdue';
const needsAttention = (c) => c.frt.status === 'overdue' || c.frt.status === 'due';
const OVERDUE = BY_URGENCY.filter(breached);
const frtText = (c) => slaMessage('frt', c.frt.status, c.frt.time);
const emailKey = (c, m) => `${c.id}:${m.id}`;
const lastKey = (c) => emailKey(c, c.messages[c.messages.length - 1]);
const frtKey = (c) => emailKey(c, c.messages.find((m) => m.startsFrt) ?? c.messages[0]);

const MERGE_ROW = { id: 'merge', kind: 'ticket', icon: <ArrowMerge size={14} />, text: MERGE_EVENT.text, time: MERGE_EVENT.time };

/** Every email of `conversations` and the merge row, oldest first. */
const timelineOf = (conversations) => [
  ...conversations.flatMap((c) => c.messages.map((m) => ({ kind: 'email', at: m.at, key: emailKey(c, m), msg: m, conv: c }))),
  { kind: 'merge', at: MERGE_EVENT.at, key: 'merge' },
].sort((a, b) => a.at - b.at);

const scrollToEmail = (key) => requestAnimationFrame(() => requestAnimationFrame(() => {
  document.getElementById(`pm-email-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}));

/* ---------- Middle pane pieces ---------- */

/** An email card, open or folded, as in the thread. The ⚡FRT pill sits on the email that started a running FRT clock. */
function EmailCard({ msg, conv, open, onToggle, selected, onSelect }) {
  const fromAgent = msg.from === 'agent';
  const name = fromAgent ? SUPPORT.agent.name : conv.customer;
  const to = fromAgent ? conv.customer : SUPPORT.name;
  const initial = fromAgent ? SUPPORT.agent.initial : conv.initial;
  const avatarColor = fromAgent ? SUPPORT.agent.avatarColor : conv.avatarColor;
  const frt = msg.startsFrt && needsAttention(conv) && (
    <Tooltip content={frtText(conv)} placement="top" portal><SlaPill kind="frt" status={conv.frt.status} /></Tooltip>
  );
  const avatar = <div className="convo-avatar" style={{ backgroundColor: avatarColor }}><span>{initial}</span></div>;
  return (
    <div id={`pm-email-${emailKey(conv, msg)}`} className={`pm-email${selected ? ' is-selected' : ''}`} onClickCapture={onSelect}>
      {open ? (
        <div className="convo-card">
          <div className="convo-card-header">
            {avatar}
            <div className="convo-info" onClick={onToggle} style={{ cursor: 'pointer' }}>
              <h3 className="convo-email">{name}</h3>
              <div className="convo-to">To: {to}</div>
            </div>
            <div className="header-actions-right">
              {frt}
              <span className="convo-time">{msg.time}</span>
              <button type="button" className="icon-btn" aria-label="Reply"><Icon name="reply" size={16} /></button>
            </div>
          </div>
          <div className="convo-body">
            {msg.body.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
          </div>
          <div className="convo-actions">
            <button type="button" className="convo-btn"><Icon name="reply" size={14} /> Reply</button>
            <button type="button" className="convo-btn"><Icon name="forward" size={14} /> Forward</button>
          </div>
        </div>
      ) : (
        <div className="convo-card-collapsed" onClick={onToggle}>
          {avatar}
          <div className="convo-info">
            <h3 className="convo-email">{name}</h3>
            <p className="collapsed-text">{msg.body.replace(/\s+/g, ' ')}</p>
          </div>
          {frt}
          <span className="convo-time">{msg.time}</span>
        </div>
      )}
    </div>
  );
}

const MergeRow = () => <ActivityGroup rows={[MERGE_ROW]} />;

/** A timeline of emails (one or all conversations) with the merge row in its place. */
function Timeline({ items, openKeys, toggleOpen, selectedId, onSelect }) {
  return items.map((item) => (item.kind === 'merge' ? <MergeRow key="merge" /> : (
    <EmailCard
      key={item.key}
      msg={item.msg}
      conv={item.conv}
      open={openKeys.includes(item.key)}
      onToggle={() => toggleOpen(item.key)}
      selected={selectedId === item.conv.id}
      onSelect={onSelect && (() => onSelect(item.conv.id))}
    />
  )));
}

/* ---------- Right panel pieces ---------- */

function Row({ icon, label, children, link }) {
  return (
    <div className="hot-rp-field">
      <div className="hot-rp-field__label"><Icon name={icon} size={14} /><span>{label}</span></div>
      <div className={`hot-rp-field__value${link ? ' hot-rp-field__value--link' : ''}`}>{children}</div>
    </div>
  );
}

/** The panel's props for one conversation: its subject, FRT, old assignee and status (history), and contact. */
const conversationProps = (c, nav) => ({
  subject: c.subject,
  sla: c.frt,
  nav,
  assignee: c.oldAssignee,
  status: c.oldStatus,
  contact: { name: c.customer, email: c.email, account: TICKET.account.name, conversations: c.contactConversations },
});

/** "2 of 4" with ‹ › to step through the ticket's conversations, most urgent first. */
function Stepper({ current, onChange }) {
  const ids = BY_URGENCY.map((c) => c.id);
  const i = ids.indexOf(current);
  return (
    <span className="pm-stepper">
      <span className="pm-stepper__count">{i + 1} of {ids.length}</span>
      <Tooltip content="Previous conversation" placement="bottom" portal>
        <button type="button" className="pm-stepper__btn" aria-label="Previous conversation" disabled={i <= 0} onClick={() => onChange(ids[i - 1])}><Icon name="chevronleft" size={14} /></button>
      </Tooltip>
      <Tooltip content="Next conversation" placement="bottom" portal>
        <button type="button" className="pm-stepper__btn" aria-label="Next conversation" disabled={i >= ids.length - 1} onClick={() => onChange(ids[i + 1])}><Icon name="chevronright" size={14} /></button>
      </Tooltip>
    </span>
  );
}

/**
 * The ticket's conversations as a list in the panel, most urgent first, each with its FRT pill.
 * With `expandSelected`, the picked one opens in place to show its FRT alert.
 */
function ConversationsBlock({ selectedId, onPick, expandSelected, hint }) {
  return (
    <section className="hot-rp-top hot-rp-top--conversation pm-convs">
      <div className="hot-rp-top__title-row">
        <h2 className="hot-rp-top__title">Conversations · {CONVERSATIONS.length}</h2>
        {OVERDUE.length > 0 && <span className="pm-convs__overdue"><Icon name="boltfilled" size={12} />{OVERDUE.length} FRT overdue</span>}
      </div>
      <div className="pm-convs__list">
        {BY_URGENCY.map((c) => {
          const selected = selectedId === c.id;
          return (
            <div key={c.id} className={`pm-convs__item${selected ? ' is-selected' : ''}`}>
              <button type="button" className="pm-convs__row" aria-pressed={selected} onClick={() => onPick(c.id)}>
                <Avatar initial={c.initial} color={c.color} title={c.customer} />
                <span className="pm-convs__text">
                  <span className="pm-convs__name">{c.customer}</span>
                  <span className="pm-convs__subject">{c.subject}</span>
                </span>
                <Tooltip content={frtText(c)} placement="left" portal><SlaPill kind="frt" status={c.frt.status} /></Tooltip>
              </button>
              {/* The picked conversation's own details, in place: its FRT and contact */}
              {expandSelected && selected && (
                <div className="pm-convs__detail">
                  <SlaAlert kind="frt" status={c.frt.status} time={c.frt.time} />
                  <div className="hot-rp-fields">
                    <Row icon="mailbox" label="Email">{c.email}</Row>
                    <Row icon="previousconversations" label="Conversations" link>{c.contactConversations}</Row>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hint && <p className="pm-convs__hint">{hint}</p>}
    </section>
  );
}

/* ---------- Tab-row controls (they use the empty right side of the Conversation / Slack row) ---------- */

/** "⚡ 2 FRT overdue": each press jumps to the next conversation past its first response time. */
function BreachJump({ onJump }) {
  const [next, setNext] = React.useState(0);
  if (OVERDUE.length === 0) return null;
  return (
    <Tooltip content="Jump to the next conversation past its first response time" placement="bottom" portal>
      <button type="button" className="pm-breach" onClick={() => { onJump(OVERDUE[next % OVERDUE.length]); setNext((n) => n + 1); }}>
        <span className="pm-breach__badge"><Icon name="boltfilled" size={10} /></span>
        {OVERDUE.length} FRT overdue
        <Icon name="downarrow" size={14} />
      </button>
    </Tooltip>
  );
}

/** The menu that replaces the tabs: "All conversations", then each conversation with its FRT. */
function ConversationSwitcher({ filterId, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const current = filterId && byId(filterId);
  const choose = (id) => { onChange(id); setOpen(false); };
  return (
    <>
      <button ref={ref} type="button" className={`pm-switcher${open ? ' is-open' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {current ? <Avatar initial={current.initial} color={current.color} size="small" /> : <Icon name="listview" size={14} />}
        <span className="pm-switcher__label">{current ? `${current.customer} · ${current.subject}` : 'All conversations'}</span>
        <span className="pm-switcher__count">{CONVERSATIONS.length}</span>
        {OVERDUE.length > 0 && <span className="pm-switcher__breach"><Icon name="boltfilled" size={10} />{OVERDUE.length}</span>}
        <Icon name="chevrondown" size={14} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={ref} placement="bottom-end">
        <div className="hot-dropdown hot-dropdown--no-search hot-dropdown--no-actions pm-menu" role="menu">
          <ListItem compact label="All conversations" description="Every email, in time order" leading={<ListIcon name="listview" />} rightElement={!filterId} trailing="check" onClick={() => choose(null)} />
          <div className="pm-menu__divider" />
          {BY_URGENCY.map((c) => (
            <ListItem
              key={c.id}
              compact
              label={<span className="pm-menu__label"><span className="pm-menu__name">{c.customer}</span><SlaPill kind="frt" status={c.frt.status} /></span>}
              description={c.subject}
              leading={<ListAvatar initial={c.initial} />}
              rightElement={filterId === c.id}
              trailing="check"
              onClick={() => choose(c.id)}
            />
          ))}
        </div>
      </Popover>
    </>
  );
}

/** A narrow rail at the left of the thread: "All", then one avatar per conversation with a ⚡ badge when its FRT needs attention. */
function ConversationRail({ filterId, onChange }) {
  return (
    <nav className="pm-rail" aria-label="Conversations in this ticket">
      <Tooltip content="All conversations" placement="right" portal>
        <button type="button" className={`pm-rail__item${!filterId ? ' is-active' : ''}`} aria-label="All conversations" aria-pressed={!filterId} onClick={() => onChange(null)}>
          <Icon name="listview" size={16} />
        </button>
      </Tooltip>
      <span className="pm-rail__divider" />
      {BY_URGENCY.map((c) => (
        <Tooltip key={c.id} content={<>{c.customer} · {c.subject}<br />{frtText(c)}</>} placement="right" portal>
          <button type="button" className={`pm-rail__item${filterId === c.id ? ' is-active' : ''}`} aria-label={`${c.customer}: ${c.subject}. ${frtText(c)}`} aria-pressed={filterId === c.id} onClick={() => onChange(c.id)}>
            <Avatar initial={c.initial} color={c.color} />
            {needsAttention(c) && <span className={`pm-rail__badge pm-rail__badge--${c.frt.status}`}><Icon name="boltfilled" size={10} /></span>}
          </button>
        </Tooltip>
      ))}
    </nav>
  );
}

/* ---------- The ticket, laid out for one approach ---------- */

function TicketView({ approach, fields }) {
  const all = React.useMemo(() => timelineOf(CONVERSATIONS), []);
  const latest = all.filter((i) => i.kind === 'email').pop();
  const [tab, setTab] = React.useState('conversation');
  // The conversation in focus (its details are in the panel) and, for the switcher and the rail, the one the
  // thread is narrowed to (null = all of them).
  const [selectedId, setSelectedId] = React.useState(approach === 'focus' ? latest.conv.id : approach === 'grouped' ? BY_URGENCY[0].id : null);
  const [filterId, setFilterId] = React.useState(null);
  const [openKeys, setOpenKeys] = React.useState([latest.key]);
  const [groupsOpen, setGroupsOpen] = React.useState([]);
  // A timeline opens at its latest email, as a thread does; the grouped view opens at the top (its overview).
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el && approach !== 'grouped') el.scrollTop = el.scrollHeight;
  }, [approach, filterId]);

  const toggleOpen = (key) => setOpenKeys((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));
  const openAndScroll = (key) => { setOpenKeys((keys) => (keys.includes(key) ? keys : [...keys, key])); scrollToEmail(key); };
  const focus = (id, key) => { setSelectedId(id); if (key) openAndScroll(key); };
  const narrow = (id) => {
    setFilterId(id);
    setSelectedId(id);
    setOpenKeys([id ? lastKey(byId(id)) : latest.key]);
  };
  const toggleGroup = (id) => {
    const opening = !groupsOpen.includes(id);
    setGroupsOpen((ids) => (opening ? [...ids, id] : ids.filter((x) => x !== id)));
    setSelectedId(id);
    if (opening) setOpenKeys((keys) => [...keys, lastKey(byId(id))]);
  };

  /* Middle pane */
  let body;
  let tabRowSlot = null;
  if (approach === 'grouped') {
    const allOpen = groupsOpen.length === CONVERSATIONS.length;
    tabRowSlot = (
      <Button variant="ghost" size="xs" iconLeft={<Icon name={allOpen ? 'collapse' : 'expand'} size={14} />} onClick={() => setGroupsOpen(allOpen ? [] : CONVERSATIONS.map((c) => c.id))}>
        {allOpen ? 'Collapse all' : 'Expand all'}
      </Button>
    );
    body = (
      <div className="messages-container pm-groups">
        <MergeRow />
        {BY_URGENCY.map((c) => {
          const open = groupsOpen.includes(c.id);
          const last = c.messages[c.messages.length - 1];
          return (
            <section key={c.id} className={`pm-group${open ? ' is-open' : ''}${selectedId === c.id ? ' is-selected' : ''}`}>
              <button type="button" className="pm-group__header" aria-expanded={open} onClick={() => toggleGroup(c.id)}>
                <span className="pm-group__chevron"><Icon name="chevronright" size={14} /></span>
                <Avatar initial={c.initial} color={c.color} />
                <span className="pm-group__title">
                  <span className="pm-group__name">{c.customer}</span>
                  <span className="pm-group__subject">{c.subject}</span>
                </span>
                <span className="pm-group__count">{c.messages.length} {c.messages.length === 1 ? 'email' : 'emails'}</span>
                <Tooltip content={frtText(c)} placement="top" portal><SlaPill kind="frt" status={c.frt.status} /></Tooltip>
                <span className="pm-group__time">{last.time}</span>
              </button>
              {open && (
                <div className="pm-group__emails">
                  {c.messages.map((m) => (
                    <EmailCard key={m.id} msg={m} conv={c} open={openKeys.includes(emailKey(c, m))} onToggle={() => toggleOpen(emailKey(c, m))} onSelect={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  } else {
    const items = filterId ? timelineOf([byId(filterId)]) : all;
    const highlight = approach === 'panel-list' || approach === 'focus' ? selectedId : null;
    const pick = approach === 'panel-list' || approach === 'focus' ? (id) => setSelectedId(id) : undefined;
    const timeline = (
      <div className="messages-container">
        <Timeline items={items} openKeys={openKeys} toggleOpen={toggleOpen} selectedId={highlight} onSelect={pick} />
      </div>
    );
    if (approach === 'focus') tabRowSlot = <BreachJump onJump={(c) => focus(c.id, frtKey(c))} />;
    if (approach === 'switcher') tabRowSlot = <ConversationSwitcher filterId={filterId} onChange={narrow} />;
    body = approach === 'rail' ? (
      <div className="pm-railwrap">
        <ConversationRail filterId={filterId} onChange={narrow} />
        {timeline}
      </div>
    ) : timeline;
  }

  /* Right panel: the ticket first, then the conversation in focus, or the list of conversations */
  // The list of conversations sits right under the ticket block, so their FRTs are seen without scrolling the panel.
  let conversation;
  let afterTicket;
  if (approach === 'panel-list') {
    afterTicket = (
      <ConversationsBlock
        selectedId={selectedId}
        expandSelected
        onPick={(id) => (id === selectedId ? setSelectedId(null) : focus(id, lastKey(byId(id))))}
        hint={!selectedId && 'Pick a conversation to see its details and highlight its emails.'}
      />
    );
  } else if ((approach === 'switcher' || approach === 'rail') && !filterId) {
    afterTicket = <ConversationsBlock onPick={narrow} hint="Pick one to read only its emails." />;
  } else if (selectedId) {
    const c = byId(selectedId);
    const step = (id) => {
      if (approach === 'switcher' || approach === 'rail') narrow(id);
      else if (approach === 'grouped') setSelectedId(id);
      else focus(id, lastKey(byId(id)));
    };
    conversation = conversationProps(c, <Stepper current={selectedId} onChange={step} />);
  }

  return (
    <div className="pm-ticket">
      <div className="conversation-detail">
        <div className="detail-header">
          <div className="header-left">
            <Tooltip content="Print" placement="bottom"><button type="button" className="icon-btn" aria-label="Print"><Icon name="print" size={16} /></button></Tooltip>
            <Tooltip content="Add conversation" placement="bottom"><button type="button" className="icon-btn" aria-label="Add conversation"><MessagePlusSquare size={16} /></button></Tooltip>
          </div>
        </div>
        <div className="detail-scroll-area" ref={scrollRef}>
          <div className="detail-sticky">
            <div className="subject-bar-detail">
              <h1 className="subject-text-large text-label-medium">{TICKET.subject}</h1>
            </div>
            <div className="pm-tabrow">
              <Tabs
                className="detail-tabs"
                aria-label="Conversation views"
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: 'conversation', label: 'Conversation' },
                  { value: 'slack', label: TICKET.slackChannel, icon: <Icon name="slack" size={14} /> },
                ]}
              />
              {tab === 'conversation' && tabRowSlot && <div className="pm-tabrow__slot">{tabRowSlot}</div>}
            </div>
          </div>
          {tab === 'slack' ? <div className="detail-slack-placeholder text-body-small">Slack internal collaboration page</div> : body}
        </div>
      </div>
      <TicketRightPanel
        inboxName={TICKET.inbox}
        title="Ticket"
        ticketId={TICKET.ticketId}
        ticketKey={`${TICKET.id}-${approach}`}
        sla={TICKET.rt}
        assignee={fields.assignee}
        onAssigneeChange={fields.setAssignee}
        status={fields.status}
        onStatusChange={fields.setStatus}
        tagOptions={TAGS}
        tags={fields.tags}
        onTagsChange={fields.setTags}
        customFields={CUSTOM_FIELDS.map((f) => ({ ...f, value: fields.customFields[f.id] }))}
        onCustomFieldChange={(id, value) => fields.setCustomFields((all) => ({ ...all, [id]: value }))}
        account={TICKET.account}
        conversation={conversation}
        afterTicket={afterTicket}
        sectionsFolded
      />
    </div>
  );
}

/* ---------- The page ---------- */

export default function PostMergePage() {
  const [approach, setApproach] = React.useState(APPROACHES[0].id);
  const [small, setSmall] = React.useState(true);
  const [showNotes, setShowNotes] = React.useState(true);
  // The ticket's own values, kept across approaches
  const [assignee, setAssignee] = React.useState(TICKET.assignee);
  const [status, setStatus] = React.useState(TICKET.status);
  const [tags, setTags] = React.useState(TICKET.tags);
  const [customFields, setCustomFields] = React.useState(TICKET.customFields);
  const fields = { assignee, setAssignee, status, setStatus, tags, setTags, customFields, setCustomFields };
  const current = APPROACHES.find((a) => a.id === approach);

  return (
    <div className="pm-page">
      <header className="pm-bar">
        <div className="pm-bar__title">
          <span className="pm-bar__name">After merge</span>
          <span className="pm-bar__meta">{TICKET.ticketId} · {CONVERSATIONS.length} conversations · {OVERDUE.length} past FRT</span>
        </div>
        <div className="pm-bar__approaches" role="tablist" aria-label="Approaches">
          {APPROACHES.map((a, i) => (
            <button key={a.id} type="button" role="tab" aria-selected={a.id === approach} className="pm-bar__approach" onClick={() => setApproach(a.id)}>
              <span className="pm-bar__num">{i + 1}</span>{a.name}
            </button>
          ))}
        </div>
        <div className="pm-bar__controls">
          <Switch checked={small} onChange={(e) => setSmall(e.target.checked)} label="Small screen" />
          <Switch checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} label="Notes" />
        </div>
      </header>
      {showNotes && (
        <section className="pm-notes" aria-label="About this approach">
          <p className="pm-notes__summary">{current.summary}</p>
          <dl className="pm-notes__grid">
            <div><dt>FRT</dt><dd>{current.frt}</dd></div>
            <div><dt>Height</dt><dd>{current.cost}</dd></div>
            <div><dt>Trade-offs</dt><dd>{current.tradeoffs.join(' ')}</dd></div>
            <div><dt>Seen in</dt><dd>{current.inspiredBy}</dd></div>
          </dl>
        </section>
      )}
      <div className="pm-stage">
        <div className={`pm-frame${small ? ' pm-frame--small' : ''}`}>
          <TicketView key={approach} approach={approach} fields={fields} />
        </div>
        {small && <p className="pm-stage__caption">The work area left on a 1366 × 768 laptop once the inbox list is open (960 × 640).</p>}
      </div>
    </div>
  );
}
