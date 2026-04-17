import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logout } from "@/app/actions";
import { isStudentEmailAllowed } from "@/lib/student-access";

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
  const email = session.user?.email ?? "";

  let accessDeniedMessage: string | null = null;

  if (selectedRole === "student") {
    try {
      const isAllowed = await isStudentEmailAllowed(email);

      if (!isAllowed) {
        accessDeniedMessage =
          "This Google account is either missing from sgs_local.student_master.student_email or the matching record is not active.";
      }
    } catch {
      accessDeniedMessage =
        "Google sign-in worked, but the student validation against your local Postgres database failed.";
    }
  }

  if (accessDeniedMessage) {
    return (
      <main className="dashboard-screen">
        <section className="dashboard-card">
          <p className="dashboard-kicker">Access Restricted</p>
          <h1>Student Access Not Allowed</h1>
          <p className="dashboard-copy">
            Signed in as <strong>{email}</strong> for the <strong>{roleLabel}</strong> role.
          </p>
          <p className="auth-error dashboard-error">{accessDeniedMessage}</p>

          <div className="dashboard-meta">
            <div>
              <span>Role</span>
              <strong>{roleLabel}</strong>
            </div>
            <div>
              <span>Validation</span>
              <strong>student_master.student_email</strong>
            </div>
          </div>

          <form action={logout}>
            <button type="submit" className="signout-button">
              Sign out
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-screen">
      <section className="dashboard-card">
        <p className="dashboard-kicker">Authenticated Successfully</p>
        <h1>Welcome, {session.user?.name ?? "User"}</h1>
        <p className="dashboard-copy">
          You signed in with <strong>{email}</strong> and selected the{" "}
          <strong>{roleLabel}</strong> role.
        </p>

        <div className="dashboard-meta">
          <div>
            <span>Role</span>
            <strong>{roleLabel}</strong>
          </div>
          <div>
            <span>Provider</span>
            <strong>Google OAuth</strong>
          </div>
        </div>

        <form action={logout}>
          <button type="submit" className="signout-button">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}

