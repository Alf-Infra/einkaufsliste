import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import request from 'supertest'; import App from '../src/App.jsx'; import { createApp } from '../src/server';
import { LEGACY_STORAGE_KEY, SCHEMA_VERSION, STORAGE_KEY, createDefaultState, normalizeState } from '../src/storage';
import { duplicateOpenItem, filterItems, groupItems, reducer, sortItems } from '../src/model';

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
const add = (name) => { fireEvent.change(screen.getByLabelText('Artikel hinzufügen'), { target: { value: name } }); fireEvent.click(screen.getByRole('button', { name: 'Hinzufügen' })); };

describe('Schema und reine Logik', () => {
  it('migriert v2 label-Artikel verlustfrei in Schema v3', () => {
    const state = normalizeState({ activeListId: 'a', lists: [{ id: 'a', name: 'Alt', items: [{ id: 'i', label: 'Milch', completed: true }] }] });
    expect(state.version).toBe(SCHEMA_VERSION); expect(state.lists[0].items[0]).toMatchObject({ id: 'i', name: 'Milch', completed: true, category: 'Sonstiges' });
  });
  it('normalisiert beschädigte und unvollständige Daten defensiv', () => {
    expect(normalizeState(null)).toEqual(createDefaultState());
    const state = normalizeState({ activeListId: 'weg', lists: [{ name: ' Gut ', items: [{ label: '' }, { label: ' Brot ' }] }, null] });
    expect(state.lists).toHaveLength(1); expect(state.activeListId).toBe(state.lists[0].id); expect(state.lists[0].items[0].name).toBe('Brot');
  });
  it('sucht Name und Notiz, sortiert und gruppiert', () => {
    const items = [{ id:'1',name:'Zitrone',note:'Bio',category:'Obst',completed:false },{ id:'2',name:'Apfel',note:'rot',category:'Obst',completed:true }];
    expect(filterItems(items, 'bio')).toHaveLength(1); expect(sortItems(items, 'name')[0].name).toBe('Apfel'); expect(sortItems(items, 'status')[0].name).toBe('Zitrone'); expect(groupItems(items)).toHaveProperty('Erledigt');
  });
  it('erkennt offene Duplikate ohne Großschreibung zu beachten', () => {
    const items = [{ id:'1',name:'Milch',completed:false },{ id:'2',name:'Brot',completed:true }];
    expect(duplicateOpenItem(items, 'milch').id).toBe('1'); expect(duplicateOpenItem(items, 'brot')).toBeUndefined();
  });
  it('bearbeitet, ordnet um, löscht und stellt Artikel per Reducer wieder her', () => {
    let state = createDefaultState(); state = reducer(state,{type:'ADD_ITEM',item:{name:'A'}}); state = reducer(state,{type:'ADD_ITEM',item:{name:'B'}}); const [a,b]=state.lists[0].items;
    state=reducer(state,{type:'UPDATE_ITEM',item:{...a,name:'A+',important:true}}); state=reducer(state,{type:'MOVE_ITEM',id:b.id,delta:-1}); expect(state.lists[0].items.map(i=>i.name)).toEqual(['B','A+']);
    state=reducer(state,{type:'DELETE_ITEM',id:b.id}); state=reducer(state,{type:'RESTORE_ITEM',item:b,index:0}); expect(state.lists[0].items[0].id).toBe(b.id);
  });
  it('unterstützt Listen anlegen, umbenennen, duplizieren und löschen', () => {
    let state=createDefaultState(); state=reducer(state,{type:'ADD_LIST',name:'Markt'}); state=reducer(state,{type:'RENAME_LIST',name:'Wochenmarkt'}); state=reducer(state,{type:'DUPLICATE_LIST'}); expect(state.lists.map(l=>l.name)).toEqual(['Einkauf','Wochenmarkt','Wochenmarkt Kopie']); state=reducer(state,{type:'DELETE_LIST',id:state.activeListId}); expect(state.lists).toHaveLength(2);
  });
});

describe('App-Abläufe', () => {
  it('lädt alte Daten, fügt schnell hinzu und persistiert v3', async () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({activeListId:'a',lists:[{id:'a',name:'Markt',items:[{id:'1',label:'Kaffee',completed:false}]}]})); render(<App/>); expect(screen.getByText('Kaffee')).toBeInTheDocument(); add('Milch'); expect(screen.getByText('Milch')).toBeInTheDocument(); await waitFor(()=>expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).lists[0].items).toHaveLength(2));
  });
  it('ignoriert leere Namen und verhindert offene Duplikate zugänglich', () => {
    render(<App/>); add('   '); expect(screen.getByText('Die Liste ist bereit')).toBeInTheDocument(); add('Milch'); add('milch'); expect(screen.getByRole('alert')).toHaveTextContent('bereits offen');
  });
  it('erfasst Details, bearbeitet und markiert wichtig', () => {
    render(<App/>); fireEvent.click(screen.getByRole('button',{name:'Details'})); fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Tomaten'}}); fireEvent.change(screen.getByLabelText('Menge'),{target:{value:'2'}}); fireEvent.click(screen.getByLabelText('Als wichtig markieren')); fireEvent.click(screen.getByRole('button',{name:'Speichern'})); expect(screen.getByText('Tomaten')).toBeInTheDocument(); expect(screen.getByLabelText('Wichtig')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button',{name:'Tomaten bearbeiten'})); fireEvent.change(screen.getByLabelText('Notiz'),{target:{value:'reif'}}); fireEvent.click(screen.getByRole('button',{name:'Speichern'})); expect(screen.getByText(/reif/)).toBeInTheDocument();
  });
  it('wechselt Listen und hält Artikel getrennt', () => {
    render(<App/>); add('Milch'); fireEvent.change(screen.getByLabelText('Neue Liste'),{target:{value:'Baumarkt'}}); fireEvent.click(screen.getByRole('button',{name:'Liste anlegen'})); add('Nägel'); expect(screen.queryByText('Milch')).not.toBeInTheDocument(); fireEvent.click(screen.getByText('Einkauf').closest('button')); expect(screen.getByText('Milch')).toBeInTheDocument();
  });
  it('löscht einen Artikel und bietet Undo', () => {
    render(<App/>); add('Brot'); fireEvent.click(screen.getByRole('button',{name:'Brot löschen'})); expect(screen.queryByText('Brot')).not.toBeInTheDocument(); fireEvent.click(screen.getByRole('button',{name:'Rückgängig'})); expect(screen.getByText('Brot')).toBeInTheDocument();
  });
  it('bietet Einkaufsmodus, Offen-Filter, Fortschritt und Abschluss', () => {
    vi.spyOn(window,'confirm').mockReturnValue(true); render(<App/>); add('Apfel'); add('Brot'); fireEvent.click(screen.getByRole('button',{name:'Apfel als erledigt markieren'})); expect(screen.getByLabelText('1 von 2 erledigt')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button',{name:'Einkaufen'})); fireEvent.click(screen.getByLabelText('Nur offene')); expect(screen.queryByText('Apfel')).not.toBeInTheDocument(); fireEvent.click(screen.getByRole('button',{name:'Einkauf abschließen'})); expect(screen.getByLabelText('0 von 1 erledigt')).toBeInTheDocument(); expect(screen.getByText('Brot')).toBeInTheDocument();
  });
  it('filtert, sortiert und ordnet per Tastatur-Alternative um', () => {
    render(<App/>); add('Zitrone'); add('Apfel'); fireEvent.change(screen.getByLabelText('Artikel durchsuchen'),{target:{value:'Apfel'}}); expect(screen.queryByText('Zitrone')).not.toBeInTheDocument(); fireEvent.change(screen.getByLabelText('Artikel durchsuchen'),{target:{value:''}}); fireEvent.change(screen.getByLabelText('Sortierung'),{target:{value:'name'}}); expect(screen.getAllByRole('button',{name:/bearbeiten/})[0]).toHaveAccessibleName('Apfel bearbeiten'); fireEvent.change(screen.getByLabelText('Sortierung'),{target:{value:'custom'}}); fireEvent.click(screen.getByRole('button',{name:'Apfel nach oben'})); expect(screen.getAllByRole('button',{name:/bearbeiten/})[0]).toHaveAccessibleName('Apfel bearbeiten');
  });
});

describe('Express', () => {
  it('liefert exakt den Healthcheck', async()=>{const res=await request(createApp()).get('/health');expect(res.status).toBe(200);expect(res.body).toEqual({ok:true});});
  it('liefert die gebaute Root-HTML',async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shop-'));fs.writeFileSync(path.join(dir,'index.html'),'<!doctype html><div id="root"></div>');const res=await request(createApp({staticDir:dir})).get('/');expect(res.status).toBe(200);expect(res.type).toMatch(/html/);});
});
