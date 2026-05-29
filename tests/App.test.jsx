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
  it('fuegt neue Eintraege hinzu', () => {
    render(<App />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Apfel' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hinzufuegen' }));

    expect(screen.getByText('Apfel')).toBeInTheDocument();
    expect(screen.getByText('Offen')).toBeInTheDocument();
  });

  it('ignoriert leere Eintraege', () => {
    render(<App />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hinzufuegen' }));

    expect(screen.getByText('Noch nichts auf der Liste.')).toBeInTheDocument();
  });

  it('kann Eintraege als besorgt markieren und sichtbar unterscheiden', () => {
    render(<App />);

    fireEvent.change(screen.getByRole('textbox'), {
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

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Brot' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hinzufuegen' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Brot als besorgt markieren' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Brot loeschen' }));

    expect(screen.queryByText('Brot')).not.toBeInTheDocument();
  });

  it('laedt die Liste aus localStorage', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: '1', label: 'Kaffee', completed: true }]),
    );

    render(<App />);

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
