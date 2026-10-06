import { BlocksAppShell } from "@/components/blocks-app-shell";
import { TopBar } from "@/components/shell/top-bar";
import { Toaster } from "@/components/ui/sonner";
import { getAuthProviderPreference } from "@/lib/blocks/config";
import { requireUser } from "@/lib/supabase/require-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (getAuthProviderPreference() === "blocks") {
    return <BlocksAppShell>{children}</BlocksAppShell>;
  }

  const { user } = await requireUser();
  const email = user.email ?? "account";

  return (
    <div className="flex h-dvh flex-col">
      <TopBar email={email} />
      <main id="main-content" className="flex flex-1 flex-col overflow-hidden">{children}</main>
      <Toaster position="bottom-right" />
    </div>
  );
}
