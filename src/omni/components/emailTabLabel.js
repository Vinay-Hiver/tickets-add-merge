// A merged conversation's chip label: "Customer • Subject", the subject cut short as in Figma (Tickets Add/Merge › 4089:1970).
const customerOf = (c) => c.messages?.[0]?.sender ?? c.sender;

export const emailTabLabel = (c) => {
  const subject = c.subject.length > 14 ? `${c.subject.slice(0, 12)}..` : c.subject;
  return `${customerOf(c)} • ${subject}`;
};
