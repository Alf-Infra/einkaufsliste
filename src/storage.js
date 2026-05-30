export const STORAGE_KEY = 'einkaufsliste-state-v2';
const LEGACY_ITEMS_KEY = 'einkaufsliste-items';

export function createDefaultList(items = []) {
  return {
    id: 'default',
    name: 'Einkauf',
    items,
  };
}

function createDefaultState(items = []) {
  return {
    activeListId: 'default',
    lists: [createDefaultList(items)],
  };
}

function normalizeState(parsedState) {
  if (!parsedState || !Array.isArray(parsedState.lists)) {
    return createDefaultState();
  }

  const lists = parsedState.lists
    .filter((list) => list && typeof list.name === 'string' && list.name.trim())
    .map((list) => ({
      id: typeof list.id === 'string' && list.id ? list.id : crypto.randomUUID(),
      name: list.name.trim(),
      items: Array.isArray(list.items) ? list.items : [],
    }));

  if (lists.length === 0) {
    return createDefaultState();
  }

  const activeListExists = lists.some((list) => list.id === parsedState.activeListId);

  return {
    activeListId: activeListExists ? parsedState.activeListId : lists[0].id,
    lists,
  };
}

export function loadState() {
  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);
    if (rawState) {
      return normalizeState(JSON.parse(rawState));
    }

    const legacyItems = window.localStorage.getItem(LEGACY_ITEMS_KEY);
    return legacyItems ? createDefaultState(JSON.parse(legacyItems)) : createDefaultState();
  } catch {
    return createDefaultState();
  }
}

export function saveState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}
