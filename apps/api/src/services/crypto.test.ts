import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, isEncrypted } from './crypto.js';

describe('crypto', () => {
  it('roundtrip cifrado/descifrado', () => {
    const c = encrypt('secreto-123');
    expect(isEncrypted(c)).toBe(true);
    expect(decrypt(c)).toBe('secreto-123');
  });

  it('cada cifrado usa IV distinto', () => {
    expect(encrypt('x')).not.toBe(encrypt('x'));
  });

  it('respeta valores antiguos en claro (compat)', () => {
    expect(isEncrypted('test-client-secret')).toBe(false);
    expect(decrypt('test-client-secret')).toBe('test-client-secret');
  });
});
