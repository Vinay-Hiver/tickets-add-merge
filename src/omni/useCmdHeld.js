import React from 'react';

/** True while ⌘ (Meta) is held. For demo highlights: they show only while the presenter holds ⌘. */
export default function useCmdHeld() {
  const [held, setHeld] = React.useState(false);
  React.useEffect(() => {
    const down = (e) => { if (e.key === 'Meta') setHeld(true); };
    const up = (e) => { if (e.key === 'Meta') setHeld(false); };
    const off = () => setHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', off);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', off);
    };
  }, []);
  return held;
}
