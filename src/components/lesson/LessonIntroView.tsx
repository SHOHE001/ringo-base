import { useEffect } from 'react';
import type { LessonIntro } from '../../lib/types';
import { CloseIcon } from '../Icons';
import { Mascot } from '../Mascot';

type LessonIntroViewProps = {
  title: string;
  intro: LessonIntro;
  onStart: () => void;
  onExit: () => void;
};

export function LessonIntroView({
  title,
  intro,
  onStart,
  onExit,
}: LessonIntroViewProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [onExit]);

  return (
    <div className="lesson-screen">
      <header className="lesson-topbar">
        <button
          type="button"
          className="icon-button"
          aria-label="レッスンを閉じる"
          onClick={onExit}
        >
          <CloseIcon size={22} />
        </button>
      </header>

      <main className="lesson-body lesson-intro">
        <div className="lesson-intro-head">
          <Mascot mood="happy" size={72} />
          <div>
            <p className="lesson-intro-eyebrow">このレッスンでやること</p>
            <h1 className="lesson-intro-title">{title}</h1>
          </div>
        </div>

        <p className="lesson-intro-summary">{intro.summary}</p>

        <ul className="lesson-intro-points">
          {intro.points.map((point) => (
            <li key={point.term} className="lesson-intro-point">
              <strong>{point.term}</strong>
              <p>{point.text}</p>
            </li>
          ))}
        </ul>
      </main>

      <footer className="lesson-footer">
        <div className="lesson-footer-inner">
          <button
            type="button"
            className="btn btn-primary btn-block"
            autoFocus
            onClick={onStart}
          >
            はじめる
          </button>
        </div>
      </footer>
    </div>
  );
}
