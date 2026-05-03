import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CoreMaterialScreen } from "./core-material-screen";

export default async function CoreMaterialPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <CoreMaterialScreen />;
}
