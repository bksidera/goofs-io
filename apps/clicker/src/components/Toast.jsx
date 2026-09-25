import { useEffect, useImperativeHandle, useState, forwardRef, useRef } from 'react';

// Stack of slide-in toast notifications. Parent gets a ref and calls
// `toastRef.current.push({ text, kind })`. Each toast auto-dismisses after 3.2s.
// `kind` controls styling: 'flavor' (default), 'milestone' (louder).

const TTL = 3200;

const Toast = forwardRef(function Toast(_props, ref) {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(1);

  useImperativeHandle(ref, () => ({
    push({ text, kind = 'flavor' }) {
      const id = nextIdRef.current++;
      setToasts(prev => [...prev, { id, text, kind }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, TTL);
    },
  }), []);

  useEffect(() => () => setToasts([]), []);

  return (
    <div className="clicker-toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`clicker-toast clicker-toast-${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
});

export default Toast;
