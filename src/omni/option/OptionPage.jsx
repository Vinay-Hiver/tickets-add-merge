import React from 'react';
import { Tabs } from '../../components/Tabs';
import { Tooltip } from '../../components/Tooltip';
import { Icon } from '../../icons/Icon';
import { ArrowMerge } from '../../icons/ArrowMerge';
import { MessagePlusSquare } from '../../icons/MessagePlusSquare';
import { TicketRightPanel } from '../../patterns/RightPanel/ChannelRightPanel';
import Sidebar from '../Sidebar';
import ConversationList from '../components/ConversationList';
import ConversationMenu from '../components/ConversationMenu';
import { ActivityGroup, NoteCard, NoteComposer, formatNoteTime } from '../components/notes/EmailNotes';
import { useCurrentUser } from '../CurrentUser';
import noteIcon from '../assets/icons/note.svg';
import { groupActivity } from '../components/notes/threadTimeline';
import { CUSTOM_FIELDS } from '../data/customFields';
import { TAGS } from '../data/tags';
import { AGENT, CONVERSATIONS, HISTORY, SUPPORT_NAME, TICKET } from './optionData';
import '../components/ConversationDetail.css';
import './OptionPage.css';

// /option: tabs and the single page together. "Overview" is every email of the ticket on one page, oldest first (as in
// Front); each conversation also has its own tab. Hovering an email on the Overview shows an "open in its conversation
// tab" button before the date: it switches to that tab and opens and scrolls to the same email there.

// The ⋮ menu on an open email card, as in the inbox (none of these do anything here yet).
const EMAIL_CARD_MENU = [
  { value: 'reply', label: 'Reply', icon: 'reply' },
  { value: 'forward', label: 'Forward', icon: 'forward' },
  { value: 'print', label: 'Print', icon: 'print' },
  { value: 'download', label: 'Download Message', icon: 'download' },
];

const byId = (id) => CONVERSATIONS.find((c) => c.id === id);
const keyOf = (c, m) => `${c.id}:${m.id}`;
const tabLabel = (c) => `${c.customer} • ${c.subject.length > 14 ? `${c.subject.slice(0, 12)}..` : c.subject}`;

const MERGE_ROW = {
  id: 'merge', kind: 'ticket', icon: <ArrowMerge size={14} />,
  text: `${CONVERSATIONS.length} conversations merged into ${TICKET.ticketId}`, time: TICKET.mergedTime,
};

/**
 * The emails, notes and activity of `conversations`, plus the merge row, oldest first. With `withTicket` (the Overview),
 * the ticket's own notes and activity from after the merge too. Activity rows that follow each other fold into one line.
 */
const timelineOf = (conversations, withTicket = false) => {
  const ids = conversations.map((c) => c.id);
  const history = HISTORY.filter((h) => (h.conv ? ids.includes(h.conv) : withTicket));
  return [
    ...conversations.flatMap((c) => c.messages.map((m) => ({ kind: 'email', at: m.at, key: keyOf(c, m), msg: m, conv: c }))),
    ...history.map((h) => (h.type === 'note' ? { kind: 'note', at: h.at, key: h.id, note: h.note } : { kind: 'activity', at: h.at, row: h.row })),
    { kind: 'activity', at: TICKET.mergedAt, row: MERGE_ROW },
  ].sort((a, b) => a.at - b.at);
};

const latestKey = (items) => items.filter((i) => i.kind === 'email').pop()?.key;

// The ticket's card in the inbox list: its first conversation's customer, the latest email and the email count.
const LATEST = timelineOf(CONVERSATIONS).filter((i) => i.kind === 'email').pop();
const TICKET_CARD = {
  id: TICKET.id,
  ticketId: TICKET.ticketId,
  sender: CONVERSATIONS[0].customer,
  customerEmail: CONVERSATIONS[0].email,
  subject: TICKET.subject,
  preview: LATEST.msg.body.replace(/\s+/g, ' ').trim(),
  time: LATEST.msg.time,
  threadCount: CONVERSATIONS.reduce((n, c) => n + c.messages.length, 0),
};

/**
 * An email card, open or folded. `onOpenInTab` (Overview only) shows the open-in-tab button beside the date on hover.
 * `target` briefly outlines the card after a jump from the Overview.
 */
function EmailCard({ id, msg, conv, open, onToggle, onOpenInTab, target }) {
  const fromAgent = msg.from === 'agent';
  const name = fromAgent ? AGENT.name : conv.customer;
  const to = fromAgent ? conv.customer : SUPPORT_NAME;
  const avatar = (
    <div className="convo-avatar" style={{ backgroundColor: fromAgent ? AGENT.avatarColor : conv.avatarColor }}>
      <span>{fromAgent ? AGENT.initial : conv.initial}</span>
    </div>
  );
  const openInTab = onOpenInTab && (
    <Tooltip content="Open in conversation tab" placement="left" portal>
      <button type="button" className="opt-open" aria-label={`Open in ${conv.customer}'s conversation tab`} onClick={(e) => { e.stopPropagation(); onOpenInTab(); }}>
        <Icon name="newtab" size={14} />
      </button>
    </Tooltip>
  );
  return (
    <div id={id} className={`opt-email${target ? ' is-target' : ''}`}>
      {open ? (
        <div className="convo-card">
          <div className="convo-card-header">
            {avatar}
            <div className="convo-info" onClick={onToggle} style={{ cursor: 'pointer' }}>
              <h3 className="convo-email">{name}</h3>
              <div className="convo-to">To: {to}</div>
            </div>
            <div className="header-actions-right">
              {openInTab}
              <span className="convo-time">{msg.time}</span>
              <button type="button" className="icon-btn" aria-label="Reply"><Icon name="reply" size={16} /></button>
              <ConversationMenu className="convo-card-menu" options={EMAIL_CARD_MENU} onSelect={() => {}} />
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
          {openInTab}
          <span className="convo-time">{msg.time}</span>
        </div>
      )}
    </div>
  );
}

export default function OptionPage() {
  const { user } = useCurrentUser();
  // Notes added on the ticket (Overview) from here; they join the Overview in time order.
  const [ticketNotes, setTicketNotes] = React.useState([]);
  const [composing, setComposing] = React.useState(false);
  const overview = React.useMemo(() => [
    ...timelineOf(CONVERSATIONS, true),
    ...ticketNotes.map((n) => ({ kind: 'note', at: n.at, key: n.id, note: n })),
  ].sort((a, b) => a.at - b.at), [ticketNotes]);
  const addNote = ({ body, attachments }) => {
    const now = new Date();
    const id = `ticket-note-${now.getTime()}`;
    setTicketNotes((notes) => [...notes, {
      id, authorId: user.id, author: user.name, initial: user.name.charAt(0), color: user.color,
      time: formatNoteTime(now), at: now.getTime(), body, attachments: attachments.length ? attachments : undefined,
    }]);
    setOpenNotes((o) => ({ ...o, [id]: true }));
    setComposing(false);
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
  };

  const [tab, setTab] = React.useState('conversation');
  const [view, setView] = React.useState('overview'); // 'overview' or a conversation id
  // Which emails are open, per view, so each tab keeps its own
  const [openByView, setOpenByView] = React.useState({ overview: [latestKey(overview)] });
  const [target, setTarget] = React.useState(null); // the email just jumped to, outlined for a moment
  const [openNotes, setOpenNotes] = React.useState({});
  const scrollRef = React.useRef(null);
  const targetTimer = React.useRef(0);

  // The ticket's own values
  const [assignee, setAssignee] = React.useState(TICKET.assignee);
  const [status, setStatus] = React.useState(TICKET.status);
  const [tags, setTags] = React.useState(TICKET.tags);
  const [customFields, setCustomFields] = React.useState(TICKET.customFields);

  const items = view === 'overview' ? overview : timelineOf([byId(view)]);
  const openKeys = openByView[view] ?? [latestKey(items)];
  const toggle = (key) => setOpenByView((all) => {
    const keys = all[view] ?? [latestKey(items)];
    return { ...all, [view]: keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key] };
  });

  // A view opens at its latest email, unless it was opened to show a particular one.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (target) document.getElementById(`opt-${view}-${target}`)?.scrollIntoView({ block: 'center' });
    else el.scrollTop = el.scrollHeight;
  }, [view, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const showView = (next) => { setTarget(null); setView(next); };
  // From the Overview: switch to the email's conversation tab, open that email there and scroll to it.
  const openInTab = (item) => {
    setOpenByView((all) => {
      const keys = all[item.conv.id] ?? [latestKey(timelineOf([item.conv]))];
      return { ...all, [item.conv.id]: keys.includes(item.key) ? keys : [...keys, item.key] };
    });
    setTarget(item.key);
    setView(item.conv.id);
    window.clearTimeout(targetTimer.current);
    targetTimer.current = window.setTimeout(() => setTarget(null), 1600);
  };

  const current = view !== 'overview' && byId(view);
  // The inbox the ticket is in; the sidebar can be clicked around, the list always shows this one ticket.
  const [activeFilter, setActiveFilter] = React.useState({ inbox: TICKET.inbox, type: 'Mine' });

  return (
    <div className="opt-page">
      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} activeRole="Admin" />
      <ConversationList conversations={[TICKET_CARD]} selectedId={TICKET.id} onSelect={() => {}} activeFilter={activeFilter} />
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
            {tab === 'conversation' && (
              <Tabs
                className="detail-tabs detail-email-tabs"
                aria-label="Merged conversations"
                value={view}
                onChange={showView}
                tabs={[
                  { value: 'overview', label: 'Overview' },
                  ...CONVERSATIONS.map((c) => ({ value: c.id, label: tabLabel(c), icon: <Icon name="mailbox" size={14} /> })),
                ]}
              />
            )}
          </div>
          {tab === 'slack' ? (
            <div className="detail-slack-placeholder text-body-small">Slack internal collaboration page</div>
          ) : (
            <div className="messages-container">
              {groupActivity(items).map((item) => (item.kind === 'activity' ? <ActivityGroup key={item.key} rows={item.rows} /> : item.kind === 'note' ? (
                <NoteCard
                  key={item.key}
                  note={item.note}
                  elementId={`opt-${view}-${item.key}`}
                  expanded={!!openNotes[item.key]}
                  onToggle={() => setOpenNotes((o) => ({ ...o, [item.key]: !o[item.key] }))}
                />
              ) : (
                <EmailCard
                  key={item.key}
                  id={`opt-${view}-${item.key}`}
                  msg={item.msg}
                  conv={item.conv}
                  open={openKeys.includes(item.key)}
                  onToggle={() => toggle(item.key)}
                  onOpenInTab={view === 'overview' ? () => openInTab(item) : undefined}
                  target={target === item.key && view !== 'overview'}
                />
              )))}
            </div>
          )}
        </div>
        {/* The ticket has no reply of its own; its Overview keeps Add note (emails are replied to from their cards) */}
        {tab === 'conversation' && view === 'overview' && (composing ? (
          <NoteComposer onSubmit={addNote} onCancel={() => setComposing(false)} />
        ) : (
          <div className="en-footer">
            <button type="button" className="en-footer__btn" onClick={() => setComposing(true)}><img src={noteIcon} alt="" />Add note</button>
          </div>
        ))}
      </div>
      <TicketRightPanel
        inboxName={TICKET.inbox}
        ticketId={TICKET.ticketId}
        ticketKey={TICKET.id}
        sla={TICKET.rt}
        assignee={assignee}
        onAssigneeChange={setAssignee}
        status={status}
        onStatusChange={setStatus}
        tagOptions={TAGS}
        tags={tags}
        onTagsChange={setTags}
        customFields={CUSTOM_FIELDS.map((f) => ({ ...f, value: customFields[f.id] }))}
        onCustomFieldChange={(id, value) => setCustomFields((all) => ({ ...all, [id]: value }))}
        account={TICKET.account}
        conversation={current ? {
          subject: current.subject,
          sla: current.frt,
          assignee: current.oldAssignee,
          status: current.oldStatus,
          contact: { name: current.customer, email: current.email, account: TICKET.account.name, conversations: current.contactConversations },
        } : undefined}
      />
    </div>
  );
}
