import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export function getPort() {
  return parseInt(
    process.env.PORT || fs.readFileSync(path.join(projectRoot, 'PORT.txt'), 'utf8').trim(),
    10,
  );
}

export function createApp(options = {}) {
  const app = express();
  const staticDir = options.staticDir || path.join(projectRoot, 'dist');
  const indexFile = path.join(staticDir, 'index.html');

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  if (fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
  }

  app.get('/', (_req, res) => {
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
      return;
    }

    res
      .status(200)
      .type('html')
      .send('<!doctype html><html><body><p>Build fehlt.</p></body></html>');
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  const port = getPort();

  app.listen(port, () => {
    console.log(`listening on ${port}`);
  });
}
