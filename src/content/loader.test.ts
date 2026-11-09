import { describe, expect, it } from 'vitest';
import { content, createQuestionId, parseLessonIntro, parseQuestion } from './loader';

describe('parseQuestion', () => {
  it('4形式の正しい問題を受け入れる', () => {
    const valid = [
      { type: 'choice', prompt: 'p', choices: ['a', 'b'], answer: 'a' },
      { type: 'truefalse', prompt: 'p', answer: false },
      { type: 'order', prompt: 'p', answer: ['a', 'b'], distractors: ['c'] },
      {
        type: 'match',
        prompt: 'p',
        pairs: [
          ['a', '1'],
          ['b', '2'],
        ],
      },
    ];
    for (const raw of valid) {
      expect(parseQuestion(raw).ok, JSON.stringify(raw)).toBe(true);
    }
  });

  it('必須項目の欠落を検出する', () => {
    expect(parseQuestion({ type: 'truefalse', answer: true }).ok).toBe(false);
    expect(parseQuestion({ type: 'choice', prompt: 'p', answer: 'a' }).ok).toBe(false);
    expect(parseQuestion({ prompt: 'p', answer: true }).ok).toBe(false);
    expect(parseQuestion('text').ok).toBe(false);
  });

  it('answer が choices にない choice を除外する', () => {
    const result = parseQuestion({
      type: 'choice',
      prompt: 'p',
      choices: ['a', 'b'],
      answer: 'z',
    });
    expect(result.ok).toBe(false);
  });

  it('choices の重複や不足を除外する', () => {
    expect(
      parseQuestion({ type: 'choice', prompt: 'p', choices: ['a', 'a'], answer: 'a' }).ok,
    ).toBe(false);
    expect(
      parseQuestion({ type: 'choice', prompt: 'p', choices: ['a'], answer: 'a' }).ok,
    ).toBe(false);
  });

  it('truefalse の answer が真偽値でなければ除外する', () => {
    expect(parseQuestion({ type: 'truefalse', prompt: 'p', answer: 'true' }).ok).toBe(false);
  });

  it('order の重複と、distractors が answer と重なる場合を除外する', () => {
    expect(parseQuestion({ type: 'order', prompt: 'p', answer: ['a', 'a'] }).ok).toBe(false);
    expect(
      parseQuestion({ type: 'order', prompt: 'p', answer: ['a', 'b'], distractors: ['a'] }).ok,
    ).toBe(false);
  });

  it('match の組が2未満、または値が重複する場合を除外する', () => {
    expect(parseQuestion({ type: 'match', prompt: 'p', pairs: [['a', '1']] }).ok).toBe(false);
    expect(
      parseQuestion({
        type: 'match',
        prompt: 'p',
        pairs: [
          ['a', '1'],
          ['a', '2'],
        ],
      }).ok,
    ).toBe(false);
  });

  it('未知の type を除外する', () => {
    expect(parseQuestion({ type: 'essay', prompt: 'p' }).ok).toBe(false);
  });
});

describe('createQuestionId', () => {
  it('同じ入力なら同じ ID、レッスンか問題文が違えば別の ID', () => {
    expect(createQuestionId('l1', 'p')).toBe(createQuestionId('l1', 'p'));
    expect(createQuestionId('l1', 'p')).not.toBe(createQuestionId('l2', 'p'));
    expect(createQuestionId('l1', 'p')).not.toBe(createQuestionId('l1', 'q'));
  });
});

describe('同梱コンテンツ', () => {
  it('検証警告なしで読み込め、ユニットは order の昇順', () => {
    expect(content.warnings).toEqual([]);
    expect(content.units.length).toBeGreaterThan(0);
    const orders = content.units.map((u) => u.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('レッスン ID と問題 ID が全体で一意', () => {
    const lessons = content.units.flatMap((u) => u.lessons);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
    const questions = lessons.flatMap((l) => l.questions);
    expect(new Set(questions.map((x) => x.id)).size).toBe(questions.length);
  });

  it('_template.json は読み込まれない', () => {
    expect(content.units.some((u) => u.id === 'unit-id')).toBe(false);
  });
});

describe('lesson intro', () => {
  it('summary と points が欠けた導入を拒否する', () => {
    expect(parseLessonIntro({ points: [{ term: 't', text: 'x' }] }).ok).toBe(false);
    expect(parseLessonIntro({ summary: 's', points: [] }).ok).toBe(false);
    expect(parseLessonIntro({ summary: 's', points: [{ term: 't' }] }).ok).toBe(false);
    expect(parseLessonIntro({ summary: 's', points: [{ term: 't', text: 'x' }] }).ok).toBe(true);
  });

  it('全レッスンに導入がある', () => {
    const lessons = content.units.flatMap((unit) => unit.lessons);
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons.filter((lesson) => !lesson.intro).map((lesson) => lesson.id)).toEqual([]);
  });
});
