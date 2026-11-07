// 学習リマインド通知を送る（GitHub Actions の定期実行から呼ばれる）。
// 必要な環境変数:
//   VAPID_PRIVATE_KEY   … src/lib/notifications.ts の公開鍵と対になる秘密鍵
//   PUSH_SUBSCRIPTIONS  … アプリの「登録コード」。複数端末なら JSON 配列か、1 行に 1 つ。
import * as webpush from 'web-push';

const VAPID_PUBLIC_KEY =
  'BAFJSF2mmsTC4CYEhA8xXm80Ne5A0SR3XMzQpXcLHnk1aMYVxIA0z9jCxejCXygcl7V49hSgFvYN_gJd2eycjsQ';

const MESSAGES = [
  '今日の 1 レッスン、やってみよう！',
  '連続記録を伸ばそう。5 分だけでも OK！',
  '復習リストの問題、覚えているかな？',
  '基本情報まで一歩ずつ。今日もやろう！',
];

function parseSubscriptions(raw) {
  const text = (raw ?? '').trim();
  if (!text) return [];
  if (text.startsWith('[')) return JSON.parse(text);
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
const subscriptions = parseSubscriptions(process.env.PUSH_SUBSCRIPTIONS);

if (!privateKey || subscriptions.length === 0) {
  console.log('VAPID_PRIVATE_KEY か PUSH_SUBSCRIPTIONS が未設定のため、送信をスキップします。');
  process.exit(0);
}

webpush.setVapidDetails('https://shohe001.github.io/ringo-base/', VAPID_PUBLIC_KEY, privateKey);

const day = Math.floor(Date.now() / 86_400_000);
const payload = JSON.stringify({
  title: 'キホンのキ',
  body: MESSAGES[day % MESSAGES.length],
});

let failed = 0;
for (const [index, subscription] of subscriptions.entries()) {
  try {
    await webpush.sendNotification(subscription, payload, { TTL: 60 * 60 * 6 });
    console.log(`端末 ${index + 1}: 送信しました`);
  } catch (error) {
    failed += 1;
    const status = error?.statusCode;
    const hint =
      status === 404 || status === 410
        ? '（登録が無効です。アプリで通知をオンにし直し、登録コードを貼り直してください）'
        : '';
    console.error(`端末 ${index + 1}: 送信失敗 status=${status ?? '?'}${hint}`);
  }
}

if (failed === subscriptions.length) process.exit(1);
