import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AssignmentsScreen } from "./assignments-screen";

export default async function AssignmentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <AssignmentsScreen />;
}
