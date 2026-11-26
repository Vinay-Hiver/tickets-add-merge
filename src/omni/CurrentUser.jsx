import React from 'react';

// The people you can view the prototype as. Michael's view is the default.
// Michael is a member of every inbox. Jim is only a member of the "02" inboxes
// (`hiddenInboxes` lists the ones he is not part of).
export const USERS = [
  { id: 'michael', name: 'Michael Scott', email: 'michael.scott@hiverhq.co.in', color: 'red', hiddenInboxes: [] },
  {
    id: 'jim',
    name: 'Jim Halpert',
    email: 'jim.halpert@hiverhq.co.in',
    color: 'lightBlue',
    hiddenInboxes: ['Chat Support 01', 'Slack Support 01', 'WhatsApp Support 01', 'SMS Support 01', 'Voice Support 01', 'Email Support 01'],
  },
];

// The co-assignee demo's viewer (/co-assignee.html): not a member of Email Support 01, where Nora - Shopify is.
// Not in USERS, so the prototype can't switch to her.
export const AMY_USER = { id: 'amy', name: 'Amy', email: 'amy@hiverhq.co.in', color: 'violet', hiddenInboxes: ['Email Support 01'] };

const CurrentUserContext = React.createContext({ user: USERS[0], switchUser: () => {} });

export const useCurrentUser = () => React.useContext(CurrentUserContext);

// `fixedUser`: always view as this person (the co-assignee demo views as Amy).
export function CurrentUserProvider({ children, fixedUser = undefined }) {
  const [userId, setUserId] = React.useState(USERS[0].id);
  const user = fixedUser ?? (USERS.find((u) => u.id === userId) || USERS[0]);
  const value = React.useMemo(() => ({ user, switchUser: setUserId }), [user]);
  return (
    <CurrentUserContext.Provider value={value}>
      {/* Keyed by user, so switching enters that person's view fresh (selection, open sections, etc. reset). */}
      <React.Fragment key={user.id}>{children}</React.Fragment>
    </CurrentUserContext.Provider>
  );
}
