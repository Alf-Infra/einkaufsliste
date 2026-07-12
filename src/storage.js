export const STORAGE_KEY = 'einkaufsliste-state-v3';
export const LEGACY_STORAGE_KEY = 'einkaufsliste-state-v2';
export const HISTORY_KEY = 'einkaufsliste-history-v1';
export const SCHEMA_VERSION = 3;

const id = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random()}`;

export function createItem(input = {}) {
  const name = String(input.name ?? input.label ?? '').trim();
  return {
    id: typeof input.id === 'string' && input.id ? input.id : id(),
    name,
    quantity: String(input.quantity ?? '').trim(),
    unit: String(input.unit ?? '').trim(),
    category: String(input.category ?? 'Sonstiges').trim() || 'Sonstiges',
    note: String(input.note ?? '').trim(),
    important: Boolean(input.important),
    completed: Boolean(input.completed),
  };
}

export function createList(name = 'Einkauf', items = []) {
  return { id: id(), name: String(name).trim() || 'Einkauf', items };
}

export function createDefaultState() {
  const list = { id: 'default', name: 'Einkauf', items: [] };
  return { version: SCHEMA_VERSION, activeListId: list.id, lists: [list], sort: 'custom', mode: 'plan' };
}

export function normalizeState(value) {
  if (!value || !Array.isArray(value.lists)) return createDefaultState();
  const seenLists = new Set();
  const lists = value.lists.flatMap((raw) => {
    if (!raw || !String(raw.name ?? '').trim()) return [];
    let listId = typeof raw.id === 'string' && raw.id && !seenLists.has(raw.id) ? raw.id : id();
    seenLists.add(listId);
    const seenItems = new Set();
    const items = (Array.isArray(raw.items) ? raw.items : []).flatMap((entry) => {
      const item = createItem(entry);
      if (!item.name) return [];
      if (seenItems.has(item.id)) item.id = id();
      seenItems.add(item.id);
      return [item];
    });
    return [{ id: listId, name: String(raw.name).trim(), items }];
  });
  if (!lists.length) return createDefaultState();
  return {
    version: SCHEMA_VERSION,
    activeListId: lists.some((l) => l.id === value.activeListId) ? value.activeListId : lists[0].id,
    lists,
    sort: ['custom', 'category', 'name', 'status'].includes(value.sort) ? value.sort : 'custom',
    mode: value.mode === 'shop' ? 'shop' : 'plan',
  };
}

export function loadState(storage = window.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : createDefaultState();
  } catch { return createDefaultState(); }
}

export function saveState(state, storage = window.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

export function loadHistory(storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? [...new Set(parsed.filter((x) => typeof x === 'string').map((x) => x.trim()).filter(Boolean))].slice(0, 40) : [];
  } catch { return []; }
}

export function saveHistory(history, storage = window.localStorage) {
  storage.setItem(HISTORY_KEY, JSON.stringify([...new Set(history)].slice(0, 40)));
}
