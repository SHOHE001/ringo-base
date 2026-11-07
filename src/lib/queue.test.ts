import { describe, expect, it } from 'vitest';
import { advanceQueue, requeueToEnd } from './queue';

describe('advanceQueue', () => {
  it('正解なら先頭を取り除く', () => {
    expect(advanceQueue(['a', 'b', 'c'], true)).toEqual(['b', 'c']);
  });

  it('不正解なら先頭を末尾へ回す', () => {
    expect(advanceQueue(['a', 'b', 'c'], false)).toEqual(['b', 'c', 'a']);
  });

  it('問題が1つだけでも同じ問題を残す', () => {
    expect(advanceQueue(['a'], false)).toEqual(['a']);
    expect(advanceQueue(['a'], true)).toEqual([]);
  });

  it('空のキューは空のまま', () => {
    expect(advanceQueue([], false)).toEqual([]);
    expect(advanceQueue([], true)).toEqual([]);
  });
});

describe('requeueToEnd', () => {
  it('先頭を末尾へ回す', () => {
    expect(requeueToEnd(['a', 'b', 'c'])).toEqual(['b', 'c', 'a']);
  });
});
