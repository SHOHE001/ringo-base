import { heartRegenMinutes, maxHearts } from '../config';

export type HeartState = {
  hearts: number;
  heartAnchor: number;
};

const intervalMs = heartRegenMinutes * 60_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 最後の回復基準時刻から経過した分だけハートを回復する。
 * 満タンになったら基準時刻を now にそろえる。
 */
export function regenerateHearts(
  state: HeartState,
  now: number,
  max: number = maxHearts,
  regenMs: number = intervalMs,
): HeartState {
  const hearts = clamp(Math.trunc(state.hearts), 0, max);
  if (hearts >= max) {
    return { hearts: max, heartAnchor: state.heartAnchor };
  }
  const elapsed = Math.max(0, now - state.heartAnchor);
  const gained = Math.floor(elapsed / regenMs);
  if (gained <= 0) {
    return { hearts, heartAnchor: state.heartAnchor };
  }
  const nextHearts = Math.min(max, hearts + gained);
  return {
    hearts: nextHearts,
    heartAnchor: nextHearts >= max ? now : state.heartAnchor + gained * regenMs,
  };
}

export function nextHeartInMs(
  state: HeartState,
  now: number,
  max: number = maxHearts,
  regenMs: number = intervalMs,
): number {
  if (state.hearts >= max) return 0;
  return Math.max(0, state.heartAnchor + regenMs - now);
}

/** ハートを 1 つ消費する。満タンから減らしたときは回復基準時刻を now にする。 */
export function spendHeart(
  state: HeartState,
  now: number,
  max: number = maxHearts,
  regenMs: number = intervalMs,
): HeartState {
  const regenerated = regenerateHearts(state, now, max, regenMs);
  if (regenerated.hearts <= 0) {
    return regenerated;
  }
  const wasFull = regenerated.hearts >= max;
  return {
    hearts: regenerated.hearts - 1,
    heartAnchor: wasFull ? now : regenerated.heartAnchor,
  };
}

export function refillHearts(now: number, max: number = maxHearts): HeartState {
  return { hearts: max, heartAnchor: now };
}
