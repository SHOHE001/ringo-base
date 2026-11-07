/**
 * 先頭が現在の問題。正解なら先頭を取り除き、不正解なら末尾へ回す。
 */
export function advanceQueue<T>(queue: readonly T[], correct: boolean): T[] {
  if (queue.length === 0) return [];
  const [head, ...rest] = queue;
  return correct ? rest : [...rest, head];
}

export function requeueToEnd<T>(queue: readonly T[]): T[] {
  return advanceQueue(queue, false);
}
