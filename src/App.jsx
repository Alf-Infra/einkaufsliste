import { useEffect, useId, useRef, useState } from 'react';
import { Check, Circle, ListPlus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { createDefaultList, loadState, saveState } from './storage';

function createItem(label) {
  return {
    id: crypto.randomUUID(),
    label,
    completed: false,
  };
}

function createList(name) {
  return {
    id: crypto.randomUUID(),
    name,
    items: [],
  };
}

export default function App() {
  const [state, setState] = useState(() => ({
    activeListId: 'default',
    lists: [createDefaultList()],
  }));
  const [itemDraft, setItemDraft] = useState('');
  const [listDraft, setListDraft] = useState('');
  const itemInputId = useId();
  const listInputId = useId();
  const hasLoadedState = useRef(false);

  useEffect(() => {
    setState(loadState());
    hasLoadedState.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedState.current) {
      return;
    }

    saveState(state);
  }, [state]);

  const activeList =
    state.lists.find((list) => list.id === state.activeListId) ?? state.lists[0];
  const activeItems = activeList?.items ?? [];
  const completedCount = activeItems.filter((item) => item.completed).length;

  function updateActiveItems(updater) {
    setState((currentState) => ({
      ...currentState,
      lists: currentState.lists.map((list) =>
        list.id === currentState.activeListId
          ? { ...list, items: updater(list.items) }
          : list,
      ),
    }));
  }

  function handleItemSubmit(event) {
    event.preventDefault();
    const normalized = itemDraft.trim();

    if (!normalized) {
      return;
    }

    updateActiveItems((currentItems) => [...currentItems, createItem(normalized)]);
    setItemDraft('');
  }

  function handleListSubmit(event) {
    event.preventDefault();
    const normalized = listDraft.trim();

    if (!normalized) {
      return;
    }

    const nextList = createList(normalized);
    setState((currentState) => ({
      activeListId: nextList.id,
      lists: [...currentState.lists, nextList],
    }));
    setListDraft('');
  }

  function toggleItem(id) {
    updateActiveItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  }

  function deleteItem(id) {
    updateActiveItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  function deleteList(id) {
    setState((currentState) => {
      const remainingLists = currentState.lists.filter((list) => list.id !== id);
      const lists = remainingLists.length > 0 ? remainingLists : [createDefaultList()];
      const activeListStillExists = lists.some(
        (list) => list.id === currentState.activeListId,
      );

      return {
        activeListId: activeListStillExists ? currentState.activeListId : lists[0].id,
        lists,
      };
    });
  }

  return (
    <main className="app-shell">
      <section className="panel" aria-label="Einkaufslisten">
        <aside className="list-panel" aria-label="Eigene Listen">
          <div className="list-panel-header">
            <h2>Listen</h2>
            <span>{state.lists.length}</span>
          </div>

          <form className="list-composer" onSubmit={handleListSubmit}>
            <label className="sr-only" htmlFor={listInputId}>
              Neue Liste
            </label>
            <input
              id={listInputId}
              name="list"
              type="text"
              placeholder="Neue Liste"
              value={listDraft}
              onChange={(event) => setListDraft(event.target.value)}
            />
            <button type="submit" className="icon-button" aria-label="Liste hinzufuegen">
              <ListPlus size={18} aria-hidden="true" />
            </button>
          </form>

          <ul className="lists" aria-label="Listenauswahl">
            {state.lists.map((list) => (
              <li key={list.id} className="list-row">
                <button
                  type="button"
                  className={`list-select ${
                    list.id === activeList.id ? 'is-active' : ''
                  }`}
                  aria-label={`Liste ${list.name} auswaehlen`}
                  onClick={() =>
                    setState((currentState) => ({
                      ...currentState,
                      activeListId: list.id,
                    }))
                  }
                  aria-pressed={list.id === activeList.id}
                >
                  <span>{list.name}</span>
                  <small>
                    {list.items.filter((item) => !item.completed).length} offen
                  </small>
                </button>
                <button
                  type="button"
                  className="list-delete-button"
                  onClick={() => deleteList(list.id)}
                  aria-label={`${list.name} Liste loeschen`}
                  title="Liste loeschen"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="work-panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Alltagstool</p>
              <h1>{activeList.name}</h1>
            </div>
            <div className="status-chip">
              <ShoppingCart size={16} aria-hidden="true" />
              <span>
                {completedCount}/{activeItems.length || 0} besorgt
              </span>
            </div>
          </header>

          <form className="composer" onSubmit={handleItemSubmit}>
            <label className="sr-only" htmlFor={itemInputId}>
              Neues Einkaufselement
            </label>
            <input
              id={itemInputId}
              name="item"
              type="text"
              placeholder="z. B. Tomaten, Hafermilch, Spuelmittel"
              value={itemDraft}
              onChange={(event) => setItemDraft(event.target.value)}
            />
            <button type="submit" className="primary-button">
              <Plus size={18} aria-hidden="true" />
              <span>Hinzufuegen</span>
            </button>
          </form>

          <ul className="item-list" aria-label="Einkaufseintraege">
            {activeItems.length === 0 ? (
              <li className="empty-state">Noch nichts auf der Liste.</li>
            ) : (
              activeItems.map((item) => (
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
        </div>
      </section>
    </main>
  );
}
