import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

export function useDialogFocus({ onClose, initialFocusRef, returnFocusRef }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = returnFocusRef?.current || document.activeElement;
    (initialFocusRef?.current || dialogRef.current?.querySelector(FOCUSABLE))?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) || [])]
        .filter((element) => !element.disabled && element.getAttribute('aria-hidden') !== 'true');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      requestAnimationFrame(() => previouslyFocused?.isConnected && previouslyFocused.focus());
    };
  }, [initialFocusRef, onClose, returnFocusRef]);

  return dialogRef;
}
