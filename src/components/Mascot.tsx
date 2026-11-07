import { mascotName } from '../config';

export type MascotMood = 'normal' | 'happy' | 'sad';

type MascotProps = {
  mood?: MascotMood;
  size?: number;
  className?: string;
  title?: string;
};

const PINS = [
  { x1: 46, y1: 7, x2: 46, y2: 24 },
  { x1: 74, y1: 7, x2: 74, y2: 24 },
  { x1: 46, y1: 98, x2: 46, y2: 113 },
  { x1: 74, y1: 98, x2: 74, y2: 113 },
  { x1: 7, y1: 46, x2: 20, y2: 46 },
  { x1: 7, y1: 74, x2: 20, y2: 74 },
  { x1: 100, y1: 46, x2: 113, y2: 46 },
  { x1: 100, y1: 74, x2: 113, y2: 74 },
];

/**
 * ピンの生えた丸いマイクロチップのキャラクター「チップ」。
 * すべてインライン SVG のオリジナル。
 */
export function Mascot({
  mood = 'normal',
  size = 96,
  className,
  title,
}: MascotProps) {
  const label = title ?? `${mascotName}（${mood === 'happy' ? 'よろこび' : mood === 'sad' ? 'かなしみ' : 'ふつう'}）`;

  return (
    <svg
      className={`mascot mascot--${mood}${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={label}
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth="7" strokeLinecap="round">
        {PINS.map((pin) => (
          <line key={`${pin.x1}-${pin.y1}`} {...pin} />
        ))}
      </g>

      <circle cx="60" cy="60" r="43" fill="#3FBF96" />
      <circle cx="60" cy="60" r="39" fill="#8FE8C9" />
      <circle cx="60" cy="61" r="30" fill="#F2FFFA" />

      <ellipse
        cx="44"
        cy="43"
        rx="9"
        ry="5"
        fill="#FFFFFF"
        opacity="0.5"
        transform="rotate(-28 44 43)"
      />

      {mood === 'happy' ? (
        <>
          <path
            d="M43.5 58.5c1.9-4.5 8.6-4.5 10.5 0"
            fill="none"
            stroke="#35505A"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <path
            d="M66 58.5c1.9-4.5 8.6-4.5 10.5 0"
            fill="none"
            stroke="#35505A"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <path
            d="M51 70c0 8.4 18 8.4 18 0Z"
            fill="#35505A"
            stroke="none"
          />
          <ellipse cx="60" cy="76.5" rx="5.2" ry="2.8" fill="#FF8FA3" />
        </>
      ) : (
        <>
          <ellipse cx="49" cy="58" rx="4.2" ry="5.8" fill="#35505A" />
          <ellipse cx="71" cy="58" rx="4.2" ry="5.8" fill="#35505A" />
          <circle cx="50.6" cy="55.8" r="1.3" fill="#FFFFFF" />
          <circle cx="72.6" cy="55.8" r="1.3" fill="#FFFFFF" />
          {mood === 'sad' ? (
            <path
              d="M53 78c2.4-4.2 11.6-4.2 14 0"
              fill="none"
              stroke="#35505A"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M54 72c1.9 3.1 10.1 3.1 12 0"
              fill="none"
              stroke="#35505A"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          )}
        </>
      )}

      <circle cx="39.5" cy="69" r="3.6" fill="#FFB7C5" opacity="0.9" />
      <circle cx="80.5" cy="69" r="3.6" fill="#FFB7C5" opacity="0.9" />
    </svg>
  );
}
