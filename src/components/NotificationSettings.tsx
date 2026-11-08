import { useEffect, useState } from 'react';
import {
  detectPushSupport,
  getCurrentSubscription,
  showTestNotification,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/notifications';

type State =
  | { kind: 'loading' }
  | { kind: 'off' }
  | { kind: 'denied' }
  | { kind: 'on'; subscriptionJson: string }
  | { kind: 'error'; message: string };

export function NotificationSettings() {
  const support = detectPushSupport();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (support !== 'supported') return;
    let cancelled = false;
    getCurrentSubscription()
      .then((subscription) => {
        if (cancelled) return;
        if (subscription) {
          setState({ kind: 'on', subscriptionJson: JSON.stringify(subscription) });
        } else {
          setState({ kind: Notification.permission === 'denied' ? 'denied' : 'off' });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'off' });
      });
    return () => {
      cancelled = true;
    };
  }, [support]);

  const turnOn = async () => {
    try {
      const subscription = await subscribeToPush();
      if (!subscription) {
        setState({ kind: 'denied' });
        return;
      }
      setState({ kind: 'on', subscriptionJson: JSON.stringify(subscription) });
    } catch {
      setState({ kind: 'error', message: '通知の登録に失敗しました。時間をおいて試してください。' });
    }
  };

  const turnOff = async () => {
    try {
      await unsubscribeFromPush();
    } finally {
      setState({ kind: 'off' });
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="record-section notify-section" aria-labelledby="notify-title">
      <h2 id="notify-title">学習リマインド通知</h2>

      {support === 'needs-home-screen' ? (
        <p className="notify-text">
          iPhone では、Safari の共有メニューから「ホーム画面に追加」し、ホーム画面のアイコンから開くと通知をオンにできます。
        </p>
      ) : null}

      {support === 'not-configured' ? (
        <p className="notify-text">
          通知の鍵がまだ設定されていません（README の「学習リマインド通知」を参照）。
        </p>
      ) : null}

      {support === 'unsupported' ? (
        <p className="notify-text">このブラウザは通知に対応していません。</p>
      ) : null}

      {support === 'supported' && state.kind === 'loading' ? (
        <p className="notify-text">確認中…</p>
      ) : null}

      {support === 'supported' && (state.kind === 'off' || state.kind === 'error') ? (
        <>
          <p className="notify-text">毎日 20 時ごろに、学習を思い出させる通知を送ります。</p>
          {state.kind === 'error' ? <p className="notify-error">{state.message}</p> : null}
          <button type="button" className="btn btn-primary btn-block" onClick={turnOn}>
            通知をオンにする
          </button>
        </>
      ) : null}

      {support === 'supported' && state.kind === 'denied' ? (
        <p className="notify-text">
          通知がブロックされています。端末の設定でこのアプリの通知を許可してから、もう一度開いてください。
        </p>
      ) : null}

      {support === 'supported' && state.kind === 'on' ? (
        <>
          <p className="notify-text">
            この端末で通知を受け取る準備ができました。下の「登録コード」をコピーして、GitHub のシークレット
            <code>PUSH_SUBSCRIPTIONS</code> に貼り付けると、毎日の通知が届くようになります（最初の 1 回だけ）。
          </p>
          <textarea
            className="notify-code"
            readOnly
            rows={4}
            value={state.subscriptionJson}
            aria-label="登録コード"
            onFocus={(event) => event.currentTarget.select()}
          />
          <div className="notify-actions">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => copy(state.subscriptionJson)}
            >
              {copied ? 'コピーしました' : '登録コードをコピー'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => {
                showTestNotification().catch(() => undefined);
              }}
            >
              テスト通知を出す
            </button>
            <button type="button" className="btn btn-danger-ghost btn-block" onClick={turnOff}>
              通知をオフにする
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
