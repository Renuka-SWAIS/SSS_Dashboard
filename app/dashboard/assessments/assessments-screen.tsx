"use client";

import { useState } from "react";
import {
  AvatarIllustration,
  BellIcon,
} from "@/components/dashboard/icons";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

type AssessmentTab = "remarks" | "self";

const teacherStudents = [
  { name: "Aarav Sharma", score: "92%", color: "#ef4444" },
  { name: "Diya Patel", score: "78%", color: "#fbbf24" },
  { name: "Rohan Verma", score: "85%", color: "#22c55e" },
  { name: "Meera Singh", score: "90%", color: "#84cc16" },
];

const topSubjects = [
  { label: "Mathematics", value: "97%", color: "#1f6ed4" },
  { label: "Science", value: "80%", color: "#f97316" },
  { label: "English", value: "78%", color: "#2286b8" },
  { label: "Social Studies", value: "45%", color: "#1f6ed4" },
];

const focusAreas = [
  { label: "Algebra", before: 52, after: 94, color: "#1f6ed4" },
  { label: "Mechanics", before: 42, after: 84, color: "#f97316" },
  { label: "Organic Chemistry", before: 48, after: 86, color: "#4caf50" },
  { label: "Essay Writing", before: 45, after: 87, color: "#4caf50" },
];

export function AssessmentsScreen() {
  const [activeTab, setActiveTab] = useState<AssessmentTab>("remarks");

  return (
    <div className="dashboard-shell">
      <DashboardSidebar activeItem="Assessments" />

      <main className="dashboard-main-content assessment-main">
        <header className="assessment-header">
          <h1>
            {activeTab === "remarks"
              ? "Dashboard"
              : "Student Self-Assessment: Academic Year 2023-24"}
          </h1>
          <div className="assessment-header-actions">
            <button type="button" aria-label="Notifications">
              <BellIcon className="assessment-header-icon" />
            </button>
            <button type="button" aria-label="More options">
              <span>...</span>
            </button>
            <div className="assessment-avatar">
              <AvatarIllustration className="assessment-avatar-icon" />
            </div>
          </div>
        </header>

        <div className="assessment-tabs" role="tablist" aria-label="Assessment sections">
          <button
            type="button"
            className={activeTab === "remarks" ? "active" : undefined}
            onClick={() => setActiveTab("remarks")}
          >
            Teacher Remarks
          </button>
          <button
            type="button"
            className={activeTab === "self" ? "active" : undefined}
            onClick={() => setActiveTab("self")}
          >
            Student Self Assessment
          </button>
        </div>

        {activeTab === "remarks" ? <TeacherRemarksView /> : <StudentSelfAssessmentView />}
      </main>
    </div>
  );
}

function TeacherRemarksView() {
  return (
    <section className="assessment-grid">
      <article className="assessment-card">
        <h2>Performance Overview</h2>
        <div className="assessment-donut-wrap">
          <div className="assessment-donut teacher">
            <span>365</span>
          </div>
          <div className="assessment-legend">
            <LegendItem color="#1267d8" label="Excellent" value="40%" />
            <LegendItem color="#ffbd18" label="Good" value="30%" />
            <LegendItem color="#48a5e7" label="Average" value="20%" />
            <LegendItem color="#ff7218" label="Needs Support" value="10%" />
          </div>
        </div>
        <div className="assessment-caption">
          <span>Total Students</span>
          <span>no. / 4 weeks</span>
        </div>
      </article>

      <article className="assessment-card">
        <h2>At-Risk Students</h2>
        <div className="bar-chart">
          {[45, 31, 49, 72, 61, 74, 104].map((height, index) => (
            <div className="bar-column" key={index}>
              <span style={{ height: `${Math.max(20, height - 20)}%` }} />
              <strong style={{ height: `${height}%` }} />
            </div>
          ))}
        </div>
        <div className="chart-labels seven">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jun</span>
        </div>
      </article>

      <article className="assessment-card">
        <h2>Top Subjects</h2>
        <div className="subject-list">
          {topSubjects.map((subject) => (
            <div className="subject-row" key={subject.label}>
              <span style={{ background: subject.color }}>{subject.label.charAt(0)}</span>
              <strong>{subject.label}</strong>
              <b>{subject.value}</b>
            </div>
          ))}
        </div>
      </article>

      <article className="assessment-card">
        <h2>Engagement Heatmap</h2>
        <Heatmap rows={["Mon", "Tue", "Wed", "Thu", "Sat"]} columns={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jun"]} />
      </article>

      <article className="assessment-card">
        <h2>Learning Progress</h2>
        <div className="progress-list">
          {teacherStudents.map((student) => (
            <div className="progress-row" key={student.name}>
              <span style={{ background: student.color }} />
              <AvatarIllustration className="mini-avatar" />
              <strong>{student.name}</strong>
              <div className="mini-bars">
                <i />
                <i />
                <i />
                <i />
              </div>
              <b>{student.score}</b>
            </div>
          ))}
        </div>
      </article>

      <article className="assessment-card">
        <h2>Growth Trend</h2>
        <LineChart labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]} points="6,86 58,66 110,92 162,46 214,56 266,12" />
      </article>
    </section>
  );
}

function StudentSelfAssessmentView() {
  return (
    <section className="assessment-grid">
      <article className="assessment-card">
        <h2>Final Subject Performance</h2>
        <p className="assessment-subtitle">(Average of all Tests)</p>
        <div className="assessment-donut-wrap">
          <div className="assessment-donut student">
            <span>Overall<br />Average:<br /><b>88%</b></span>
          </div>
          <div className="assessment-legend self">
            <LegendItem color="#1267d8" label="Math" />
            <LegendItem color="#f59e0b" label="Physics" />
            <LegendItem color="#4caf50" label="Chemistry" />
            <LegendItem color="#ef1818" label="Biology" />
          </div>
        </div>
      </article>

      <article className="assessment-card">
        <h2>Test Result Timeline</h2>
        <LineChart labels={["Quarter 1", "Mid-Term", "Quarter 2", "Final Exam"]} points="18,90 92,70 184,28 266,14" labelsTop={["78%", "80%", "93%", "94%"]} />
      </article>

      <article className="assessment-card">
        <h2>Detailed Test Performance by Subject</h2>
        <div className="test-detail-list">
          {["Quiz 1", "Project 1", "Unit Test 1", "Presentation 1"].map((test, index) => (
            <div className="test-detail-row" key={test}>
              <strong>{test}</strong>
              <span><i className="blue" />Math= {index === 3 ? "78%" : index === 1 ? "95%" : "97%"}</span>
              <span><i className="orange" />Phys= {index === 3 ? "85%" : "80%"}</span>
              <span><i className="green" />Chem= {index === 3 ? "70%" : index === 1 ? "82%" : "88%"}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="assessment-card">
        <h2>Study Subject Distribution Heatmap</h2>
        <Heatmap rows={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]} columns={["Math", "Phys", "Chem", "Bio", "Eng"]} />
      </article>

      <article className="assessment-card">
        <h2>Focus Area Improvements</h2>
        <div className="focus-list">
          {focusAreas.map((area) => (
            <div className="focus-row" key={area.label}>
              <span className="focus-icon" style={{ background: area.color }}>{area.label.charAt(0)}</span>
              <strong>{area.label}</strong>
              <div className="focus-meter">
                <i />
                <b style={{ width: `${area.after - area.before + 28}%`, background: area.color }} />
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="assessment-card">
        <h2>Overall Growth Trend <small>(Percentage &amp; Class Rank)</small></h2>
        <LineChart labels={["Quarter 1", "Mid-Term", "Quarter 2", "Final Exam"]} points="18,100 92,60 184,35 266,18" dashedPoints="18,112 92,84 184,60 266,8" />
      </article>
    </section>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value?: string }) {
  return (
    <div className="legend-row">
      <i style={{ background: color }} />
      <span>{label}</span>
      {value ? <strong>{value}</strong> : null}
    </div>
  );
}

function Heatmap({ rows, columns }: { rows: string[]; columns: string[] }) {
  const colors = ["#4caf50", "#9ccc65", "#ffd34d", "#ff8a2a", "#ff3d1f"];

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-rows">
        {rows.map((row) => (
          <span key={row}>{row}</span>
        ))}
      </div>
      <div>
        <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {Array.from({ length: rows.length * columns.length }).map((_, index) => (
            <span key={index} style={{ background: colors[(index * 3 + rows.length) % colors.length] }} />
          ))}
        </div>
        <div className="heatmap-columns" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineChart({
  labels,
  points,
  dashedPoints,
  labelsTop,
}: {
  labels: string[];
  points: string;
  dashedPoints?: string;
  labelsTop?: string[];
}) {
  return (
    <div className="line-chart">
      <svg viewBox="0 0 290 130" preserveAspectRatio="none">
        <path d="M0 108H290M0 82H290M0 56H290M0 30H290" stroke="#e5e7eb" strokeWidth="1" />
        <polyline points={points} fill="none" stroke="#28975e" strokeWidth="3" />
        {dashedPoints ? (
          <polyline points={dashedPoints} fill="none" stroke="#28975e" strokeDasharray="6 6" strokeWidth="3" />
        ) : null}
        {points.split(" ").map((point) => {
          const [cx, cy] = point.split(",");
          return <circle cx={cx} cy={cy} fill="#28975e" key={point} r="5" />;
        })}
      </svg>
      {labelsTop ? (
        <div className="line-top-labels">
          {labelsTop.map((label) => (
            <strong key={label}>{label}</strong>
          ))}
        </div>
      ) : null}
      <div className="chart-labels" style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}>
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
