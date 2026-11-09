import { useLayoutEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { appName, dailyGoalXp, reviewSessionSize } from './config';
import { content } from './content/loader';
import { useProgress } from './hooks/useProgress';
import { toDateKey } from './lib/date';
import { countReviewable, pickReviewQuestions } from './lib/stats';
import { displayStreak } from './lib/streak';
import type { LoadedLesson } from './lib/types';
import {
  LearnIcon,
  RecordIcon,
  ReviewIcon,
} from './components/Icons';
import { Mascot } from './components/Mascot';
import { StatChip, StatsList } from './components/Stats';
import { LearnScreen } from './screens/LearnScreen';
import { LessonScreen } from './screens/LessonScreen';
import { RecordScreen } from './screens/RecordScreen';
import { ReviewScreen } from './screens/ReviewScreen';

type View = 'learn' | 'review' | 'record';

type NavItem = {
  id: View;
  label: string;
  Icon: ComponentType<{ className?: string; size?: number }>;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'learn', label: '学ぶ', Icon: LearnIcon },
  { id: 'review', label: '復習', Icon: ReviewIcon },
  { id: 'record', label: '記録', Icon: RecordIcon },
];

type Session = { mode: 'lesson' | 'review'; lesson: LoadedLesson };

export default function App() {
  const [view, setView] = useState<View>('learn');
  const [session, setSession] = useState<Session | null>(null);
  const { progress, actions } = useProgress();
  const savedScrollYRef = useRef<number | null>(null);

  const openSession = (next: Session) => {
    savedScrollYRef.current = window.scrollY;
    setSession(next);
  };

  // レッスン終了後に学習マップへ戻ったら、開始前のスクロール位置を復元する
  useLayoutEffect(() => {
    if (session !== null) return;
    const y = savedScrollYRef.current;
    if (y === null) return;
    savedScrollYRef.current = null;
    window.scrollTo(0, y);
  }, [session]);

  const today = toDateKey(new Date());
  const todayXp = progress.dailyXp[today] ?? 0;
  const streak = displayStreak(
    progress.streakCount,
    progress.lastStudyDate,
    today,
  );
  const goal = Math.max(1, dailyGoalXp);
  const goalPct = Math.min(100, Math.round((todayXp / goal) * 100));

  const reviewableCount = countReviewable(
    content.units,
    progress.reviewQuestionIds,
  );

  const startReview = () => {
    const questions = pickReviewQuestions(
      content.units,
      progress.reviewQuestionIds,
      reviewSessionSize,
    );
    if (questions.length === 0) return;
    openSession({
      mode: 'review',
      lesson: {
        id: 'review-session',
        title: '復習',
        unitId: '',
        questions,
      },
    });
  };

  if (session) {
    const { mode, lesson } = session;
    return (
      <LessonScreen
        key={`${mode}:${lesson.id}`}
        lesson={lesson}
        mode={mode}
        isReplay={
          mode === 'lesson' && progress.completedLessonIds.includes(lesson.id)
        }
        onWrongQuestion={(questionId) =>
          actions.addReviewQuestions([questionId])
        }
        onCorrectQuestion={actions.removeReviewQuestion}
        onComplete={({ xp }) => {
          actions.awardXp(xp);
          if (mode === 'lesson') actions.completeLesson(lesson.id);
        }}
        onExit={() => setSession(null)}
      />
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Mascot mood="happy" size={46} />
          <span className="brand-name">{appName}</span>
        </div>

        <nav className="sidebar-nav" aria-label="メインナビゲーション">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-button${view === id ? ' is-active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => setView(id)}
            >
              <Icon size={28} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="main-column">
        <header className="top-stats">
          <div className="top-stats-group">
            <StatChip kind="streak" value={streak} />
            <StatChip kind="xp" value={progress.xp} />
          </div>
        </header>

        <main className="content">
          {view === 'learn' ? (
            <LearnScreen
              content={content}
              completedLessonIds={progress.completedLessonIds}
              onStartLesson={(lesson) => openSession({ mode: 'lesson', lesson })}
            />
          ) : null}
          {view === 'review' ? (
            <ReviewScreen count={reviewableCount} onStart={startReview} />
          ) : null}
          {view === 'record' ? (
            <RecordScreen
              content={content}
              progress={progress}
              streak={streak}
              today={today}
              onReset={actions.resetProgress}
            />
          ) : null}
        </main>
      </div>

      <aside className="right-panel" aria-label="統計と今日の目標">
        <section className="panel-card goal-card" aria-labelledby="goal-title">
          <div className="goal-head">
            <h2 id="goal-title">今日の目標</h2>
            <span className="goal-badge">{goalPct}%</span>
          </div>
          <p className="goal-xp">
            <strong>{todayXp}</strong>
            <span> / {goal} XP</span>
          </p>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="今日の目標 XP"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={Math.min(todayXp, goal)}
          >
            <div className="progress-fill" style={{ width: `${goalPct}%` }} />
          </div>
          <p className="goal-note">
            {todayXp >= goal
              ? '今日の目標を達成しました！'
              : `あと ${goal - todayXp} XP で達成です。`}
          </p>
        </section>

        <section className="panel-card" aria-labelledby="stats-title">
          <h2 id="stats-title">いまの記録</h2>
          <StatsList streak={streak} xp={progress.xp} />
        </section>
      </aside>

      <nav className="tabbar" aria-label="画面切り替え">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`tab-button${view === id ? ' is-active' : ''}`}
            aria-current={view === id ? 'page' : undefined}
            onClick={() => setView(id)}
          >
            <span className="tab-icon-wrap">
              <Icon size={24} />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
