import React from 'react';

// The co-assignee demo, shared between the prototype (index.html, Michael's view) and /co-assignee.html (Amy's view),
// which run in two tabs. It lives in localStorage so each tab sees the other's changes as they happen:
//   coAssignees: conversation id -> co-assignee value ('amy' or 'none'). Only Nora - Shopify has the field.
//   ticket: the ticket Nora's conversation was merged into ({ ids, titleId, ticketId, description }), or null.
// Loading the prototype starts the demo over.

export const NORA_ID = 65;
export const AMY = { value: 'amy', label: 'Amy', color: 'violet' };
export const CO_ASSIGNEE_PEOPLE = [AMY];

const KEY = 'tam-co-assignee-demo';
const EMPTY = JSON.stringify({ coAssignees: {}, ticket: null });
const listeners = new Set();

const read = () => {
  try { return localStorage.getItem(KEY) ?? EMPTY; } catch { return EMPTY; }
};
const write = (next) => {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked: this tab still updates */ }
  listeners.forEach((l) => l());
};
const subscribe = (fn) => {
  listeners.add(fn);
  const onStorage = (e) => { if (e.key === KEY) fn(); }; // the other tab changed it
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(fn); window.removeEventListener('storage', onStorage); };
};
const current = () => JSON.parse(read());

export const resetCoAssigneeDemo = () => write(JSON.parse(EMPTY));
export const setCoAssignee = (id, value) => {
  const s = current();
  write({ ...s, coAssignees: { ...s.coAssignees, [String(id)]: value } });
};
export const setDemoTicket = (ticket) => write({ ...current(), ticket });

/** The demo's state, re-rendering when either tab changes it. */
export function useCoAssigneeDemo() {
  const raw = React.useSyncExternalStore(subscribe, read, () => EMPTY);
  return React.useMemo(() => {
    const s = JSON.parse(raw);
    return { ...s, coAssigneeOf: (id) => s.coAssignees[String(id)] ?? 'none' };
  }, [raw]);
}
