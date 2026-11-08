import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/m-plus-rounded-1c/500.css';
import '@fontsource/m-plus-rounded-1c/700.css';
import '@fontsource/m-plus-rounded-1c/800.css';
import './styles.css';
import App from './App';
import { applyThemePreference, loadThemePreference, watchSystemTheme } from './lib/theme';

applyThemePreference(loadThemePreference());
watchSystemTheme(loadThemePreference);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('#root が見つかりません');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 本番ビルドのときだけ Service Worker を登録する（ホーム画面追加・オフライン用）。
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // 登録に失敗してもアプリはそのまま使える
    });
  });
}
