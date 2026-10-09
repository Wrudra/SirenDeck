import { cn } from "cn";

/**
 * Full lockup: tile mark plus wordmark. The file is dark on transparent,
 * so dark surfaces invert it.
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
      src="/sirendeck-logo.png"
      alt="SirenDeck"
      width={520}
      height={130}
      className={cn("h-7 w-auto", onDark && "invert", className)}
    />
  );
}
