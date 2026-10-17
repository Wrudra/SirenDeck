import { cn } from "cn";

/**
 * Three-tile mark, dark artwork on transparent. Theme-aware via CSS: the
 * dark theme inverts it so the mark reads on #111114 surfaces.
 */
export function Logo({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <img
      src="/sirendeck-mark.png"
      alt="SirenDeck"
      width={754}
      height={754}
      className={cn(
        "h-10 w-10 dark:invert",
        onDark && "invert dark:invert-0",
        className,
      )}
    />
  );
}
