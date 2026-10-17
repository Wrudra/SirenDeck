import { cn } from "cn";

/**
 * Three-tile mark. Dark on transparent, so dark surfaces invert it.
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
      className={cn("h-10 w-10", onDark && "invert", className)}
    />
  );
}
