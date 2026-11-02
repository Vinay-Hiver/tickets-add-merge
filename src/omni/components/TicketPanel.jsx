import React from 'react';
import { TicketRightPanel } from '../../patterns/RightPanel/ChannelRightPanel';
import { useConversationFields } from '../ConversationFields';
import { conversationsData } from '../data/emailConversations';
import { CUSTOM_FIELDS } from '../data/customFields';
import { TAGS } from '../data/tags';
import { companyOf, domainOf } from '../data/companies';

// The right panel of a merged ticket. The ticket's values are its own (set at merge, editable here); in an email's tab
// that email's contact, activity and old assignee/status follow. Everything comes from the prototype's data.

const customerEmailOf = (c) => c.customerEmail ?? c.messages?.[0]?.email;
const dayOf = (time) => time.split(',')[0]; // 'Feb 4, 02:45 PM' -> 'Feb 4'
const clockOf = (time) => time.split(', ')[1] ?? time;

// The email's activity, newest first: when it joined the ticket, then its messages grouped by day.
const activityOf = (email, ticket) => {
  const customer = customerEmailOf(email);
  const events = email.messages.map((m, i) => ({
    day: dayOf(m.time),
    icon: m.email === customer ? 'conversation' : 'reply',
    text: i === 0
      ? `New conversation received in ${email.inbox}`
      : m.email === customer ? `${m.sender} replied` : `${m.sender} sent a reply`,
    time: clockOf(m.time),
  })).reverse();
  const days = [{ day: 'Today', events: [{ icon: 'ticket', text: `Merged into ticket ${ticket.ticketId}`, time: ticket.mergedAt }] }];
  events.forEach(({ day, ...event }) => {
    const group = days.find((d) => d.day === day);
    if (group) group.events.push(event);
    else days.push({ day, events: [event] });
  });
  return days;
};

export default function TicketPanel({ ticket, emailTab, inboxName }) {
  const fields = useConversationFields();
  const id = String(ticket.id);
  const domain = domainOf(ticket);
  const fromDomain = conversationsData.filter((c) => domainOf(c) === domain);
  const email = ticket.emails.find((e) => String(e.id) === emailTab);
  const customer = email && customerEmailOf(email);

  return (
    <TicketRightPanel
      inboxName={inboxName}
      ticketId={ticket.ticketId}
      ticketKey={id}
      assignee={fields.assigneeOf(id)}
      onAssigneeChange={(value) => fields.setAssignee(id, value)}
      status={fields.statusOf(id)}
      onStatusChange={(value) => fields.setStatus(id, value)}
      tagOptions={TAGS}
      tags={fields.tagsOf(id)}
      onTagsChange={(value) => fields.setTags(id, value)}
      customFields={CUSTOM_FIELDS.map((f) => ({ ...f, value: fields.customFieldsOf(id)[f.id] }))}
      onCustomFieldChange={(fieldId, value) => fields.setCustomField(id, fieldId, value)}
      account={{
        name: companyOf(ticket),
        domain,
        contacts: new Set(fromDomain.map(customerEmailOf)).size,
        conversations: fromDomain.length,
      }}
      conversation={email && {
        subject: email.subject,
        assignee: fields.assigneeOf(email.id),
        status: fields.statusOf(email.id),
        contact: {
          name: email.messages[0]?.sender ?? email.sender,
          email: customer,
          account: companyOf(email),
          conversations: conversationsData.filter((c) => customerEmailOf(c) === customer).length,
        },
        activity: activityOf(email, ticket),
      }}
    />
  );
}
