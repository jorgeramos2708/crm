import { describe, it, expect } from 'vitest';
import { parseCsv, toCsv } from './csv.js';

describe('parseCsv', () => {
  it('parsea cabeceras y filas simples', () => {
    const { headers, rows } = parseCsv('nombre,email\nAna,a@x.com\nBob,b@x.com');
    expect(headers).toEqual(['nombre', 'email']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ nombre: 'Ana', email: 'a@x.com' });
  });

  it('respeta comillas con comas y comillas dobles', () => {
    const { rows } = parseCsv('nombre,empresa\n"Uno, Jr","Acme, ""S.A."""');
    expect(rows[0]).toEqual({ nombre: 'Uno, Jr', empresa: 'Acme, "S.A."' });
  });

  it('ignora BOM y líneas vacías', () => {
    const { headers, rows } = parseCsv('\uFEFFa,b\n1,2\n\n3,4\n');
    expect(headers).toEqual(['a', 'b']);
    expect(rows).toHaveLength(2);
  });

  it('retorna vacío ante CSV vacío', () => {
    expect(parseCsv('').rows).toEqual([]);
  });
});

describe('toCsv', () => {
  it('escapa comas y comillas con roundtrip', () => {
    const rows = [{ nombre: 'Uno, Jr', empresa: 'Acme "S.A."' }];
    const csv = toCsv(['nombre', 'empresa'], rows);
    const parsed = parseCsv(csv);
    expect(parsed.rows[0]).toEqual(rows[0]);
  });
});
