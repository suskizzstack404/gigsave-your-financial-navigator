import { cn } from "@/lib/utils";

/**
 * GigSave's AI orb — a layered radial-gradient sphere with a soft lime glow.
 * Pure CSS/SVG, no external image, so it never fails to load and stays
 * crisp at any size. `active` makes the inner swirl move faster (while the
 * assistant is thinking) instead of idling.
 */
export function AiOrb({
  size = 84,
  active = false,
  className,
}: {
  size?: number;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="GigSave AI"
    >
      {/* outer glow */}
      <div
        className="absolute -inset-3 rounded-full bg-lime-400/40 blur-xl animate-orb-pulse"
        style={{ animationDuration: active ? "1.6s" : "4s" }}
      />
      {/* body */}
      <div
        className="absolute inset-0 rounded-full animate-orb-pulse"
        style={{
          animationDuration: active ? "1.6s" : "4s",
          background:
            "radial-gradient(circle at 32% 28%, #eaffb0 0%, #a3e635 32%, #4d7c0f 78%, #14532d 100%)",
          boxShadow: "0 8px 28px -6px rgba(77,124,15,0.55), inset 0 -6px 14px rgba(0,0,0,0.25)",
        }}
      />
      {/* swirling inner highlight */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full mix-blend-soft-light animate-orb-spin"
        style={{ animationDuration: active ? "6s" : "16s" }}
      >
        <div
          className="absolute inset-[-40%]"
          style={{
            background:
              "conic-gradient(from 90deg, transparent 0%, rgba(255,255,255,0.55) 18%, transparent 38%, transparent 60%, rgba(255,255,255,0.35) 78%, transparent 100%)",
          }}
        />
      </div>
      {/* glass highlight */}
      <div
        className="absolute left-[18%] top-[14%] h-[30%] w-[38%] rounded-full bg-white/60 blur-[3px]"
        aria-hidden="true"
      />
    </div>
  );
}
