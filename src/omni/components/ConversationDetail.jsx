import React, { useState, useEffect } from 'react';
import './ConversationDetail.css';
import ReplySection from './ReplySection';
import { Tabs } from '../../components/Tabs';
import { Icon } from '../../icons/Icon';
import { MessagePlusSquare } from '../../icons/MessagePlusSquare';
import { Tooltip } from '../../components/Tooltip';
import { Popover } from '../../components/Popover';
import { Dropdown } from '../../components/Dropdown';
import { slackChannelFor, slackChannelsFor } from '../data/slackChannels';
// ClickUp's logo (Figma: Tickets Add/Merge › 4089:2893), as exported
import clickupIcon from '../assets/icons/clickup.svg';
// Slack's colour logo (Figma: Tickets Add/Merge › 4089:2233), as exported
import slackLogo from '../assets/icons/slack-logo.svg';
import { emailTabLabel } from './emailTabLabel';
import { frtOf } from '../data/sla';
import { Badge } from '../../components/Badge';
import { ArrowBarToLeft } from '../../icons/TablerPanelIcons';
import HoverHighlight from './HoverHighlight';
import ConversationMenu, { VIEW_ONLY_NOTES } from './ConversationMenu';
// The Note icon from Figma (Activity - Notes › 12:24260), used as it is.
import noteIcon from '../assets/icons/note.svg';
import { useCurrentUser } from '../CurrentUser';
import { useEmailNotes } from '../EmailNotesStore';
import { useConversationFields } from '../ConversationFields';
import { groupActivity, seedActivity } from './notes/threadTimeline';
import { ActivityGroup, NoteCard, NoteComposer, NoteConfirm, PinnedNote, formatNoteTime } from './notes/EmailNotes';

// Icons
import titlePrint from '../assets/icons/title-print.svg';
import replyIcon from '../assets/icons/reply.svg';
import replyAllIcon from '../assets/icons/reply-all.svg';
import forwardIcon from '../assets/icons/forward.svg';
import smallReplyIcon from '../assets/icons/small-reply.svg';
import smallForwardIcon from '../assets/icons/small-forward.svg';
import chevronDownIcon from '../assets/icons/s-chevron-down.svg';

const SUPPORT_EMAIL = 'support@hiver.com';

// Notes and activity live in the thread itself (ported from the "Activity and Notes - All Channels" prototype).
// Every email thread starts with one note from Michael after the first message.
const seedNotes = (conversation) => (conversation.emails ? [] : [{
  id: `seed-${conversation.id}`,
  authorId: 'michael',
  author: 'Michael Scott',
  initial: 'M',
  color: 'red',
  time: conversation.messages[0]?.time,
  body: "Checked their account: this looks related to last week's billing change. @Jim Halpert can you confirm before we reply?",
}]); // a merged ticket starts with no notes of its own

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

// The ⋮ menu on an open email card.
const EMAIL_CARD_MENU = [
  { value: 'reply', label: 'Reply', icon: 'reply' },
  { value: 'forward', label: 'Forward', icon: 'forward' },
  { value: 'print', label: 'Print', icon: 'print' },
  { value: 'download', label: 'Download Message', icon: 'download' },
];

const releaseFiles = (files) => files?.forEach((f) => URL.revokeObjectURL(f.url));

const hashOf = (id) => {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};

const customerEmailOf = (thread) => thread?.customerEmail ?? thread?.messages?.find((m) => m.email !== SUPPORT_EMAIL)?.email;
// The customer's name, from their own emails (their address when none has a name).
const contactNameOf = (thread) => {
  const email = customerEmailOf(thread);
  return thread?.messages?.find((m) => m.email === email)?.sender ?? email;
};

// How a thread names people: half the conversations show them by name ("David Chen", "Hiver Support"), the other half
// by email address, picked from the conversation's id so it stays the same. The customer's emails go to the support
// inbox, and support's replies go to the customer.
const peopleOf = (thread) => {
  const customerEmail = customerEmailOf(thread);
  const showNames = !!thread && hashOf(thread.id) % 2 === 1;
  const customerName = thread?.messages?.find((m) => m.email === customerEmail)?.sender;
  const labelOf = (email, name) => (!showNames ? email : email === SUPPORT_EMAIL ? 'Hiver Support' : name ?? email);
  return {
    senderOf: (msg) => labelOf(msg.email, msg.sender),
    recipientOf: (msg) => (msg.email === SUPPORT_EMAIL ? labelOf(customerEmail, customerName) : labelOf(SUPPORT_EMAIL)),
  };
};

// A merged ticket's tabs. When they don't all fit, the ones that don't go into "More ▾" at the end of the row: its red
// badge counts how many of them are unread (conversations, not emails), and its list shows each with the tabs'
// blue unread dot and overdue FRT ⚡.
// The selected tab always stays in the row.
const MORE_WIDTH = 104; // room kept for "More (n) ▾"
function TicketTabs({ tabs, value, onChange }) {
  const rowRef = React.useRef(null);
  const measureRef = React.useRef(null);
  const moreRef = React.useRef(null);
  const [fit, setFit] = useState(tabs.length);
  const [open, setOpen] = useState(false);

  React.useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;
    const measure = () => {
      const widths = [...(measureRef.current?.querySelectorAll('.hot-tab') ?? [])].map((el) => el.getBoundingClientRect().width);
      const gap = 4;
      const room = row.clientWidth;
      const total = widths.reduce((sum, w) => sum + w, 0) + gap * Math.max(widths.length - 1, 0);
      if (total <= room) { setFit(widths.length); return; }
      let used = 0;
      let n = 0;
      while (n < widths.length && used + widths[n] + (n ? gap : 0) <= room - MORE_WIDTH) { used += widths[n] + (n ? gap : 0); n += 1; }
      setFit(Math.max(n, 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [tabs.length]);

  // The first `fit` tabs, but with the selected one swapped in for the last if it would be hidden
  const at = tabs.findIndex((t) => t.value === value);
  let shown = tabs.slice(0, fit);
  if (at >= fit) shown = [...tabs.slice(0, Math.max(fit - 1, 1)), tabs[at]];
  const hidden = tabs.filter((t) => !shown.includes(t));
  const hiddenUnread = hidden.filter((t) => t.unread).length;
  const strip = (t) => ({ value: t.value, label: t.label, icon: t.icon });

  return (
    <div className="detail-ticket-tabs-row" ref={rowRef}>
      <Tabs className="detail-tabs detail-ticket-tabs" aria-label="Merged conversations" value={value} onChange={onChange} tabs={shown.map(strip)} />
      {hidden.length > 0 && (
        <>
          <button ref={moreRef} type="button" className={`detail-tabs-more${open ? ' is-open' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            More
            {hiddenUnread > 0 && <Badge type="important">{hiddenUnread}</Badge>}
            <Icon name="chevrondown" size={14} />
          </button>
          <Popover open={open} onClose={() => setOpen(false)} anchorRef={moreRef} placement="bottom-end">
            <div className="detail-tabs-more__menu" role="menu" aria-label="More conversations">
              {hidden.map((t) => (
                <button key={t.value} type="button" role="menuitem" className="detail-tabs-more__item" onClick={() => { setOpen(false); onChange(t.value); }}>
                  {t.icon}
                  <span className="detail-tabs-more__label">{t.menuLabel ?? t.label}</span>
                  {t.unread && <span className="detail-email-chip__unread" role="img" aria-label="Unread" />}
                  {t.frt && (
                    <Tooltip content="First response time overdue" placement="top" portal>
                      <span className="detail-email-chip__frt" role="img" aria-label="First response time overdue"><Icon name="boltfilled" size={12} /></span>
                    </Tooltip>
                  )}
                </button>
              ))}
            </div>
          </Popover>
        </>
      )}
      {/* Every tab at full width, off screen, to measure what fits */}
      <div className="detail-ticket-tabs-measure" ref={measureRef} aria-hidden="true">
        <Tabs className="detail-tabs detail-ticket-tabs" value={value} onChange={() => {}} tabs={tabs.map(strip)} />
      </div>
    </div>
  );
}

// The Slack logo on a tab: in the tab's text colour (so it follows inactive and hover) and in full colour when the
// tab is active. Both are drawn; the CSS shows one by the tab's state.
const SlackTabIcon = () => (
  <span className="detail-slack-logo detail-slack-logo--tab">
    <img className="detail-slack-logo__color" src={slackLogo} alt="" />
    <span className="detail-slack-logo__mono" style={{ WebkitMaskImage: `url(${slackLogo})`, maskImage: `url(${slackLogo})` }} />
  </span>
);

const ConversationDetail = ({ conversation, signatures, setSignatures, defaultSignatureId, emailTab: emailTabProp, onEmailTabChange, onAddToTicketClick, onAddConversationClick, panelCollapsed, onExpandPanel }) => {
  const [expandedIds, setExpandedIds] = useState([]);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [tab, setTab] = useState('conversation');
  // A merged ticket: the id of the conversation whose thread is open (there's no Overview).
  // App can hold it (the right panel follows it); otherwise it is kept here.
  const [innerEmailTab, setInnerEmailTab] = useState(null);
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
  // Emails whose "..." is open, showing the earlier email they replied to.
  const [quotedIds, setQuotedIds] = useState([]);
  const scrollRef = React.useRef(null);
  const highlightTimer = React.useRef(0);

  useEffect(() => {
    if (conversation && conversation.messages.length > 0) {
      setExpandedIds([conversation.messages[0].id]);
      setActiveReplyId(null);
    }
    setTab('conversation');
    setOnlyNotes(false);
    setComposer(null);
    setConfirm(null);
    // A ticket opens on its first unread conversation, else its first one
    if (conversation?.emails?.length) {
      const first = conversation.emails.find((e) => isUnread(e)) ?? conversation.emails[0];
      selectEmail(String(first.id));
    } else {
      setEmailTab(null);
    }
  }, [conversation]);

  const emails = conversation?.emails;
  const openEmail = emails?.find((e) => String(e.id) === emailTab);
  const threadMessages = openEmail ? openEmail.messages : conversation?.messages ?? [];
  // Who a message went to: the customer's emails go to the support inbox, and support's replies go to the customer.
  const thread = openEmail ?? conversation;
  const customerEmail = customerEmailOf(thread);
  const { senderOf, recipientOf } = peopleOf(thread);
  // A merged conversation is unread (blue dot on its chip) while its latest email is from the customer, until its
  // chip is opened.
  const [readIds, setReadIds] = useState([]);
  const isUnread = (email) => {
    const saved = threads[String(email.id)];
    const latest = [...email.messages, ...(saved?.replies ?? [])].pop();
    return !!latest && latest.email !== 'support@hiver.com' && !saved?.replies?.length && !readIds.includes(String(email.id));
  };
  const selectEmail = (value) => {
    setTab('conversation');
    setReadIds((ids) => (ids.includes(value) ? ids : [...ids, value]));
    setEmailTab(value);
    const email = emails?.find((e) => String(e.id) === value);
    if (email?.messages.length) setExpandedIds([email.messages[0].id]);
    setActiveReplyId(null);
    setOnlyNotes(false);
    setComposer(null);
  };

  // The conversation whose notes and activity show: the email itself, or a merged ticket (its own notes; its
  // conversations' emails, notes and activity join its timeline).
  const source = openEmail ?? conversation;
  // The Slack channels the open conversation is shared to (none on a ticket's Overview).
  const channels = openEmail ? slackChannelsFor(openEmail.id) : [];
  // A merged ticket's Slack channels: every channel any of its conversations is shared to, each once (new-ui tabs)
  // Rows a ⌘ + hover demo highlight attaches to (merged tickets)
  const tabsRowRef = React.useRef(null);
  // The ⌘ + hover highlight on the tabs row covers the Slack channel tabs and the add button, not "Conversation"
  const slackTabsBox = (row) => {
    const parts = [...row.querySelectorAll('.hot-tab')].slice(1);
    const add = row.querySelector('.detail-email-chip--add');
    if (add) parts.push(add);
    if (!parts.length) return null;
    const rects = parts.map((p) => p.getBoundingClientRect());
    const rowRect = row.getBoundingClientRect();
    // Full row height, so it lines up with the row as before; 4px past the ends
    return { left: Math.min(...rects.map((r) => r.left)) - 4, right: Math.max(...rects.map((r) => r.right)) + 4, top: rowRect.top, bottom: rowRect.bottom };
  };
  const chipsRowRef = React.useRef(null);
  const ticketChannels = emails ? [...new Set(emails.flatMap((e) => slackChannelsFor(e.id)))] : [];
  const convoId = source ? String(source.id) : null;
  const notesThread = (convoId && threads[convoId]) || (source ? { notes: seedNotes(source), pin: null } : null);
  const updateThreadOf = (id, seedFrom, fn) => setThreads((all) => ({ ...all, [id]: fn(all[id] || { notes: seedNotes(seedFrom), pin: null }) }));
  const updateThread = (fn) => updateThreadOf(convoId, source, fn);
  const findNote = (id) => notesThread?.notes.find((n) => n.id === id);
  // A merged ticket's own notes (posted with "Also post on TKT#…"): they show in every conversation of it, with the
  // same actions as a conversation's notes, which act on the ticket's copy. `scope` 'ticket' picks them.
  const ticketKey = conversation?.emails ? String(conversation.id) : null;
  const ticketThread = ticketKey ? (threads[ticketKey] ?? { notes: [], pin: null }) : null;
  const threadIn = (scope) => (scope === 'ticket' ? ticketThread : notesThread);
  const updateIn = (scope, fn) => (scope === 'ticket' ? updateThreadOf(ticketKey, conversation, fn) : updateThread(fn));
  const findNoteIn = (scope, id) => threadIn(scope)?.notes.find((n) => n.id === id);

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

  // Cancel / Add: the composer shrinks back into the footer first (see .en-composer-wrap.is-closing), then goes.
  const [composerClosing, setComposerClosing] = useState(false);
  const closeTimer = React.useRef(0);
  const closeComposer = () => {
    setComposerClosing(true);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => { setComposer(null); setComposerClosing(false); }, 220);
  };
  const openComposer = (next) => {
    window.clearTimeout(closeTimer.current);
    setComposerClosing(false);
    setComposer(next);
    setActiveReplyId(null);
    if (next.mode !== 'edit') scrollToBottom();
  };

  const submitNote = ({ body, attachments, onTicket }) => {
    const scope = composer.scope;
    if (composer.mode === 'edit') {
      updateIn(scope, (t) => ({
        ...t,
        notes: t.notes.map((n) => {
          if (n.id !== composer.noteId) return n;
          n.attachments?.forEach((f) => { if (!attachments.includes(f)) URL.revokeObjectURL(f.url); });
          const same = n.body === body && (n.attachments ?? []).map((f) => f.id).join() === attachments.map((f) => f.id).join();
          return same ? n : { ...n, body, attachments: attachments.length ? attachments : undefined, edited: true };
        }),
      }));
    } else {
      const replyTo = composer.mode === 'reply' ? findNoteIn(scope, composer.noteId) : null;
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
      // "Also post on TKT#…": the note goes on the ticket (it shows in every conversation of it), marked with the
      // conversation it was written in.
      // A reply to a ticket note goes on the ticket too.
      if (onTicket || scope === 'ticket') updateThreadOf(String(conversation.id), conversation, (t) => ({ ...t, notes: [...t.notes, { ...note, fromId: convoId }] }));
      else updateThread((t) => ({ ...t, notes: [...t.notes, note] }));
      scrollToBottom();
    }
    closeComposer();
  };

  // A sent reply joins the thread as another email card, from the support inbox to the customer, opened.
  // On a merged ticket it goes to the conversation of the email being replied to (`email`).
  const sendReply = (body, email) => {
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
    if (email) updateThreadOf(String(email.id), email, (t) => ({ ...t, replies: [...(t.replies ?? []), reply] }));
    else {
      updateThread((t) => ({ ...t, replies: [...(t.replies ?? []), reply] }));
      setExpandedIds((ids) => [...ids, reply.id]);
    }
    setActiveReplyId(null);
    scrollToBottom();
  };

  const deleteNote = (id, scope) => {
    if (composer?.noteId === id) setComposer(null);
    releaseFiles(findNoteIn(scope, id)?.attachments);
    updateIn(scope, (t) => ({ ...t, notes: t.notes.filter((n) => n.id !== id), pin: t.pin?.id === id ? null : t.pin }));
  };

  const pinNote = (id, scope) => {
    updateIn(scope, (t) => ({ ...t, pin: { id, by: { id: user.id, name: user.name } } }));
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; });
  };

  // Only one note can be pinned (one on the conversation, one on the ticket): pinning another asks first.
  const togglePin = (id, scope) => {
    const t = threadIn(scope);
    if (t.pin?.id === id) updateIn(scope, (x) => ({ ...x, pin: null }));
    else if (t.pin) setConfirm({ kind: 'pin', id, scope });
    else pinNote(id, scope);
  };

  const scrollToNote = (id, scope) => {
    if (!findNoteIn(scope, id)) return;
    setOpenNoteIds((o) => ({ ...o, [scope === 'ticket' ? `ticket-${id}` : `feed-${id}`]: true }));
    window.clearTimeout(highlightTimer.current);
    setHighlightId(id);
    highlightTimer.current = window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 1400);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(scope === 'ticket' ? `email-note-ticket-${id}` : `email-note-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  };

  // On a merged ticket, a reply goes to the conversation of the email it answers (ids there are "<email id>:<message id>").
  const emailOfReply = conversation?.emails && activeReplyId ? conversation.emails.find((e) => activeReplyId.startsWith(`${e.id}:`)) : null;
  // `msg` is the email being replied to: the reply box's "..." shows it.
  const renderReplyBox = (msg, people) => (
    <ReplySection
      key={activeReplyId}
      quotedEmail={{ time: msg.time, sender: people.senderOf(msg), body: msg.body }}
      recipientName={contactNameOf(emailOfReply ?? thread)}
      recipientEmail={emailOfReply ? customerEmailOf(emailOfReply) : customerEmail}
      signatures={signatures}
      setSignatures={setSignatures}
      defaultSignatureId={defaultSignatureId}
      currentInbox={conversation.inbox}
      onSend={(body) => sendReply(body, emailOfReply ?? undefined)}
      onDiscard={(e) => {
        e.stopPropagation();
        setActiveReplyId(null);
      }}
    />
  );

  // An email card: open (header, body, Reply / Forward) or folded to one line. Clicking the header toggles it.
  // `quoted` is the earlier email this one replied to, shown under "..."; `people` names the sender and recipient;
  const renderMessage = (msg, { quoted, people = { senderOf, recipientOf } } = {}) => {
    const isExpanded = expandedIds.includes(msg.id);
    const toggle = () => toggleExpand(msg.id);
    const isQuoted = quotedIds.includes(msg.id);
    const cardProps = { id: `email-card-${msg.id}` };
    return (
      <>
      {isExpanded ? (
        <div className="convo-card" {...cardProps}>
          <div className="convo-card-header">
            <div className="convo-avatar" style={{ backgroundColor: msg.avatarColor }}>
              <span>{msg.initial}</span>
            </div>
            <div className="convo-info" onClick={toggle} style={{ cursor: 'pointer' }}>
              <h3 className="convo-email">{people.senderOf(msg)}</h3>
              <div className="convo-to">
                To: {people.recipientOf(msg)} <img src={chevronDownIcon} alt="Expand" width="14" height="14" style={{ marginLeft: 4 }} />
              </div>
            </div>
            <div className="header-actions-right">
              <span className="convo-time">{msg.time}</span>
              <button className="icon-btn" onClick={(e) => handleReplyAll(e, msg.id)}>
                 <img src={replyIcon} alt="Reply" width="16" height="16" />
              </button>
              {/* ⋮ on an email: Reply opens the reply box under it; the rest have no action yet */}
              <ConversationMenu
                className="convo-card-menu"
                options={EMAIL_CARD_MENU}
                onSelect={(value) => { if (value === 'reply') setActiveReplyId(msg.id); }}
              />
            </div>
          </div>
          <div className="convo-body">
            {msg.body.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}<br />
              </React.Fragment>
            ))}
          </div>
          {/* "..." shows the earlier email this one replied to, as a mail client quotes it (the first email has none) */}
          {quoted && (
            <button
              type="button"
              className={`btn-more-content${isQuoted ? ' is-open' : ''}`}
              aria-expanded={isQuoted}
              aria-label={isQuoted ? 'Hide trimmed content' : 'Show trimmed content'}
              onClick={() => setQuotedIds((ids) => (ids.includes(msg.id) ? ids.filter((x) => x !== msg.id) : [...ids, msg.id]))}
            ><Icon name="hmore" size={14} /></button>
          )}
          {quoted && isQuoted && (
            <div className="convo-quote">
              <p className="convo-quote__meta">On {quoted.time}, {people.senderOf(quoted)} wrote:</p>
              {quoted.body.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
            </div>
          )}
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
        <div className="convo-card-collapsed" onClick={toggle} {...cardProps}>
          <div className="convo-avatar" style={{ backgroundColor: msg.avatarColor }}>
            <span>{msg.initial}</span>
          </div>
          <div className="convo-info">
            <h3 className="convo-email">{people.senderOf(msg)}</h3>
            {/* The whole email on one line, cut with "…" where the card ends (so a wider card shows more) */}
            <p className="collapsed-text">{msg.body.replace(/\s+/g, ' ').trim()}</p>
          </div>
          <span className="convo-time">{msg.time}</span>
        </div>
      )}
      {/* The reply box opens right below the email whose Reply was clicked */}
      {activeReplyId === msg.id && renderReplyBox(msg, people)}
      </>
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
    // In a merged conversation's tab, changes made on the ticket (tags, assignee, status, custom fields) show too,
    // marked "Ticket". The Overview shows them as they are.
    ...(openEmail ? activityOf(conversation.id).map((row) => ({ kind: 'activity', at: row.at, row: { ...row, id: `ticket-${row.id}`, prefix: 'Ticket' } })) : []),
    // A note added on the Overview belongs to the ticket and shows in every conversation (read-only there).
    ...(openEmail ? (threads[String(conversation.id)]?.notes ?? []).map((n) => ({ kind: 'note', at: n.at ?? 0, note: n, ticketNote: true })) : []),
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
  // The thread's emails in order, so each one can quote the email before it under "...".
  const threadEmails = [...threadMessages, ...(notesThread?.replies ?? [])];
  const previousOf = (list, msg) => list[list.findIndex((m) => m.id === msg.id) - 1];

  // A ticket note inside a conversation's tab: worded "added a note on the ticket" so it isn't mistaken for the
  // conversation's own. Its actions act on the ticket's copy, so a change shows in every conversation.
  const renderTicketNote = (note, copy = 'ticket') => {
    const id = `${copy}-${note.id}`;
    return (
      <NoteCard
        key={id}
        note={note}
        onTicket
        elementId={copy === 'ticket' ? `email-note-ticket-${note.id}` : `email-note-ticket-${note.id}-pin`}
        expanded={openNoteIds[id] ?? !!note.replyTo}
        pinned={ticketThread?.pin?.id === note.id}
        highlighted={highlightId === note.id}
        onToggle={() => setOpenNoteIds((o) => ({ ...o, [id]: !(o[id] ?? !!note.replyTo) }))}
        onPin={() => togglePin(note.id, 'ticket')}
        onReply={() => openComposer({ mode: 'reply', noteId: note.id, scope: 'ticket' })}
        onQuoteClick={note.replyTo ? () => scrollToNote(note.replyTo.noteId, 'ticket') : undefined}
        onEdit={note.authorId === user.id ? () => openComposer({ mode: 'edit', noteId: note.id, scope: 'ticket' }) : undefined}
        onDelete={note.authorId === user.id ? () => setConfirm({ kind: 'delete', id: note.id, scope: 'ticket' }) : undefined}
      />
    );
  };
  const pinned = notesThread?.pin ? findNote(notesThread.pin.id) : null;
  // The ticket's pinned note shows at the top of every conversation of it.
  const ticketPinned = openEmail && ticketThread?.pin ? findNoteIn('ticket', ticketThread.pin.id) : null;
  // The Reply / Add note footer shows wherever a thread does (not on the Slack tab).
  // The Overview's footer has Add note only (a ticket has no reply of its own).
  const showThread = tab === 'conversation' && !!source;

  return (
    <div className="conversation-detail">
      {/* Upper Bar */}
      <div className="detail-header">
        <div className="header-left">
          <button className="icon-btn">
             <img src={titlePrint} alt="Print" width="16" height="16" />
          </button>
          {/* Ticket and conversation actions. Merging is a bulk action only (from the list), not in this header. */}
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
            </>
          )}
        </div>
      </div>

      {/* Scrollable Area */}
      <div className="detail-scroll-area" ref={scrollRef}>
        {/* The subject bar and the Conversation / Slack tabs stay at the top while the thread scrolls */}
        <div className="detail-sticky">
        {/* Subject Bar */}
        <div className="subject-bar-detail">
          <h1 className="subject-text-large text-label-medium">{conversation.subject}</h1>
          <div className="subject-actions">
             {/* A ticket has no reply, reply all or forward of its own: each email in its timeline has them */}
             {!emails && (
               <>
                 <button className="icon-btn" onClick={(e) => handleReplyAll(e, expandedIds[0] || (conversation.messages.length > 0 ? conversation.messages[0].id : null))}>
                   <img src={replyIcon} alt="Reply" width="16" height="16" />
                 </button>
                 <button className="icon-btn" onClick={(e) => handleReplyAll(e, expandedIds[0])}>
                   <img src={replyAllIcon} alt="Reply All" width="16" height="16" />
                 </button>
                 <button className="icon-btn">
                   <img src={forwardIcon} alt="Forward" width="16" height="16" />
                 </button>
               </>
             )}
             {source && (
               <ConversationMenu
                 options={emails ? EMAIL_MENU.filter((o) => !['reply', 'reply-all', 'forward'].includes(o.value)) : EMAIL_MENU}
                 onlyNotes={onlyNotes}
                 onSelect={(value) => {
                   const last = threadMessages[lastIndex]?.id;
                   if (value === VIEW_ONLY_NOTES.value) setOnlyNotes((on) => !on);
                   else if (value === 'reply' || value === 'reply-all') setActiveReplyId(last);
                 }}
               />
             )}
             {/* The right panel is hidden: bring it back (Figma: Tickets Add/Merge › 4118:14580) */}
             {panelCollapsed && (
               <>
                 <span className="subject-actions__divider" />
                 <Tooltip content="Show right panel" placement="bottom">
                   <button type="button" className="icon-btn detail-panel-toggle" aria-label="Show right panel" onClick={onExpandPanel}><ArrowBarToLeft size={16} /></button>
                 </Tooltip>
               </>
             )}
          </div>
        </div>

        {/* A merged ticket: a tab for its Overview (every email on one page, no Slack) and one per merged conversation,
            with a blue dot while it's unread and a red ⚡ past its first response time (Figma: Tickets Add/Merge › 4089:1970) */}
        {/* A merged ticket (new-ui): the views are tabs on top — "Conversation", then the Slack channels the open
            conversations are shared to (all of them, each once, whichever conversation is open), then a button to add a Slack channel or ClickUp task — and the ticket's
            conversations are chips under them: one per conversation (no Overview), with its unread dot and overdue
            FRT ⚡ (the earlier layout, Figma 4026:14306 / 4068:299, with today's data). */}
        {emails && (
          <div className="detail-tabs-row" ref={tabsRowRef}>
            {/* Demo: ⌘ + hover labels the tabs */}
            <HoverHighlight targetRef={tabsRowRef} label="Slack internal collaboration" placement="top" getBox={slackTabsBox} />
            <Tabs
              className="detail-tabs"
              aria-label="Conversation views"
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'conversation', label: 'Conversation' },
                ...ticketChannels.map((channel) => ({ value: `slack:${channel}`, label: channel, icon: <SlackTabIcon /> })),
              ]}
            />
            {(
              <button type="button" className="detail-email-chip detail-email-chip--add" aria-label="Add a Slack channel or ClickUp task">
                <span className="detail-add-apps">
                  <span className="detail-add-apps__item"><Icon name="add" size={14} /></span>
                  <span className="detail-add-apps__item"><img className="detail-add-apps__slack" src={slackLogo} alt="" /></span>
                  <span className="detail-add-apps__item"><img src={clickupIcon} alt="" /></span>
                </span>
              </button>
            )}
          </div>
        )}
        {emails && tab === 'conversation' && (
          <div className="detail-email-chips" role="tablist" aria-label="Merged conversations" ref={chipsRowRef}>
            {/* Demo: ⌘ + hover labels the chips */}
            <HoverHighlight targetRef={chipsRowRef} label="Conversations in this ticket" placement="top" />
            {[...emails.map((e) => ({ value: String(e.id), label: emailTabLabel(e), email: e }))].map((chip) => (
              <button
                key={chip.value}
                type="button"
                role="tab"
                aria-selected={emailTab === chip.value}
                className={`detail-email-chip${chip.email ? ' detail-email-chip--conversation' : ''}`}
                title={chip.email ? `${chip.email.messages[0]?.sender ?? chip.email.sender} • ${chip.email.subject}` : undefined}
                onClick={() => selectEmail(chip.value)}
              >
                {chip.email && <Icon name="mailbox" size={14} />}
                <span className="detail-email-chip__label">{chip.label}</span>
                {chip.email && (isUnread(chip.email) || frtOf(chip.email)) && (
                  <span className="detail-email-chip__flags">
                    {isUnread(chip.email) && <span className="detail-email-chip__unread" role="img" aria-label="Unread" />}
                    {frtOf(chip.email) && (
                      <Tooltip content="First response time overdue" placement="top" portal>
                        <span className="detail-email-chip__frt" role="img" aria-label="First response time overdue"><Icon name="boltfilled" size={12} /></span>
                      </Tooltip>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        {/* An email or a ticket that was never merged keeps the Conversation / Slack tabs (Figma 4026:14306) */}
        {!emails && (
          <Tabs
            className="detail-tabs"
            aria-label="Conversation views"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'conversation', label: 'Conversation' },
              { value: `slack:${slackChannelFor(conversation.id)}`, label: slackChannelFor(conversation.id), icon: <SlackTabIcon /> },
            ]}
          />
        )}
        </div>

        {/* The Slack tab is a placeholder for now; the email thread shows on the Conversation tab */}
        {tab !== 'conversation' ? (
          <div className="detail-slack-placeholder text-body-small">Slack internal collaboration page</div>
        ) : (
        <>
        <div className="messages-container">
          {ticketPinned && <PinnedNote by={ticketThread.pin.by}>{renderTicketNote(ticketPinned, 'ticket-pin')}</PinnedNote>}
          {pinned && <PinnedNote by={notesThread.pin.by}>{renderNote(pinned, 'pin')}</PinnedNote>}
          {/* "View only notes": the conversation's notes and the ticket's, in time order */}
          {onlyNotes && (() => {
            const all = [
              ...notesThread.notes.map((n) => ({ n, ticket: false })),
              ...(openEmail ? ticketThread?.notes ?? [] : []).map((n) => ({ n, ticket: true })),
            ].sort((a, b) => (a.n.at ?? 0) - (b.n.at ?? 0));
            return all.length
              ? all.map(({ n, ticket }) => (ticket ? renderTicketNote(n) : renderNote(n)))
              : <p className="en-notes-empty">No notes in this conversation yet.</p>;
          })()}
          {!onlyNotes && threadMessages.map((msg, index) => {
            return (
              <React.Fragment key={msg.id}>
                {renderMessage(msg, { quoted: previousOf(threadEmails, msg) })}

                {itemsAfter(index).map((item) => {
                  if (item.kind === 'note' && item.ticketNote) return renderTicketNote(item.note);
                  if (item.kind === 'note') return renderNote(item.note);
                  if (item.kind === 'message') return <React.Fragment key={item.key}>{renderMessage(item.msg, { quoted: previousOf(threadEmails, item.msg) })}</React.Fragment>;
                  return <ActivityGroup key={item.key} rows={item.rows} />;
                })}
              </React.Fragment>
            );
          })}
        </div>
        </>
        )}
      </div>

      {showThread && (composer ? (
        <NoteComposer
          key={`${composer.scope ?? 'convo'}-${composer.mode}-${composer.noteId ?? 'new'}`}
          editing={composer.mode === 'edit' ? findNoteIn(composer.scope, composer.noteId) : undefined}
          replyTo={composer.mode === 'reply' ? findNoteIn(composer.scope, composer.noteId) : undefined}
          ticketId={composer.mode === 'new' && openEmail && emails.length > 1 ? conversation.ticketId : undefined}
          onQuoteClick={() => scrollToNote(composer.noteId, composer.scope)}
          onSubmit={submitNote}
          onCancel={closeComposer}
          closing={composerClosing}
        />
      ) : !activeReplyId && (
        <div className="en-footer">
          {/* A ticket's own view (a merged ticket's Overview, or a ticket that was never merged) has no reply: only Add
              note. A merged conversation's tab has both. */}
          {(openEmail || !conversation.ticketId) && <button type="button" className="en-footer__btn" onClick={(e) => handleReplyAll(e, threadMessages[lastIndex]?.id)}><Icon name="reply" size={16} />Reply</button>}
          <button type="button" className="en-footer__btn" onClick={() => openComposer({ mode: 'new' })}><img src={noteIcon} alt="" />Add note</button>
        </div>
      ))}

      {confirm?.kind === 'pin' && (
        <NoteConfirm
          title="Replace pinned note?"
          text="Only one note can be pinned. Replace the note that’s already pinned?"
          confirmLabel="Replace"
          onClose={() => setConfirm(null)}
          onConfirm={() => { pinNote(confirm.id, confirm.scope); setConfirm(null); }}
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
          onConfirm={() => { deleteNote(confirm.id, confirm.scope); setConfirm(null); }}
        />
      )}
    </div>
  );
};

export default ConversationDetail;
