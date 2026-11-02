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

  useEffect(() => {
    if (conversation && conversation.messages.length > 0) {
      setExpandedIds([conversation.messages[0].id]);
      setActiveReplyId(null);
    }
    setTab('conversation');
    setEmailTab('overview');
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
  };

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
    setActiveReplyId(prev => prev === id ? null : id);
  };

  if (!conversation) return <div className="conversation-detail">Select a conversation</div>;

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
      <div className="detail-scroll-area">
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
            aria-label="Merged emails"
            value={emailTab}
            onChange={selectEmail}
            tabs={[{ value: 'overview', label: 'Overview' }, ...emails.map((e) => ({ value: String(e.id), label: emailTabLabel(e) }))]}
          />
        )}
        {emails && emailTab === 'overview' ? (
          <TicketOverview emails={emails} onOpen={selectEmail} />
        ) : (
        <div className="messages-container">
          {threadMessages.map((msg) => {
            const isExpanded = expandedIds.includes(msg.id);
            const isReplying = activeReplyId === msg.id;
   
            return (
              <React.Fragment key={msg.id}>
                {isReplying && (
                  <ReplySection 
                    recipientEmail={msg.email} 
                    signatures={signatures}
                    setSignatures={setSignatures}
                    defaultSignatureId={defaultSignatureId}
                    currentInbox={conversation.inbox}
                    onDiscard={(e) => {
                      e.stopPropagation();
                      setActiveReplyId(null);
                    }}
                  />
                )}
                
                {isExpanded ? (
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
                )}
              </React.Fragment>
            );
          })}
        </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default ConversationDetail;
