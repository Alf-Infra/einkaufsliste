import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Copy, Edit3, ListPlus, Menu, Plus, Search, ShoppingCart, Star, Trash2, X } from 'lucide-react';
import { activeList, duplicateOpenItem, filterItems, groupItems, reducer, sortItems } from './model';
import { createDefaultState, loadHistory, loadState, saveHistory, saveState } from './storage';

const CATEGORIES = ['Obst & Gemüse', 'Kühlregal', 'Backwaren', 'Getränke', 'Haushalt', 'Drogerie', 'Sonstiges'];
const emptyDraft = { name: '', quantity: '', unit: '', category: 'Sonstiges', note: '', important: false };

function ItemDialog({ initial, onClose, onSave, duplicate }) {
  const [draft, setDraft] = useState(initial || emptyDraft);
  const dialogRef = useRef(null);
  const nameRef = useRef(null);
  useEffect(() => {
    nameRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...dialogRef.current.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <form ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby="item-dialog-title" onSubmit={(e) => { e.preventDefault(); onSave(draft); }}>
      <div className="dialog-title"><h2 id="item-dialog-title">{initial?.id ? 'Artikel bearbeiten' : 'Artikeldetails'}</h2><button type="button" className="icon ghost" onClick={onClose} aria-label="Dialog schließen"><X /></button></div>
      <label>Name<input ref={nameRef} value={draft.name} onChange={(e) => set('name', e.target.value)} required /></label>
      {duplicate && <p className="inline-alert" role="alert">„{duplicate.name}“ ist bereits offen. Bitte bearbeite den vorhandenen Artikel.</p>}
      <div className="form-grid"><label>Menge<input value={draft.quantity} onChange={(e) => set('quantity', e.target.value)} inputMode="decimal" /></label><label>Einheit<input value={draft.unit} onChange={(e) => set('unit', e.target.value)} placeholder="kg, Packung …" /></label></div>
      <label>Kategorie<select value={draft.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label>Notiz<textarea value={draft.note} onChange={(e) => set('note', e.target.value)} rows="2" /></label>
      <label className="check-label"><input type="checkbox" checked={draft.important} onChange={(e) => set('important', e.target.checked)} />Als wichtig markieren</label>
      <div className="dialog-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary">Speichern</button></div>
    </form>
  </div>;
}

function Sidebar({ state, current, dispatch, open, close }) {
  const [name, setName] = useState('');
  const rename = () => { const next = prompt('Neuer Listenname', current.name); if (next) dispatch({ type: 'RENAME_LIST', name: next }); };
  const remove = (list) => { if (list.items.length && !confirm(`Liste „${list.name}“ mit ${list.items.length} Artikeln löschen?`)) return; dispatch({ type: 'DELETE_LIST', id: list.id }); };
  return <><div className={`drawer-scrim ${open ? 'show' : ''}`} onClick={close} /><aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Listenverwaltung">
    <div className="brand"><span className="brand-mark"><ShoppingCart /></span><div><strong>Plan & Kauf</strong><small>Local-first</small></div><button className="icon ghost mobile-only" onClick={close} aria-label="Listen schließen"><X /></button></div>
    <form className="new-list" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { dispatch({ type: 'ADD_LIST', name }); setName(''); } }}><label className="sr-only" htmlFor="new-list">Neue Liste</label><input id="new-list" value={name} onChange={(e) => setName(e.target.value)} placeholder="Neue Liste"/><button className="icon primary" aria-label="Liste anlegen"><ListPlus /></button></form>
    <nav aria-label="Eigene Listen">{state.lists.map((list) => <button key={list.id} className={`list-link ${list.id === current.id ? 'active' : ''}`} aria-pressed={list.id === current.id} onClick={() => { dispatch({ type: 'SELECT_LIST', id: list.id }); close(); }}><span><strong>{list.name}</strong><small>{list.items.filter((i) => !i.completed).length} offen</small></span><span className="count">{list.items.length}</span></button>)}</nav>
    <div className="sidebar-actions"><button onClick={rename}><Edit3 />Umbenennen</button><button onClick={() => dispatch({ type: 'DUPLICATE_LIST' })}><Copy />Duplizieren</button><button className="danger" onClick={() => remove(current)}><Trash2 />Löschen</button></div>
  </aside></>;
}

function ItemRow({ item, dispatch, edit, remove, draggable, onDrop }) {
  const meta = [item.quantity, item.unit, item.category].filter(Boolean).join(' · ');
  return <li className={`item ${item.completed ? 'done' : ''} ${item.important ? 'important' : ''}`} draggable={draggable} onDragStart={(e) => e.dataTransfer.setData('text/item-id', item.id)} onDragOver={(e) => draggable && e.preventDefault()} onDrop={(e) => onDrop(e.dataTransfer.getData('text/item-id'), item.id)}>
    <button className="check" onClick={() => dispatch({ type: 'TOGGLE_ITEM', id: item.id })} aria-label={`${item.name} als ${item.completed ? 'offen' : 'erledigt'} markieren`} aria-pressed={item.completed}>{item.completed && <Check />}</button>
    <button className="item-copy" onClick={() => edit(item)} aria-label={`${item.name} bearbeiten`}><span className="item-name">{item.important && <Star aria-label="Wichtig" />} {item.name}</span><small>{meta}{item.note && <>{meta && ' · '}{item.note}</>}</small></button>
    {draggable && <div className="move-buttons"><button onClick={() => dispatch({ type: 'MOVE_ITEM', id: item.id, delta: -1 })} aria-label={`${item.name} nach oben`}><ChevronUp /></button><button onClick={() => dispatch({ type: 'MOVE_ITEM', id: item.id, delta: 1 })} aria-label={`${item.name} nach unten`}><ChevronDown /></button></div>}
    <button className="icon ghost danger" onClick={() => remove(item)} aria-label={`${item.name} löschen`}><Trash2 /></button>
  </li>;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => typeof window === 'undefined' ? createDefaultState() : loadState());
  const [draft, setDraft] = useState(''); const [details, setDetails] = useState(null); const [duplicate, setDuplicate] = useState(null);
  const [query, setQuery] = useState(''); const [openOnly, setOpenOnly] = useState(false); const [drawer, setDrawer] = useState(false);
  const [undo, setUndo] = useState(null); const [history, setHistory] = useState(() => typeof window === 'undefined' ? [] : loadHistory());
  const dialogTriggerRef = useRef(null);
  const current = activeList(state); const completed = current.items.filter((i) => i.completed).length;
  useEffect(() => saveState(state), [state]); useEffect(() => saveHistory(history), [history]);
  useEffect(() => { if (!undo) return; const timer = setTimeout(() => setUndo(null), 6000); return () => clearTimeout(timer); }, [undo]);
  const visible = useMemo(() => sortItems(filterItems(current.items, query), state.sort).filter((i) => !openOnly || !i.completed), [current.items, query, state.sort, openOnly]);
  const groups = state.mode === 'shop' ? groupItems(visible) : { Artikel: visible };
  const submitQuick = (e) => { e.preventDefault(); const name = draft.trim(); if (!name) return; const found = duplicateOpenItem(current.items, name); if (found) { dialogTriggerRef.current = document.activeElement; setDuplicate(found); setDetails({ ...found }); return; } dispatch({ type: 'ADD_ITEM', item: { ...emptyDraft, name } }); setHistory((h) => [name, ...h.filter((x) => x.toLowerCase() !== name.toLowerCase())]); setDraft(''); };
  const remove = (item) => { const index = current.items.findIndex((i) => i.id === item.id); dispatch({ type: 'DELETE_ITEM', id: item.id }); setUndo({ item, index, listId: current.id }); };
  const finish = () => { if (completed && confirm(`${completed} erledigte Artikel entfernen?`)) dispatch({ type: 'COMPLETE_SHOPPING' }); };
  const openDetails = (item) => { dialogTriggerRef.current = document.activeElement; setDuplicate(null); setDetails(item); };
  const closeDetails = () => { setDetails(null); setDuplicate(null); requestAnimationFrame(() => dialogTriggerRef.current?.focus()); };
  const saveItem = (item) => { if (!item.name.trim()) return; const found = duplicateOpenItem(current.items, item.name, item.id); if (found) { setDuplicate(found); return; } dispatch({ type: item.id ? 'UPDATE_ITEM' : 'ADD_ITEM', item }); setHistory((h) => [item.name.trim(), ...h.filter((x) => x.toLowerCase() !== item.name.trim().toLowerCase())]); closeDetails(); };
  return <div className="app-layout"><Sidebar state={state} current={current} dispatch={dispatch} open={drawer} close={() => setDrawer(false)} />
    <main className={`workspace ${state.mode === 'shop' ? 'shopping' : ''}`}>
      <header className="topbar"><button className="icon ghost mobile-only" onClick={() => setDrawer(true)} aria-label="Listen öffnen"><Menu /></button><div><span className="eyebrow">{state.mode === 'shop' ? 'Einkaufsmodus' : 'Planung'}</span><h1>{current.name}</h1></div><div className="progress" aria-label={`${completed} von ${current.items.length} erledigt`}><span>{completed}/{current.items.length}</span><div><i style={{ width: `${current.items.length ? completed / current.items.length * 100 : 0}%` }} /></div></div><button className="button mode" onClick={() => dispatch({ type: 'SET_MODE', mode: state.mode === 'shop' ? 'plan' : 'shop' })}><ShoppingCart />{state.mode === 'shop' ? 'Planen' : 'Einkaufen'}</button></header>
      {state.mode === 'plan' && <form className="quick-add" onSubmit={submitQuick}><label className="sr-only" htmlFor="quick-item">Artikel hinzufügen</label><input id="quick-item" list="history" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Was brauchst du?" autoComplete="off"/><datalist id="history">{history.map((x) => <option key={x} value={x} />)}</datalist><button type="button" className="button secondary details" onClick={() => openDetails({ ...emptyDraft, name: draft })}>Details</button><button className="button primary"><Plus />Hinzufügen</button></form>}
      <section className="toolbar" aria-label="Filtern und sortieren"><label className="search"><Search /><span className="sr-only">Artikel durchsuchen</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name oder Notiz suchen" /></label><label>Sortierung <select value={state.sort} onChange={(e) => dispatch({ type: 'SET_SORT', sort: e.target.value })}><option value="custom">Eigene Reihenfolge</option><option value="category">Kategorie</option><option value="name">Name</option><option value="status">Status</option></select></label>{state.mode === 'shop' && <label className="check-label"><input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />Nur offene</label>}</section>
      {visible.length === 0 ? <div className="empty"><ShoppingCart /><h2>{query ? 'Nichts gefunden' : 'Die Liste ist bereit'}</h2><p>{query ? 'Versuche einen anderen Suchbegriff.' : 'Füge oben den ersten Artikel hinzu.'}</p></div> : <div className="groups">{Object.entries(groups).map(([group, items]) => <section className="item-group" key={group}><h2>{group}<span>{items.length}</span></h2><ul>{items.map((item) => <ItemRow key={item.id} item={item} dispatch={dispatch} edit={openDetails} remove={remove} draggable={state.sort === 'custom' && state.mode === 'plan'} onDrop={(id, beforeId) => dispatch({ type: 'REORDER_ITEM', id, beforeId })} />)}</ul></section>)}</div>}
      {state.mode === 'shop' && completed > 0 && <button className="finish button primary" onClick={finish}>Einkauf abschließen</button>}
    </main>
    {details && <ItemDialog initial={details} duplicate={duplicate} onClose={closeDetails} onSave={saveItem} />}
    {undo && <div className="toast" role="status"><span>„{undo.item.name}“ gelöscht</span><button onClick={() => { dispatch({ type: 'RESTORE_ITEM', item: undo.item, index: undo.index, listId: undo.listId }); setUndo(null); }}>Rückgängig</button></div>}
  </div>;
}
