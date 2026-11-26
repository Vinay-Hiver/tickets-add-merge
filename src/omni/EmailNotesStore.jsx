import React from 'react';

// The notes in every email thread: { [conversationId]: { notes, pin: { id, by } | null } }.
// Shared by every user (it sits above CurrentUserProvider), so a note Michael adds shows in Jim's view too.
// `syncKey` also shares them with other tabs through localStorage (the co-assignee demo: Amy's notes in
// /co-assignee.html show in the prototype, and the prototype's in hers). `resetOnLoad` starts them empty (the prototype
// starts the demo over when it loads). Attachments are files in the tab that added them, so they don't open in the other.

const EmailNotesContext = React.createContext({ threads: {}, setThreads: () => {} });

export const useEmailNotes = () => React.useContext(EmailNotesContext);

const load = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? {}; } catch { return {}; }
};

export function EmailNotesProvider({ children, syncKey = '', resetOnLoad = false }) {
  const [threads, setThreads] = React.useState(() => (syncKey && !resetOnLoad ? load(syncKey) : {}));
  const fromOtherTab = React.useRef(false);

  // Every change here goes to storage (not the ones that just came from the other tab)
  React.useEffect(() => {
    if (!syncKey) return;
    if (fromOtherTab.current) { fromOtherTab.current = false; return; }
    try { localStorage.setItem(syncKey, JSON.stringify(threads)); } catch { /* storage blocked: this tab still works */ }
  }, [syncKey, threads]);

  // ...and the other tab's changes come in
  React.useEffect(() => {
    if (!syncKey) return undefined;
    const onStorage = (e) => {
      if (e.key !== syncKey) return;
      fromOtherTab.current = true;
      setThreads(e.newValue ? JSON.parse(e.newValue) : {});
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [syncKey]);

  const value = React.useMemo(() => ({ threads, setThreads }), [threads]);
  return <EmailNotesContext.Provider value={value}>{children}</EmailNotesContext.Provider>;
}
