import React from 'react';
import { sampleAssignees } from '../patterns/RightPanel/data/options';
import { CONVERSATION_INDEX } from './data/conversationIndex';
import { defaultTagsFor } from './data/tags';
import { defaultCustomFieldsFor } from './data/customFields';

// Each conversation's Assignee, Status and Tags, as set in the top section of its right panel.
// One value per conversation: the right panel shows and edits it, and linked conversation
// cards and link search results read it, so they always match the conversation.
// Shared by every user (it sits above CurrentUserProvider): these are data, not per-viewer settings.
//
// Starting values: every fifth conversation has no assignee ("none"); the other 80% are spread
// across the people in the list. Each conversation starts Open or Pending.
// Every conversation starts with two tags (see data/tags.js).

const NONE = 'none';

const ConversationFieldsContext = React.createContext({
  assigneeOf: () => NONE,
  assigneeNameOf: () => undefined,
  setAssignee: () => {},
  statusOf: () => 'open',
  setStatus: () => {},
  tagsOf: () => [],
  setTags: () => {},
  customFieldsOf: () => ({}),
  setCustomField: () => {},
  activityOf: () => [],
  addActivity: () => {},
});

export const useConversationFields = () => React.useContext(ConversationFieldsContext);

const defaultAssignee = (id) => {
  const i = CONVERSATION_INDEX.findIndex((c) => c.id === String(id));
  if (i < 0 || i % 5 === 4) return NONE;
  return sampleAssignees[(i - Math.floor(i / 5)) % sampleAssignees.length].value;
};
// Open or Pending, picked from the id so it stays the same on every load.
const defaultStatus = (id) => {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h >>> 3) % 2 ? 'pending' : 'open';
};

/** A person's name as the Assignee list shows it, without "(Me)"; undefined for None. */
export const assigneeName = (value) => sampleAssignees.find((p) => p.value === value)?.label.replace(/ \(Me\)$/, '');

/** The values a conversation starts with, before anyone changes them (its history in the thread). */
export const initialFieldsOf = (id) => ({ assignee: defaultAssignee(id), status: defaultStatus(id), tags: defaultTagsFor(id) });

export function ConversationFieldsProvider({ children }) {
  const [assignees, setAssignees] = React.useState({}); // id -> assignee value, once changed
  const [statuses, setStatuses] = React.useState({}); // id -> 'open' | 'pending' | 'closed', once changed
  const [tags, setTagsState] = React.useState({}); // id -> list of tag values, once changed
  const [customFields, setCustomFields] = React.useState({}); // id -> { fieldId: value }, once changed
  const [activity, setActivity] = React.useState({}); // id -> [{ id, kind, icon, ..., time, at }], oldest first

  const value = React.useMemo(() => {
    const assigneeOf = (id) => assignees[String(id)] ?? defaultAssignee(id);
    return {
      /** The assignee's value (`none` when unassigned). */
      assigneeOf,
      /** The assignee's name without "(Me)", or undefined when unassigned. */
      assigneeNameOf: (id) => assigneeName(assigneeOf(id)),
      setAssignee: (id, next) => setAssignees((prev) => ({ ...prev, [String(id)]: next })),
      /** The status: open, pending or closed. */
      statusOf: (id) => statuses[String(id)] ?? defaultStatus(id),
      setStatus: (id, next) => setStatuses((prev) => ({ ...prev, [String(id)]: next })),
      /** The tag values on the conversation. */
      tagsOf: (id) => tags[String(id)] ?? defaultTagsFor(id),
      setTags: (id, next) => setTagsState((prev) => ({ ...prev, [String(id)]: next })),
      /** The custom field values on the conversation, keyed by field id (a missing key is empty). */
      customFieldsOf: (id) => customFields[String(id)] ?? defaultCustomFieldsFor(id),
      setCustomField: (id, fieldId, next) => setCustomFields((prev) => {
        const current = prev[String(id)] ?? defaultCustomFieldsFor(id);
        return { ...prev, [String(id)]: { ...current, [fieldId]: next } };
      }),
      /** The activity rows left by changes (right panel, merging), oldest first. Email shows them in the thread. */
      activityOf: (id) => activity[String(id)] ?? [],
      addActivity: (id, row) => setActivity((prev) => ({ ...prev, [String(id)]: [...(prev[String(id)] ?? []), row] })),
    };
  }, [assignees, statuses, tags, customFields, activity]);

  return <ConversationFieldsContext.Provider value={value}>{children}</ConversationFieldsContext.Provider>;
}
