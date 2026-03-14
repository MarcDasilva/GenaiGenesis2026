import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="dark min-h-screen text-foreground">
      <DashboardContent />
    </div>
  );
}
