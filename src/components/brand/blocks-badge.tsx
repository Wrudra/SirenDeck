import { cn } from "cn";

export const BLOCKS_SITE_URL = "https://seliseblocks.com";

type BlocksBadgeProps = {
  /**
   * "dark" = dark artwork (for light surfaces), "light" = white artwork
   * (for dark surfaces), "auto" = follow the app theme via CSS.
   */
  tone?: "dark" | "light" | "auto";
  className?: string;
};

/**
 * "Built on SELISE Blocks" attribution. Both wordmarks render and CSS picks
 * per theme, so SSR markup always matches hydration. Wordmark SVGs from the
 * Blocks scaffold (Ripple-Cloud).
 */
export function BlocksBadge({ tone = "auto", className }: BlocksBadgeProps) {
  const imgClass = cn("h-auto w-[7rem] object-contain object-left", className);

  if (tone === "light") {
    return (
      <img src="/blocks-logo-white.svg" alt="SELISE Blocks" className={imgClass} />
    );
  }
  if (tone === "dark") {
    return <img src="/blocks-logo.svg" alt="SELISE Blocks" className={imgClass} />;
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