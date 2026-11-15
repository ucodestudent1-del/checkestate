import DashboardLayout from "@/components/DashboardLayout";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardRoute({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}