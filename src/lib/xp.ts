import { xpLesson, xpPerfectBonus, xpReplay, xpReview } from '../config';

/** 初回は基本 XP、誤答なしならパーフェクトボーナス。再挑戦はリプレイ XP。 */
export function calculateLessonXp(isReplay: boolean, mistakes: number): number {
  if (isReplay) return xpReplay;
  return xpLesson + (mistakes === 0 ? xpPerfectBonus : 0);
}

export function calculateReviewXp(): number {
  return xpReview;
}
