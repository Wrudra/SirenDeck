import { cn } from "cn";

export const BLOCKS_SITE_URL = "https://seliseblocks.com";

type BlocksBadgeProps = {
  /** Force artwork tone; omit to follow the OS color scheme. */
  tone?: "dark" | "light";
  className?: string;
};

/**
 * "Built on SELISE Blocks" attribution. Dual-tone <img> pair follows the OS
 * `prefers-color-scheme` so theme switches stay hydration-safe (no JS).
 * Wordmark SVGs from the Blocks scaffold (Ripple-Cloud).
 */
/* SirenDeck is light-only: the dark-artwork wordmark is the right default. */
export function BlocksBadge({ tone = "dark", className }: BlocksBadgeProps) {
  const imgClass = cn("h-auto w-[7rem] object-contain object-left", className);

  if (tone === "dark") {
    return <img src="/blocks-logo.svg" alt="SELISE Blocks" className={imgClass} />;
  }
  if (tone === "light") {
    return <img src="/blocks-logo-white.svg" alt="SELISE Blocks" className={imgClass} />;
  }

  return (
    <span className="relative inline-flex shrink-0 items-center">
      <img
        src="/blocks-logo.svg"
        alt=""
        aria-hidden="true"
        className={cn(imgClass, "dark:hidden")}
      />
      <img
        src="/blocks-logo-white.svg"
        alt="SELISE Blocks"
        className={cn(imgClass, "hidden dark:block")}
      />
    </span>
  );
}
