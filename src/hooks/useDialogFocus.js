import { useLayoutEffect, useRef } from 'react';

const FOCUSABLE = 'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

export function useDialogFocus({ onClose, initialFocusRef, returnFocusRef }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const returnTargetRef = useRef(null);
  onCloseRef.current = onClose;

  // Capture the actual opener once, while it is still the active element. A
  // shared mutable ref may point somewhere else by the time the dialog unmounts.
  if (!returnTargetRef.current && typeof document !== 'undefined') {
    returnTargetRef.current = returnFocusRef?.current || document.activeElement;
  }

  useLayoutEffect(() => {
    (initialFocusRef?.current || dialogRef.current?.querySelector(FOCUSABLE))?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
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
      const target = returnTargetRef.current;
      if (target?.isConnected && typeof target.focus === 'function') {
        target.focus();
      } else {
        document.querySelector('[data-dialog-focus-fallback]')?.focus();
      }
    };
  }, []);

  return dialogRef;
}
