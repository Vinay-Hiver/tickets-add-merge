import React from 'react';
import { Icon } from '../../icons/Icon';
import { statusOptions } from '../../patterns/RightPanel/data/options';
import { useConversationFields } from '../ConversationFields';
import { groupActivity } from './notes/threadTimeline';
import { ActivityGroup } from './notes/EmailNotes';
import './TicketOverview.css';

// A merged ticket's Overview tab: one card per merged email, newest first (Figma: Tickets Add/Merge › 4028:16172).
// Clicking a card opens that email's tab.

const dateOf = (time) => time.split(',')[0]; // 'Feb 4, 02:45 PM' -> 'Feb 4'
const customerOf = (c) => c.messages?.[0]?.sender ?? c.sender;

/** The email's tab label: "Customer • Subject", the subject cut short as in Figma. */
export const emailTabLabel = (c) => {
  const subject = c.subject.length > 14 ? `${c.subject.slice(0, 12)}..` : c.subject;
  return `${customerOf(c)} • ${subject}`;
};

// Under the cards, the ticket's own activity: changes to its assignee, status, tags and custom fields, grouped as in
// the threads (rows that follow each other fold into one line).
export default function TicketOverview({ ticketId, emails, onOpen }) {
  const { statusOf, assigneeNameOf, activityOf } = useConversationFields();
  const activity = groupActivity(activityOf(ticketId).map((row) => ({ kind: 'activity', row })));
  return (
    <div className="ticket-overview">
      {emails.map((c) => {
        const status = statusOptions.find((o) => o.value === statusOf(c.id)) ?? statusOptions[0];
        return (
          <button key={c.id} type="button" className="ticket-overview__card" onClick={() => onOpen(String(c.id))}>
            <span className="ticket-overview__top">
              <span className="ticket-overview__name"><Icon name="mailbox" size={14} />{customerOf(c)}</span>
              <span className="ticket-overview__date">{dateOf(c.time)}</span>
            </span>
            <span className="ticket-overview__bottom">
              <span className="ticket-overview__subject">{c.subject}</span>
              <span className="ticket-overview__preview">{c.preview}</span>
            </span>
            <span className="ticket-overview__chips">
              <span className="ticket-overview__chip"><Icon name={status.icon} size={12} />{status.label}</span>
              <span className="ticket-overview__chip"><Icon name="user" size={12} />{assigneeNameOf(c.id) ?? 'Unassigned'}</span>
            </span>
          </button>
        );
      })}
      {activity.map((item) => <ActivityGroup key={item.key} rows={item.rows} />)}
    </div>
  );
}
