import React, { useState, useEffect } from 'react';
import './ConversationDetail.css';
import ReplySection from './ReplySection';
import { Tabs } from '../../components/Tabs';
import { Icon } from '../../icons/Icon';
import { ArrowMerge } from '../../icons/ArrowMerge';
import { MessagePlusSquare } from '../../icons/MessagePlusSquare';
import { Tooltip } from '../../components/Tooltip';
import { Popover } from '../../components/Popover';
import { Dropdown } from '../../components/Dropdown';
import { slackChannelFor } from '../data/slackChannels';
import TicketOverview, { emailTabLabel } from './TicketOverview';
import ConversationMenu, { VIEW_ONLY_NOTES } from './ConversationMenu';
// The Note icon from Figma (Activity - Notes › 12:24260), used as it is.
import noteIcon from '../assets/icons/note.svg';
import { useCurrentUser } from '../CurrentUser';
import { useEmailNotes } from '../EmailNotesStore';
import { useConversationFields } from '../ConversationFields';
import { groupActivity, seedActivity } from './notes/threadTimeline';
import { ActivityGroup, NoteCard, NoteComposer, NoteConfirm, PinnedNote, formatNoteTime } from './notes/EmailNotes';

// Icons
import titleUnread from '../assets/icons/title-unreaed.svg';
import titleMailbox from '../assets/icons/title-mailbox.svg';
import titlePrint from '../assets/icons/title-print.svg';
import titleAi from '../assets/icons/title-ai.svg';
import replyIcon from '../assets/icons/reply.svg';
import replyAllIcon from '../assets/icons/reply-all.svg';
import forwardIcon from '../assets/icons/forward.svg';
import kebabIcon from '../assets/icons/kebab-menu.svg';
import smallReplyIcon from '../assets/icons/small-reply.svg';
import smallForwardIcon from '../assets/icons/small-forward.svg';
import chevronDownIcon from '../assets/icons/s-chevron-down.svg';

const SUPPORT_EMAIL = 'support@hiver.com';

// Notes and activity live in the thread itself (ported from the "Activity and Notes - All Channels" prototype).
// Every email thread starts with one note from Michael after the first message.
const seedNotes = (conversation) => [{
  id: `seed-${conversation.id}`,
  authorId: 'michael',
  author: 'Michael Scott',
  initial: 'M',
  color: 'red',
  time: conversation.messages[0]?.time,
  body: "Checked their account: this looks related to last week's billing change. @Jim Halpert can you confirm before we reply?",
}];

// The ⋮ menu at the top right of an email (only "Reply", "Reply all" and "View only notes" do something here).
const EMAIL_MENU = [
  { value: 'reply', label: 'Reply', icon: 'reply' },
  { value: 'reply-all', label: 'Reply all', icon: 'replyall' },
  { value: 'forward', label: 'Forward', icon: 'forward' },
  { value: 'print', label: 'Print', icon: 'print' },
  { value: 'download', label: 'Download Message', icon: 'download' },
  { value: 'unread', label: 'Mark as unread', icon: 'markasunread' },
  VIEW_ONLY_NOTES,
  { value: 'delete', label: 'Delete conversation', icon: 'delete' },
];

const releaseFiles = (files) => files?.forEach((f) => URL.revokeObjectURL(f.url));

const hashOf = (id) => {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};

const ConversationDetail = ({ conversation, signatures, setSignatures, defaultSignatureId, emailTab: emailTabProp, onEmailTabChange, onMergeClick, onAddToTicketClick, onAddConversationClick }) => {
  const [expandedIds, setExpandedIds] = useState([]);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [tab, setTab] = useState('conversation');
  // A merged ticket: 'overview' (every email as a card) or the id of the email whose thread is open.
  // App can hold it (the right panel follows it); otherwise it is kept here.
  const [innerEmailTab, setInnerEmailTab] = useState('overview');
  const emailTab = emailTabProp ?? innerEmailTab;
  const setEmailTab = (value) => { setInnerEmailTab(value); onEmailTabChange?.(value); };

  const { user } = useCurrentUser();
  // Notes per conversation, shared by Michael and Jim, and the activity changes leave.
  const { threads, setThreads } = useEmailNotes();
  const { activityOf } = useConversationFields();
  const [openNoteIds, setOpenNoteIds] = useState({});
  const [composer, setComposer] = useState(null); // { mode: 'new' | 'reply' | 'edit', noteId? }
  const [confirm, setConfirm] = useState(null); // { kind: 'pin' | 'delete', id }
  const [highlightId, setHighlightId] = useState(null);
  // "View only notes" in the ⋮ menu: the thread shows its notes alone, without messages or activity.
  const [onlyNotes, setOnlyNotes] = useState(false);
  const scrollRef = React.useRef(null);
  const highlightTimer = React.useRef(0);

  useEffect(() => {
    if (conversation && conversation.messages.length > 0) {
      setExpandedIds([conversation.messages[0].id]);
      setActiveReplyId(null);
    }
    setTab('conversation');
    setEmailTab('overview');
    setOnlyNotes(false);
    setComposer(null);
    setConfirm(null);
  }, [conversation]);

  const emails = conversation?.emails;
  const openEmail = emails?.find((e) => String(e.id) === emailTab);
  const threadMessages = openEmail ? openEmail.messages : conversation?.messages ?? [];
  // Who a message went to: the customer's emails go to the support inbox, and support's replies go to the customer.
  const thread = openEmail ?? conversation;
  const customerEmail = thread?.customerEmail ?? thread?.messages?.find((m) => m.email !== SUPPORT_EMAIL)?.email;
  // Half the conversations show people by name ("David Chen", "Hiver Support"), the other half by email address,
  // picked from the conversation's id so it stays the same.
  const showNames = !!thread && hashOf(thread.id) % 2 === 1;
  const customerName = thread?.messages?.find((m) => m.email === customerEmail)?.sender;
  const labelOf = (email, name) => (!showNames ? email : email === SUPPORT_EMAIL ? 'Hiver Support' : name ?? email);
  const senderOf = (msg) => labelOf(msg.email, msg.sender);
  const recipientOf = (msg) => (msg.email === SUPPORT_EMAIL ? labelOf(customerEmail, customerName) : labelOf(SUPPORT_EMAIL));
  const selectEmail = (value) => {
    setEmailTab(value);
    const email = emails?.find((e) => String(e.id) === value);
    if (email?.messages.length) setExpandedIds([email.messages[0].id]);
    setActiveReplyId(null);
    setOnlyNotes(false);
    setComposer(null);
  };

  // The conversation whose notes and activity show: the email itself, or the open email tab of a merged ticket.
  // A merged ticket's Overview has none of its own yet.
  const source = openEmail ?? (emails ? null : conversation);
  const convoId = source ? String(source.id) : null;
  const notesThread = (convoId && threads[convoId]) || (source ? { notes: seedNotes(source), pin: null } : null);
  const updateThread = (fn) => setThreads((all) => ({ ...all, [convoId]: fn(all[convoId] || { notes: seedNotes(source), pin: null }) }));
  const findNote = (id) => notesThread?.notes.find((n) => n.id === id);

  const scrollToBottom = () => requestAnimationFrame(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  // A change made in the right panel scrolls the thread down to its new activity row.
  const activityCount = convoId ? activityOf(convoId).length : 0;
  const seenActivity = React.useRef({ convoId, count: activityCount });
  useEffect(() => {
    const seen = seenActivity.current;
    if (seen.convoId === convoId && activityCount > seen.count) scrollToBottom();
    seenActivity.current = { convoId, count: activityCount };
  }, [convoId, activityCount]);

  const openComposer = (next) => {
    setComposer(next);
    setActiveReplyId(null);
    if (next.mode !== 'edit') scrollToBottom();
  };

  const submitNote = ({ body, attachments }) => {
    if (composer.mode === 'edit') {
      updateThread((t) => ({
        ...t,
        notes: t.notes.map((n) => {
          if (n.id !== composer.noteId) return n;
          n.attachments?.forEach((f) => { if (!attachments.includes(f)) URL.revokeObjectURL(f.url); });
          const same = n.body === body && (n.attachments ?? []).map((f) => f.id).join() === attachments.map((f) => f.id).join();
          return same ? n : { ...n, body, attachments: attachments.length ? attachments : undefined, edited: true };
        }),
      }));
    } else {
      const replyTo = composer.mode === 'reply' ? findNote(composer.noteId) : null;
      const note = {
        id: `note-${Date.now()}`,
        authorId: user.id,
        author: user.name,
        initial: user.name.charAt(0),
        color: user.color,
        time: formatNoteTime(),
        at: Date.now(),
        body,
        attachments: attachments.length ? attachments : undefined,
        replyTo: replyTo ? { noteId: replyTo.id, authorId: replyTo.authorId, author: replyTo.author, body: replyTo.body } : undefined,
      };
      updateThread((t) => ({ ...t, notes: [...t.notes, note] }));
      scrollToBottom();
    }
    setComposer(null);
  };

  // A sent reply joins the thread as another email card, from the support inbox to the customer, opened.
  const sendReply = (body) => {
    const now = new Date();
    const reply = {
      id: `reply-${now.getTime()}`,
      sender: user.name,
      email: SUPPORT_EMAIL,
      time: formatNoteTime(now),
      at: now.getTime(),
      initial: user.name.charAt(0),
      avatarColor: `var(--pastel${user.color.charAt(0).toUpperCase()}${user.color.slice(1)}BorderDefault)`,
      body,
    };
    updateThread((t) => ({ ...t, replies: [...(t.replies ?? []), reply] }));
    setExpandedIds((ids) => [...ids, reply.id]);
    setActiveReplyId(null);
    scrollToBottom();
  };

  const deleteNote = (id) => {
    if (composer?.noteId === id) setComposer(null);
    releaseFiles(findNote(id)?.attachments);
    updateThread((t) => ({ ...t, notes: t.notes.filter((n) => n.id !== id), pin: t.pin?.id === id ? null : t.pin }));
  };

  const pinNote = (id) => {
    updateThread((t) => ({ ...t, pin: { id, by: { id: user.id, name: user.name } } }));
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; });
  };

  // Only one note can be pinned: pinning another asks first.
  const togglePin = (id) => {
    if (notesThread.pin?.id === id) updateThread((t) => ({ ...t, pin: null }));
    else if (notesThread.pin) setConfirm({ kind: 'pin', id });
    else pinNote(id);
  };

  const scrollToNote = (id) => {
    if (!findNote(id)) return;
    setOpenNoteIds((o) => ({ ...o, [`feed-${id}`]: true }));
    window.clearTimeout(highlightTimer.current);
    setHighlightId(id);
    highlightTimer.current = window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 1400);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(`email-note-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
  };

  const renderNote = (note, copy = 'feed') => (
    <NoteCard
      key={`${copy}-${note.id}`}
      note={note}
      elementId={copy === 'pin' ? `email-note-${note.id}-pin` : `email-note-${note.id}`}
      // The pinned copy and the note in the thread open and close on their own.
      // A reply to a note opens by default; other notes start closed.
      expanded={openNoteIds[`${copy}-${note.id}`] ?? !!note.replyTo}
      pinned={notesThread.pin?.id === note.id}
      highlighted={highlightId === note.id}
      onToggle={() => setOpenNoteIds((o) => ({ ...o, [`${copy}-${note.id}`]: !(o[`${copy}-${note.id}`] ?? !!note.replyTo) }))}
      onPin={() => togglePin(note.id)}
      onReply={() => openComposer({ mode: 'reply', noteId: note.id })}
      onQuoteClick={note.replyTo ? () => scrollToNote(note.replyTo.noteId) : undefined}
      // Only the person who wrote a note can edit or delete it.
      onEdit={note.authorId === user.id ? () => openComposer({ mode: 'edit', noteId: note.id }) : undefined}
      onDelete={note.authorId === user.id ? () => setConfirm({ kind: 'delete', id: note.id }) : undefined}
    />
  );

  // The ticket button's flyout: Add to an existing ticket (opens its sheet) / Convert to ticket (no action yet).
  const [ticketMenuOpen, setTicketMenuOpen] = useState(false);
  const ticketBtnRef = React.useRef(null);
  // Any press outside the button and the flyout closes it. Listened for in the capture phase, so a click handler
  // that stops the event on its way up can't keep the flyout open.
  useEffect(() => {
    if (!ticketMenuOpen) return undefined;
    const onDown = (e) => {
      if (ticketBtnRef.current?.contains(e.target) || e.target.closest?.('.detail-ticket-menu')) return;
      setTicketMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [ticketMenuOpen]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleReplyAll = (e, id) => {
    e.stopPropagation();
    setComposer(null);
    setActiveReplyId(prev => prev === id ? null : id);
    scrollToBottom();
  };

  // An email card: open (header, body, Reply / Forward) or folded to one line. Clicking the header toggles it.
  const renderMessage = (msg) => {
    const isExpanded = expandedIds.includes(msg.id);
    return (
      isExpanded ? (
        <div className="convo-card">
          <div className="convo-card-header">
            <div className="convo-avatar" style={{ backgroundColor: msg.avatarColor }}>
              <span>{msg.initial}</span>
            </div>
            <div className="convo-info" onClick={() => toggleExpand(msg.id)} style={{ cursor: 'pointer' }}>
              <h3 className="convo-email">{senderOf(msg)}</h3>
              <div className="convo-to">
                To: {recipientOf(msg)} <img src={chevronDownIcon} alt="Expand" width="14" height="14" style={{ marginLeft: 4 }} />
              </div>
            </div>
            <div className="header-actions-right">
              <span className="convo-time">{msg.time}</span>
              <button className="icon-btn" onClick={(e) => handleReplyAll(e, msg.id)}>
                 <img src={replyAllIcon} alt="Reply All" width="16" height="16" />
              </button>
              <button className="icon-btn">
                 <img src={kebabIcon} alt="More" width="16" height="16" />
              </button>
            </div>
          </div>
          <div className="convo-body">
            {msg.body.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}<br />
              </React.Fragment>
            ))}
          </div>
          <button className="btn-more-content">...</button>
          <div className="convo-actions">
            <button className="convo-btn" onClick={(e) => handleReplyAll(e, msg.id)}>
              <img src={smallReplyIcon} alt="" width="14" height="14" /> Reply
            </button>
            <button className="convo-btn">
              <img src={smallForwardIcon} alt="" width="14" height="14" /> Forward
            </button>
          </div>
        </div>
      ) : (
        <div className="convo-card-collapsed" onClick={() => toggleExpand(msg.id)}>
          <div className="convo-avatar" style={{ backgroundColor: msg.avatarColor }}>
            <span>{msg.initial}</span>
          </div>
          <div className="convo-info">
            <h3 className="convo-email">{senderOf(msg)}</h3>
            <p className="collapsed-text">{msg.body.substring(0, 80)}...</p>
          </div>
          <span className="convo-time">{msg.time}</span>
        </div>
      )
    );
  };

  if (!conversation) return <div className="conversation-detail">Select a conversation</div>;

  // What sits between the messages: the starting history and the first note after the first message, then
  // new notes and activity (right panel changes, joining a ticket) after the last one, grouped as in Front.
  const lastIndex = threadMessages.length - 1;
  const activity = source ? seedActivity({ id: source.id, firstTime: source.messages[0]?.time }) : { first: [], last: [] };
  const seedIds = new Set(source ? seedNotes(source).map((n) => n.id) : []);
  const later = source ? [
    ...notesThread.notes.filter((n) => !seedIds.has(n.id)).map((n) => ({ kind: 'note', at: n.at ?? 0, note: n })),
    ...activityOf(source.id).map((row) => ({ kind: 'activity', at: row.at, row })),
    ...(notesThread.replies ?? []).map((msg) => ({ kind: 'message', at: msg.at, key: msg.id, msg })),
  ].sort((a, b) => a.at - b.at) : [];
  const asActivity = (rows) => rows.map((row) => ({ kind: 'activity', row }));
  const itemsAfter = (index) => {
    if (!source) return [];
    const items = [];
    if (index === 0) items.push(...asActivity(activity.first), ...notesThread.notes.filter((n) => seedIds.has(n.id)).map((note) => ({ kind: 'note', note })));
    if (index === lastIndex) items.push(...asActivity(activity.last), ...later);
    return groupActivity(items);
  };
  const pinned = notesThread?.pin ? findNote(notesThread.pin.id) : null;
  // The Reply / Add note footer shows wherever a thread does (not on the Slack tab or a merged ticket's Overview).
  const showThread = tab !== 'slack' && !!source;

  return (
    <div className="conversation-detail">
      {/* Upper Bar */}
      <div className="detail-header">
        <div className="header-left">
          <button className="icon-btn">
             <img src={titleUnread} alt="Unread" width="16" height="16" />
          </button>
          <button className="icon-btn">
             <img src={titleMailbox} alt="Mailbox" width="16" height="16" />
          </button>
          <button className="icon-btn">
             <img src={titlePrint} alt="Print" width="16" height="16" />
          </button>
          <button className="icon-btn">
             <img src={titleAi} alt="AI" width="16" height="16" />
          </button>
          {/* Ticket and conversation actions. None of them do anything yet. */}
          {conversation.ticketId ? (
            <Tooltip content="Add conversation" placement="bottom">
              <button type="button" className="icon-btn" aria-label="Add conversation" onClick={onAddConversationClick}><MessagePlusSquare size={16} /></button>
            </Tooltip>
          ) : (
            <>
              <button ref={ticketBtnRef} type="button" className={`icon-btn${ticketMenuOpen ? ' is-active' : ''}`} aria-label="Ticket" aria-haspopup="menu" aria-expanded={ticketMenuOpen} onClick={() => setTicketMenuOpen((o) => !o)}>
                <Icon name="ticket" size={16} />
              </button>
              <Popover open={ticketMenuOpen} onClose={() => setTicketMenuOpen(false)} anchorRef={ticketBtnRef}>
                <Dropdown
                  className="detail-ticket-menu"
                  options={[
                    { value: 'add', label: 'Add to an existing ticket' },
                    { value: 'convert', label: 'Convert to ticket' },
                  ]}
                  onChange={(value) => { setTicketMenuOpen(false); if (value === 'add') onAddToTicketClick?.(); }}
                />
              </Popover>
              <Tooltip content="Merge conversations" placement="bottom">
                <button type="button" className="icon-btn" aria-label="Merge conversations" onClick={onMergeClick}><ArrowMerge /></button>
              </Tooltip>
            </>
          )}
          <Tooltip content="Delete" placement="bottom">
            <button type="button" className="icon-btn" aria-label="Delete"><Icon name="delete" size={16} /></button>
          </Tooltip>
        </div>
      </div>

      {/* Scrollable Area */}
      <div className="detail-scroll-area" ref={scrollRef}>
        {/* Subject Bar */}
        <div className="subject-bar-detail">
          <h1 className="subject-text-large text-label-medium">{conversation.subject}</h1>
          <div className="subject-actions">
             <button className="icon-btn" onClick={(e) => handleReplyAll(e, expandedIds[0] || (conversation.messages.length > 0 ? conversation.messages[0].id : null))}>
               <img src={replyIcon} alt="Reply" width="16" height="16" />
             </button>
             <button className="icon-btn" onClick={(e) => handleReplyAll(e, expandedIds[0])}>
               <img src={replyAllIcon} alt="Reply All" width="16" height="16" />
             </button>
             <button className="icon-btn">
               <img src={forwardIcon} alt="Forward" width="16" height="16" />
             </button>
             {source && (
               <ConversationMenu
                 options={EMAIL_MENU}
                 onlyNotes={onlyNotes}
                 onSelect={(value) => {
                   const last = threadMessages[lastIndex]?.id;
                   if (value === VIEW_ONLY_NOTES.value) setOnlyNotes((on) => !on);
                   else if (value === 'reply' || value === 'reply-all') setActiveReplyId(last);
                 }}
               />
             )}
          </div>
        </div>

        {/* Conversation and its Slack channel (Figma 4026:14306). Only the tab itself is built for now. */}
        <Tabs
          className="detail-tabs"
          aria-label="Conversation views"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'conversation', label: 'Conversation' },
            { value: 'slack', label: slackChannelFor(conversation.id), icon: <Icon name="slack" size={14} /> },
          ]}
        />

        {/* The Slack tab is a placeholder for now; the email thread shows on the Conversation tab */}
        {tab === 'slack' ? (
          <div className="detail-slack-placeholder text-body-small">Slack internal collaboration page</div>
        ) : (
        <>
        {/* A merged ticket: Overview, then a tab per merged email (Figma 4028:16172) */}
        {emails && (
          <Tabs
            className="detail-tabs detail-email-tabs"
            aria-label="Merged conversations"
            value={emailTab}
            onChange={selectEmail}
            tabs={[{ value: 'overview', label: 'Overview' }, ...emails.map((e) => ({ value: String(e.id), label: emailTabLabel(e), icon: <Icon name="mailbox" size={14} /> }))]}
          />
        )}
        {emails && emailTab === 'overview' ? (
          <TicketOverview ticketId={conversation.id} emails={emails} onOpen={selectEmail} />
        ) : (
        <div className="messages-container">
          {pinned && <PinnedNote by={notesThread.pin.by}>{renderNote(pinned, 'pin')}</PinnedNote>}
          {onlyNotes && (notesThread.notes.length
            ? notesThread.notes.map((n) => renderNote(n))
            : <p className="en-notes-empty">No notes in this conversation yet.</p>)}
          {!onlyNotes && threadMessages.map((msg, index) => {
            return (
              <React.Fragment key={msg.id}>
                {renderMessage(msg)}

                {itemsAfter(index).map((item) => {
                  if (item.kind === 'note') return renderNote(item.note);
                  if (item.kind === 'message') return <React.Fragment key={item.key}>{renderMessage(item.msg)}</React.Fragment>;
                  return <ActivityGroup key={item.key} rows={item.rows} />;
                })}
              </React.Fragment>
            );
          })}
          {activeReplyId && source && (
            <ReplySection
              key={activeReplyId}
              recipientEmail={customerEmail}
              signatures={signatures}
              setSignatures={setSignatures}
              defaultSignatureId={defaultSignatureId}
              currentInbox={conversation.inbox}
              onSend={sendReply}
              onDiscard={(e) => {
                e.stopPropagation();
                setActiveReplyId(null);
              }}
            />
          )}
        </div>
        )}
        </>
        )}
      </div>

      {showThread && (composer ? (
        <NoteComposer
          key={`${composer.mode}-${composer.noteId ?? 'new'}`}
          editing={composer.mode === 'edit' ? findNote(composer.noteId) : undefined}
          replyTo={composer.mode === 'reply' ? findNote(composer.noteId) : undefined}
          onQuoteClick={() => scrollToNote(composer.noteId)}
          onSubmit={submitNote}
          onCancel={() => setComposer(null)}
        />
      ) : !activeReplyId && (
        <div className="en-footer">
          <button type="button" className="en-footer__btn" onClick={(e) => handleReplyAll(e, threadMessages[lastIndex]?.id)}><Icon name="reply" size={16} />Reply</button>
          <button type="button" className="en-footer__btn" onClick={() => openComposer({ mode: 'new' })}><img src={noteIcon} alt="" />Add note</button>
        </div>
      ))}

      {confirm?.kind === 'pin' && (
        <NoteConfirm
          title="Replace pinned note?"
          text="Only one note can be pinned. Replace the note that’s already pinned?"
          confirmLabel="Replace"
          onClose={() => setConfirm(null)}
          onConfirm={() => { pinNote(confirm.id); setConfirm(null); }}
        />
      )}
      {confirm?.kind === 'delete' && (
        <NoteConfirm
          title="Delete this note?"
          text="This note will be removed from the conversation."
          confirmLabel="Delete"
          icon="delete"
          danger
          onClose={() => setConfirm(null)}
          onConfirm={() => { deleteNote(confirm.id); setConfirm(null); }}
        />
      )}
    </div>
  );
};

export default ConversationDetail;
