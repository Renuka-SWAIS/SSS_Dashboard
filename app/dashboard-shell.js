"use client";

import { usePathname } from "next/navigation";

const navItems = [
  ["home", "Dashboard", "/"],
  ["book-open", "Core Study", "/chapters"],
  ["clipboard", "Assignments", "/assignments"],
  ["target", "Assessments", "/assessments"],
  ["chart", "My Progress", "/progress"]
];

const settingsItems = [
  ["settings", "Settings", "/settings"],
  ["help", "Help & Support", "/help"]
];

function Icon({ name, className = "" }) {
  return <span className={`icon ${name} ${className}`} aria-hidden="true" />;
}



function Avatar() {
  return (
    <div className="avatar" aria-hidden="true">
      <svg viewBox="0 0 120 120" role="img">
        <circle cx="60" cy="60" r="58" fill="#f4f5f7" />
        <circle cx="60" cy="42" r="29" fill="#3b291f" />
        <path d="M24 113c7-25 24-39 36-39s29 14 36 39" fill="#fff" stroke="#07192c" strokeWidth="3" />
        <path d="M52 79h16l-3 35H55z" fill="#1a62a3" />
        <path d="M38 40c1-19 11-28 23-28 13 0 22 10 22 28v11c0 18-11 32-22 32-12 0-23-14-23-32z" fill="#ffd2a3" stroke="#07192c" strokeWidth="3" />
        <circle cx="49" cy="50" r="3.2" fill="#07192c" />
        <circle cx="72" cy="50" r="3.2" fill="#07192c" />
        <path d="M53 64c5 5 12 5 17 0" fill="none" stroke="#07192c" strokeWidth="3" strokeLinecap="round" />
        <path d="M33 49c3-18 12-27 28-28 15 1 25 12 27 29-11-1-22-7-29-17-5 10-15 15-26 16z" fill="#2d2018" />
        <path d="M45 82l15 11 15-11" fill="none" stroke="#07192c" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();

  function isActive(href) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
         <img
  src="/SSS_logo.jpeg"
  alt="SSS Logo"
  className="brand-logo"
/>   
          <div>
            <div className="brand-title">SSS</div>
            <div className="brand-subtitle">Shiva Satya Sai Educational Society</div>
          </div>
        </div>

        <nav className="nav-list" aria-label="Student navigation">
          {navItems.map(([icon, label, href]) => (
            <a className={`nav-item ${isActive(href) ? "active" : ""}`} href={href} key={label}>
              <Icon name={icon} />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="nav-divider" />

        <nav className="nav-list compact" aria-label="Settings navigation">
          {settingsItems.map(([icon, label, href]) => (
            <a className={`nav-item ${isActive(href) ? "active" : ""}`} href={href} key={label}>
              <Icon name={icon} />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="nav-divider" />

        <a className="nav-item logout-link" href="#">
          <Icon name="power" />
          <span>Logout</span>
        </a>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="student-card">
            <Avatar />
            <div className="student-info">
              <p>Welcome back,</p>
              <h1>Aarav</h1>
              <div className="chips">
                <span>Roll No.: 23</span>
                <span>Admission No.: 2024/08/0156</span>
                <span>Class: Class 9</span>
                <span>Section: A</span>
              </div>
            </div>
          </div>

          <div className="top-actions">
            <label className="language-select">
              <span>Language</span>
              <select defaultValue="English" aria-label="Select language">
                <option>English</option>
                <option>Hindi</option>
                <option>Telugu</option>
              </select>
            </label>
            <button className="bell-button" aria-label="Notifications">
              <span className="bell-icon" aria-hidden="true" />
              <span className="badge">3</span>
            </button>
            <button className="top-logout" type="button">
              <span className="exit-icon" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
