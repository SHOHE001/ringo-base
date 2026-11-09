import type {
  ChoiceQuestion,
  Content,
  ContentWarning,
  LoadedLesson,
  LoadedQuestion,
  LessonIntro,
  LoadedUnit,
  MatchQuestion,
  OrderQuestion,
  Question,
  TrueFalseQuestion,
  UnitColor,
} from '../lib/types';

type Parsed<T> = { ok: true; value: T } | { ok: false; reason: string };

const UNIT_COLORS: readonly UnitColor[] = [
  'green',
  'blue',
  'purple',
  'orange',
  'red',
  'gold',
];

function ok<T>(value: T): Parsed<T> {
  return { ok: true, value };
}

function fail(reason: string): Parsed<never> {
  return { ok: false, reason };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function toStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every(isNonEmptyString)) return null;
  return value;
}

function toPairArray(value: unknown): [string, string][] | null {
  if (!Array.isArray(value)) return null;
  const pairs: [string, string][] = [];
  for (const item of value) {
    if (!Array.isArray(item) || item.length !== 2) return null;
    const [left, right] = item;
    if (!isNonEmptyString(left) || !isNonEmptyString(right)) return null;
    pairs.push([left, right]);
  }
  return pairs;
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function intersects(a: readonly string[], b: readonly string[]): boolean {
  const set = new Set(a);
  return b.some((value) => set.has(value));
}

/** レッスン ID と問題文から決定的な問題 ID を作る（FNV-1a）。 */
export function createQuestionId(lessonId: string, prompt: string): string {
  const input = `${lessonId}\u0000${prompt}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function parseQuestion(raw: unknown): Parsed<Question> {
  if (!isRecord(raw)) return fail('問題がオブジェクトではありません');
  if (!isNonEmptyString(raw.prompt)) return fail('prompt がありません');
  if (raw.code !== undefined && typeof raw.code !== 'string') {
    return fail('code は文字列で指定してください');
  }
  if (raw.explanation !== undefined && typeof raw.explanation !== 'string') {
    return fail('explanation は文字列で指定してください');
  }

  const prompt = raw.prompt;
  const code = typeof raw.code === 'string' ? raw.code : undefined;
  const explanation =
    typeof raw.explanation === 'string' ? raw.explanation : undefined;

  switch (raw.type) {
    case 'choice': {
      const choices = toStringArray(raw.choices);
      if (!choices || choices.length < 2) {
        return fail('choices は2つ以上の文字列が必要です');
      }
      if (hasDuplicates(choices)) {
        return fail('choices が重複しています');
      }
      if (!isNonEmptyString(raw.answer) || !choices.includes(raw.answer)) {
        return fail('answer が choices の中にありません');
      }
      const value: ChoiceQuestion = {
        type: 'choice',
        prompt,
        choices,
        answer: raw.answer,
      };
      if (code !== undefined) value.code = code;
      if (explanation !== undefined) value.explanation = explanation;
      return ok(value);
    }
    case 'truefalse': {
      if (typeof raw.answer !== 'boolean') {
        return fail('truefalse の answer は true / false で指定してください');
      }
      const value: TrueFalseQuestion = {
        type: 'truefalse',
        prompt,
        answer: raw.answer,
      };
      if (code !== undefined) value.code = code;
      if (explanation !== undefined) value.explanation = explanation;
      return ok(value);
    }
    case 'order': {
      const answer = toStringArray(raw.answer);
      if (!answer || answer.length < 2) {
        return fail('order の answer は2つ以上の文字列が必要です');
      }
      if (hasDuplicates(answer)) {
        return fail('order の answer が重複しています');
      }
      let distractors: string[] | undefined;
      if (raw.distractors !== undefined) {
        const parsed = toStringArray(raw.distractors);
        if (!parsed) {
          return fail('distractors は文字列の配列で指定してください');
        }
        if (hasDuplicates(parsed) || intersects(answer, parsed)) {
          return fail('distractors が answer や自分自身と重複しています');
        }
        distractors = parsed;
      }
      const value: OrderQuestion = {
        type: 'order',
        prompt,
        answer,
      };
      if (code !== undefined) value.code = code;
      if (explanation !== undefined) value.explanation = explanation;
      if (distractors !== undefined) value.distractors = distractors;
      return ok(value);
    }
    case 'match': {
      const pairs = toPairArray(raw.pairs);
      if (!pairs || pairs.length < 2) {
        return fail('match の pairs は2組以上の文字列ペアが必要です');
      }
      const lefts = pairs.map(([left]) => left);
      const rights = pairs.map(([, right]) => right);
      if (hasDuplicates(lefts) || hasDuplicates(rights)) {
        return fail('match の pairs に重複した値があります');
      }
      const value: MatchQuestion = {
        type: 'match',
        prompt,
        pairs,
      };
      if (code !== undefined) value.code = code;
      if (explanation !== undefined) value.explanation = explanation;
      return ok(value);
    }
    default:
      return fail('type が choice / truefalse / order / match のいずれでもありません');
  }
}

export function parseLessonIntro(raw: unknown): Parsed<LessonIntro> {
  if (!isRecord(raw)) return fail('intro がオブジェクトではありません');
  if (!isNonEmptyString(raw.summary)) return fail('intro に summary がありません');
  if (!Array.isArray(raw.points) || raw.points.length === 0) {
    return fail('intro の points は1つ以上必要です');
  }
  const points: LessonIntro['points'] = [];
  for (const point of raw.points) {
    if (!isRecord(point) || !isNonEmptyString(point.term) || !isNonEmptyString(point.text)) {
      return fail('intro の points は term と text の文字列が必要です');
    }
    points.push({ term: point.term, text: point.text });
  }
  return ok({ summary: raw.summary, points });
}

function basename(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] ?? path;
}

function unwrapModule(module: unknown): unknown {
  if (isRecord(module) && 'default' in module) return module.default;
  return module;
}

/**
 * `src/content/units/*.json` を検証しながら読み込む。
 * 不正な問題・レッスン・ファイルは除外し、警告として返す（アプリは落とさない）。
 */
export function loadContent(): Content {
  const warnings: ContentWarning[] = [];
  const drafts: {
    unit: Omit<LoadedUnit, 'color'>;
    explicitColor?: UnitColor;
  }[] = [];

  const seenUnitIds = new Set<string>();
  const seenLessonIds = new Set<string>();
  const seenQuestionIds = new Set<string>();

  const modules = import.meta.glob('./units/*.json', {
    eager: true,
  }) as Record<string, unknown>;

  const entries = Object.entries(modules)
    .filter(([path]) => !basename(path).startsWith('_'))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [path, module] of entries) {
    const file = basename(path);
    const warn = (reason: string) => {
      warnings.push({ file, reason });
    };

    const rawUnit = unwrapModule(module);
    if (!isRecord(rawUnit)) {
      warn('JSON の内容がオブジェクトではありません');
      continue;
    }
    if (!isNonEmptyString(rawUnit.id)) {
      warn('id がありません');
      continue;
    }
    if (seenUnitIds.has(rawUnit.id)) {
      warn(`ユニット ID "${rawUnit.id}" が重複しています`);
      continue;
    }
    if (typeof rawUnit.order !== 'number' || !Number.isFinite(rawUnit.order)) {
      warn('order が数値ではありません');
      continue;
    }
    if (!isNonEmptyString(rawUnit.title)) {
      warn('title がありません');
      continue;
    }
    if (!Array.isArray(rawUnit.lessons)) {
      warn('lessons が配列ではありません');
      continue;
    }

    const unitId = rawUnit.id;
    const unitTitle = rawUnit.title;

    let explicitColor: UnitColor | undefined;
    if (rawUnit.color !== undefined) {
      if (
        typeof rawUnit.color === 'string' &&
        (UNIT_COLORS as readonly string[]).includes(rawUnit.color)
      ) {
        explicitColor = rawUnit.color as UnitColor;
      } else {
        warn(`color "${String(rawUnit.color)}" は無効なため既定色を使います`);
      }
    }

    const lessons: LoadedLesson[] = [];

    rawUnit.lessons.forEach((rawLesson, lessonIndex) => {
      if (!isRecord(rawLesson)) {
        warn(`lessons[${lessonIndex}] がオブジェクトではありません`);
        return;
      }
      if (!isNonEmptyString(rawLesson.id)) {
        warn(`lessons[${lessonIndex}] に id がありません`);
        return;
      }
      if (seenLessonIds.has(rawLesson.id)) {
        warn(`レッスン ID "${rawLesson.id}" が重複しています`);
        return;
      }
      if (!isNonEmptyString(rawLesson.title)) {
        warn(`レッスン "${rawLesson.id}" に title がありません`);
        return;
      }
      if (!Array.isArray(rawLesson.questions)) {
        warn(`レッスン "${rawLesson.id}" の questions が配列ではありません`);
        return;
      }

      const lessonId = rawLesson.id;
      const lessonTitle = rawLesson.title;

      let intro: LessonIntro | undefined;
      if (rawLesson.intro !== undefined) {
        const parsedIntro = parseLessonIntro(rawLesson.intro);
        if (parsedIntro.ok) {
          intro = parsedIntro.value;
        } else {
          warn(`レッスン "${lessonTitle}" の導入を表示しません（${parsedIntro.reason}）`);
        }
      }

      const questions: LoadedQuestion[] = [];

      rawLesson.questions.forEach((rawQuestion, questionIndex) => {
        const parsed = parseQuestion(rawQuestion);
        const prompt =
          isRecord(rawQuestion) && typeof rawQuestion.prompt === 'string'
            ? rawQuestion.prompt
            : '';
        const label =
          prompt.trim().length > 0
            ? `「${prompt.trim().slice(0, 24)}${prompt.trim().length > 24 ? '…' : ''}」`
            : `${questionIndex + 1}問目`;

        if (!parsed.ok) {
          warn(`レッスン "${lessonTitle}" の${label}を除外しました（${parsed.reason}）`);
          return;
        }

        const questionId = createQuestionId(lessonId, parsed.value.prompt);
        if (seenQuestionIds.has(questionId)) {
          warn(
            `レッスン "${lessonTitle}" の${label}を除外しました（問題 ID が重複しています）`,
          );
          return;
        }

        seenQuestionIds.add(questionId);
        questions.push({
          id: questionId,
          lessonId,
          unitId,
          data: parsed.value,
        });
      });

      if (questions.length === 0) {
        warn(`レッスン "${lessonId}" に有効な問題がありません`);
        return;
      }

      seenLessonIds.add(lessonId);
      lessons.push({
        id: lessonId,
        title: lessonTitle,
        unitId,
        ...(intro ? { intro } : {}),
        questions,
      });
    });

    if (lessons.length === 0) {
      warn('有効なレッスンがありません');
      continue;
    }

    seenUnitIds.add(unitId);
    drafts.push({
      unit: {
        id: unitId,
        order: rawUnit.order,
        title: unitTitle,
        description: isNonEmptyString(rawUnit.description)
          ? rawUnit.description
          : undefined,
        lessons,
      },
      explicitColor,
    });
  }

  drafts.sort(
    (a, b) =>
      a.unit.order - b.unit.order ||
      a.unit.title.localeCompare(b.unit.title, 'ja') ||
      a.unit.id.localeCompare(b.unit.id),
  );

  const units: LoadedUnit[] = drafts.map((draft, index) => ({
    ...draft.unit,
    color: draft.explicitColor ?? UNIT_COLORS[index % UNIT_COLORS.length],
  }));

  return { units, warnings };
}

export const content: Content = loadContent();
