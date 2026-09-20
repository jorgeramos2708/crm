import { describe, it, expect } from 'vitest';
import { signWebhook, verifyWebhookSignature } from './webhooks.js';

describe('webhook HMAC', () => {
  const secret = 's3cr3t-test';
  const body = '{"event":"contacto.creado"}';

  it('firma con prefijo sha256=', () => {
    expect(signWebhook(secret, body).startsWith('sha256=')).toBe(true);
  });

  it('verifica firma correcta y rechaza manipulada', () => {
    const sig = signWebhook(secret, body);
    expect(verifyWebhookSignature(secret, body, sig)).toBe(true);
    expect(verifyWebhookSignature(secret, body + 'x', sig)).toBe(false);
    expect(verifyWebhookSignature('otro', body, sig)).toBe(false);
  });
});
