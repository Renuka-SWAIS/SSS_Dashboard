import React from "react";
import Link from "next/link";
import { logout } from "@/app/actions";
import {
  BookIcon,
  ChartIcon,
  ClipboardIcon,
  HelpIcon,
  HomeIcon,
  LogoMark,
  LogoutIcon,
  MailIcon,
  NotesIcon,
  SettingsIcon,
  TargetIcon,
} from "@/components/dashboard/icons";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/dashboard/core-material", label: "Core Material", icon: BookIcon },
  { href: "/dashboard/assignments", label: "Assignments", icon: ClipboardIcon },
  { href: "/dashboard/assessments", label: "Assessments", icon: TargetIcon },
  { href: "#", label: "My Notes", icon: NotesIcon },
  { href: "#", label: "My Progress", icon: ChartIcon },
  { href: "#", label: "Messages", icon: MailIcon },
  { href: "#", label: "Settings", icon: SettingsIcon },
  { href: "#", label: "Help & Support", icon: HelpIcon },
];

type DashboardSidebarProps = {
  activeItem?: string;
};

export function DashboardSidebar({ activeItem = "Dashboard" }: DashboardSidebarProps) {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <LogoMark className="logo-icon" />
          <div>
            <div className="sidebar-title">SWAIS</div>
            <div className="sidebar-sub">Shreeram Vidhyapeeth JV</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <Link href={item.href} className={item.label === activeItem ? "active" : undefined}>
                  <Icon className="sidebar-link-icon" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-logout">
        <form action={logout}>
          <button type="submit" className="sidebar-logout-link">
            <LogoutIcon className="sidebar-link-icon" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
