import React from 'react';
import { createPortal } from 'react-dom';
import useCmdHeld from '../useCmdHeld';

// For demos, in a merged ticket's conversation: hold ⌘ over the right panel and the part under the pointer is tinted
// green and labelled outside the panel, like the merge sheet (Figma: Tickets Add/Merge › 4122:15577).
//   Ticket details: from the top of the panel's content down to Account details (the ticket's sections).
//   Conversation details: the rest, from the conversation's block (its subject) down to its last section (not the
//   "Customize widgets" button).
// Same look as the sheet's: the tint sits 8px in from the panel's edges with rounded corners and fades in and out; the
// label's connector reaches the tint.
const INSET = 8;
// `panelRef` is the element holding the panel.
export default function PanelHighlights({ panelRef }) {
  const cmd = useCmdHeld();
  const [pointerY, setPointerY] = React.useState(null);
  const [box, setBox] = React.useState(null);

  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;
    const move = (e) => setPointerY(e.clientY);
    const leave = () => setPointerY(null);
    panel.addEventListener('mousemove', move);
    panel.addEventListener('mouseleave', leave);
    return () => { panel.removeEventListener('mousemove', move); panel.removeEventListener('mouseleave', leave); };
  }, [panelRef]);

  // Where the two parts are, measured each time (the panel scrolls and its sections open and close). The last box is
  // kept while it fades out.
  const [on, setOn] = React.useState(false);
  React.useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!cmd || pointerY == null || !panel) { setOn(false); return undefined; }
    // On a frame after the box is placed, so it fades in rather than popping
    const raf = requestAnimationFrame(() => setOn(true));
    const measure = () => {
      const body = panel.querySelector('.hot-rp-body');
      const split = panel.querySelector('.hot-rp-top--conversation');
      if (!body || !split) { setBox(null); return; }
      const b = body.getBoundingClientRect();
      const s = Math.min(Math.max(split.getBoundingClientRect().top, b.top), b.bottom);
      const footer = panel.querySelector('.hot-rp-footer');
      const end = footer ? Math.min(footer.getBoundingClientRect().top, b.bottom) : b.bottom;
      const part = pointerY < s ? 'ticket' : 'convo';
      const top = (part === 'ticket' ? b.top : s) + INSET;
      const bottom = (part === 'ticket' ? s : end) - INSET;
      setBox(bottom - top < 1 ? null : { part, left: b.left + INSET, width: b.width - INSET * 2, top, height: bottom - top });
    };
    measure();
    const body = panel.querySelector('.hot-rp-body');
    body?.addEventListener('scroll', measure);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(raf); body?.removeEventListener('scroll', measure); window.removeEventListener('resize', measure); };
  }, [cmd, pointerY, panelRef]);

  // Nothing in the panel responds while a part is highlighted (.cmd-locked in App.css)
  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !on) return undefined;
    panel.classList.add('cmd-locked');
    return () => panel.classList.remove('cmd-locked');
  }, [on, panelRef]);

  if (!box) return null;
  // The cutout reaches 8px past the part on every side
  const cut = { left: box.left - 8, top: box.top - 8, width: box.width + 16, height: box.height + 16 };
  return createPortal(
    <>
      <div className={`rp-annot${on ? ' is-on' : ''}`} style={cut} />
      <div className={`rp-annot-label${on ? ' is-on' : ''}`} style={{ left: cut.left, top: cut.top + cut.height / 2 }}>
        {box.part === 'ticket' ? 'Ticket details' : 'Conversation details'}
      </div>
    </>,
    document.body,
  );
}
