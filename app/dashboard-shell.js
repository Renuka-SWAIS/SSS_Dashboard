'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getApiBaseUrl } from './api-base-url';
import NotificationBell from './notification-bell';
import VoiceTextTools from './voice-text-tools';

const navItems = [
  ['home', 'Dashboard','/' ],
  ['book-open', 'Core Study', '/chapters'],
  ['document', 'AI Translator', '/ai-translator'],
  ['clipboard', 'Assignments', '/assignments'],
  ['target', 'Assessments', '/assessments'],
  ['chart', 'My Progress', '/progress'],
];

const settingsItems = [
  ['settings', 'Settings', '/settings'],
  ['help', 'Help & Support', '/help'],
];

const API_BASE_URL = getApiBaseUrl();

// FIXED URL (removed square brackets)
const loginServiceUrl =
  process.env.NEXT_PUBLIC_LOGIN_URL || 'https://staging.sss.swais.in';

function handleLogout(event) {
  event.preventDefault();

  window.localStorage.clear();
  window.sessionStorage.clear();

  window.location.href = 'https://staging.sss.swais.in';
}
function useCurrentStudent() {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStudent() {
      try {
        const storedSession =
          window.sessionStorage.getItem('sssUserSession') ||
          window.localStorage.getItem('sssUserSession');

        let session = storedSession ? JSON.parse(storedSession) : null;

        if (!session?.email) {
          const sessionResponse = await fetch(
            `${loginServiceUrl}/api/auth/session`,
            {
              credentials: 'include',
            }
          );

          session = sessionResponse.ok
            ? await sessionResponse.json().catch(() => null)
            : null;
        }

        const email = (session?.email || session?.user?.email || '').trim();

        if (!email) {
          throw new Error('Logged-in student email is unavailable.');
        }

        const params = new URLSearchParams({ email });

        const response = await fetch(
          `${API_BASE_URL}/students/current?${params.toString()}`,
          {
            credentials: 'include',
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!cancelled && response.ok) {
          setStudent(data.student || null);
        }
      } catch {
        if (!cancelled) {
          setStudent(null);
        }
      }
    }

    loadStudent();

    return () => {
      cancelled = true;
    };
  }, []);

  return student;
}

function Icon({ name, className = '' }) {
  return (
    <span className={`icon ${name} ${className}`} aria-hidden='true' />
  );
}

function Avatar() {
  return (
    <div className='avatar' aria-hidden='true'>
      <svg viewBox='0 0 120 120' role='img'>
        <circle cx='60' cy='60' r='58' fill='#f4f5f7' />
        <circle cx='60' cy='42' r='29' fill='#3b291f' />
        <path
          d='M24 113c7-25 24-39 36-39s29 14 36 39'
          fill='#fff'
          stroke='#07192c'
          strokeWidth='3'
        />
        <path d='M52 79h16l-3 35H55z' fill='#1a62a3' />
        <path
          d='M38 40c1-19 11-28 23-28 13 0 22 10 22 28v11c0 18-11 32-22 32-12 0-23-14-23-32z'
          fill='#ffd2a3'
          stroke='#07192c'
          strokeWidth='3'
        />
        <circle cx='49' cy='50' r='3.2' fill='#07192c' />
        <circle cx='72' cy='50' r='3.2' fill='#07192c' />
      </svg>
    </div>
  );
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();

    
    const student = useCurrentStudent();


  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <main className='app-shell'>
      <aside className='sidebar'>
        <div className='brand'>
       <img
  src='/student/SSS_logo.jpeg'
  alt='SSS Logo'
  className='brand-logo'
/>
          <div>
            <div className='brand-title'>SSS</div>
            <div className='brand-subtitle'>
              Shiva Satya Sai School
            </div>
          </div>
        </div>

        <nav className='nav-list' aria-label='Student navigation'>
          {navItems.map(([icon, label, href]) => (
            <Link
              key={label}
              href={href}
              className={`nav-item ${isActive(href) ? 'active' : ''}`}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className='nav-divider' />

        <nav className='nav-list compact' aria-label='Settings navigation'>
          {settingsItems.map(([icon, label, href]) => (
            <Link
              key={label}
              href={href}
              className={`nav-item ${isActive(href) ? 'active' : ''}`}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className='nav-divider' />

        <a
          className='nav-item logout-link'
          href={loginServiceUrl}
          onClick={handleLogout}
        >
          <Icon name='power' />
          <span>Logout</span>
        </a>
      </aside>

      <section className='workspace'>
        <header className='topbar'>
          <div className='student-card'>
            <Avatar />
            <div className='student-info'>
              <p>Welcome back,</p>
              <h1>{student?.full_name || 'Student'}</h1>

              <div className='chips'>
                <span>Roll No.: {student?.roll_no || '-'}</span>
                <span>
                  Admission No.: {student?.admission_no || '-'}
                </span>
                <span>Class: {student?.class_name || '-'}</span>
                <span>Section: {student?.section || '-'}</span>
              </div>
            </div>
          </div>

         <div className='top-actions'>
  <h2 className='page-title'>Student Dashboard</h2>

  <div className='top-controls'>
    <label className='language-select'>
      <span>Language</span>
      <select defaultValue='English' aria-label='Select language'>
        <option>English</option>
        <option>Hindi</option>
        <option>Telugu</option>
      </select>
    </label>

    <VoiceTextTools />
    <NotificationBell />
  </div>
</div>
        </header>

        {children}
      </section>
    </main>
  );
}