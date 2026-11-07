import { describe, expect, it } from 'vitest';
import {
  buildQuestionView,
  buildQuestionViews,
  isCorrectAnswer,
  isMatchPairCorrect,
} from './lesson';
import type {
  ChoiceQuestion,
  LoadedQuestion,
  MatchQuestion,
  OrderQuestion,
  TrueFalseQuestion,
} from './types';

function loaded(data: LoadedQuestion['data'], id = 'q1'): LoadedQuestion {
  return { id, lessonId: 'lesson-1', unitId: 'unit-1', data };
}

const choiceQuestion: ChoiceQuestion = {
  type: 'choice',
  prompt: 'どれ？',
  choices: ['A', 'B', 'C'],
  answer: 'B',
};

const trueFalseQuestion: TrueFalseQuestion = {
  type: 'truefalse',
  prompt: '正しい？',
  answer: true,
};

const orderQuestion: OrderQuestion = {
  type: 'order',
  prompt: '並べよう',
  answer: ['first', 'second'],
  distractors: ['third'],
};

const matchQuestion: MatchQuestion = {
  type: 'match',
  prompt: '組み合わせよう',
  pairs: [
    ['A', '1'],
    ['B', '2'],
  ],
};

describe('buildQuestionView', () => {
  it('choice は全選択肢を重複なく並べ替え、元の配列を変更しない', () => {
    const original = [...choiceQuestion.choices];
    const view = buildQuestionView(loaded(choiceQuestion), () => 0.5);

    expect(view.type).toBe('choice');
    if (view.type === 'choice') {
      expect(view.choices).toHaveLength(original.length);
      expect([...view.choices].sort()).toEqual([...original].sort());
    }
    expect(choiceQuestion.choices).toEqual(original);
  });

  it('order は answer と distractors を含み、スロット数は answer の長さ', () => {
    const view = buildQuestionView(loaded(orderQuestion), () => 0);

    expect(view.type).toBe('order');
    if (view.type === 'order') {
      expect([...view.chips].sort()).toEqual(['first', 'second', 'third']);
      expect(view.slots).toBe(2);
    }
  });

  it('match は左右を別々に並べ、正しい組み合わせを引ける', () => {
    const view = buildQuestionView(loaded(matchQuestion), () => 0.25);

    expect(view.type).toBe('match');
    if (view.type === 'match') {
      expect([...view.left].sort()).toEqual(['A', 'B']);
      expect([...view.right].sort()).toEqual(['1', '2']);
      expect(isMatchPairCorrect(view, 'A', '1')).toBe(true);
      expect(isMatchPairCorrect(view, 'A', '2')).toBe(false);
      expect(isMatchPairCorrect(view, 'unknown', '1')).toBe(false);
    }
  });
});

describe('buildQuestionViews', () => {
  it('問題 ID をキーにした表示データを作る', () => {
    const views = buildQuestionViews(
      [
        loaded(choiceQuestion, 'a'),
        loaded(trueFalseQuestion, 'b'),
        loaded(matchQuestion, 'c'),
      ],
      () => 0.5,
    );

    expect(Object.keys(views).sort()).toEqual(['a', 'b', 'c']);
    expect(views.a.type).toBe('choice');
    expect(views.b.type).toBe('truefalse');
    expect(views.c.type).toBe('match');
  });
});

describe('isCorrectAnswer', () => {
  it('choice は値が一致するときだけ正解', () => {
    expect(isCorrectAnswer(loaded(choiceQuestion), 'B')).toBe(true);
    expect(isCorrectAnswer(loaded(choiceQuestion), 'A')).toBe(false);
    expect(isCorrectAnswer(loaded(choiceQuestion), 'Z')).toBe(false);
  });

  it('truefalse は真偽値が一致するときだけ正解', () => {
    expect(isCorrectAnswer(loaded(trueFalseQuestion), true)).toBe(true);
    expect(isCorrectAnswer(loaded(trueFalseQuestion), false)).toBe(false);
    expect(isCorrectAnswer(loaded(trueFalseQuestion), 'true')).toBe(false);
  });

  it('order は順番まで一致するときだけ正解', () => {
    expect(
      isCorrectAnswer(loaded(orderQuestion), ['first', 'second']),
    ).toBe(true);
    expect(
      isCorrectAnswer(loaded(orderQuestion), ['second', 'first']),
    ).toBe(false);
    expect(isCorrectAnswer(loaded(orderQuestion), ['first'])).toBe(false);
  });

  it('match は1組ずつ判定するため、ここでは常に false', () => {
    expect(isCorrectAnswer(loaded(matchQuestion), [])).toBe(false);
  });
});
