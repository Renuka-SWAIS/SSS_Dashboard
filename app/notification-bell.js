"use client";

import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "./api-base-url";

const API_BASE_URL = getApiBaseUrl();

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function NotificationBell() {
  const menuRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications`, { credentials: "include" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(typeof data.detail === "string" ? data.detail : "Unable to load notifications.");
        }
        if (!cancelled) {
          setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
          setCount(Number.isFinite(data.count) ? data.count : 0);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to load notifications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNotifications();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function closeOnOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="notification-menu" ref={menuRef}>
      <button
        className="bell-button"
        aria-label={`Notifications${count ? ` (${count} unread)` : ""}`}
        aria-expanded={open}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="bell-icon" aria-hidden="true" />
        {count > 0 && <span className="badge">{count > 99 ? "99+" : count}</span>}
      </button>

      {open && (
        <div className="notice-dropdown" role="dialog" aria-label="Notifications">
          <div className="notice-dropdown-head"><strong>Notifications</strong><span>{count}</span></div>
          {loading && <p className="notice-message">Loading notifications...</p>}
          {!loading && error && <p className="notice-message">{error}</p>}
          {!loading && !error && notifications.length === 0 && <p className="notice-message">No notifications found.</p>}
          {!loading && !error && notifications.map((item) => {
            const assignment = item.type === "assignment";
            return (
              <article className={`notice-item ${assignment ? "assignment-alert" : ""}`} key={item.id}>
                <div><strong>{item.title || "Notification"}</strong><time>{formatDate(item.due_date || item.notice_date)}</time></div>
                <p>{item.message || item.body || "-"}</p>
                <footer>
                  <span>{assignment ? item.subject_name || "Assignment" : item.applicable_class || "All"}</span>
                  {assignment && <span className={`alert-status ${item.priority || "low"}`}>{item.status}</span>}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
