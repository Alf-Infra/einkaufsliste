import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import request from 'supertest';
import App from '../src/App.jsx';
import { STORAGE_KEY } from '../src/storage';
import { createApp } from '../src/server';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('Einkaufsliste App', () => {
  it('startet mit einer Standardliste', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Einkauf' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Liste Einkauf auswaehlen' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('legt neue Listen an und ignoriert leere Listennamen', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Neue Liste'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Liste hinzufuegen' }));

    expect(screen.getByRole('button', { name: 'Liste Einkauf auswaehlen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Einkauf Liste loeschen' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Neue Liste'), {
      target: { value: 'Drogerie' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Liste hinzufuegen' }));

    expect(screen.getByRole('heading', { name: 'Drogerie' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Liste Drogerie auswaehlen' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('fuegt Artikel zur aktuell ausgewaehlten Liste hinzu', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Neues Einkaufselement'), {
      target: { value: 'Apfel' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hinzufuegen' }));

    expect(screen.getByText('Apfel')).toBeInTheDocument();
    expect(screen.getByText('Offen')).toBeInTheDocument();
  });

  it('ignoriert leere Eintraege', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Neues Einkaufselement'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hinzufuegen' }));

    expect(screen.getByText('Noch nichts auf der Liste.')).toBeInTheDocument();
  });

  it('wechselt zwischen Listen und haelt Artikel getrennt', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Neues Einkaufselement'), {
      target: { value: 'Milch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hinzufuegen' }));

    fireEvent.change(screen.getByLabelText('Neue Liste'), {
      target: { value: 'Baumarkt' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Liste hinzufuegen' }));
    fireEvent.change(screen.getByLabelText('Neues Einkaufselement'), {
      target: { value: 'Schrauben' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hinzufuegen' }));

    expect(screen.getByText('Schrauben')).toBeInTheDocument();
    expect(screen.queryByText('Milch')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Liste Einkauf auswaehlen' }));

    expect(screen.getByText('Milch')).toBeInTheDocument();
    expect(screen.queryByText('Schrauben')).not.toBeInTheDocument();
  });

  it('kann Eintraege als besorgt markieren und sichtbar unterscheiden', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Neues Einkaufselement'), {
      target: { value: 'Milch' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Hinzufuegen' }).closest('form'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Milch als besorgt markieren' }),
    );

    expect(screen.getByText('Besorgt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Milch loeschen' })).toBeEnabled();
  });

  it('loescht erledigte Eintraege', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Neues Einkaufselement'), {
      target: { value: 'Brot' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hinzufuegen' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Brot als besorgt markieren' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Brot loeschen' }));

    expect(screen.queryByText('Brot')).not.toBeInTheDocument();
  });

  it('wendet Abhaken und Loeschen nur auf die aktive Liste an', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeListId: 'home',
        lists: [
          {
            id: 'home',
            name: 'Zuhause',
            items: [{ id: '1', label: 'Kaffee', completed: false }],
          },
          {
            id: 'office',
            name: 'Buero',
            items: [{ id: '2', label: 'Tee', completed: false }],
          },
        ],
      }),
    );

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Kaffee als besorgt markieren' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kaffee loeschen' }));

    expect(screen.queryByText('Kaffee')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Liste Buero auswaehlen' }));

    expect(screen.getByText('Tee')).toBeInTheDocument();
    expect(screen.getByText('Offen')).toBeInTheDocument();
  });

  it('loescht Listen ohne Artikel anderer Listen zu veraendern', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeListId: 'home',
        lists: [
          {
            id: 'home',
            name: 'Zuhause',
            items: [{ id: '1', label: 'Kaffee', completed: true }],
          },
          {
            id: 'office',
            name: 'Buero',
            items: [{ id: '2', label: 'Tee', completed: false }],
          },
        ],
      }),
    );

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Zuhause Liste loeschen' }));

    expect(screen.getByRole('heading', { name: 'Buero' })).toBeInTheDocument();
    expect(screen.getByText('Tee')).toBeInTheDocument();
    expect(screen.queryByText('Kaffee')).not.toBeInTheDocument();
  });

  it('erstellt nach dem Loeschen der letzten Liste wieder eine Standardliste', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Einkauf Liste loeschen' }));

    expect(screen.getByRole('heading', { name: 'Einkauf' })).toBeInTheDocument();
    expect(screen.getByText('Noch nichts auf der Liste.')).toBeInTheDocument();
  });

  it('laedt Listen und Artikel aus localStorage', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeListId: 'market',
        lists: [
          {
            id: 'market',
            name: 'Markt',
            items: [{ id: '1', label: 'Kaffee', completed: true }],
          },
        ],
      }),
    );

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Markt' })).toBeInTheDocument();
    expect(screen.getByText('Kaffee')).toBeInTheDocument();
    expect(screen.getByText('Besorgt')).toBeInTheDocument();
  });
});

describe('Express server', () => {
  it('liefert /health als JSON', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('liefert HTML auf / aus dem dist-Verzeichnis', async () => {
    const staticDir = fs.mkdtempSync(path.join(os.tmpdir(), 'einkaufsliste-dist-'));
    fs.writeFileSync(
      path.join(staticDir, 'index.html'),
      '<!doctype html><html><body><div id="root">ok</div></body></html>',
      'utf8',
    );

    const response = await request(createApp({ staticDir })).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<!doctype html>');
    expect(response.text).toContain('<div id="root">ok</div>');
  });
});
