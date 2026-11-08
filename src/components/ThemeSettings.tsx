import { useState } from 'react';
import {
  applyThemePreference,
  loadThemePreference,
  saveThemePreference,
} from '../lib/theme';
import type { ThemePreference } from '../lib/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: '自動' },
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: 'ダーク' },
];

export function ThemeSettings() {
  const [preference, setPreference] = useState<ThemePreference>(loadThemePreference);

  const choose = (value: ThemePreference) => {
    setPreference(value);
    saveThemePreference(value);
    applyThemePreference(value);
  };

  return (
    <section className="record-section" aria-labelledby="theme-title">
      <h2 id="theme-title">画面の表示</h2>
      <div className="theme-options" role="radiogroup" aria-labelledby="theme-title">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={preference === option.value}
            className="theme-option"
            onClick={() => choose(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
