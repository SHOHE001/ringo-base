import { describe, expect, it } from 'vitest';
import { displayStreak, updateStreak } from './streak';

describe('updateStreak', () => {
  it('初回の学習は1日目', () => {
    expect(
      updateStreak({ streakCount: 0, lastStudyDate: null }, '2026-01-01'),
    ).toEqual({ streakCount: 1, lastStudyDate: '2026-01-01' });
  });

  it('同じ日なら維持する', () => {
    expect(
      updateStreak(
        { streakCount: 3, lastStudyDate: '2026-01-01' },
        '2026-01-01',
      ),
    ).toEqual({ streakCount: 3, lastStudyDate: '2026-01-01' });
  });

  it('前日なら1を足す', () => {
    expect(
      updateStreak(
        { streakCount: 3, lastStudyDate: '2026-01-01' },
        '2026-01-02',
      ),
    ).toEqual({ streakCount: 4, lastStudyDate: '2026-01-02' });
  });

  it('2日以上空いたら1に戻す', () => {
    expect(
      updateStreak(
        { streakCount: 3, lastStudyDate: '2026-01-01' },
        '2026-01-03',
      ),
    ).toEqual({ streakCount: 1, lastStudyDate: '2026-01-03' });
  });
});

describe('updateStreak: 月・年・うるう日の境界', () => {
  it('年をまたいでも前日なら +1', () => {
    expect(
      updateStreak({ streakCount: 5, lastStudyDate: '2025-12-31' }, '2026-01-01'),
    ).toEqual({ streakCount: 6, lastStudyDate: '2026-01-01' });
  });

  it('うるう日をまたいでも前日なら +1', () => {
    expect(
      updateStreak({ streakCount: 2, lastStudyDate: '2028-02-29' }, '2028-03-01'),
    ).toEqual({ streakCount: 3, lastStudyDate: '2028-03-01' });
  });

  it('日付が過去に戻った（時計の巻き戻し）場合は 1 に戻す', () => {
    expect(
      updateStreak({ streakCount: 5, lastStudyDate: '2026-01-10' }, '2026-01-05'),
    ).toEqual({ streakCount: 1, lastStudyDate: '2026-01-05' });
  });
});

describe('displayStreak', () => {
  it('学習日が今日か昨日ならその連続日数を表示する', () => {
    expect(displayStreak(4, '2026-01-02', '2026-01-02')).toBe(4);
    expect(displayStreak(4, '2026-01-01', '2026-01-02')).toBe(4);
  });

  it('一昨日以前なら0', () => {
    expect(displayStreak(4, '2025-12-31', '2026-01-02')).toBe(0);
  });

  it('未学習なら0', () => {
    expect(displayStreak(0, null, '2026-01-02')).toBe(0);
  });
});
