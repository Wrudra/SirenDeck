import Link from "next/link";

import { cn } from "cn";

import { BLOCKS_SITE_URL, BlocksBadge } from "@/components/brand/blocks-badge";

type BuiltOnBlocksProps = {
  className?: string;
};

/**
 * "Built on" caption above the Blocks wordmark, linking to the Blocks site.
 * Mirrors the Blocks scaffold's attribution (credit variant).
 */
export function BuiltOnBlocks({ className }: BuiltOnBlocksProps) {
  return (
    <Link
      href={BLOCKS_SITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Built on SELISE Blocks"
      className={cn(
        "group inline-flex flex-col items-start gap-1.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <span className="text-[11px] font-medium tracking-wide text-ink-muted transition-colors duration-150 group-hover:text-ink">
        Built on
      </span>
      <BlocksBadge className="transition-opacity duration-150 group-hover:opacity-95" />
    </Link>
  );
}
