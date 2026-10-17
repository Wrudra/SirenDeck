import { BlocksAppShell } from "@/components/blocks-app-shell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BlocksAppShell>{children}</BlocksAppShell>;
}
