import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Sidebar from './Sidebar';
import ConversationList from './components/ConversationList';
import ConversationDetail from './components/ConversationDetail';
import LinkedRightPanel from './components/link/LinkedRightPanel';
import TicketPanel from './components/TicketPanel';
import BulkActionsPanel from './components/BulkActionsPanel';
import MergeConversationsSheet from './components/MergeConversationsSheet';
import AddToTicketSheet, { AddConversationsSheet } from './components/AddToTicketSheet';
import { CUSTOM_FIELDS } from './data/customFields';
import { domainOf } from './data/companies';
import ChannelChatView from './components/ChannelChatView';
import VoiceCallView from './components/voice/VoiceCallView';
import { VOICE_INBOXES } from './data/voiceCalls';
import { CHANNEL_BY_INBOX } from './data/channelChats';
import MySettingsPage from './pages/MySettingsPage';
import { useState } from 'react';
import { conversationsData } from './data/emailConversations';
import { INITIAL_VIEWS_BY_INBOX } from './data/dummyViews';
import { useCurrentUser } from './CurrentUser';
import { useConversationFields } from './ConversationFields';
import { addToTicket, buildMergedTicket, mergeCustomFields, mergeTags, timestampOf } from './data/merge';


// Fallback dummy threads for views (e.g. Team, Tickets, Pending, Closed,
// custom views) that don't have hand-authored conversation data above.
const DUMMY_SENDERS = [
  { sender: 'Priya Nair', initial: 'P', avatarColor: 'var(--pastelVioletBorderDefault)', email: 'priya.nair@fedex.com' },
  { sender: 'Marcus Lee', initial: 'M', avatarColor: 'var(--pastelLightBlueBorderDefault)', email: 'marcus.lee@dell.com' },
  { sender: 'Sofia Reyes', initial: 'S', avatarColor: 'var(--pastelOrangeSurfaceDefault)', email: 'sofia.reyes@paypal.com' },
  { sender: 'Daniel Kim', initial: 'D', avatarColor: 'var(--pastelRedBorderDefault)', email: 'daniel.kim@shopify.com' },
  { sender: 'Grace Okafor', initial: 'G', avatarColor: 'var(--pastelVioletBorderDefault)', email: 'grace.okafor@airbnb.com' },
  { sender: 'Tom Becker', initial: 'T', avatarColor: 'var(--pastelLightBlueBorderDefault)', email: 'tom.becker@fedex.com' },
  { sender: 'Hana Sato', initial: 'H', avatarColor: 'var(--pastelOrangeSurfaceDefault)', email: 'hana.sato@dell.com' },
  { sender: 'Liam Walsh', initial: 'L', avatarColor: 'var(--pastelRedBorderDefault)', email: 'liam.walsh@paypal.com' },
  { sender: 'Ava Patel', initial: 'A', avatarColor: 'var(--pastelVioletBorderDefault)', email: 'ava.patel@shopify.com' },
  { sender: 'Noah Khan', initial: 'N', avatarColor: 'var(--pastelLightBlueBorderDefault)', email: 'noah.khan@airbnb.com' },
  { sender: 'Arlene McCoy', initial: 'A', avatarColor: 'var(--pastelOrangeSurfaceDefault)', email: 'arlene.mccoy@fedex.com' },
  { sender: 'Guy Hawkins', initial: 'G', avatarColor: 'var(--pastelRedBorderDefault)', email: 'guy.hawkins@dell.com' },
  { sender: 'Courtney Henry', initial: 'C', avatarColor: 'var(--pastelVioletBorderDefault)', email: 'courtney.henry@paypal.com' },
  { sender: 'Darlene Robertson', initial: 'D', avatarColor: 'var(--pastelLightBlueBorderDefault)', email: 'darlene.robertson@shopify.com' },
  { sender: 'Eleanor Pena', initial: 'E', avatarColor: 'var(--pastelOrangeSurfaceDefault)', email: 'eleanor.pena@airbnb.com' },
  { sender: 'Floyd Miles', initial: 'F', avatarColor: 'var(--pastelRedBorderDefault)', email: 'floyd.miles@fedex.com' },
];

const DUMMY_SUBJECTS = [
  { subject: 'Need help with account setup', preview: 'I followed the steps but still can\'t log in.' },
  { subject: 'Order not received yet', preview: 'It has been over a week since I placed the order.' },
  { subject: 'Question about pricing plan', preview: 'Can you clarify what is included in the pro tier?' },
  { subject: 'Feature request: dark mode', preview: 'Would love to see a dark mode option added.' },
  { subject: 'Unable to reset password', preview: 'The reset link keeps expiring before I can use it.' },
  { subject: 'Integration not syncing', preview: 'Data stopped syncing since yesterday afternoon.' },
  { subject: 'Follow-up on previous ticket', preview: 'Just checking in on the status of this request.' },
  { subject: 'Thank you for the quick fix', preview: 'Everything is working well now, appreciate it!' },
];

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const generateDummyConversations = (inbox, type) => {
  const seed = hashString(`${inbox}|${type}`);
  const count = 4 + (seed % 5); // 4-8 threads
  return Array.from({ length: count }, (_, i) => {
    const person = DUMMY_SENDERS[(seed + i) % DUMMY_SENDERS.length];
    const topic = DUMMY_SUBJECTS[(seed + i * 3) % DUMMY_SUBJECTS.length];
    return {
      id: `dummy-${inbox}-${type}-${i}`,
      inbox,
      type,
      sender: person.sender,
      initial: person.initial,
      avatarColor: person.avatarColor,
      time: 'Feb 4, 0' + (1 + (i % 9)) + ':00 PM',
      subject: topic.subject,
      preview: topic.preview,
      threadCount: 1 + (i % 3),
      messages: [
        {
          id: 'm1',
          sender: person.sender,
          email: person.email,
          time: 'Feb 4, 0' + (1 + (i % 9)) + ':00 PM',
          initial: person.initial,
          avatarColor: person.avatarColor,
          body: `Hi,\n\n${topic.preview}\n\nLooking forward to your help.`
        },
        {
          id: 'm2',
          sender: 'Ruben Geidt',
          email: 'support@hiver.com',
          time: 'Feb 4, 0' + (1 + ((i + 1) % 9)) + ':30 PM',
          initial: 'R',
          avatarColor: 'var(--pastelLightBlueBorderDefault)',
          body: 'Thanks for reaching out — taking a look into this now and will follow up shortly.'
        }
      ]
    };
  });
};

// Each user opens on the Unassigned view of the first inbox they are a member of
// (Chat Support 01 for Michael, Chat Support 02 for Jim).
const firstInboxFor = (user) =>
  Object.keys(INITIAL_VIEWS_BY_INBOX).find((name) => !user.hiddenInboxes?.includes(name));

function App() {
  const { user } = useCurrentUser();
  const [activeFilter, setActiveFilter] = useState(() => ({ inbox: firstInboxFor(user), type: 'Unassigned' }));
  const [selectedId, setSelectedId] = useState(null);
  // Conversations ticked in the list for bulk actions.
  const [checkedIds, setCheckedIds] = useState([]);
  const toggleChecked = (id) =>
    setCheckedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  // Merging emails makes a ticket: the ticket joins the list and the emails leave it.
  const [mergedTickets, setMergedTickets] = useState([]);
  const [mergedAwayIds, setMergedAwayIds] = useState([]);
  const fields = useConversationFields();
  // "Merge conversations" from an open conversation's header: the sheet starts by picking what to merge it with.
  const [mergeSourceId, setMergeSourceId] = useState(null);
  // "Add to an existing ticket" from an open conversation's header.
  // The conversations being added: the open one, or the ones ticked in the list (bulk actions).
  const [addSourceIds, setAddSourceIds] = useState(null);
  // "Add conversation" from a ticket's header: the ticket conversations are added to.
  const [addTargetId, setAddTargetId] = useState(null);

  // In a merged ticket: 'overview' or the id of the email whose tab is open. The right panel follows it.
  const [emailTab, setEmailTab] = useState('overview');

  // Prototype role — All Views pins Team Favourites as Admin. No toggle UI.
  const activeRole = 'Admin';

  const dummyCacheRef = React.useRef({});

  const filteredConversations = React.useMemo(() => {
    const inView = (c) => c.inbox === activeFilter.inbox && c.type === activeFilter.type;
    let base = conversationsData.filter(inView);
    if (base.length === 0) {
      const key = `${activeFilter.inbox}|${activeFilter.type}`;
      if (!dummyCacheRef.current[key]) {
        dummyCacheRef.current[key] = generateDummyConversations(activeFilter.inbox, activeFilter.type);
      }
      base = dummyCacheRef.current[key];
    }
    // Tickets made by merging sit at the top, newest first; merged emails are gone.
    // A ticket that had a conversation added is in mergedTickets now, so its original card is left out.
    return [...mergedTickets.filter(inView), ...base.filter((c) => !mergedAwayIds.includes(c.id) && !mergedTickets.some((t) => t.id === c.id))];
  }, [activeFilter.inbox, activeFilter.type, mergedTickets, mergedAwayIds]);

  // "Merge and create ticket": a ticket with the chosen title, its assignee and status, the tags of every email and
  // the merged custom fields. The ticket opens; the emails leave the list.
  const mergeIntoTicket = (selected, titleId) => {
    const ticket = buildMergedTicket(selected, titleId);
    fields.setAssignee(ticket.id, fields.assigneeOf(titleId));
    fields.setStatus(ticket.id, fields.statusOf(titleId));
    fields.setTags(ticket.id, mergeTags(selected, fields.tagsOf));
    mergeCustomFields(selected, titleId, fields.customFieldsOf).forEach((f) => fields.setCustomField(ticket.id, f.id, f.value));
    setMergedTickets((tickets) => [ticket, ...tickets]);
    setMergedAwayIds((ids) => [...ids, ...ticket.mergedFrom]);
    setCheckedIds([]);
    setSelectedId(ticket.id);
  };

  const location = useLocation();
  React.useEffect(() => {
    // Each route/page sets its own title (e.g. MySettingsPage). Only own the
    // mailbox title here so this always-mounted component doesn't clobber it.
    if (location.pathname === '/') {
      document.title = 'Omni Tickets - Add/Merge';
    }
  }, [location.pathname]);

  React.useEffect(() => {
    if (filteredConversations.length > 0) {
      setSelectedId(filteredConversations[0].id);
    } else {
      setSelectedId(null);
    }
    setCheckedIds([]);
  }, [activeFilter.inbox, activeFilter.type]);

  const [signatures, setSignatures] = useState([]);
  const [defaultSignatureId] = useState(null);

  const selectedConversation = mergedTickets.find(c => c.id === selectedId)
    || conversationsData.find(c => c.id === selectedId)
    || filteredConversations.find(c => c.id === selectedId);

  // "Add to ticket": the conversation joins the ticket. The ticket keeps its title, assignee and status; tags are combined
  // and custom fields the ticket leaves empty are filled from the conversation (ticket values win).
  // Several conversations can be added at once (from the ticket's header); a gap takes the first value found.
  const addConversationsToTicket = (conversations, ticketId) => {
    const existing = mergedTickets.find((t) => t.id === ticketId) ?? conversationsData.find((c) => c.id === ticketId);
    const ticket = conversations.reduce(addToTicket, existing);
    fields.setTags(ticket.id, [...new Set([...fields.tagsOf(ticket.id), ...conversations.flatMap((c) => fields.tagsOf(c.id))])]);
    const ticketValues = fields.customFieldsOf(ticket.id);
    CUSTOM_FIELDS.forEach((f) => {
      if (ticketValues[f.id]) return;
      const value = conversations.map((c) => fields.customFieldsOf(c.id)[f.id]).find(Boolean);
      if (value) fields.setCustomField(ticket.id, f.id, value);
    });
    setMergedTickets((tickets) => [ticket, ...tickets.filter((t) => t.id !== ticket.id)]);
    setMergedAwayIds((ids) => [...ids, ...conversations.map((c) => c.id)]);
    setSelectedId(ticket.id);
    setEmailTab('overview');
  };

  // Tickets the open conversation can be added to: in the same inbox, newest first. Only the same domain can be picked.
  const addSources = addSourceIds
    ?.map((id) => conversationsData.find((c) => c.id === id) ?? filteredConversations.find((c) => c.id === id))
    .filter(Boolean);
  const addSource = addSources?.[0] ?? null;
  const inboxTickets = addSource
    ? [...mergedTickets, ...conversationsData.filter((c) => c.ticketId && !mergedTickets.some((t) => t.id === c.id))]
      .filter((t) => t.inbox === addSource.inbox)
      .sort((a, b) => timestampOf(b.time) - timestampOf(a.time))
    : [];

  // Conversations a ticket can take: emails in its inbox that are not tickets and not merged yet, newest first.
  // Only the ticket's domain can be picked.
  const addTarget = addTargetId != null
    ? mergedTickets.find((t) => t.id === addTargetId) ?? conversationsData.find((c) => c.id === addTargetId) ?? filteredConversations.find((c) => c.id === addTargetId)
    : null;
  const addable = addTarget
    ? conversationsData
      .filter((c) => c.inbox === addTarget.inbox && !c.ticketId && !mergedAwayIds.includes(c.id))
      .sort((a, b) => timestampOf(b.time) - timestampOf(a.time))
    : [];

  // The open conversation being merged, and what it can merge into: emails in the same inbox (any view) that are not
  // tickets and not merged yet. Same domain can be picked; other domains only explain why a search finds nothing.
  const mergeSource = mergeSourceId != null
    ? conversationsData.find((c) => c.id === mergeSourceId) ?? filteredConversations.find((c) => c.id === mergeSourceId)
    : null;
  const mergeable = mergeSource
    ? conversationsData
      .filter((c) => c.inbox === mergeSource.inbox && !c.ticketId && c.id !== mergeSource.id && !mergedAwayIds.includes(c.id))
      .sort((a, b) => timestampOf(b.time) - timestampOf(a.time))
    : [];

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={
          <>
            <Sidebar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              activeRole={activeRole}
            />
            {VOICE_INBOXES.includes(activeFilter.inbox) ? (
              <VoiceCallView key={`${activeFilter.inbox}|${activeFilter.type}`} inboxName={activeFilter.inbox} viewType={activeFilter.type} />
            ) : CHANNEL_BY_INBOX[activeFilter.inbox] ? (
              <ChannelChatView key={`${activeFilter.inbox}|${activeFilter.type}`} inboxName={activeFilter.inbox} viewType={activeFilter.type} />
            ) : (
              <>
                <ConversationList
                  conversations={filteredConversations}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  activeFilter={activeFilter}
                  checkedIds={checkedIds}
                  onToggleCheck={toggleChecked}
                />
                {checkedIds.length > 0 ? (
                  <BulkActionsPanel
                    selected={filteredConversations.filter((c) => checkedIds.includes(c.id))}
                    onCancel={() => setCheckedIds([])}
                    onMerge={mergeIntoTicket}
                    onAddToTicket={(selected) => setAddSourceIds(selected.map((c) => c.id))}
                  />
                ) : (
                  <>
                    <ConversationDetail
                      conversation={selectedConversation}
                      emailTab={emailTab}
                      onEmailTabChange={setEmailTab}
                      onMergeClick={() => setMergeSourceId(selectedConversation.id)}
                      onAddToTicketClick={() => setAddSourceIds([selectedConversation.id])}
                      onAddConversationClick={() => setAddTargetId(selectedConversation.id)}
                      signatures={signatures}
                      setSignatures={setSignatures}
                      defaultSignatureId={defaultSignatureId}
                    />
                    {selectedConversation?.emails ? (
                      <TicketPanel ticket={selectedConversation} emailTab={emailTab} inboxName={activeFilter.inbox} />
                    ) : (
                      <LinkedRightPanel channel="email" ticketId={selectedConversation?.ticketId} inboxName={activeFilter.inbox} unassigned={activeFilter.type === 'Unassigned'} conversationId={String(selectedId)} />
                    )}
                  </>
                )}
              </>
            )}
          </>
        } />
        <Route path="/my-settings" element={<MySettingsPage />} />
      </Routes>
      {addSource && (
        <AddToTicketSheet
          key={addSourceIds.join('-')}
          conversations={addSources}
          tickets={inboxTickets.filter((t) => domainOf(t) === domainOf(addSource))}
          others={inboxTickets.filter((t) => domainOf(t) !== domainOf(addSource))}
          onClose={() => setAddSourceIds(null)}
          onAdd={(ticketId) => { addConversationsToTicket(addSources, ticketId); setAddSourceIds(null); setCheckedIds([]); }}
        />
      )}
      {addTarget && (
        <AddConversationsSheet
          key={addTarget.id}
          ticket={addTarget}
          candidates={addable.filter((c) => domainOf(c) === domainOf(addTarget))}
          others={addable.filter((c) => domainOf(c) !== domainOf(addTarget))}
          onClose={() => setAddTargetId(null)}
          onAdd={(conversations) => { addConversationsToTicket(conversations, addTarget.id); setAddTargetId(null); }}
        />
      )}
      {mergeSource && (
        <MergeConversationsSheet
          key={mergeSource.id}
          source={mergeSource}
          candidates={mergeable.filter((c) => domainOf(c) === domainOf(mergeSource))}
          others={mergeable.filter((c) => domainOf(c) !== domainOf(mergeSource))}
          onClose={() => setMergeSourceId(null)}
          onMerge={(titleId, conversations) => { mergeIntoTicket(conversations, titleId); setMergeSourceId(null); }}
        />
      )}
    </div>
  );
}

export default App;
