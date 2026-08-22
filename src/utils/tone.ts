/** Runtime-safe tone styling for jar/goal colours stored in the database. */
export function toneStyle(tone: string) {
  return {
    backgroundColor: `color-mix(in oklab, var(--brand-${tone}) 18%, transparent)`,
    color: `var(--brand-${tone})`,
  } satisfies React.CSSProperties;
}

export function toneAccent(tone: string) {
  return { color: `var(--brand-${tone})` } satisfies React.CSSProperties;
}
