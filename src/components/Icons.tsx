type IconProps = {
  className?: string;
  size?: number;
};

function iconProps({ className, size = 24 }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    className,
    'aria-hidden': true,
    focusable: 'false' as const,
  };
}

export function LearnIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} fill="none" stroke="currentColor" strokeWidth="2.2">
      <path
        d="M3.5 5.2C6 3.8 9.2 3.8 12 5.4v13.4c-2.8-1.6-6-1.6-8.5-.2V5.2Z"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 5.2C18 3.8 14.8 3.8 12 5.4v13.4c2.8-1.6 6-1.6 8.5-.2V5.2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReviewIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M20 11a8 8 0 0 0-14.2-4.6L4 8.2" strokeLinecap="round" />
      <path d="M4 4.5v3.7h3.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 13a8 8 0 0 0 14.2 4.6L20 15.8" strokeLinecap="round" />
      <path d="M20 19.5v-3.7h-3.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RecordIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M4 20V9" strokeLinecap="round" />
      <path d="M10 20V4" strokeLinecap="round" />
      <path d="M16 20v-7" strokeLinecap="round" />
      <path d="M22 20H2" strokeLinecap="round" />
    </svg>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} fill="none">
      <path
        d="M12.6 2.4c.5 3 2.1 4.3 3.6 5.9 1.6 1.7 2.8 3.4 2.8 5.9a7 7 0 1 1-14 0c0-2.1.8-3.8 2.1-5.2.4 1 1 1.7 1.8 2.1.2-3.2.8-6.2 3.7-8.7Z"
        fill="currentColor"
      />
      <path
        d="M12 12.2c.3 1.6 1.2 2.3 1.9 3.1.5.6.8 1.1.8 1.9a2.7 2.7 0 1 1-5.4 0c0-1.1.4-1.9 1.1-2.6.2.5.5.9.9 1.1.1-1.3.3-2.5.7-3.5Z"
        fill="#FFFFFF"
        opacity="0.85"
      />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} fill="none">
      <path
        d="M13.5 2 4.8 13.1c-.4.5 0 1.2.6 1.2h5.2l-1 7.7 8.7-11.1c.4-.5 0-1.2-.6-1.2h-5.2l1-7.7Z"
        fill="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" strokeLinecap="round" />
      <path d="M12 14.6v2.1" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} fill="none" stroke="currentColor" strokeWidth="3">
      <path d="m5 12.5 4.6 4.6L19 6.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} fill="none">
      <path
        d="m12 3 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.3l6-.8L12 3Z"
        fill="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.1 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
