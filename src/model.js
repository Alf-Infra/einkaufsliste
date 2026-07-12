import { createDefaultState, createItem, createList } from './storage';

export const activeList = (state) => state.lists.find((l) => l.id === state.activeListId) || state.lists[0];

export function filterItems(items, query = '') {
  const q = query.trim().toLocaleLowerCase('de');
  return q ? items.filter((i) => `${i.name} ${i.note}`.toLocaleLowerCase('de').includes(q)) : items;
}

export function sortItems(items, sort = 'custom') {
  const copy = [...items];
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  if (sort === 'category') return copy.sort((a, b) => a.category.localeCompare(b.category, 'de') || a.name.localeCompare(b.name, 'de'));
  if (sort === 'status') return copy.sort((a, b) => Number(a.completed) - Number(b.completed));
  return copy;
}

export function groupItems(items) {
  return items.reduce((groups, item) => {
    const key = item.completed ? 'Erledigt' : item.category;
    (groups[key] ||= []).push(item);
    return groups;
  }, {});
}

const updateActive = (state, updater) => ({ ...state, lists: state.lists.map((l) => l.id === state.activeListId ? updater(l) : l) });

export function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_LIST': return state.lists.some((l) => l.id === action.id) ? { ...state, activeListId: action.id } : state;
    case 'ADD_LIST': {
      if (!action.name?.trim()) return state;
      const list = createList(action.name);
      return { ...state, lists: [...state.lists, list], activeListId: list.id };
    }
    case 'RENAME_LIST': return action.name?.trim() ? updateActive(state, (l) => ({ ...l, name: action.name.trim() })) : state;
    case 'DUPLICATE_LIST': {
      const source = activeList(state); const list = createList(`${source.name} Kopie`, source.items.map((i) => createItem({ ...i, id: undefined, completed: false })));
      return { ...state, lists: [...state.lists, list], activeListId: list.id };
    }
    case 'DELETE_LIST': {
      const lists = state.lists.filter((l) => l.id !== action.id);
      if (!lists.length) return createDefaultState();
      return { ...state, lists, activeListId: lists.some((l) => l.id === state.activeListId) ? state.activeListId : lists[0].id };
    }
    case 'ADD_ITEM': return updateActive(state, (l) => ({ ...l, items: [...l.items, createItem(action.item)] }));
    case 'UPDATE_ITEM': return updateActive(state, (l) => ({ ...l, items: l.items.map((i) => i.id === action.item.id ? createItem(action.item) : i) }));
    case 'TOGGLE_ITEM': return updateActive(state, (l) => ({ ...l, items: l.items.map((i) => i.id === action.id ? { ...i, completed: !i.completed } : i) }));
    case 'DELETE_ITEM': return updateActive(state, (l) => ({ ...l, items: l.items.filter((i) => i.id !== action.id) }));
    case 'RESTORE_ITEM': return { ...state, activeListId: action.listId || state.activeListId, lists: state.lists.map((l) => l.id === (action.listId || state.activeListId) ? ({ ...l, items: [...l.items.slice(0, action.index), action.item, ...l.items.slice(action.index)] }) : l) };
    case 'MOVE_ITEM': return updateActive(state, (l) => { const from = l.items.findIndex((i) => i.id === action.id); if (from < 0) return l; const to = Math.max(0, Math.min(l.items.length - 1, from + action.delta)); const items = [...l.items]; items.splice(to, 0, items.splice(from, 1)[0]); return { ...l, items }; });
    case 'REORDER_ITEM': return updateActive(state, (l) => { const from = l.items.findIndex((i) => i.id === action.id); const to = l.items.findIndex((i) => i.id === action.beforeId); if (from < 0 || to < 0 || from === to) return l; const items = [...l.items]; const [item] = items.splice(from, 1); items.splice(to, 0, item); return { ...l, items }; });
    case 'COMPLETE_SHOPPING': return updateActive(state, (l) => ({ ...l, items: l.items.filter((i) => !i.completed) }));
    case 'SET_SORT': return { ...state, sort: action.sort };
    case 'SET_MODE': return { ...state, mode: action.mode };
    default: return state;
  }
}

export function duplicateOpenItem(items, name, exceptId) {
  return items.find((i) => i.id !== exceptId && !i.completed && i.name.localeCompare(name.trim(), 'de', { sensitivity: 'base' }) === 0);
}
