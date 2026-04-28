const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { once } = require("node:events");

const appRoot = path.resolve(__dirname, "..");
const packageJson = require(path.join(appRoot, "package.json"));
const viteConfigSource = fs.readFileSync(
  path.join(appRoot, "vite.config.js"),
  "utf8"
);
const appSource = fs.readFileSync(
  path.join(appRoot, "src/frontend/App.jsx"),
  "utf8"
);
const serverSource = fs.readFileSync(
  path.join(appRoot, "src/backend/server.js"),
  "utf8"
);
const { app, db, DB_PATH } = require(path.join(
  appRoot,
  "src/backend/server.js"
));

const originalDbBuffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;

function resetDatabase() {
  db.exec("DELETE FROM items;");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'items';");
}

async function createServerContext() {
  resetDatabase();

  const server = app.listen(0);
  await once(server, "listening");

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  async function request(pathname, options = {}) {
    const response = await fetch(`${baseUrl}${pathname}`, options);
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    return { response, body };
  }

  async function close() {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    resetDatabase();
  }

  return { request, close };
}

test.after(() => {
  resetDatabase();
  db.close();

  if (originalDbBuffer) {
    fs.writeFileSync(DB_PATH, originalDbBuffer);
  }
});

async function withServer(run) {
  const ctx = await createServerContext();

  try {
    await run(ctx);
  } finally {
    await ctx.close();
  }
}

test("Akzeptanzkriterien: Projekt- und Stack-Grundlagen", () => {
  assert.equal(packageJson.name, "einkaufsliste");
  assert.match(serverSource, /require\("express"\)/);
  assert.match(serverSource, /require\("node:sqlite"\)/);
  assert.match(serverSource, /CREATE TABLE IF NOT EXISTS items/);
  assert.match(appSource, /from "react"/);
  assert.match(viteConfigSource, /@vitejs\/plugin-react/);
  assert.match(viteConfigSource, /"\/api": "http:\/\/localhost:3107"/);
});

test("Akzeptanzkriterien: UI-Quellcode deckt Formular, Liste und Live-Updates ab", () => {
  assert.match(appSource, /<h1>Einkaufsliste<\/h1>/);
  assert.match(appSource, /name="name"/);
  assert.match(appSource, /name="quantity"/);
  assert.match(appSource, /required/);
  assert.match(appSource, /Artikel hinzufuegen/);
  assert.match(appSource, /Loeschen/);
  assert.match(appSource, /Erledigt/);
  assert.match(appSource, /Offen/);
  assert.match(appSource, /setItems\(\(currentItems\) => \[createdItem, \.\.\.currentItems\]\)/);
  assert.match(appSource, /currentItems\.map\(/);
  assert.match(appSource, /currentItems\.filter\(/);
  assert.doesNotMatch(appSource, /location\.reload|window\.reload|window\.location/);
});

test("GET /health antwortet mit HTTP 200 und status ok", async () => {
  await withServer(async (ctx) => {
    const { response, body } = await ctx.request("/health");

    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: "ok" });
  });
});

test("GET /api/items liefert alle Artikel als JSON-Array, neueste zuerst", async () => {
  await withServer(async (ctx) => {
    const first = await ctx.request("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Milch", quantity: "2 Liter" }),
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const second = await ctx.request("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Brot", quantity: "1 Laib" }),
    });

    const { response, body } = await ctx.request("/api/items");

    assert.equal(first.response.status, 201);
    assert.equal(second.response.status, 201);
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 2);
    assert.equal(body[0].name, "Brot");
    assert.equal(body[0].quantity, "1 Laib");
    assert.equal(body[0].completed, false);
    assert.equal(body[1].name, "Milch");
    assert.equal(body[1].quantity, "2 Liter");
    assert.equal(typeof body[0].created_at, "string");
    assert.equal(typeof body[0].updated_at, "string");
  });
});

test("POST /api/items erstellt Artikel mit gueltigem Namen und gueltiger Menge", async () => {
  await withServer(async (ctx) => {
    const { response, body } = await ctx.request("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Aepfel", quantity: "6 Stueck" }),
    });

    assert.equal(response.status, 201);
    assert.equal(body.name, "Aepfel");
    assert.equal(body.quantity, "6 Stueck");
    assert.equal(body.completed, false);
    assert.equal(typeof body.id, "number");
    assert.match(body.created_at, /^\d{4}-\d{2}-\d{2}T/);
    assert.match(body.updated_at, /^\d{4}-\d{2}-\d{2}T/);
  });
});

test("POST /api/items mit ungueltigen Eingaben antwortet HTTP 400", async () => {
  await withServer(async (ctx) => {
    for (const payload of [{}, { name: "Milch" }, { quantity: "2 Liter" }, { name: " ", quantity: " " }]) {
      const { response, body } = await ctx.request("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      assert.equal(response.status, 400);
      assert.deepEqual(body, { error: "name and quantity are required" });
    }
  });
});

test("PATCH /api/items/:id aktualisiert den Erledigt-Status und macht ihn wiedererkennbar", async () => {
  await withServer(async (ctx) => {
    const created = await ctx.request("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Butter", quantity: "1 Packung" }),
    });

    const { response, body } = await ctx.request(`/api/items/${created.body.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });

    const list = await ctx.request("/api/items");

    assert.equal(response.status, 200);
    assert.equal(body.completed, true);
    assert.equal(body.name, "Butter");
    assert.equal(list.body[0].completed, true);
  });
});

test("PATCH /api/items/:id mit ungueltigem Request antwortet HTTP 400", async () => {
  await withServer(async (ctx) => {
    const created = await ctx.request("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Kaffee", quantity: "500 g" }),
    });

    for (const payload of [{}, { completed: "true" }, { completed: 1 }, { completed: null }]) {
      const { response, body } = await ctx.request(`/api/items/${created.body.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      assert.equal(response.status, 400);
      assert.deepEqual(body, { error: "completed must be a boolean" });
    }
  });
});

test("PATCH /api/items/:id mit unbekannter ID antwortet HTTP 404", async () => {
  await withServer(async (ctx) => {
    const { response, body } = await ctx.request("/api/items/99999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });

    assert.equal(response.status, 404);
    assert.deepEqual(body, { error: "not found" });
  });
});

test("DELETE /api/items/:id loescht Artikel und antwortet HTTP 200", async () => {
  await withServer(async (ctx) => {
    const created = await ctx.request("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Kaese", quantity: "200 g" }),
    });

    const deleted = await ctx.request(`/api/items/${created.body.id}`, {
      method: "DELETE",
    });
    const list = await ctx.request("/api/items");

    assert.equal(deleted.response.status, 200);
    assert.deepEqual(deleted.body, { deleted: true });
    assert.deepEqual(list.body, []);
  });
});

test("DELETE /api/items/:id mit unbekannter ID antwortet HTTP 404", async () => {
  await withServer(async (ctx) => {
    const { response, body } = await ctx.request("/api/items/99999", {
      method: "DELETE",
    });

    assert.equal(response.status, 404);
    assert.deepEqual(body, { error: "not found" });
  });
});
