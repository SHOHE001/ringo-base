import type { ComponentType } from 'react';
import { BoltIcon, FlameIcon, HeartIcon } from './Icons';

export type StatKind = 'streak' | 'xp' | 'hearts';

type StatMeta = {
  label: string;
  suffix: string;
  Icon: ComponentType<{ className?: string; size?: number }>;
};

const META: Record<StatKind, StatMeta> = {
  streak: { label: '連続日数', suffix: '日', Icon: FlameIcon },
  xp: { label: '合計 XP', suffix: 'XP', Icon: BoltIcon },
  hearts: { label: 'ハート', suffix: '', Icon: HeartIcon },
};

type StatChipProps = {
  kind: StatKind;
  value: number;
};

export function StatChip({ kind, value }: StatChipProps) {
  const meta = META[kind];
  return (
    <span className={`stat-chip stat-chip--${kind}`}>
      <meta.Icon className="stat-chip-icon" size={21} />
      <span className="stat-chip-value">{value}</span>
      <span className="sr-only">
        {meta.label} {value}
        {meta.suffix}
      </span>
    </span>
  );
}

type StatsListProps = {
  streak: number;
  xp: number;
  hearts: number;
};

export function StatsList({ streak, xp, hearts }: StatsListProps) {
  const values: Record<StatKind, number> = { streak, xp, hearts };
  const kinds: StatKind[] = ['streak', 'xp', 'hearts'];

  return (
    <ul className="stats-list">
      {kinds.map((kind) => {
        const meta = META[kind];
        return (
          <li key={kind}>
            <span className={`stat-badge stat-badge--${kind}`}>
              <meta.Icon size={20} />
            </span>
            <span className="stat-label">{meta.label}</span>
            <span className="stat-value">
              {values[kind]}
              {meta.suffix ? <span className="stat-suffix">{meta.suffix}</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
