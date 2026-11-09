export type UnitColor = 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'gold';

export type ChoiceQuestion = {
  type: 'choice';
  prompt: string;
  code?: string;
  explanation?: string;
  choices: string[];
  answer: string;
};

export type TrueFalseQuestion = {
  type: 'truefalse';
  prompt: string;
  code?: string;
  explanation?: string;
  answer: boolean;
};

export type OrderQuestion = {
  type: 'order';
  prompt: string;
  code?: string;
  explanation?: string;
  answer: string[];
  distractors?: string[];
};

export type MatchQuestion = {
  type: 'match';
  prompt: string;
  code?: string;
  explanation?: string;
  pairs: [string, string][];
};

export type Question = ChoiceQuestion | TrueFalseQuestion | OrderQuestion | MatchQuestion;

export type LessonIntroPoint = {
  term: string;
  text: string;
};

/** レッスンの最初に表示する導入カード。 */
export type LessonIntro = {
  summary: string;
  points: LessonIntroPoint[];
};

export type Lesson = {
  id: string;
  title: string;
  intro?: LessonIntro;
  questions: Question[];
};

export type Unit = {
  id: string;
  order: number;
  title: string;
  description?: string;
  color?: UnitColor;
  lessons: Lesson[];
};

export type LoadedQuestion = {
  id: string;
  lessonId: string;
  unitId: string;
  data: Question;
};

export type LoadedLesson = {
  id: string;
  title: string;
  unitId: string;
  intro?: LessonIntro;
  questions: LoadedQuestion[];
};

export type LoadedUnit = {
  id: string;
  order: number;
  title: string;
  description?: string;
  color: UnitColor;
  lessons: LoadedLesson[];
};

export type ContentWarning = {
  file: string;
  reason: string;
};

export type Content = {
  units: LoadedUnit[];
  warnings: ContentWarning[];
};

export type Progress = {
  version: 1;
  xp: number;
  completedLessonIds: string[];
  reviewQuestionIds: string[];
  streakCount: number;
  lastStudyDate: string | null;
  dailyXp: Record<string, number>;
};

export type LessonStatus = 'completed' | 'current' | 'locked';
