import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

/** Maps a kebab-case icon name stored in the database to a Lucide component. */
function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const registry = LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>;
  const Icon = registry[toPascalCase(name)] ?? LucideIcons.PiggyBank;
  return <Icon aria-hidden="true" {...props} />;
}
