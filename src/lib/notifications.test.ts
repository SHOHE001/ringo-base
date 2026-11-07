import { describe, expect, it } from 'vitest';
import { urlBase64ToUint8Array, vapidPublicKey } from './notifications';

describe('urlBase64ToUint8Array', () => {
  it('Base64URL をバイト列に戻す', () => {
    expect([...urlBase64ToUint8Array('AQID_-8')]).toEqual([1, 2, 3, 255, 239]);
  });

  it('VAPID 公開鍵は 65 バイトの非圧縮 P-256 公開鍵', () => {
    const bytes = urlBase64ToUint8Array(vapidPublicKey);
    expect(bytes.length).toBe(65);
    expect(bytes[0]).toBe(4);
  });
});
