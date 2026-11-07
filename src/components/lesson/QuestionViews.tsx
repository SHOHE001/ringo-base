import type { MatchView, OrderView } from '../../lib/lesson';
import type { Question } from '../../lib/types';
import { CheckIcon, CloseIcon } from '../Icons';

export function QuestionPrompt({ question }: { question: Question }) {
  return (
    <>
      <h1 className="question-prompt">{question.prompt}</h1>
      {question.code ? (
        <pre className="code-block">
          <code>{question.code}</code>
        </pre>
      ) : null}
    </>
  );
}

type ChoiceQuestionViewProps = {
  choices: string[];
  selected: string | null;
  answered: boolean;
  onSelect: (choice: string) => void;
};

export function ChoiceQuestionView({
  choices,
  selected,
  answered,
  onSelect,
}: ChoiceQuestionViewProps) {
  return (
    <div className="choice-list" role="group" aria-label="選択肢">
      {choices.map((choice, index) => (
        <button
          key={choice}
          type="button"
          className={`answer-card${selected === choice ? ' is-selected' : ''}`}
          aria-pressed={selected === choice}
          aria-keyshortcuts={String(index + 1)}
          disabled={answered}
          onClick={() => onSelect(choice)}
        >
          <span className="choice-number" aria-hidden="true">
            {index + 1}
          </span>
          <span>{choice}</span>
        </button>
      ))}
    </div>
  );
}

type TrueFalseQuestionViewProps = {
  selected: boolean | null;
  answered: boolean;
  onSelect: (value: boolean) => void;
};

const TRUE_FALSE_OPTIONS = [
  { value: true, label: '正しい', Icon: CheckIcon },
  { value: false, label: '誤り', Icon: CloseIcon },
] as const;

export function TrueFalseQuestionView({
  selected,
  answered,
  onSelect,
}: TrueFalseQuestionViewProps) {
  return (
    <div className="truefalse-grid" role="group" aria-label="正誤の選択肢">
      {TRUE_FALSE_OPTIONS.map(({ value, label, Icon }, index) => (
        <button
          key={label}
          type="button"
          className={`answer-card truefalse-card${selected === value ? ' is-selected' : ''}`}
          aria-pressed={selected === value}
          aria-keyshortcuts={String(index + 1)}
          disabled={answered}
          onClick={() => onSelect(value)}
        >
          <Icon size={30} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

type OrderQuestionViewProps = {
  view: OrderView;
  selected: string[];
  answered: boolean;
  onAdd: (chip: string) => void;
  onRemove: (index: number) => void;
};

export function OrderQuestionView({
  view,
  selected,
  answered,
  onAdd,
  onRemove,
}: OrderQuestionViewProps) {
  const available = view.chips.filter((chip) => !selected.includes(chip));

  return (
    <div className="order-question">
      <div className="order-answer" role="group" aria-label="回答欄">
        {Array.from({ length: view.slots }, (_, index) => {
          const value = selected[index];
          if (value) {
            return (
              <button
                key={`${value}-${index}`}
                type="button"
                className="order-slot is-filled"
                aria-label={`${index + 1}番目 ${value} を回答欄から戻す`}
                disabled={answered}
                onClick={() => onRemove(index)}
              >
                <span className="order-slot-index" aria-hidden="true">
                  {index + 1}
                </span>
                <span>{value}</span>
              </button>
            );
          }
          return (
            <div
              key={`empty-${index}`}
              className="order-slot"
              aria-label={`${index + 1}番目 未選択`}
            >
              <span className="order-slot-index" aria-hidden="true">
                {index + 1}
              </span>
              <span className="order-slot-empty">ここに並べる</span>
            </div>
          );
        })}
      </div>

      <div className="order-chips" role="group" aria-label="並べ替えるチップ">
        {available.map((chip, index) => (
          <button
            key={chip}
            type="button"
            className="chip"
            aria-keyshortcuts={String(index + 1)}
            disabled={answered || selected.length >= view.slots}
            onClick={() => onAdd(chip)}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

type MatchSide = 'left' | 'right';

type MatchQuestionViewProps = {
  view: MatchView;
  selectedLeft: string | null;
  selectedRight: string | null;
  matchedLeft: string[];
  matchedRight: string[];
  wrongPair: { left: string; right: string } | null;
  answered: boolean;
  onSelect: (side: MatchSide, value: string) => void;
};

export function MatchQuestionView({
  view,
  selectedLeft,
  selectedRight,
  matchedLeft,
  matchedRight,
  wrongPair,
  answered,
  onSelect,
}: MatchQuestionViewProps) {
  return (
    <div className="match-question">
      <div className="match-grid">
        <div className="match-column" role="group" aria-label="左の項目">
          {view.left.map((left, index) => {
            const matched = matchedLeft.includes(left);
            const selected = selectedLeft === left;
            const wrong = wrongPair?.left === left;
            return (
              <button
                key={left}
                type="button"
                className={[
                  'match-card',
                  selected ? 'is-selected' : '',
                  matched ? 'is-matched' : '',
                  wrong ? 'is-wrong' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={selected}
                aria-keyshortcuts={String(index + 1)}
                disabled={answered || matched}
                onClick={() => onSelect('left', left)}
              >
                <span>{left}</span>
                {matched ? <CheckIcon size={17} /> : null}
              </button>
            );
          })}
        </div>

        <div className="match-column" role="group" aria-label="右の項目">
          {view.right.map((right, index) => {
            const matched = matchedRight.includes(right);
            const selected = selectedRight === right;
            const wrong = wrongPair?.right === right;
            return (
              <button
                key={right}
                type="button"
                className={[
                  'match-card',
                  selected ? 'is-selected' : '',
                  matched ? 'is-matched' : '',
                  wrong ? 'is-wrong' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={selected}
                aria-keyshortcuts={String(view.left.length + index + 1)}
                disabled={answered || matched}
                onClick={() => onSelect('right', right)}
              >
                <span>{right}</span>
                {matched ? <CheckIcon size={17} /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {wrongPair ? '組み合わせが違います。もう一度選んでください。' : ''}
      </p>
    </div>
  );
}
