import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useDialogFocus } from '../hooks/useDialogFocus';

export function Dialog({ title, children, onClose, initialFocusRef, returnFocusRef, actions, onSubmit, className = '' }) {
  const dialogRef = useDialogFocus({ onClose, initialFocusRef, returnFocusRef });
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form ref={dialogRef} className={`dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title" onSubmit={onSubmit}>
      <div className="dialog-title"><h2 id="dialog-title">{title}</h2><button type="button" className="icon ghost" onClick={onClose} aria-label="Dialog schließen"><X /></button></div>
      {children}
      {actions && <div className="dialog-actions">{actions}</div>}
    </form>
  </div>;
}

export function RenameListDialog({ list, onClose, onRename, returnFocusRef }) {
  const [name, setName] = useState(list.name);
  const inputRef = useRef(null);
  const valid = Boolean(name.trim());
  return <Dialog title="Liste umbenennen" onClose={onClose} initialFocusRef={inputRef} returnFocusRef={returnFocusRef}
    onSubmit={(event) => { event.preventDefault(); if (valid) onRename(name.trim()); }}
    actions={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary" disabled={!valid}>Umbenennen</button></>}>
    <label>Listenname<input ref={inputRef} value={name} onChange={(event) => setName(event.target.value)} required /></label>
  </Dialog>;
}

export function ConfirmDialog({ title, message, confirmLabel, destructive = false, onClose, onConfirm, returnFocusRef }) {
  const confirmRef = useRef(null);
  return <Dialog title={title} onClose={onClose} initialFocusRef={confirmRef} returnFocusRef={returnFocusRef}
    onSubmit={(event) => { event.preventDefault(); onConfirm(); }}
    actions={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button ref={confirmRef} className={`button ${destructive ? 'destructive' : 'primary'}`}>{confirmLabel}</button></>}>
    <p className="dialog-message">{message}</p>
  </Dialog>;
}
