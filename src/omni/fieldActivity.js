import { statusOptions } from '../patterns/RightPanel/data/options';
import { assigneeName } from './ConversationFields';
import { TAGS } from './data/tags';
import { CUSTOM_FIELDS } from './data/customFields';
import { formatNoteTime } from './components/notes/EmailNotes';

const tagLabel = (value) => TAGS.find((t) => t.value === value)?.label ?? value;
const statusLabel = (value) => statusOptions.find((o) => o.value === value)?.label ?? value;

/**
 * Right-panel change handlers for conversation `id` that also log each change as an activity row
 * (same logic as the "Activity and Notes - All Channels" prototype). Email shows these rows in the thread.
 * `logIds` are the threads the rows go to: the conversation itself, or for a ticket, every conversation in it.
 * Rows keep who did it (and who it was assigned to) as people, so each viewer reads themselves as "You".
 */
export function fieldChangeHandlers({ fields, user, id, logIds = [id] }) {
  const log = (kind, row) => {
    const now = Date.now();
    const base = { kind, actor: { id: user.id, name: user.name }, time: formatNoteTime(), at: now, ...row };
    logIds.forEach((logId) => fields.addActivity(logId, { ...base, id: `act-${now}-${logId}-${Math.random().toString(36).slice(2, 6)}` }));
  };

  return {
    changeAssignee: (value) => {
      if (value === fields.assigneeOf(id)) return;
      fields.setAssignee(id, value);
      const name = assigneeName(value);
      log('assignee', name
        ? { icon: 'assigned', verb: 'assigned this conversation to', object: { id: value, name } }
        : { icon: 'assigned', verb: 'unassigned the conversation' });
    },
    changeStatus: (value) => {
      if (value === fields.statusOf(id)) return;
      fields.setStatus(id, value);
      log('status', { icon: 'flag', verb: `changed status to ${statusLabel(value)}` });
    },
    // One row per tag, so the summary can count them ("3 tags added").
    changeTags: (value) => {
      const before = fields.tagsOf(id);
      fields.setTags(id, value);
      value.filter((v) => !before.includes(v)).forEach((v) => log('tag-add', { icon: 'tag', verb: `applied ${tagLabel(v)} tag` }));
      before.filter((v) => !value.includes(v)).forEach((v) => log('tag-remove', { icon: 'tag', verb: `removed ${tagLabel(v)} tag` }));
    },
    changeCustomField: (fieldId, value) => {
      fields.setCustomField(id, fieldId, value);
      const label = CUSTOM_FIELDS.find((f) => f.id === fieldId)?.label ?? fieldId;
      log('field', { icon: 'text', verb: value ? `updated ${label} to ${value}` : `cleared ${label}` });
    },
  };
}
