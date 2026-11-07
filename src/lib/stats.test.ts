import { describe, expect, it } from 'vitest';
import {
  countReviewable,
  pickReviewQuestions,
  recentDailyXp,
  unitProgressList,
} from './stats';
import type { LoadedQuestion, LoadedUnit, Question } from './types';

describe('recentDailyXp', () => {
  it('今日を含む7日分を古い順に返し、記録のない日は0', () => {
    const result = recentDailyXp({ '2026-03-01': 15, '2026-02-27': 5 }, '2026-03-01');
    expect(result.map((d) => d.date)).toEqual([
      '2026-02-23',
      '2026-02-24',
      '2026-02-25',
      '2026-02-26',
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ]);
    expect(result.map((d) => d.xp)).toEqual([0, 0, 0, 0, 5, 0, 15]);
  });
});

function q(id: string, data: Question): LoadedQuestion {
  return { id, lessonId: 'l', unitId: 'u', data };
}

const units: LoadedUnit[] = [
  {
    id: 'u',
    order: 1,
    title: 'U',
    color: 'green',
    lessons: [
      {
        id: 'l1',
        title: 'L1',
        unitId: 'u',
        questions: [
          q('q1', { type: 'truefalse', prompt: 'p1', answer: true }),
          q('q2', { type: 'truefalse', prompt: 'p2', answer: false }),
          q('q3', {
            type: 'match',
            prompt: 'p3',
            pairs: [
              ['a', '1'],
              ['b', '2'],
            ],
          }),
          q('q4', { type: 'truefalse', prompt: 'p4', answer: true }),
        ],
      },
      { id: 'l2', title: 'L2', unitId: 'u', questions: [] },
    ],
  },
];

describe('unitProgressList', () => {
  it('ユニットごとの完了数と総数を返す', () => {
    expect(unitProgressList(units, ['l1', 'other'])).toEqual([
      { unitId: 'u', title: 'U', done: 1, total: 2 },
    ]);
  });
});

describe('pickReviewQuestions', () => {
  it('保存順に最大 limit 問、match と存在しない ID は除く', () => {
    const picked = pickReviewQuestions(units, ['q2', 'gone', 'q3', 'q1', 'q4'], 2);
    expect(picked.map((x) => x.id)).toEqual(['q2', 'q1']);
  });

  it('countReviewable は出題できる数を返す', () => {
    expect(countReviewable(units, ['q1', 'q3', 'gone'])).toBe(1);
    expect(countReviewable(units, [])).toBe(0);
  });
});
