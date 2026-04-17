import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { continueWithGoogle } from "@/app/actions";
import { GoogleIcon } from "@/components/google-icon";
import { RoleSelector } from "@/components/role-selector";

type HomeProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "AccessDenied") {
    return "Only verified @gmail.com accounts are allowed to sign in.";
  }

  return null;
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="screen">
      <section className="auth-shell">
        <div className="auth-backdrop" />
        <div className="auth-orb auth-orb-left" />
        <div className="auth-orb auth-orb-right" />

        <div className="auth-card-stack">
          <header className="auth-hero">
            <div className="brand-lockup" aria-label="SWAIS - SGS">
              <div className="brand-badge" aria-hidden="true">
                <svg viewBox="0 0 64 72" className="brand-badge-svg">
                  <path
                    d="M8 6h48v28c0 16-10.5 26.8-24 32C18.5 60.8 8 50 8 34V6Z"
                    fill="#ffcc1d"
                  />
                  <path
                    d="M12 10h40v24c0 13.2-8.5 22.2-20 26.7C20.5 56.2 12 47.2 12 34V10Z"
                    fill="#1f63c8"
                  />
                  <rect x="17" y="17" width="30" height="14" rx="2" fill="#ffffff" />
                  <rect x="17" y="35" width="30" height="4" rx="2" fill="#ffffff" />
                  <rect x="17" y="42" width="30" height="4" rx="2" fill="#35b34a" />
                  <text x="32" y="26.5" textAnchor="middle" className="brand-badge-text">
                    SWAIS
                  </text>
                </svg>
              </div>
              <div className="brand-copy">
                <strong>SWAIS - SGS</strong>
                <span>Shreeram Vidhyapeeth JV</span>
              </div>
            </div>

            <h1>
              <span className="auth-hero-line">Welcome to SWAIS - Shreeram</span>
              <span className="auth-hero-line">Vidhyapeeth JV</span>
            </h1>
            <p>Sign in with your Google account or create a new account to get started.</p>
          </header>

          <form action={continueWithGoogle} className="google-card">
            <input type="hidden" name="role" value="guest" />
            <button type="submit" className="google-button google-button-compact">
              <span className="google-mark" aria-hidden="true">
                <GoogleIcon />
              </span>
              <span>
                <strong>Continue with Google</strong>
                <small>Only Google accounts (@gmail.com) are allowed.</small>
              </span>
            </button>
          </form>

          <div className="divider" aria-hidden="true">
            <span />
            <em>OR</em>
            <span />
          </div>

          <section className="role-card">
            <div className="role-card-header">
              <h1>Create a New Account</h1>
              <p>Select your user type to continue with Google sign-up.</p>
            </div>

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            <RoleSelector action={continueWithGoogle} />
          </section>
        </div>
      </section>
    </main>
  );
}
