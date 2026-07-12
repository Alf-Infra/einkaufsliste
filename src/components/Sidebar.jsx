import { useState } from 'react';
import { Copy, Edit3, ListPlus, ShoppingCart, Trash2, X } from 'lucide-react';

export function Sidebar({ state, current, dispatch, open, close, onRename, onDelete }) {
  const [name, setName] = useState('');
  return <><div className={`drawer-scrim ${open ? 'show' : ''}`} onClick={close} /><aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Listenverwaltung">
    <div className="brand"><span className="brand-mark"><ShoppingCart /></span><div><strong>Plan & Kauf</strong><small>Local-first</small></div><button className="icon ghost mobile-only" onClick={close} aria-label="Listen schließen"><X /></button></div>
    <form className="new-list" onSubmit={(event) => { event.preventDefault(); if (name.trim()) { dispatch({ type: 'ADD_LIST', name }); setName(''); } }}><label className="sr-only" htmlFor="new-list">Neue Liste</label><input id="new-list" value={name} onChange={(event) => setName(event.target.value)} placeholder="Neue Liste"/><button className="icon primary" aria-label="Liste anlegen"><ListPlus /></button></form>
    <nav aria-label="Eigene Listen">{state.lists.map((list) => <button key={list.id} className={`list-link ${list.id === current.id ? 'active' : ''}`} aria-pressed={list.id === current.id} onClick={() => { dispatch({ type: 'SELECT_LIST', id: list.id }); close(); }}><span><strong>{list.name}</strong><small>{list.items.filter((item) => !item.completed).length} offen</small></span><span className="count">{list.items.length}</span></button>)}</nav>
    <div className="sidebar-actions"><button onClick={onRename}><Edit3 />Umbenennen</button><button onClick={() => dispatch({ type: 'DUPLICATE_LIST' })}><Copy />Duplizieren</button><button className="danger" onClick={onDelete}><Trash2 />Löschen</button></div>
  </aside></>;
}
