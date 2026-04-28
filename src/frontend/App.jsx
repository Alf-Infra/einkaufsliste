import { useEffect, useState } from "react";

async function readJson(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "request failed");
  }

  return data;
}

export default function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingItemIds, setPendingItemIds] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    void fetchItems();
  }, []);

  async function fetchItems() {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await readJson(await fetch("/api/items"));
      setItems(data);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!name.trim() || !quantity.trim()) {
      setFormError("Name und Menge sind erforderlich.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdItem = await readJson(
        await fetch("/api/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            quantity: quantity.trim(),
          }),
        })
      );

      setItems((currentItems) => [createdItem, ...currentItems]);
      setName("");
      setQuantity("");
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(item) {
    setPendingItemIds((currentIds) => [...new Set([...currentIds, item.id])]);
    setLoadError("");

    try {
      const updatedItem = await readJson(
        await fetch(`/api/items/${item.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: !item.completed,
          }),
        })
      );

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === updatedItem.id ? updatedItem : currentItem
        )
      );
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setPendingItemIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== item.id)
      );
    }
  }

  async function handleDelete(itemId) {
    setPendingItemIds((currentIds) => [...new Set([...currentIds, itemId])]);
    setLoadError("");

    try {
      await readJson(
        await fetch(`/api/items/${itemId}`, {
          method: "DELETE",
        })
      );

      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== itemId)
      );
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setPendingItemIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== itemId)
      );
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Haushalt</p>
          <h1>Einkaufsliste</h1>
          <p className="hero-text">
            Erfasse Artikel, halte Mengen fest und markiere Einkaeufe direkt in
            der Liste als erledigt.
          </p>
        </div>

        <form className="item-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input
              name="name"
              type="text"
              placeholder="Zum Beispiel Milch"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Menge</span>
            <input
              name="quantity"
              type="text"
              placeholder="Zum Beispiel 2 Liter"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Wird hinzugefuegt..." : "Artikel hinzufuegen"}
          </button>

          {formError ? (
            <p className="message error" role="alert">
              {formError}
            </p>
          ) : null}
        </form>
      </section>

      <section className="list-card">
        <div className="list-header">
          <div>
            <p className="eyebrow">Aktuell</p>
            <h2>Deine Artikel</h2>
          </div>
          <span className="item-count">{items.length} Eintraege</span>
        </div>

        {loadError ? (
          <p className="message error" role="alert">
            {loadError}
          </p>
        ) : null}

        {isLoading ? <p className="message">Liste wird geladen...</p> : null}

        {!isLoading && items.length === 0 ? (
          <p className="message">
            Noch keine Artikel vorhanden. Fuege oben den ersten Eintrag hinzu.
          </p>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <ul className="item-list">
            {items.map((item) => {
              const isBusy = pendingItemIds.includes(item.id);

              return (
                <li
                  key={item.id}
                  className={`item-card ${item.completed ? "is-completed" : ""}`}
                >
                  <div className="item-main">
                    <div className="item-title-row">
                      <label className="status-toggle">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggle(item)}
                          disabled={isBusy}
                          aria-label={
                            item.completed
                              ? `${item.name} als offen markieren`
                              : `${item.name} als erledigt markieren`
                          }
                        />
                        <span className="status-toggle-ui" aria-hidden="true" />
                      </label>
                      <h3>{item.name}</h3>
                      <span
                        className={`status-pill ${
                          item.completed ? "done" : "open"
                        }`}
                      >
                        {item.completed ? "Erledigt" : "Offen"}
                      </span>
                    </div>
                    <p className="item-quantity">{item.quantity}</p>
                  </div>

                  <div className="item-actions">
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={isBusy}
                    >
                      Loeschen
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
