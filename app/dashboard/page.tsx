import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getStudentAccessRecord } from "@/lib/student-access";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardMainCards } from "@/components/dashboard/main-cards";
import { DashboardProgressOverview } from "@/components/dashboard/progress-overview";

type DashboardPageProps = {
  searchParams: Promise<{
    role?: string;
  }>;
};

function formatRole(role?: string) {
  if (!role) {
    return "Guest";
  }

  return role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const roleLabel = formatRole(params.role);
  const selectedRole = params.role?.toLowerCase();
  const email = session.user.email ?? "";

  let studentRecord = null;

  if (selectedRole === "student") {
    try {
      studentRecord = await getStudentAccessRecord(email);

      if (!studentRecord || studentRecord.isActive !== true) {
        await signOut({
          redirectTo: "/?error=StudentAccessDenied",
        });
      }
    } catch {
      await signOut({
        redirectTo: "/?error=StudentValidationFailed",
      });
    }
  }

  const displayRole = selectedRole === "student" ? "Student" : roleLabel;
  const displayName = "Aarav Sharma";
  const displayAdmissionNo = "ADM001";
  const displayClassName = "9";
  const displayRollNo = "25";
  const displaySection = "B";

  return (
    <div className="dashboard-shell">
      <DashboardSidebar activeItem="Dashboard" />

      <main className="dashboard-main-content">
        <div className="dashboard-main-wrap">
          <DashboardHeader
            name={displayName}
            role={displayRole}
            admissionNo={displayAdmissionNo}
            className={displayClassName}
            section={displaySection}
            rollNo={displayRollNo}
          />

          <section className="dashboard-hero">
            <div className="dashboard-hero-decor dashboard-hero-decor-book" aria-hidden="true">
              📖
            </div>
            <div
              className="dashboard-hero-decor dashboard-hero-decor-microscope"
              aria-hidden="true"
            >
              🔬
            </div>
            <div className="dashboard-hero-decor dashboard-hero-decor-brain" aria-hidden="true">
              🧠
            </div>
            <div className="dashboard-hero-stars" aria-hidden="true">
              ✦ ✧ ✦ ✧ ✦
            </div>

            <h1 className="dashboard-hero-title">
              Welcome back, {displayName}! <span aria-hidden="true">👋</span>
            </h1>
            <p className="dashboard-hero-copy">Choose what you want to study today.</p>

            <DashboardMainCards />
          </section>

          <section className="dashboard-progress-block">
            <DashboardProgressOverview />
          </section>
        </div>
      </main>
    </div>
  );
}
