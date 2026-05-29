export const STORAGE_KEY = 'einkaufsliste-items';

export function loadItems() {
  try {
    const rawItems = window.localStorage.getItem(STORAGE_KEY);
    return rawItems ? JSON.parse(rawItems) : [];
  } catch {
    return [];
  }
}

export function saveItems(items) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
