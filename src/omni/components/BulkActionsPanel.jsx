import React from 'react';
import { Icon } from '../../icons/Icon';
import { ArrowMerge } from '../../icons/ArrowMerge';
import { Tooltip } from '../../components/Tooltip';
import bulkSelectIllustration from '../assets/bulk-select.png';
import { domainOf } from '../data/companies';
import MergeConversationsSheet from './MergeConversationsSheet';
import './BulkActionsPanel.css';

// Why the selection can't be merged, or null when it can.
const mergeBlockedReason = (selected) => {
  if (selected.length < 2) return 'Select at least two emails to merge';
  if (new Set(selected.map(domainOf)).size > 1) return 'Cannot merge conversations from different domains';
  return null;
};

function Action({ icon, label, disabled, onClick }) {
  return (
    <button type="button" className="bulk-action" disabled={disabled} onClick={onClick}>
      {typeof icon === 'string' ? <Icon name={icon} size={16} /> : icon}
      <span>{label}</span>
    </button>
  );
}

// Replaces the conversation and right panel while cards are ticked in the list.
// "Merge conversations" and "Add to an existing ticket" show only when every ticked card is an email (no tickets).
export default function BulkActionsPanel({ selected, onCancel, onMerge }) {
  const [merging, setMerging] = React.useState(false);
  const allEmails = selected.every((c) => !c.ticketId);
  const mergeBlocked = allEmails ? mergeBlockedReason(selected) : null;

  return (
    <div className="bulk-actions-panel">
      <img src={bulkSelectIllustration} alt="" width="68" height="68" />
      <p className="bulk-actions-count">
        {selected.length} {selected.length === 1 ? 'item' : 'items'} selected
      </p>
      <div className="bulk-actions-list">
        <Action icon="markasunread" label="Mark as unread" />
        <Action icon="user" label="Assign to" />
        <Action icon="flag" label="Change status" />
        <Action icon="tag" label="Manage tags" />
        {allEmails && (mergeBlocked ? (
          <Tooltip content={mergeBlocked} placement="right">
            <Action icon={<ArrowMerge />} label="Merge conversations" disabled />
          </Tooltip>
        ) : (
          <Action icon={<ArrowMerge />} label="Merge conversations" onClick={() => setMerging(true)} />
        ))}
        {allEmails && <Action icon="ticket" label="Add to an existing ticket" />}
        <div className="bulk-actions-divider" />
        <Action icon="close" label="Cancel" onClick={onCancel} />
      </div>
      {merging && (
        <MergeConversationsSheet
          conversations={selected}
          onClose={() => setMerging(false)}
          onMerge={(titleId) => onMerge(selected, titleId)}
        />
      )}
    </div>
  );
}
