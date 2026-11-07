// 学習リマインド通知（Web Push）。
// サーバーは使わず、GitHub Actions の定期実行（.github/workflows/reminder.yml）が
// ここで作った購読情報あてに通知を送る。公開鍵は GitHub のリポジトリ変数 VAPID_PUBLIC_KEY から
// ビルド時に埋め込まれ、シークレット VAPID_PRIVATE_KEY と対になっている。
export const vapidPublicKey: string = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';

export type PushSupport =
  | 'supported'
  | 'needs-home-screen'
  | 'unsupported'
  | 'not-configured';

/** Base64URL 文字列を、PushManager.subscribe が受け取るバイト列に変換する。 */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches)
  );
}

function isIos(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function detectPushSupport(): PushSupport {
  const hasApis =
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  // iPhone の Safari は、ホーム画面に追加したアプリでしか通知 API が出てこない。
  if (isIos() && !isStandalone()) return 'needs-home-screen';
  if (!hasApis) return 'unsupported';
  return vapidPublicKey ? 'supported' : 'not-configured';
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.ready;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (detectPushSupport() !== 'supported') return null;
  const registration = await getRegistration();
  return registration.pushManager.getSubscription();
}

/** 通知を許可してもらい、購読を作る。許可されなければ null。 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  const registration = await getRegistration();
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getCurrentSubscription();
  await subscription?.unsubscribe();
}

/** その端末で試しに1回通知を出す（Service Worker 経由）。 */
export async function showTestNotification(): Promise<void> {
  const registration = await getRegistration();
  await registration.showNotification('キホンのキ', {
    body: 'テスト通知です。毎日この形でお知らせします。',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: 'study-reminder',
  });
}
