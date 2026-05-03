import React from "react";
import { logout } from "@/app/actions";
import { AvatarIllustration, BellIcon, LogoutIcon } from "@/components/dashboard/icons";

type DashboardHeaderProps = {
  name: string;
  role: string;
  admissionNo?: string | null;
  section?: string | null;
  rollNo?: string | null;
  className?: string | null;
};

export function DashboardHeader({
  name,
  role,
  admissionNo,
  section,
  rollNo,
  className,
}: DashboardHeaderProps) {
  const metaItems = [
    admissionNo ? { label: "Admission No", value: admissionNo } : { label: "Role", value: role },
    className ? { label: "Class", value: className } : null,
    section ? { label: "Section", value: section } : null,
    rollNo ? { label: "Roll No", value: rollNo } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <header className="dashboard-header">
      <div className="header-profile">
        <div className="header-avatar">
          <AvatarIllustration className="avatar-icon" />
        </div>
        <div className="header-info">
          <div className="header-welcome">Welcome back,</div>
          <div className="header-name">{name}</div>
          <div className="header-meta">
            {metaItems.map((item) => (
              <span key={item.label} className="header-role">
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button type="button" className="header-bell" aria-label="Notifications">
          <BellIcon className="header-bell-icon" />
          <span className="header-badge">3</span>
        </button>

        <form action={logout}>
          <button type="submit" className="header-logout-btn">
            <LogoutIcon className="header-logout-icon" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}
