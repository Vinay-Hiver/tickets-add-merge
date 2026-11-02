import React from 'react';
import './ConversationList.css';
import InboxIcon from './InboxIcon';
import { Checkbox } from '../../components/Checkbox';
import { companyOf } from '../data/companies';

// Icons
import sideBarIcon from '../assets/icons/side-bar-icon.svg';
import selectIcon from '../assets/icons/select-icon.svg';
import filterIcon from '../assets/icons/filter-icon.svg';

// `checkedIds` are the cards ticked for bulk actions. Hovering a card's inbox icon swaps it for a
// checkbox; once anything is ticked, clicking a card toggles its tick instead of opening it.
const ConversationList = ({ conversations, selectedId, onSelect, activeFilter, checkedIds = [], onToggleCheck }) => {
  const selecting = checkedIds.length > 0;
  return (
    <div className="conversation-list">
      <div className="subject-bar">
        <div className="subject-left">
          <button className="icon-btn">
            <img src={sideBarIcon} alt="Sidebar" width="16" height="16" />
          </button>
          <div className="subject-title-wrapper">
            <div className="vertical-divider"></div>
            <h2 className="subject-title">{activeFilter.type}</h2>
          </div>
        </div>
        <div className="subject-right">
          <button className="icon-btn">
            <img src={selectIcon} alt="Select" width="16" height="16" />
          </button>
          <button className="icon-btn">
            <img src={filterIcon} alt="Filter" width="16" height="16" />
          </button>
        </div>
      </div>

      <div className="card-list">
        {conversations.map((convo) => {
          const checked = checkedIds.includes(convo.id);
          return (
          <div key={convo.id} className="email-card-wrap">
          <div
            className={`email-card ${(selecting ? checked : selectedId === convo.id) ? 'active' : ''}`}
            onClick={() => (selecting ? onToggleCheck(convo.id) : onSelect(convo.id))}
          >
            <div className="card-header">
              <div className="card-sender-info">
                {/* [inbox icon] [name], as in every inbox; tickets use the ticket icon */}
                <span className={`card-select ${checked ? 'is-checked' : ''}`} onClick={(e) => e.stopPropagation()}>
                  <span className="card-select__icon"><InboxIcon channel="email" ticket={!!convo.ticketId} /></span>
                  <span className="card-select__box">
                    <Checkbox checked={checked} onChange={() => onToggleCheck(convo.id)} aria-label={`Select conversation from ${convo.sender}`} />
                  </span>
                </span>
                <div className="sender-names">
                  {/* "First name - Company", so same-domain emails are easy to spot */}
                  {companyOf(convo) ? (
                    <span className="sender-name-primary">{convo.sender.split(' ')[0]} - {companyOf(convo)}</span>
                  ) : convo.sender.split('.. ').map((name, i) => (
                    <span key={i} className="sender-name-primary">{name}</span>
                  ))}
                  {convo.threadCount && <span className="thread-count">{convo.threadCount}</span>}
                </div>
              </div>
              <span className="card-time">{convo.time}</span>
            </div>
            <div className="card-body">
              <div className="subject-line">
                <h3 className="subject-text">{convo.subject}</h3>
              </div>
              <p className="preview-text">{convo.preview}</p>
            </div>
          </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
