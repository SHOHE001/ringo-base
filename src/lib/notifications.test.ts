import { describe, expect, it } from 'vitest';
import { urlBase64ToUint8Array } from './notifications';

describe('urlBase64ToUint8Array', () => {
  it('Base64URL をバイト列に戻す', () => {
    expect([...urlBase64ToUint8Array('AQID_-8')]).toEqual([1, 2, 3, 255, 239]);
  });

  it('VAPID 公開鍵（65 バイトの非圧縮 P-256 鍵）を復元できる', () => {
    const bytes = urlBase64ToUint8Array(
      'BAFJSF2mmsTC4CYEhA8xXm80Ne5A0SR3XMzQpXcLHnk1aMYVxIA0z9jCxejCXygcl7V49hSgFvYN_gJd2eycjsQ',
    );
    expect(bytes.length).toBe(65);
    expect(bytes[0]).toBe(4);
  });
});
