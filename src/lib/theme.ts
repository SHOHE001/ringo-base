// 画面の配色（ライト／ダーク）の設定。'system' は端末の設定に合わせる。
// index.html の先頭スクリプトも同じキーを読み、描画前に data-theme を付けてちらつきを防ぐ。
export type ThemePreference = 'system' | 'light' | 'dark';

export const themeStorageKey = 'kihon-no-ki:theme';

const THEME_COLORS = { light: '#58CC02', dark: '#131f24' } as const;

export function parseThemePreference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function loadThemePreference(): ThemePreference {
  try {
    return parseThemePreference(window.localStorage.getItem(themeStorageKey));
  } catch {
    return 'system';
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') {
      window.localStorage.removeItem(themeStorageKey);
    } else {
      window.localStorage.setItem(themeStorageKey, preference);
    }
  } catch {
    // 保存できなくても、この画面の間は切り替えが効く
  }
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): 'light' | 'dark' {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}

function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/** <html data-theme> とブラウザのテーマ色（アドレスバー等）を設定に合わせる。 */
export function applyThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', preference);
  }
  const resolved = resolveTheme(preference, systemPrefersDark());
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[resolved]);
}

/** 'system' のとき、端末の設定が変わったらテーマ色を追従させる。 */
export function watchSystemTheme(getPreference: () => ThemePreference): () => void {
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!media) return () => undefined;
  const onChange = () => applyThemePreference(getPreference());
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
