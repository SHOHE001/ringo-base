import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { maxHearts, storageKey } from '../config';
import { clearProgress, createInitialProgress, loadProgress, saveProgress } from './storage';

function installStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const localStorage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
  vi.stubGlobal('window', { localStorage });
  return data;
}

beforeEach(() => {
  installStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadProgress', () => {
  it('未保存なら初期状態', () => {
    expect(loadProgress(1000)).toEqual(createInitialProgress(1000));
  });

  it('保存した内容を読み戻せる', () => {
    const progress = {
      ...createInitialProgress(1000),
      xp: 40,
      completedLessonIds: ['a'],
      reviewQuestionIds: ['q'],
      streakCount: 2,
      lastStudyDate: '2026-01-01',
      dailyXp: { '2026-01-01': 40 },
    };
    saveProgress(progress);
    expect(loadProgress(1000)).toEqual(progress);
  });

  it('壊れた JSON は初期状態に戻す', () => {
    installStorage({ [storageKey]: '{not json' });
    expect(loadProgress(1000)).toEqual(createInitialProgress(1000));
  });

  it('形式が違う値は初期状態に戻す', () => {
    installStorage({ [storageKey]: JSON.stringify({ version: 1, xp: 'many' }) });
    expect(loadProgress(1000)).toEqual(createInitialProgress(1000));
  });

  it('読み込み時に経過時間ぶんハートを回復する', () => {
    const saved = { ...createInitialProgress(0), hearts: 1, heartAnchor: 0 };
    installStorage({ [storageKey]: JSON.stringify(saved) });
    const loaded = loadProgress(60 * 60_000);
    expect(loaded.hearts).toBe(3);
    expect(loaded.hearts).toBeLessThanOrEqual(maxHearts);
  });

  it('localStorage が例外を投げても落ちない', () => {
    const deny = () => {
      throw new Error('denied');
    };
    vi.stubGlobal('window', {
      localStorage: { getItem: deny, setItem: deny, removeItem: deny },
    });
    expect(loadProgress(1000)).toEqual(createInitialProgress(1000));
    expect(() => saveProgress(createInitialProgress(1000))).not.toThrow();
    expect(() => clearProgress()).not.toThrow();
  });
});

describe('clearProgress', () => {
  it('保存を消す', () => {
    const data = installStorage();
    saveProgress(createInitialProgress(1000));
    expect(data.has(storageKey)).toBe(true);
    clearProgress();
    expect(data.has(storageKey)).toBe(false);
  });
});
