import React, { useState, useEffect } from 'react';
import './ConversationDetail.css';
import ReplySection from './ReplySection';
import { Tabs } from '../../components/Tabs';
import { Icon } from '../../icons/Icon';
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

const ConversationDetail = ({ conversation, signatures, setSignatures, defaultSignatureId }) => {
  const [expandedIds, setExpandedIds] = useState([]);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [tab, setTab] = useState('conversation');
  // A merged ticket: 'overview' (every email as a card) or the id of the email whose thread is open.
  const [emailTab, setEmailTab] = useState('overview');

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
  const selectEmail = (value) => {
    setEmailTab(value);
    const email = emails?.find((e) => String(e.id) === value);
    if (email?.messages.length) setExpandedIds([email.messages[0].id]);
    setActiveReplyId(null);
  };

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
                        <h3 className="convo-email">{msg.email}</h3>
                        <div className="convo-to">
                          To: support@acme.com <img src={chevronDownIcon} alt="Expand" width="14" height="14" style={{ marginLeft: 4 }} />
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
                      <h3 className="convo-email">{msg.email}</h3>
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
