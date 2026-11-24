import React from 'react';
import { createPortal } from 'react-dom';
import useCmdHeld from '../useCmdHeld';

// For demos: hold ⌘ and hover `targetRef`'s element to tint it green and label it outside, on its left, with a
// connector, the same look as the right panel's highlight (.rp-annot in App.css). `inset` pulls the tint in from the
// element's edges. `placement="top"` puts the label above the middle of the tint instead, with the connector down to it.
export default function HoverHighlight({ targetRef, label, inset = 4, placement = 'left' }) {
  const cmd = useCmdHeld();
  const [hovered, setHovered] = React.useState(false);
  const [box, setBox] = React.useState(null);
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    const el = targetRef.current;
    if (!el) return undefined;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    return () => { el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave); };
  }, [targetRef]);

  React.useLayoutEffect(() => {
    const el = targetRef.current;
    if (!cmd || !hovered || !el) { setOn(false); return undefined; }
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox({ left: r.left + inset, top: r.top + inset, width: r.width - inset * 2, height: r.height - inset * 2 });
    };
    measure();
    const raf = requestAnimationFrame(() => setOn(true)); // a frame after it's placed, so it fades in
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', measure, true); window.removeEventListener('resize', measure); };
  }, [cmd, hovered, targetRef, inset]);

  if (!box) return null;
  return createPortal(
    <>
      <div className={`rp-annot rp-annot--row${on ? ' is-on' : ''}`} style={box} />
      {placement === 'top'
        ? <div className={`rp-annot-label rp-annot-label--top${on ? ' is-on' : ''}`} style={{ left: box.left + box.width / 2, top: box.top }}>{label}</div>
        : <div className={`rp-annot-label${on ? ' is-on' : ''}`} style={{ left: box.left, top: box.top + box.height / 2 }}>{label}</div>}
    </>,
    document.body,
  );
}
