// 学習リマインド通知を送る（GitHub Actions の定期実行から呼ばれる）。
// 必要な環境変数:
//   VAPID_PUBLIC_KEY    … リポジトリ変数。アプリにも同じ値が埋め込まれる
//   VAPID_PRIVATE_KEY   … 公開鍵と対になる秘密鍵（シークレット）
//   PUSH_SUBSCRIPTIONS  … アプリの「登録コード」。複数端末なら JSON 配列か、1 行に 1 つ。
import * as webpush from 'web-push';


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

const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
const subscriptions = parseSubscriptions(process.env.PUSH_SUBSCRIPTIONS);

if (!publicKey || !privateKey || subscriptions.length === 0) {
  console.log('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / PUSH_SUBSCRIPTIONS のどれかが未設定のため、送信をスキップします。');
  process.exit(0);
}

webpush.setVapidDetails('https://shohe001.github.io/ringo-base/', publicKey, privateKey);

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
