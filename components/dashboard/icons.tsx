import React from "react";

type IconProps = {
  className?: string;
};

function Svg({
  children,
  className,
  viewBox = "0 0 24 24",
}: IconProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function LogoMark({ className }: IconProps) {
  return (
    <Svg className={className} viewBox="0 0 72 72">
      <circle cx="36" cy="30" r="16" fill="#FFB21C" />
      <path d="M36 2v12M19 7l6 9M9 18l10 4M63 18l-10 4M53 7l-6 9" stroke="#FF7A1A" strokeLinecap="round" strokeWidth="3" />
      <path d="M12 44c7-6 16-9 24-9s17 3 24 9v14H12V44Z" fill="#2156D7" />
      <path d="M17 49c6-4 12-6 19-6 8 0 14 2 19 6" stroke="#FFF4C6" strokeLinecap="round" strokeWidth="2.5" />
      <path d="M22 41h28" stroke="#FF8A1C" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

export function AvatarIllustration({ className }: IconProps) {
  return (
    <Svg className={className} viewBox="0 0 96 96">
      <circle cx="48" cy="48" r="46" fill="#FFEED8" />
      <path d="M23 78c5-14 15-21 25-21s20 7 25 21" fill="#B63B44" />
      <path d="M31 34c0-12 8-22 17-22 10 0 18 10 18 22v11c0 11-8 20-18 20-9 0-17-9-17-20V34Z" fill="#FFD0A8" />
      <path d="M30 35c2-15 11-24 23-24 8 0 14 3 18 9l2 17c-3-2-7-6-9-10-6 5-14 8-24 8-3 0-7 0-10-1v1Z" fill="#2E2E3F" />
      <path d="M39 46h2M54 46h2" stroke="#2E2E3F" strokeLinecap="round" strokeWidth="3" />
      <path d="M45 55c2 2 5 2 7 0" stroke="#D56A6A" strokeLinecap="round" strokeWidth="2.5" />
      <path d="M29 84h38l-8-16H37l-8 16Z" fill="#D44354" />
      <path d="M48 67l6 8-6 6-6-6 6-8Z" fill="#FFFFFF" />
    </Svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 4a5 5 0 0 0-5 5v2.2c0 .9-.3 1.7-.8 2.4L4.6 16a1 1 0 0 0 .8 1.6h13.2a1 1 0 0 0 .8-1.6l-1.6-2.4a4 4 0 0 1-.8-2.4V9a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </Svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M14 8l4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M8 12h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </Svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    </Svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H19v14H7.5A2.5 2.5 0 0 0 5 20.5v-14Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M19 4v16M9 8h6M9 12h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </Svg>
  );
}

export function ClipboardIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="6" y="5" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 5.5h6V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v1.5ZM9 10h6M9 14h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </Svg>
  );
}

export function TargetIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15 9 5-5M15 9h5V4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Svg>
  );
}

export function NotesIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </Svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 19h16M7 15V9M12 15V6M17 15v-4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="m5 11 4-4 3 3 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m5.5 8 6.5 5 6.5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </Svg>
  );
}

export function HelpIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 9a2.6 2.6 0 1 1 4.3 2c-.8.7-1.8 1.2-1.8 2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="12" cy="16.8" r="1" fill="currentColor" />
    </Svg>
  );
}
