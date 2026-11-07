import { describe, expect, it } from 'vitest';
import { xpLesson, xpPerfectBonus, xpReplay, xpReview } from '../config';
import { calculateLessonXp, calculateReviewXp } from './xp';

describe('calculateLessonXp', () => {
  it('初回は基本 XP のみ', () => {
    expect(calculateLessonXp(false, 1)).toBe(xpLesson);
    expect(calculateLessonXp(false, 3)).toBe(xpLesson);
  });

  it('初回で誤答 0 ならパーフェクトボーナスを加算する', () => {
    expect(calculateLessonXp(false, 0)).toBe(xpLesson + xpPerfectBonus);
  });

  it('再挑戦は誤答数にかかわらずリプレイ XP', () => {
    expect(calculateLessonXp(true, 0)).toBe(xpReplay);
    expect(calculateLessonXp(true, 2)).toBe(xpReplay);
  });
});

describe('calculateReviewXp', () => {
  it('復習は常に復習 XP', () => {
    expect(calculateReviewXp()).toBe(xpReview);
  });
});
