import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Menu, Plus, Search, ShoppingCart } from 'lucide-react';
import { activeList, duplicateOpenItem, filterItems, groupItems, reducer, sortItems } from './model';
import { createDefaultState, loadHistory, loadState, saveHistory, saveState } from './storage';
import { ConfirmDialog, RenameListDialog } from './components/Dialog';
import { ItemDialog, emptyDraft } from './components/ItemDialog';
import { ItemRow } from './components/ItemRow';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => typeof window === 'undefined' ? createDefaultState() : loadState());
  const [draft, setDraft] = useState(''); const [details, setDetails] = useState(null); const [duplicate, setDuplicate] = useState(null);
  const [query, setQuery] = useState(''); const [openOnly, setOpenOnly] = useState(false); const [drawer, setDrawer] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [undo, setUndo] = useState(null); const [history, setHistory] = useState(() => typeof window === 'undefined' ? [] : loadHistory());
  const dialogTriggerRef = useRef(null);
  const current = activeList(state); const completed = current.items.filter((i) => i.completed).length;
  useEffect(() => saveState(state), [state]); useEffect(() => saveHistory(history), [history]);
  useEffect(() => { if (!undo) return; const timer = setTimeout(() => setUndo(null), 6000); return () => clearTimeout(timer); }, [undo]);
  const visible = useMemo(() => sortItems(filterItems(current.items, query), state.sort).filter((i) => !openOnly || !i.completed), [current.items, query, state.sort, openOnly]);
  const groups = state.mode === 'shop' ? groupItems(visible) : { Artikel: visible };
  const submitQuick = (e) => { e.preventDefault(); const name = draft.trim(); if (!name) return; const found = duplicateOpenItem(current.items, name); if (found) { dialogTriggerRef.current = document.activeElement; setDuplicate(found); setDetails({ ...found }); return; } dispatch({ type: 'ADD_ITEM', item: { ...emptyDraft, name } }); setHistory((h) => [name, ...h.filter((x) => x.toLowerCase() !== name.toLowerCase())]); setDraft(''); };
  const remove = (item) => { const index = current.items.findIndex((i) => i.id === item.id); dispatch({ type: 'DELETE_ITEM', id: item.id }); setUndo({ item, index, listId: current.id }); };
  const openDialog = (type, trigger = document.activeElement) => { dialogTriggerRef.current = trigger; setDialog(type); };
  const closeDialog = () => setDialog(null);
  const openDetails = (item, trigger = document.activeElement) => { dialogTriggerRef.current = trigger; setDuplicate(null); setDetails(item); };
  const closeDetails = () => { setDetails(null); setDuplicate(null); };
  const saveItem = (item) => { if (!item.name.trim()) return; const found = duplicateOpenItem(current.items, item.name, item.id); if (found) { setDuplicate(found); return; } dispatch({ type: item.id ? 'UPDATE_ITEM' : 'ADD_ITEM', item }); setHistory((h) => [item.name.trim(), ...h.filter((x) => x.toLowerCase() !== item.name.trim().toLowerCase())]); closeDetails(); };
  return <div className="app-layout"><Sidebar state={state} current={current} dispatch={dispatch} open={drawer} close={() => setDrawer(false)} onRename={(trigger) => openDialog('rename', trigger)} onDelete={(trigger) => openDialog('delete', trigger)} />
    <main className={`workspace ${state.mode === 'shop' ? 'shopping' : ''}`} tabIndex="-1" data-dialog-focus-fallback>
      <header className="topbar"><button className="icon ghost mobile-only" onClick={() => setDrawer(true)} aria-label="Listen öffnen"><Menu /></button><div><span className="eyebrow">{state.mode === 'shop' ? 'Einkaufsmodus' : 'Planung'}</span><h1>{current.name}</h1></div><div className="progress" aria-label={`${completed} von ${current.items.length} erledigt`}><span>{completed}/{current.items.length}</span><div><i style={{ width: `${current.items.length ? completed / current.items.length * 100 : 0}%` }} /></div></div><button className="button mode" onClick={() => dispatch({ type: 'SET_MODE', mode: state.mode === 'shop' ? 'plan' : 'shop' })}><ShoppingCart />{state.mode === 'shop' ? 'Planen' : 'Einkaufen'}</button></header>
      {state.mode === 'plan' && <form className="quick-add" onSubmit={submitQuick}><label className="sr-only" htmlFor="quick-item">Artikel hinzufügen</label><input id="quick-item" list="history" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Was brauchst du?" autoComplete="off"/><datalist id="history">{history.map((x) => <option key={x} value={x} />)}</datalist><button type="button" className="button secondary details" onClick={(event) => openDetails({ ...emptyDraft, name: draft }, event.currentTarget)}>Details</button><button className="button primary"><Plus />Hinzufügen</button></form>}
      <section className="toolbar" aria-label="Filtern und sortieren"><label className="search"><Search /><span className="sr-only">Artikel durchsuchen</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name oder Notiz suchen" /></label><label>Sortierung <select value={state.sort} onChange={(e) => dispatch({ type: 'SET_SORT', sort: e.target.value })}><option value="custom">Eigene Reihenfolge</option><option value="category">Kategorie</option><option value="name">Name</option><option value="status">Status</option></select></label>{state.mode === 'shop' && <label className="check-label"><input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />Nur offene</label>}</section>
      {visible.length === 0 ? <div className="empty"><ShoppingCart /><h2>{query ? 'Nichts gefunden' : 'Die Liste ist bereit'}</h2><p>{query ? 'Versuche einen anderen Suchbegriff.' : 'Füge oben den ersten Artikel hinzu.'}</p></div> : <div className="groups">{Object.entries(groups).map(([group, items]) => <section className="item-group" key={group}><h2>{group}<span>{items.length}</span></h2><ul>{items.map((item) => <ItemRow key={item.id} item={item} dispatch={dispatch} edit={openDetails} remove={remove} draggable={state.sort === 'custom' && state.mode === 'plan'} onDrop={(id, beforeId) => dispatch({ type: 'REORDER_ITEM', id, beforeId })} />)}</ul></section>)}</div>}
      {state.mode === 'shop' && completed > 0 && <button className="finish button primary" onClick={(event) => openDialog('finish', event.currentTarget)}>Einkauf abschließen</button>}
    </main>
    {details && <ItemDialog initial={details} duplicate={duplicate} onClose={closeDetails} onSave={saveItem} returnFocusRef={dialogTriggerRef} />}
    {dialog === 'rename' && <RenameListDialog list={current} onClose={closeDialog} returnFocusRef={dialogTriggerRef} onRename={(name) => { dispatch({ type: 'RENAME_LIST', name }); closeDialog(); }} />}
    {dialog === 'delete' && <ConfirmDialog title="Liste löschen" message={current.items.length ? `Die Liste „${current.name}“ und ihre ${current.items.length} Artikel werden dauerhaft gelöscht.` : `Die leere Liste „${current.name}“ wird gelöscht.`} confirmLabel="Liste löschen" destructive onClose={closeDialog} returnFocusRef={dialogTriggerRef} onConfirm={() => { dispatch({ type: 'DELETE_LIST', id: current.id }); closeDialog(); }} />}
    {dialog === 'finish' && <ConfirmDialog title="Einkauf abschließen" message={`${completed} ${completed === 1 ? 'erledigter Artikel wird' : 'erledigte Artikel werden'} entfernt. Offene Artikel bleiben erhalten.`} confirmLabel={`${completed} entfernen`} onClose={closeDialog} returnFocusRef={dialogTriggerRef} onConfirm={() => { dispatch({ type: 'COMPLETE_SHOPPING' }); closeDialog(); }} />}
    {undo && <div className="toast" role="status"><span>„{undo.item.name}“ gelöscht</span><button onClick={() => { dispatch({ type: 'RESTORE_ITEM', item: undo.item, index: undo.index, listId: undo.listId }); setUndo(null); }}>Rückgängig</button></div>}
  </div>;
}
