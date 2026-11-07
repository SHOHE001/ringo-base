import { Fragment, useEffect, useRef, useState } from 'react';
import type {
  Content,
  LessonStatus,
  LoadedLesson,
  LoadedUnit,
} from '../lib/types';
import { flattenLessons, getLessonStatuses } from '../lib/unlock';
import { CheckIcon, CloseIcon, LockIcon, StarIcon } from '../components/Icons';
import { Mascot } from '../components/Mascot';

type LearnScreenProps = {
  content: Content;
  completedLessonIds: readonly string[];
  onStartLesson: (lesson: LoadedLesson) => void;
};

const STATUS_LABEL: Record<LessonStatus, string> = {
  completed: '完了',
  current: '学習中',
  locked: 'ロック中',
};

function NodeRing({ progress }: { progress: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <svg className="node-ring" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="node-ring-track" cx="50" cy="50" r={radius} />
      <circle
        className="node-ring-fill"
        cx="50"
        cy="50"
        r={radius}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
}

function NodeIcon({ status }: { status: LessonStatus }) {
  if (status === 'completed') return <CheckIcon size={34} />;
  if (status === 'current') return <StarIcon size={32} />;
  return <LockIcon size={30} />;
}

function completedCountInUnit(
  unit: LoadedUnit,
  statuses: Record<string, LessonStatus>,
): number {
  return unit.lessons.filter((lesson) => statuses[lesson.id] === 'completed')
    .length;
}

export function LearnScreen({
  content,
  completedLessonIds,
  onStartLesson,
}: LearnScreenProps) {
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const allLessons = flattenLessons(content.units);
  const statuses = getLessonStatuses(
    allLessons.map((lesson) => lesson.id),
    completedLessonIds,
  );
  const currentLesson = allLessons.find(
    (lesson) => statuses[lesson.id] === 'current',
  );
  const allComplete = allLessons.length > 0 && !currentLesson;

  useEffect(() => {
    if (!openLessonId) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (popoverRef.current?.contains(target)) return;
      if (target.closest('.lesson-node')) return;
      setOpenLessonId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenLessonId(null);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openLessonId]);

  return (
    <div className="learn-screen">
      <h1 className="sr-only">学ぶ</h1>

      {content.warnings.length > 0 ? (
        <div className="warning-banner" role="status">
          <strong>コンテンツの読み込みで問題が見つかりました</strong>
          <ul>
            {content.warnings.map((warning, index) => (
              <li key={`${warning.file}-${index}`}>
                <span className="warning-file">{warning.file}</span>
                {warning.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {content.units.length === 0 ? (
        <div className="empty-state">
          <Mascot mood="sad" size={120} />
          <h2>学べるユニットがありません</h2>
          <p>
            src/content/units に JSON を追加すると、ここにレッスンが並びます。
          </p>
        </div>
      ) : null}

      {content.units.map((unit, unitIndex) => {
        const unitProgress =
          unit.lessons.length > 0
            ? completedCountInUnit(unit, statuses) / unit.lessons.length
            : 0;
        const bannerId = `unit-title-${unit.id}`;

        return (
          <section
            className={`unit color-${unit.color}`}
            key={unit.id}
            aria-labelledby={bannerId}
          >
            <div className="unit-banner">
              <p className="unit-kicker">ユニット {unitIndex + 1}</p>
              <h2 id={bannerId}>{unit.title}</h2>
              {unit.description ? (
                <p className="unit-description">{unit.description}</p>
              ) : null}
            </div>

            <div className="unit-path">
              {unit.lessons.map((lesson, lessonIndex) => {
                const status = statuses[lesson.id] ?? 'locked';
                const isOpen = openLessonId === lesson.id;
                const isCurrent = status === 'current';
                const isCompleted = status === 'completed';

                return (
                  <Fragment key={lesson.id}>
                    <div className={`node-row${isOpen ? ' has-popover' : ''}`}>
                      <div className={`node-anchor zig-${lessonIndex % 6}`}>
                        {isCurrent ? (
                          <span className="start-bubble" aria-hidden="true">
                            はじめる
                          </span>
                        ) : null}
                        {isCurrent ? (
                          <NodeRing progress={unitProgress} />
                        ) : null}
                        <button
                          type="button"
                          className={`lesson-node is-${status}`}
                          aria-label={`${lesson.title}（${STATUS_LABEL[status]}）`}
                          aria-haspopup="dialog"
                          aria-expanded={isOpen}
                          onClick={() =>
                            setOpenLessonId((current) =>
                              current === lesson.id ? null : lesson.id,
                            )
                          }
                        >
                          <NodeIcon status={status} />
                        </button>
                      </div>

                      {isOpen ? (
                        <div
                          className="lesson-popover"
                          role="dialog"
                          aria-label={`${lesson.title} のメニュー`}
                          ref={popoverRef}
                        >
                          <p className="popover-kicker">{unit.title}</p>
                          <h3>{lesson.title}</h3>
                          <p className="popover-meta">
                            {lesson.questions.length}問
                          </p>

                          {status === 'locked' ? (
                            <p className="popover-locked">
                              前のレッスンを完了しよう
                            </p>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary popover-start"
                              autoFocus
                              onClick={() => {
                                setOpenLessonId(null);
                                onStartLesson(lesson);
                              }}
                            >
                              {isCompleted ? 'もう一度' : 'はじめる'}
                            </button>
                          )}

                          <button
                            type="button"
                            className="popover-close"
                            aria-label="閉じる"
                            autoFocus={status === 'locked'}
                            onClick={() => setOpenLessonId(null)}
                          >
                            <CloseIcon size={18} />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {lesson.id === currentLesson?.id ? (
                      <div className="path-mascot">
                        <Mascot mood="happy" size={82} />
                        <p className="mascot-bubble">
                          ここから、いっしょに進もう！
                        </p>
                      </div>
                    ) : null}
                  </Fragment>
                );
              })}
            </div>
          </section>
        );
      })}

      {allComplete ? (
        <div className="course-complete">
          <Mascot mood="happy" size={110} />
          <div>
            <h2>ぜんぶのレッスンを完了しました！</h2>
            <p>復習の画面で、まちがえた問題をおさらいしよう。</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
