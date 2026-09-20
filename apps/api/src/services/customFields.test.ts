import { describe, it, expect } from 'vitest';
import { coerce } from './customFields.js';

describe('coerce', () => {
  it('numero válido e inválido', () => {
    expect(coerce('numero', '42', [])).toEqual({ ok: true, value: 42 });
    expect(coerce('numero', 'abc', []).ok).toBe(false);
  });

  it('booleano acepta variantes', () => {
    expect(coerce('booleano', 'true', [])).toEqual({ ok: true, value: true });
    expect(coerce('booleano', 0, [])).toEqual({ ok: true, value: false });
    expect(coerce('booleano', 'quizás', []).ok).toBe(false);
  });

  it('fecha normaliza a YYYY-MM-DD', () => {
    expect(coerce('fecha', '2026-09-19', [])).toEqual({ ok: true, value: '2026-09-19' });
    expect(coerce('fecha', 'no-fecha', []).ok).toBe(false);
  });

  it('seleccion valida contra opciones', () => {
    expect(coerce('seleccion', 'a', ['a', 'b'])).toEqual({ ok: true, value: 'a' });
    expect(coerce('seleccion', 'z', ['a', 'b']).ok).toBe(false);
  });

  it('vacío pasa como null', () => {
    expect(coerce('texto', '', [])).toEqual({ ok: true, value: null });
  });
});
