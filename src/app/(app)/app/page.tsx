import { requireUser } from "@/lib/supabase/require-user";

export default async function AppPage() {
  await requireUser();
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-ink-muted">
        The Money Map arrives in Phase 4.
      </p>
    </div>
  );
}
