import { useState } from 'react';
import { Modal } from '../components/Modal';
import { NotificationSettings } from '../components/NotificationSettings';
import { ThemeSettings } from '../components/ThemeSettings';
import { formatShortDate } from '../lib/date';
import { recentDailyXp, unitProgressList } from '../lib/stats';
import type { Content, Progress } from '../lib/types';

type RecordScreenProps = {
  content: Content;
  progress: Progress;
  streak: number;
  today: string;
  onReset: () => void;
};

export function RecordScreen({
  content,
  progress,
  streak,
  today,
  onReset,
}: RecordScreenProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const days = recentDailyXp(progress.dailyXp, today, 7);
  const maxXp = Math.max(1, ...days.map((day) => day.xp));
  const units = unitProgressList(content.units, progress.completedLessonIds);
  const totalLessons = units.reduce((sum, unit) => sum + unit.total, 0);
  const doneLessons = units.reduce((sum, unit) => sum + unit.done, 0);

  return (
    <div className="record-screen">
      <h1 className="record-title">記録</h1>

      <div className="record-summary">
        <div className="summary-card summary-card--xp">
          <span className="summary-label">合計 XP</span>
          <strong>{progress.xp}</strong>
        </div>
        <div className="summary-card summary-card--streak">
          <span className="summary-label">連続日数</span>
          <strong>
            {streak}
            <small>日</small>
          </strong>
        </div>
        <div className="summary-card summary-card--lessons">
          <span className="summary-label">完了レッスン</span>
          <strong>
            {doneLessons}
            <small> / {totalLessons}</small>
          </strong>
        </div>
      </div>

      <section className="record-section" aria-labelledby="week-title">
        <h2 id="week-title">直近 7 日の XP</h2>
        <ul className="bar-chart">
          {days.map((day) => (
            <li key={day.date} className="bar-item">
              <span className="bar-value" aria-hidden="true">
                {day.xp}
              </span>
              <span className="bar-track" aria-hidden="true">
                <span
                  className="bar-fill"
                  style={{ height: `${Math.round((day.xp / maxXp) * 100)}%` }}
                />
              </span>
              <span className="bar-label" aria-hidden="true">
                {day.date === today ? '今日' : formatShortDate(day.date)}
              </span>
              <span className="sr-only">
                {formatShortDate(day.date)} {day.xp} XP
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="record-section" aria-labelledby="units-title">
        <h2 id="units-title">ユニット別の進捗</h2>
        {units.length === 0 ? (
          <p className="record-empty">ユニットがありません。</p>
        ) : (
          <ul className="unit-progress-list">
            {units.map((unit) => {
              const pct = unit.total > 0 ? Math.round((unit.done / unit.total) * 100) : 0;
              return (
                <li key={unit.unitId}>
                  <div className="unit-progress-head">
                    <span>{unit.title}</span>
                    <span>
                      {unit.done} / {unit.total}
                    </span>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label={`${unit.title} の進捗`}
                    aria-valuemin={0}
                    aria-valuemax={unit.total}
                    aria-valuenow={unit.done}
                  >
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ThemeSettings />

      <NotificationSettings />

      <button
        type="button"
        className="btn btn-danger-ghost reset-button"
        onClick={() => setConfirmReset(true)}
      >
        進捗をリセット
      </button>

      {confirmReset ? (
        <Modal labelledBy="reset-modal-title" onEscape={() => setConfirmReset(false)}>
          <h2 id="reset-modal-title" className="modal-title">
            進捗をリセットしますか？
          </h2>
          <p className="modal-text">
            XP、連続日数、完了したレッスン、復習リストがすべて消えます。元に戻せません。
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => setConfirmReset(false)}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="btn btn-danger-ghost btn-block"
              onClick={() => {
                setConfirmReset(false);
                onReset();
              }}
            >
              リセットする
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
