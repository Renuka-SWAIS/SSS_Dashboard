import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AssessmentsScreen } from "./assessments-screen";

export default async function AssessmentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <AssessmentsScreen />;
}
