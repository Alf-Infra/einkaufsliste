import { useRef, useState } from 'react';
import { Dialog } from './Dialog';

export const CATEGORIES = ['Obst & Gemüse', 'Kühlregal', 'Backwaren', 'Getränke', 'Haushalt', 'Drogerie', 'Sonstiges'];
export const emptyDraft = { name: '', quantity: '', unit: '', category: 'Sonstiges', note: '', important: false };

export function ItemDialog({ initial, onClose, onSave, duplicate, returnFocusRef }) {
  const [draft, setDraft] = useState(initial || emptyDraft);
  const nameRef = useRef(null);
  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  return <Dialog title={initial?.id ? 'Artikel bearbeiten' : 'Artikeldetails'} onClose={onClose} initialFocusRef={nameRef} returnFocusRef={returnFocusRef}
    onSubmit={(event) => { event.preventDefault(); onSave(draft); }}
    actions={<><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Speichern</button></>}>
    <label>Name<input ref={nameRef} value={draft.name} onChange={(event) => set('name', event.target.value)} required /></label>
    {duplicate && <p className="inline-alert" role="alert">„{duplicate.name}“ ist bereits offen. Bitte bearbeite den vorhandenen Artikel.</p>}
    <div className="form-grid"><label>Menge<input value={draft.quantity} onChange={(event) => set('quantity', event.target.value)} inputMode="decimal" /></label><label>Einheit<input value={draft.unit} onChange={(event) => set('unit', event.target.value)} placeholder="kg, Packung …" /></label></div>
    <label>Kategorie<select value={draft.category} onChange={(event) => set('category', event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
    <label>Notiz<textarea value={draft.note} onChange={(event) => set('note', event.target.value)} rows="2" /></label>
    <label className="check-label"><input type="checkbox" checked={draft.important} onChange={(event) => set('important', event.target.checked)} />Als wichtig markieren</label>
  </Dialog>;
}
