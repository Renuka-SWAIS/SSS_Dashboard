"use client";

import { useEffect, useRef, useState } from "react";

const roles = [
  {
    value: "super-admin",
    title: "Super Admin (SWAIS)",
    description: "Full system access and platform management for SWAIS.",
    icon: "★",
  },
  {
    value: "admin",
    title: "Admin (College)",
    description: "Manage college, users, content and academic activities.",
    icon: "🏛",
  },
  {
    value: "teacher",
    title: "Teacher",
    description: "Create and manage classes, content and assess student learning.",
    icon: "🧑‍🏫",
  },
  {
    value: "principal",
    title: "Principal",
    description: "Oversee school operations, staff, and academic performance.",
    icon: "🏫",
  },
  {
    value: "student",
    title: "Student",
    description: "Access learning materials, attend classes and track progress.",
    icon: "🎓",
  },
  {
    value: "parent",
    title: "Parent",
    description: "Monitor your child's learning progress and activities.",
    icon: "👪",
  },
  {
    value: "guest",
    title: "Guest",
    description: "Explore public content and resources without a full account.",
    icon: "👤",
  },
];

type RoleSelectorProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function RoleSelector({ action }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState(roles[0].value);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = roles.find((role) => role.value === selectedRole) ?? roles[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <form action={action} className="role-form">
      <label className="field-label" htmlFor="role-trigger">
        User Type<span>*</span>
      </label>

      <input type="hidden" name="role" value={selected.value} />

      <div className="role-dropdown" ref={rootRef}>
        <button
          id="role-trigger"
          type="button"
          className={`role-trigger ${isOpen ? "role-trigger-open" : ""}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls="role-listbox"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="role-trigger-main">
            <span className="role-mini-icon" aria-hidden="true">
              {selected.icon}
            </span>
            <span className="role-trigger-label">{selected.title}</span>
          </span>
          <span className="select-arrow" aria-hidden="true">
            {isOpen ? "⌃" : "⌄"}
          </span>
        </button>

        {isOpen ? (
          <div id="role-listbox" className="role-menu" role="listbox" aria-label="User types">
            {roles.map((role) => {
              const active = role.value === selected.value;

              return (
                <button
                  key={role.value}
                  type="button"
                  className={`role-option ${active ? "role-option-active" : ""}`}
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setSelectedRole(role.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="role-mini-icon role-option-icon" aria-hidden="true">
                    {role.icon}
                  </span>
                  <span className="role-option-copy">
                    <strong>{role.title}</strong>
                    <small>{role.description}</small>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <button type="submit" className="role-submit-button">
        Continue with Selected User Type {"->"}
      </button>
    </form>
  );
}
