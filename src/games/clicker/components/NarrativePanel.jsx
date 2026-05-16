import { useEffect, useRef } from 'react';

export default function NarrativePanel({ stage, flashKey }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!flashKey) return;
    const el = panelRef.current;
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth; // force reflow so the animation re-triggers
    el.classList.add('flash');
  }, [flashKey]);

  if (!stage) return null;

  return (
    <div className="clicker-narrative-panel" ref={panelRef}>
      <h2>{stage.theme.name}</h2>
      <p>{stage.theme.story_text}</p>
    </div>
  );
}
