import React from 'react';
import '../omni/App.css';
import '../omni/Sidebar.css';
import './coAssignee.css';
import AppMainNav from '../omni/components/AppMainNav';
import MainSidebarPanel from '../omni/components/MainSidebarPanel';
import ConversationList from '../omni/components/ConversationList';
import ConversationDetail from '../omni/components/ConversationDetail';
import LinkedRightPanel from '../omni/components/link/LinkedRightPanel';
import TicketPanel from '../omni/components/TicketPanel';
import { conversationsData } from '../omni/data/emailConversations';
import { buildMergedTicket } from '../omni/data/merge';
import { useConversationFields } from '../omni/ConversationFields';
import { AMY, NORA_ID, useCoAssigneeDemo } from '../omni/coAssigneeDemo';

// Amy's view (/co-assignee.html), next to the prototype in another tab. Amy isn't in Email Support 01, so My Work is
// the only place she can reach Nora - Shopify: it shows there once she's made its co-assignee, and becomes the ticket
// once Nora's conversation is merged. In the ticket she sees only Nora's conversation, and can read and add notes, or
// remove herself as co-assignee; everything else a co-assignee can't do today is off.

const INBOX = 'Email Support 01';
const FILTER = { inbox: 'My Work', type: 'My Work' };

export default function CoAssigneeApp() {
  const demo = useCoAssigneeDemo();
  const fields = useConversationFields();
  const isCoAssignee = demo.coAssigneeOf(NORA_ID) === AMY.value;
  const shared = demo.ticket;

  // The ticket Nora's conversation is in, rebuilt from what the prototype shared (same ID, title and conversations)
  const ticket = React.useMemo(() => {
    if (!shared) return null;
    const convos = shared.ids.map((id) => conversationsData.find((c) => c.id === id)).filter(Boolean);
    if (!convos.length) return null;
    const primary = convos.some((c) => c.id === shared.primaryId) ? shared.primaryId : convos[0].id;
    return { ...buildMergedTicket(convos, primary), id: shared.id, ticketId: shared.ticketId, subject: shared.title, description: shared.description };
  }, [shared]);

  // The ticket's values as the prototype set them at the merge (each tab keeps its own field values)
  React.useEffect(() => {
    if (!ticket) return;
    fields.setAssignee(ticket.id, shared.assignee);
    fields.setStatus(ticket.id, shared.status);
    if (shared.tags) fields.setTags(ticket.id, shared.tags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket]);

  const nora = conversationsData.find((c) => c.id === NORA_ID);
  const items = !isCoAssignee ? [] : ticket ? [ticket] : [nora];
  const [selectedId, setSelectedId] = React.useState(null);
  const selected = items.find((c) => c.id === selectedId) ?? items[0] ?? null;
  const [emailTab, setEmailTab] = React.useState(null);

  React.useEffect(() => { document.title = 'My Work – Amy'; }, []);

  return (
    <div className="app-container coa-app">
      <div className="sidebar-root">
        <AppMainNav />
        <MainSidebarPanel activeFilter={FILTER} onFilterChange={() => {}} activeRole="agent" myWork={{ count: items.length }} inboxesInert />
      </div>
      <ConversationList conversations={items} selectedId={selected?.id} onSelect={setSelectedId} activeFilter={FILTER} />
      {selected ? (
        <>
          <ConversationDetail
            conversation={selected}
            emailTab={emailTab}
            onEmailTabChange={setEmailTab}
            signatures={[]}
            setSignatures={() => {}}
            limitedTo={[String(NORA_ID)]}
          />
          <div className="right-panel-wrap">
            <div className="right-panel-wrap__inner coa-panel">
              {selected.emails
                ? <TicketPanel ticket={selected} emailTab={emailTab} inboxName={INBOX} />
                : <LinkedRightPanel channel="email" inboxName={INBOX} conversationId={String(NORA_ID)} canLink={false} />}
            </div>
          </div>
        </>
      ) : (
        <div className="coa-empty" />
      )}
    </div>
  );
}
