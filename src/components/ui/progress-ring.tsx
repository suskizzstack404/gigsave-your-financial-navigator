import { cn } from "@/lib/utils";
import { clampPercent } from "@/utils/format";

const TONE_STOPS: Record<string, [string, string]> = {
  violet: ["var(--brand-violet)", "var(--brand-purple)"],
  purple: ["var(--brand-purple)", "var(--brand-pink)"],
  pink: ["var(--brand-pink)", "var(--brand-violet)"],
  sky: ["var(--brand-sky)", "var(--brand-violet)"],
  amber: ["var(--brand-amber)", "var(--brand-pink)"],
  teal: ["var(--brand-teal)", "var(--brand-sky)"],
  lime: ["var(--lime-500)", "var(--lime-600)"],
};

interface ProgressRingProps {
  value: number;
  size?: number;
  thickness?: number;
  tone?: string;
  className?: string;
  children?: React.ReactNode;
  label?: string;
}

/** Animated circular progress indicator built on the design-system tones. */
export function ProgressRing({
  value,
  size = 84,
  thickness = 8,
  tone = "lime",
  className,
  children,
  label,
}: ProgressRingProps) {
  const percent = clampPercent(value);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const [from, to] = TONE_STOPS[tone] ?? TONE_STOPS.lime;
  const gradientId = `ring-${tone}`;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="img"
      aria-label={label ?? `${Math.round(percent)} percent complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
