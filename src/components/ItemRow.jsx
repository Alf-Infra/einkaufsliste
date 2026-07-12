import { Check, ChevronDown, ChevronUp, Star, Trash2 } from 'lucide-react';

export function ItemRow({ item, dispatch, edit, remove, draggable, onDrop }) {
  const meta = [item.quantity, item.unit, item.category].filter(Boolean).join(' · ');
  return <li className={`item ${item.completed ? 'done' : ''} ${item.important ? 'important' : ''}`} draggable={draggable} onDragStart={(event) => event.dataTransfer.setData('text/item-id', item.id)} onDragOver={(event) => draggable && event.preventDefault()} onDrop={(event) => onDrop(event.dataTransfer.getData('text/item-id'), item.id)}>
    <button className="check" onClick={() => dispatch({ type: 'TOGGLE_ITEM', id: item.id })} aria-label={`${item.name} als ${item.completed ? 'offen' : 'erledigt'} markieren`} aria-pressed={item.completed}>{item.completed && <Check />}</button>
    <button className="item-copy" onClick={(event) => edit(item, event.currentTarget)} aria-label={`${item.name} bearbeiten`}><span className="item-name">{item.important && <Star aria-label="Wichtig" />} {item.name}</span><small>{meta}{item.note && <>{meta && ' · '}{item.note}</>}</small></button>
    {draggable && <div className="move-buttons" aria-label={`${item.name} umordnen`}><button onClick={() => dispatch({ type: 'MOVE_ITEM', id: item.id, delta: -1 })} aria-label={`${item.name} nach oben`}><ChevronUp /></button><button onClick={() => dispatch({ type: 'MOVE_ITEM', id: item.id, delta: 1 })} aria-label={`${item.name} nach unten`}><ChevronDown /></button></div>}
    <button className="icon ghost danger" onClick={() => remove(item)} aria-label={`${item.name} löschen`}><Trash2 /></button>
  </li>;
}
