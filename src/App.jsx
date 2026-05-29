import { useEffect, useId, useRef, useState } from 'react';
import { Check, Circle, ShoppingCart, Trash2 } from 'lucide-react';
import { loadItems, saveItems } from './storage';

function createItem(label) {
  return {
    id: crypto.randomUUID(),
    label,
    completed: false,
  };
}

export default function App() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState('');
  const inputId = useId();
  const hasLoadedItems = useRef(false);

  useEffect(() => {
    setItems(loadItems());
    hasLoadedItems.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedItems.current) {
      return;
    }

    saveItems(items);
  }, [items]);

  function handleSubmit(event) {
    event.preventDefault();
    const normalized = draft.trim();

    if (!normalized) {
      return;
    }

    setItems((currentItems) => [...currentItems, createItem(normalized)]);
    setDraft('');
  }

  function toggleItem(id) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  }

  function deleteItem(id) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  const completedCount = items.filter((item) => item.completed).length;

  return (
    <main className="app-shell">
      <section className="panel" aria-label="Einkaufsliste">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Alltagstool</p>
            <h1>Einkaufsliste</h1>
          </div>
          <div className="status-chip">
            <ShoppingCart size={16} aria-hidden="true" />
            <span>
              {completedCount}/{items.length || 0} besorgt
            </span>
          </div>
        </header>

        <form className="composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor={inputId}>
            Neues Einkaufselement
          </label>
          <input
            id={inputId}
            name="item"
            type="text"
            placeholder="z. B. Tomaten, Hafermilch, Spuelmittel"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" className="primary-button">
            Hinzufuegen
          </button>
        </form>

        <ul className="item-list" aria-label="Einkaufseintraege">
          {items.length === 0 ? (
            <li className="empty-state">Noch nichts auf der Liste.</li>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                className={`item-row ${item.completed ? 'is-complete' : ''}`}
              >
                <button
                  type="button"
                  className="toggle-button"
                  onClick={() => toggleItem(item.id)}
                  aria-pressed={item.completed}
                  aria-label={
                    item.completed
                      ? `${item.label} als offen markieren`
                      : `${item.label} als besorgt markieren`
                  }
                >
                  {item.completed ? (
                    <Check size={18} aria-hidden="true" />
                  ) : (
                    <Circle size={18} aria-hidden="true" />
                  )}
                </button>

                <div className="item-copy">
                  <span>{item.label}</span>
                  <small>{item.completed ? 'Besorgt' : 'Offen'}</small>
                </div>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteItem(item.id)}
                  disabled={!item.completed}
                  aria-label={`${item.label} loeschen`}
                  title={
                    item.completed
                      ? 'Eintrag loeschen'
                      : 'Erst als besorgt markieren'
                  }
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
