import React from 'react';
import { TicketRightPanel } from '../../patterns/RightPanel/ChannelRightPanel';
import { useConversationFields } from '../ConversationFields';
import { useCurrentUser } from '../CurrentUser';
import { fieldChangeHandlers } from '../fieldActivity';
import { conversationsData } from '../data/emailConversations';
import { CUSTOM_FIELDS } from '../data/customFields';
import { TAGS } from '../data/tags';
import { companyOf, domainOf } from '../data/companies';

// The right panel of a merged ticket. The ticket's values are its own (set at merge, editable here); in an email's tab
// that email's contact and old assignee/status follow (its notes and activity are in the thread). Everything comes from the prototype's data.

const customerEmailOf = (c) => c.customerEmail ?? c.messages?.[0]?.email;
export default function TicketPanel({ ticket, emailTab, inboxName }) {
  const fields = useConversationFields();
  const { user } = useCurrentUser();
  const id = String(ticket.id);
  // After a merge, assignee, status, tags and custom fields belong to the ticket: changes are logged on the ticket
  // and show on its Overview. Each conversation's own thread only gets the merge row.
  const { changeAssignee, changeStatus, changeTags, changeCustomField } = fieldChangeHandlers({ fields, user, id });
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
      onAssigneeChange={changeAssignee}
      status={fields.statusOf(id)}
      onStatusChange={changeStatus}
      tagOptions={TAGS}
      tags={fields.tagsOf(id)}
      onTagsChange={changeTags}
      customFields={CUSTOM_FIELDS.map((f) => ({ ...f, value: fields.customFieldsOf(id)[f.id] }))}
      onCustomFieldChange={changeCustomField}
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
      }}
    />
  );
}
