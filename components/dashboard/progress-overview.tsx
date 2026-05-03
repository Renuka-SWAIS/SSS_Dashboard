import React from "react";
import { BookIcon, ClipboardIcon, NotesIcon, TargetIcon } from "@/components/dashboard/icons";

const progressItems = [
  {
    label: "Core Study",
    value: "35%",
    percent: "35%",
    colorClassName: "progress-blue",
    Icon: BookIcon,
  },
  {
    label: "Assignments",
    value: "2 / 5",
    percent: "40%",
    colorClassName: "progress-orange",
    Icon: ClipboardIcon,
  },
  {
    label: "Quizzes",
    value: "6 / 10",
    percent: "60%",
    colorClassName: "progress-purple",
    Icon: TargetIcon,
  },
  {
    label: "Assessments",
    value: "1 / 3",
    percent: "33%",
    colorClassName: "progress-green",
    Icon: NotesIcon,
  },
];

export function DashboardProgressOverview() {
  return (
    <section className="dashboard-progress-overview">
      <h2 className="progress-section-title">Your Progress Overview</h2>

      <div className="progress-grid">
        {progressItems.map(({ Icon, ...item }) => (
          <div key={item.label} className="progress-item">
            <div className={`progress-icon-wrap ${item.colorClassName}`}>
              <Icon className="progress-icon" />
            </div>

            <div className="progress-copy">
              <div className="progress-label">{item.label}</div>
              <div className="progress-value">{item.value}</div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${item.colorClassName}`}
                  style={{ width: item.percent }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
