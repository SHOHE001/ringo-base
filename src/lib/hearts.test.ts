import { describe, expect, it } from 'vitest';
import {
  nextHeartInMs,
  refillHearts,
  regenerateHearts,
  spendHeart,
} from './hearts';

const MINUTE = 60_000;
const REGEN = 30 * MINUTE;

describe('regenerateHearts', () => {
  it('30分ごとに1つ回復する', () => {
    const start = { hearts: 2, heartAnchor: 0 };
    expect(regenerateHearts(start, REGEN - 1)).toEqual(start);
    expect(regenerateHearts(start, REGEN)).toEqual({
      hearts: 3,
      heartAnchor: REGEN,
    });
    expect(regenerateHearts(start, REGEN * 2 + 5)).toEqual({
      hearts: 4,
      heartAnchor: REGEN * 2,
    });
  });

  it('上限を超えない', () => {
    expect(regenerateHearts({ hearts: 1, heartAnchor: 0 }, REGEN * 10)).toEqual(
      { hearts: 5, heartAnchor: REGEN * 10 },
    );
  });

  it('満タンなら基準時刻を変えない', () => {
    expect(
      regenerateHearts({ hearts: 5, heartAnchor: 123 }, REGEN * 10),
    ).toEqual({ hearts: 5, heartAnchor: 123 });
  });
});

describe('nextHeartInMs', () => {
  it('次の回復までの残り時間を返す', () => {
    expect(nextHeartInMs({ hearts: 0, heartAnchor: 0 }, 10 * MINUTE)).toBe(
      20 * MINUTE,
    );
  });

  it('満タンなら0', () => {
    expect(nextHeartInMs({ hearts: 5, heartAnchor: 0 }, 0)).toBe(0);
  });

  it('回復時刻を過ぎていたら0', () => {
    expect(nextHeartInMs({ hearts: 0, heartAnchor: 0 }, REGEN * 2)).toBe(0);
  });
});

describe('spendHeart', () => {
  it('満タンから減らすと基準時刻を now にする', () => {
    expect(spendHeart({ hearts: 5, heartAnchor: 0 }, 1000)).toEqual({
      hearts: 4,
      heartAnchor: 1000,
    });
  });

  it('満タンでなければ基準時刻を維持する', () => {
    expect(spendHeart({ hearts: 3, heartAnchor: 500 }, 1000)).toEqual({
      hearts: 2,
      heartAnchor: 500,
    });
  });

  it('0 のときは減らさない', () => {
    expect(spendHeart({ hearts: 0, heartAnchor: 500 }, 1000)).toEqual({
      hearts: 0,
      heartAnchor: 500,
    });
  });
});

describe('refillHearts', () => {
  it('上限まで回復し、基準時刻を now にする', () => {
    expect(refillHearts(999)).toEqual({ hearts: 5, heartAnchor: 999 });
  });
});
