import { describe, expect, it } from 'vitest';
import { completedLessonCount, flattenLessons, getLessonStatuses } from './unlock';
import type { LoadedLesson, LoadedUnit } from './types';

const ids = ['a', 'b', 'c', 'd'];

describe('getLessonStatuses', () => {
  it('何も完了していなければ先頭が current、残りは locked', () => {
    expect(getLessonStatuses(ids, [])).toEqual({
      a: 'current',
      b: 'locked',
      c: 'locked',
      d: 'locked',
    });
  });

  it('完了済みの次が current になる', () => {
    expect(getLessonStatuses(ids, ['a', 'b'])).toEqual({
      a: 'completed',
      b: 'completed',
      c: 'current',
      d: 'locked',
    });
  });

  it('全部完了なら current はない', () => {
    const statuses = getLessonStatuses(ids, ids);
    expect(Object.values(statuses).every((s) => s === 'completed')).toBe(true);
  });

  it('途中が未完了なら、後ろが完了済みでも最初の未完了が current', () => {
    expect(getLessonStatuses(ids, ['a', 'c'])).toEqual({
      a: 'completed',
      b: 'current',
      c: 'completed',
      d: 'locked',
    });
  });

  it('後からレッスンを足しても、完了済みの ID は壊れない', () => {
    const extended = ['a', 'b', 'new', 'c', 'd'];
    expect(getLessonStatuses(extended, ['a', 'b', 'c'])).toEqual({
      a: 'completed',
      b: 'completed',
      new: 'current',
      c: 'completed',
      d: 'locked',
    });
  });

  it('存在しない ID が完了リストにあっても無視する', () => {
    expect(getLessonStatuses(['a'], ['gone'])).toEqual({ a: 'current' });
  });
});

function lesson(id: string): LoadedLesson {
  return { id, title: id, unitId: 'u', questions: [] };
}

describe('flattenLessons / completedLessonCount', () => {
  const units: LoadedUnit[] = [
    { id: 'u1', order: 1, title: 'u1', color: 'green', lessons: [lesson('a'), lesson('b')] },
    { id: 'u2', order: 2, title: 'u2', color: 'blue', lessons: [lesson('c')] },
  ];

  it('ユニットをまたいで順に並べる', () => {
    expect(flattenLessons(units).map((l) => l.id)).toEqual(['a', 'b', 'c']);
  });

  it('コンテンツに存在する完了レッスンだけ数える', () => {
    expect(completedLessonCount(units, ['a', 'c', 'removed'])).toBe(2);
  });
});
