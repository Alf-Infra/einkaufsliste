const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const APP_ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(APP_ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "items.db");
const PORT = process.env.PORT || 3000;

function ensureDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

function mapItem(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    completed: Boolean(row.completed),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function createApp(db) {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/api/items", (_req, res) => {
    const rows = db
      .prepare(
        `SELECT id, name, quantity, completed, created_at, updated_at
         FROM items
         ORDER BY datetime(created_at) DESC, id DESC`
      )
      .all();

    res.status(200).json(rows.map(mapItem));
  });

  app.post("/api/items", (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const quantity =
      typeof req.body?.quantity === "string" ? req.body.quantity.trim() : "";

    if (!name || !quantity) {
      return res.status(400).json({ error: "name and quantity are required" });
    }

    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO items (name, quantity, completed, created_at, updated_at)
         VALUES (?, ?, 0, ?, ?)`
      )
      .run(name, quantity, now, now);

    const row = db
      .prepare(
        `SELECT id, name, quantity, completed, created_at, updated_at
         FROM items
         WHERE id = ?`
      )
      .get(result.lastInsertRowid);

    return res.status(201).json(mapItem(row));
  });

  app.patch("/api/items/:id", (req, res) => {
    if (typeof req.body?.completed !== "boolean") {
      return res.status(400).json({ error: "completed must be a boolean" });
    }

    const id = Number.parseInt(req.params.id, 10);
    const existing = db
      .prepare(
        `SELECT id, name, quantity, completed, created_at, updated_at
         FROM items
         WHERE id = ?`
      )
      .get(id);

    if (!existing) {
      return res.status(404).json({ error: "not found" });
    }

    const updatedAt = new Date().toISOString();
    db.prepare(
      `UPDATE items
       SET completed = ?, updated_at = ?
       WHERE id = ?`
    ).run(req.body.completed ? 1 : 0, updatedAt, id);

    const row = db
      .prepare(
        `SELECT id, name, quantity, completed, created_at, updated_at
         FROM items
         WHERE id = ?`
      )
      .get(id);

    return res.status(200).json(mapItem(row));
  });

  app.delete("/api/items/:id", (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const result = db.prepare("DELETE FROM items WHERE id = ?").run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "not found" });
    }

    return res.status(200).json({ deleted: true });
  });

  return app;
}

const db = ensureDatabase();
const app = createApp(db);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

module.exports = {
  app,
  createApp,
  db,
  DB_PATH,
};
