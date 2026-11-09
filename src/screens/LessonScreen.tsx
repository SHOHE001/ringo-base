import { useEffect, useRef, useState } from 'react';
import { formatAccuracy, formatDuration } from '../lib/format';
import {
  buildQuestionViews,
  isCorrectAnswer,
  isMatchPairCorrect,
} from '../lib/lesson';
import type { AnswerValue, MatchView, OrderView, QuestionView } from '../lib/lesson';
import { advanceQueue } from '../lib/queue';
import type { LoadedLesson, LoadedQuestion, Question } from '../lib/types';
import { calculateLessonXp, calculateReviewXp } from '../lib/xp';
import {
  BoltIcon,
  ClockIcon,
  CloseIcon,
  StarIcon,
} from '../components/Icons';
import { Mascot } from '../components/Mascot';
import { Modal } from '../components/Modal';
import { LessonIntroView } from '../components/lesson/LessonIntroView';
import {
  ChoiceQuestionView,
  MatchQuestionView,
  OrderQuestionView,
  QuestionPrompt,
  TrueFalseQuestionView,
} from '../components/lesson/QuestionViews';

export type LessonResult = {
  xp: number;
  mistakes: number;
  correct: number;
  elapsedMs: number;
};

export type LessonMode = 'lesson' | 'review';

type LessonScreenProps = {
  lesson: LoadedLesson;
  /** review では正解した問題を復習リストから外す。 */
  mode?: LessonMode;
  isReplay: boolean;
  onWrongQuestion: (questionId: string) => void;
  onCorrectQuestion?: (questionId: string) => void;
  onComplete: (result: LessonResult) => void;
  onExit: () => void;
};

type Phase = 'answering' | 'feedback' | 'complete';

type MatchSide = 'left' | 'right';

type MatchState = {
  selectedLeft: string | null;
  selectedRight: string | null;
  matchedLeft: string[];
  matchedRight: string[];
  wrongPair: { left: string; right: string } | null;
};

const MATCH_WRONG_DELAY_MS = 650;
const CONFETTI_COLORS = [
  'var(--green)',
  'var(--blue)',
  'var(--gold)',
  'var(--red)',
  'var(--purple)',
  'var(--orange)',
];

const CONFETTI = Array.from({ length: 36 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  width: index % 3 === 0 ? 10 : 7,
  height: index % 2 === 0 ? 16 : 11,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  delay: `${(index % 12) * 0.11}s`,
  duration: `${2.6 + (index % 5) * 0.35}s`,
}));

function emptyMatchState(): MatchState {
  return {
    selectedLeft: null,
    selectedRight: null,
    matchedLeft: [],
    matchedRight: [],
    wrongPair: null,
  };
}

function isAnswerReady(
  question: LoadedQuestion,
  value: AnswerValue | null,
  view: QuestionView | undefined,
): boolean {
  switch (question.data.type) {
    case 'choice':
      return typeof value === 'string' && question.data.choices.includes(value);
    case 'truefalse':
      return typeof value === 'boolean';
    case 'order':
      return (
        view?.type === 'order' &&
        Array.isArray(value) &&
        value.length === view.slots
      );
    case 'match':
      return false;
  }
}

function formatCorrectAnswer(question: Question): string {
  switch (question.type) {
    case 'choice':
      return question.answer;
    case 'truefalse':
      return question.answer ? '正しい' : '誤り';
    case 'order':
      return question.answer.join(' → ');
    case 'match':
      return question.pairs.map(([left, right]) => `${left}：${right}`).join(' / ');
  }
}

export function LessonScreen(props: LessonScreenProps) {
  const { lesson, mode = 'lesson', onExit } = props;
  const [introDone, setIntroDone] = useState(false);

  // The session mounts after the intro so its timer excludes reading time.
  if (mode === 'lesson' && lesson.intro && !introDone) {
    return (
      <LessonIntroView
        title={lesson.title}
        intro={lesson.intro}
        onStart={() => setIntroDone(true)}
        onExit={onExit}
      />
    );
  }

  return <LessonSession {...props} />;
}

function LessonSession({
  lesson,
  mode = 'lesson',
  isReplay,
  onWrongQuestion,
  onCorrectQuestion,
  onComplete,
  onExit,
}: LessonScreenProps) {
  const isReview = mode === 'review';

  const [views] = useState(() => buildQuestionViews(lesson.questions));
  const [queue, setQueue] = useState<LoadedQuestion[]>(() => [
    ...lesson.questions,
  ]);
  const [phase, setPhase] = useState<Phase>('answering');
  const [selected, setSelected] = useState<AnswerValue | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [finished, setFinished] = useState<{
    xp: number;
    elapsedMs: number;
  } | null>(null);
  const [matchState, setMatchState] =
    useState<MatchState>(emptyMatchState);

  const finishedRef = useRef(false);
  const isReplayRef = useRef(isReplay);
  const matchTimeoutRef = useRef<number | null>(null);
  const keyHandlerRef = useRef<(event: KeyboardEvent) => void>(() => {});

  const total = lesson.questions.length;
  const current = queue[0];
  const currentView = current ? views[current.id] : undefined;
  const matchView: MatchView | null =
    current?.data.type === 'match' && currentView?.type === 'match'
      ? currentView
      : null;
  const orderView: OrderView | null =
    current?.data.type === 'order' && currentView?.type === 'order'
      ? currentView
      : null;
  const canCheck = current
    ? isAnswerReady(current, selected, currentView)
    : false;
  const masteredCount =
    total - queue.length + (phase === 'feedback' && lastCorrect ? 1 : 0);
  const progressPct =
    total > 0 ? Math.round((masteredCount / total) * 100) : 0;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(
    () => () => {
      if (matchTimeoutRef.current !== null) {
        window.clearTimeout(matchTimeoutRef.current);
      }
    },
    [],
  );

  function resetForNextQuestion(nextQueue: LoadedQuestion[]) {
    setQueue(nextQueue);
    setSelected(null);
    setLastCorrect(false);
    setMatchState(emptyMatchState());
    setAttempt((value) => value + 1);
    setPhase('answering');
    if (matchTimeoutRef.current !== null) {
      window.clearTimeout(matchTimeoutRef.current);
      matchTimeoutRef.current = null;
    }
  }

  function finishLesson() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const elapsedMs = Date.now() - startedAt;
    const xp = isReview
      ? calculateReviewXp()
      : calculateLessonXp(isReplayRef.current, wrongCount);
    setFinished({ xp, elapsedMs });
    setPhase('complete');
    window.scrollTo(0, 0);
    onComplete({
      xp,
      mistakes: wrongCount,
      correct: correctCount,
      elapsedMs,
    });
  }

  function handleCheck() {
    if (phase !== 'answering' || !current) return;
    if (current.data.type === 'match') return;
    if (!isAnswerReady(current, selected, currentView)) return;
    if (selected === null) return;

    const correct = isCorrectAnswer(current, selected);
    if (correct) {
      setCorrectCount((count) => count + 1);
      if (isReview) onCorrectQuestion?.(current.id);
    } else {
      setWrongCount((count) => count + 1);
      if (!isReview) onWrongQuestion(current.id);
    }
    setLastCorrect(correct);
    setPhase('feedback');
  }

  function handleContinue() {
    if (phase !== 'feedback' || !current) return;

    const nextQueue = advanceQueue(queue, lastCorrect);
    if (lastCorrect && nextQueue.length === 0) {
      finishLesson();
      return;
    }
    resetForNextQuestion(nextQueue);
  }

  function handleChoiceSelect(choice: string) {
    if (phase !== 'answering') return;
    setSelected(choice);
  }

  function handleTrueFalseSelect(value: boolean) {
    if (phase !== 'answering') return;
    setSelected(value);
  }

  function handleOrderAdd(chip: string) {
    if (phase !== 'answering' || !orderView) return;
    setSelected((value) => {
      const chips = Array.isArray(value) ? value : [];
      if (chips.length >= orderView.slots) return chips;
      if (!orderView.chips.includes(chip) || chips.includes(chip)) return chips;
      return [...chips, chip];
    });
  }

  function handleOrderRemove(index: number) {
    if (phase !== 'answering') return;
    setSelected((value) =>
      Array.isArray(value) ? value.filter((_, itemIndex) => itemIndex !== index) : [],
    );
  }

  function resolveMatch(left: string, right: string) {
    if (!matchView) return;

    if (isMatchPairCorrect(matchView, left, right)) {
      const nextMatchedLeft = [...matchState.matchedLeft, left];
      const nextMatchedRight = [...matchState.matchedRight, right];
      setCorrectCount((count) => count + 1);
      setMatchState({
        selectedLeft: null,
        selectedRight: null,
        matchedLeft: nextMatchedLeft,
        matchedRight: nextMatchedRight,
        wrongPair: null,
      });

      if (nextMatchedLeft.length === matchView.left.length) {
        setLastCorrect(true);
        setPhase('feedback');
      }
      return;
    }

    setWrongCount((count) => count + 1);
    setMatchState((state) => ({
      ...state,
      selectedLeft: null,
      selectedRight: null,
      wrongPair: { left, right },
    }));

    if (matchTimeoutRef.current !== null) {
      window.clearTimeout(matchTimeoutRef.current);
    }
    matchTimeoutRef.current = window.setTimeout(() => {
      setMatchState((state) =>
        state.wrongPair ? { ...state, wrongPair: null } : state,
      );
      matchTimeoutRef.current = null;
    }, MATCH_WRONG_DELAY_MS);
  }

  function handleMatchSelect(side: MatchSide, value: string) {
    if (phase !== 'answering' || !matchView || matchState.wrongPair) return;

    if (side === 'left') {
      if (matchState.matchedLeft.includes(value)) return;
      if (matchState.selectedRight) {
        resolveMatch(value, matchState.selectedRight);
        return;
      }
      setMatchState((state) => ({
        ...state,
        selectedLeft: state.selectedLeft === value ? null : value,
      }));
      return;
    }

    if (matchState.matchedRight.includes(value)) return;
    if (matchState.selectedLeft) {
      resolveMatch(matchState.selectedLeft, value);
      return;
    }
    setMatchState((state) => ({
      ...state,
      selectedRight: state.selectedRight === value ? null : value,
    }));
  }

  function handleExitRequest() {
    setShowExitConfirm(true);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target instanceof Element ? event.target : null;
    if (
      target?.closest(
        '.modal-card, input, textarea, select, [contenteditable="true"]',
      )
    ) {
      return;
    }
    if (showExitConfirm) return;

    if (event.key === 'Enter') {
      if (finished) {
        event.preventDefault();
        onExit();
        return;
      }
      if (target?.closest('.icon-button')) {
        return;
      }
      if (phase === 'feedback') {
        event.preventDefault();
        handleContinue();
        return;
      }
      if (phase === 'answering' && canCheck) {
        event.preventDefault();
        handleCheck();
      }
      return;
    }

    if (event.key === 'Escape') {
      if (finished) return;
      event.preventDefault();
      handleExitRequest();
      return;
    }

    if (phase !== 'answering' || !current) return;

    const index = Number(event.key) - 1;
    if (!Number.isInteger(index) || index < 0 || index > 8) return;

    if (current.data.type === 'choice' && currentView?.type === 'choice') {
      const choice = currentView.choices[index];
      if (choice !== undefined) {
        event.preventDefault();
        handleChoiceSelect(choice);
      }
      return;
    }

    if (current.data.type === 'truefalse') {
      if (index === 0) {
        event.preventDefault();
        handleTrueFalseSelect(true);
      } else if (index === 1) {
        event.preventDefault();
        handleTrueFalseSelect(false);
      }
      return;
    }

    if (orderView) {
      const selectedChips = Array.isArray(selected) ? selected : [];
      const available = orderView.chips.filter(
        (chip) => !selectedChips.includes(chip),
      );
      const chip = available[index];
      if (chip !== undefined) {
        event.preventDefault();
        handleOrderAdd(chip);
      }
      return;
    }

    if (matchView) {
      if (index < matchView.left.length) {
        const left = matchView.left[index];
        if (left !== undefined) {
          event.preventDefault();
          handleMatchSelect('left', left);
        }
        return;
      }
      const right = matchView.right[index - matchView.left.length];
      if (right !== undefined) {
        event.preventDefault();
        handleMatchSelect('right', right);
      }
    }
  }

  keyHandlerRef.current = handleKeyDown;

  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandlerRef.current(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  if (finished) {
    return (
      <div className="lesson-screen completion-screen">
        <div className="confetti-layer" aria-hidden="true">
          {CONFETTI.map((piece, index) => (
            <span
              key={index}
              className="confetti-piece"
              style={{
                left: piece.left,
                width: piece.width,
                height: piece.height,
                backgroundColor: piece.color,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
              }}
            />
          ))}
        </div>

        <main className="completion-inner">
          <Mascot mood="happy" size={148} />
          <h1>{isReview ? '復習完了！' : 'レッスン完了！'}</h1>
          <p className="completion-sub">{lesson.title}</p>

          <div className="result-cards">
            <div className="result-card result-card--xp">
              <span className="result-card-icon">
                <BoltIcon size={24} />
              </span>
              <span className="result-label">獲得 XP</span>
              <strong className="result-value">
                +{finished.xp}
                <span>XP</span>
              </strong>
            </div>
            <div className="result-card result-card--accuracy">
              <span className="result-card-icon">
                <StarIcon size={24} />
              </span>
              <span className="result-label">正答率</span>
              <strong className="result-value">
                {formatAccuracy(correctCount, correctCount + wrongCount)}
              </strong>
            </div>
            <div className="result-card result-card--time">
              <span className="result-card-icon">
                <ClockIcon size={24} />
              </span>
              <span className="result-label">かかった時間</span>
              <strong className="result-value">
                {formatDuration(finished.elapsedMs)}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary completion-continue"
            autoFocus
            onClick={onExit}
          >
            つづける
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="lesson-screen">
      <header className="lesson-topbar">
        <button
          type="button"
          className="icon-button"
          aria-label={isReview ? '復習を閉じる' : 'レッスンを閉じる'}
          onClick={handleExitRequest}
        >
          <CloseIcon size={22} />
        </button>

        <div
          className="lesson-progress-track"
          role="progressbar"
          aria-label="レッスンの進捗"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-valuetext={`${masteredCount} / ${total} 問`}
        >
          <div
            className="lesson-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <main className="lesson-body">
        {current ? (
          <div className="question-area" key={`${current.id}-${attempt}`}>
            <QuestionPrompt question={current.data} />
            {current.data.type === 'choice' && currentView?.type === 'choice' ? (
              <ChoiceQuestionView
                choices={currentView.choices}
                selected={typeof selected === 'string' ? selected : null}
                answered={phase !== 'answering'}
                onSelect={handleChoiceSelect}
              />
            ) : null}

            {current.data.type === 'truefalse' ? (
              <TrueFalseQuestionView
                selected={typeof selected === 'boolean' ? selected : null}
                answered={phase !== 'answering'}
                onSelect={handleTrueFalseSelect}
              />
            ) : null}

            {current.data.type === 'order' && orderView ? (
              <OrderQuestionView
                view={orderView}
                selected={Array.isArray(selected) ? selected : []}
                answered={phase !== 'answering'}
                onAdd={handleOrderAdd}
                onRemove={handleOrderRemove}
              />
            ) : null}

            {current.data.type === 'match' && matchView ? (
              <MatchQuestionView
                view={matchView}
                selectedLeft={matchState.selectedLeft}
                selectedRight={matchState.selectedRight}
                matchedLeft={matchState.matchedLeft}
                matchedRight={matchState.matchedRight}
                wrongPair={matchState.wrongPair}
                answered={phase !== 'answering' || matchState.wrongPair !== null}
                onSelect={handleMatchSelect}
              />
            ) : null}
          </div>
        ) : null}
      </main>

      {phase === 'answering' ? (
        <footer className="lesson-footer">
          <div className="lesson-footer-inner">
            {current?.data.type === 'match' ? (
              <p className="lesson-footer-hint">
                左右を1つずつ選ぶと、自動で判定されます。
              </p>
            ) : null}
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={!canCheck}
              onClick={handleCheck}
            >
              チェック
            </button>
          </div>
        </footer>
      ) : null}

      {phase === 'feedback' && current ? (
        <footer
          className={`lesson-footer feedback-panel ${
            lastCorrect ? 'is-correct' : 'is-wrong'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="lesson-footer-inner feedback-inner">
            <h2 className="feedback-title">
              {lastCorrect ? '正解！' : '不正解'}
            </h2>
            <p className="feedback-answer">
              <span className="feedback-answer-label">正答</span>
              {formatCorrectAnswer(current.data)}
            </p>
            {current.data.explanation ? (
              <p className="feedback-explanation">
                {current.data.explanation}
              </p>
            ) : null}
            <button
              type="button"
              className={`btn ${
                lastCorrect ? 'btn-success' : 'btn-danger'
              } btn-block`}
              autoFocus
              onClick={handleContinue}
            >
              つづける
            </button>
          </div>
        </footer>
      ) : null}

      {showExitConfirm ? (
        <Modal
          labelledBy="exit-modal-title"
          onEscape={() => setShowExitConfirm(false)}
        >
          <h2 id="exit-modal-title" className="modal-title">
            {isReview ? '復習をやめますか？' : 'レッスンをやめますか？'}
          </h2>
          <p className="modal-text">
            いまの進み具合は失われます。XP は、最後まで終えたときにもらえます。
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => setShowExitConfirm(false)}
            >
              つづける
            </button>
            <button
              type="button"
              className="btn btn-danger-ghost btn-block"
              onClick={onExit}
            >
              やめる
            </button>
          </div>
        </Modal>
      ) : null}

    </div>
  );
}
