import React from 'react';
import { createPortal } from 'react-dom';
import useCmdHeld from '../useCmdHeld';

// For demos: hold ⌘ and hover `targetRef`'s element to dim everything around it and label it outside, on its left,
// with a connector, the same look as the right panel's highlight (.rp-annot in App.css). `label` is optional. `inset` pulls the tint in from the
// element's edges. `placement="top"` puts the label above the middle of the tint instead, with the connector down to it.
// `getBox(el)` highlights only part of the element ({ left, top, right, bottom } in the viewport); then only the
// pointer over that part turns it on.
export default function HoverHighlight({ targetRef, label, inset = 4, placement = 'left', getBox }) {
  const cmd = useCmdHeld();
  const [pointer, setPointer] = React.useState(null); // { x, y } while over the element
  const [box, setBox] = React.useState(null);
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    const el = targetRef.current;
    if (!el) return undefined;
    const move = (e) => setPointer({ x: e.clientX, y: e.clientY });
    const leave = () => setPointer(null);
    el.addEventListener('mouseenter', move);
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => { el.removeEventListener('mouseenter', move); el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); };
  }, [targetRef]);

  const area = () => {
    const el = targetRef.current;
    const r = getBox ? getBox(el) : el.getBoundingClientRect();
    return r && { left: r.left + inset, top: r.top + inset, right: r.right - inset, bottom: r.bottom - inset };
  };
  const inside = (a, p) => a && p && p.x >= a.left && p.x <= a.right && p.y >= a.top && p.y <= a.bottom;
  const hovered = !!pointer && (!getBox || (targetRef.current && inside(area(), pointer)));

  React.useLayoutEffect(() => {
    const el = targetRef.current;
    if (!cmd || !hovered || !el) { setOn(false); return undefined; }
    const measure = () => {
      const a = area();
      // The cutout reaches 8px past the part on every side
      if (a) setBox({ left: a.left - 8, top: a.top - 8, width: a.right - a.left + 16, height: a.bottom - a.top + 16 });
    };
    measure();
    const raf = requestAnimationFrame(() => setOn(true)); // a frame after it's placed, so it fades in
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', measure, true); window.removeEventListener('resize', measure); };
  }, [cmd, hovered, targetRef, inset]);

  // Nothing inside the highlighted element responds while it's highlighted (.cmd-locked in App.css)
  React.useEffect(() => {
    const el = targetRef.current;
    if (!el || !on) return undefined;
    el.classList.add('cmd-locked');
    return () => el.classList.remove('cmd-locked');
  }, [on, targetRef]);

  if (!box) return null;
  return createPortal(
    <>
      <div className={`rp-annot rp-annot--row${on ? ' is-on' : ''}`} style={box} />
      {!label ? null : placement === 'top'
        ? <div className={`rp-annot-label rp-annot-label--top${on ? ' is-on' : ''}`} style={{ left: box.left + box.width / 2, top: box.top }}>{label}</div>
        : <div className={`rp-annot-label${on ? ' is-on' : ''}`} style={{ left: box.left, top: box.top + box.height / 2 }}>{label}</div>}
    </>,
    document.body,
  );
}
