import { useEffect, useRef, useState, type ElementType, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Fades + slides an element into view the first time it enters the viewport.
 * Pure CSS/IntersectionObserver — no animation library dependency.
 *
 * Usage: <Reveal delay={80}><Card /></Reveal>
 * For lists, pass `index` and a shared `stagger` (ms) to auto-space delays.
 */
export function Reveal({
  as: Component = "div",
  className,
  delay = 0,
  index,
  stagger = 70,
  once = true,
  children,
  ...props
}: {
  as?: ElementType;
  delay?: number;
  index?: number;
  stagger?: number;
  once?: boolean;
} & HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const computedDelay = index !== undefined ? index * stagger : delay;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Component
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ transitionDelay: `${computedDelay}ms` }}
      {...props}
    >
      {children}
    </Component>
  );
}
