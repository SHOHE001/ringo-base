import { shuffle } from './shuffle';
import type { LoadedQuestion } from './types';

export type ChoiceView = {
  type: 'choice';
  choices: string[];
};

export type TrueFalseView = {
  type: 'truefalse';
};

export type OrderView = {
  type: 'order';
  chips: string[];
  slots: number;
};

export type MatchView = {
  type: 'match';
  left: string[];
  right: string[];
  rightByLeft: Record<string, string>;
};

export type QuestionView = ChoiceView | TrueFalseView | OrderView | MatchView;

export type QuestionViews = Record<string, QuestionView>;

export type AnswerValue = string | boolean | string[];

/**
 * レッスン開始時に一度だけ表示用の並びを作る。
 * 選択肢・チップ・組み合わせの左右はここでシャッフルする。
 */
export function buildQuestionView(
  question: LoadedQuestion,
  random: () => number = Math.random,
): QuestionView {
  const data = question.data;

  switch (data.type) {
    case 'choice':
      return { type: 'choice', choices: shuffle(data.choices, random) };
    case 'truefalse':
      return { type: 'truefalse' };
    case 'order':
      return {
        type: 'order',
        chips: shuffle(
          [...data.answer, ...(data.distractors ?? [])],
          random,
        ),
        slots: data.answer.length,
      };
    case 'match': {
      const rightByLeft: Record<string, string> = {};
      for (const [left, right] of data.pairs) {
        rightByLeft[left] = right;
      }
      return {
        type: 'match',
        left: shuffle(
          data.pairs.map(([left]) => left),
          random,
        ),
        right: shuffle(
          data.pairs.map(([, right]) => right),
          random,
        ),
        rightByLeft,
      };
    }
  }
}

export function buildQuestionViews(
  questions: readonly LoadedQuestion[],
  random: () => number = Math.random,
): QuestionViews {
  const views: QuestionViews = {};
  for (const question of questions) {
    views[question.id] = buildQuestionView(question, random);
  }
  return views;
}

/** match の1組が正しいかどうか。 */
export function isMatchPairCorrect(
  view: MatchView,
  left: string,
  right: string,
): boolean {
  return view.rightByLeft[left] === right;
}

/** match は1組ずつ判定するため、ここでは常に false を返す。 */
export function isCorrectAnswer(
  question: LoadedQuestion,
  value: AnswerValue,
): boolean {
  const data = question.data;

  switch (data.type) {
    case 'choice':
      return typeof value === 'string' && value === data.answer;
    case 'truefalse':
      return typeof value === 'boolean' && value === data.answer;
    case 'order':
      return (
        Array.isArray(value) &&
        value.length === data.answer.length &&
        value.every((item, index) => item === data.answer[index])
      );
    case 'match':
      return false;
  }
}
