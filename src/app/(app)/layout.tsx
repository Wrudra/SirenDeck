import { TopBar } from "@/components/shell/top-bar";

import { requireUser } from "@/lib/supabase/require-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();
  const email = user.email ?? "account";

  return (
    <div className="flex h-dvh flex-col">
      <TopBar email={email} />
      <main id="main-content" className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
