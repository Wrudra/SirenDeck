import { notFound } from "next/navigation";

import { MoneyMap } from "@/components/money-map/money-map";
import { MAP_FIXTURES, type MapFixtureName } from "@/lib/map/fixtures";

/**
 * Dev-only board of fixed Money Map cases for browser tests.
 * Production requests 404. Not linked from the app.
 */
export default async function MapLabPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { scenario } = await searchParams;
  if (!scenario || !(scenario in MAP_FIXTURES)) notFound();
  const fixture = MAP_FIXTURES[scenario as MapFixtureName];

  return (
    <div className="flex h-dvh flex-col" data-map-lab={scenario}>
      <MoneyMap items={fixture.items} categories={fixture.categories} />
    </div>
  );
}
