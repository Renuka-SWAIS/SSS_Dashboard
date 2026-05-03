"use client";

import { useState } from "react";
import { logout } from "@/app/actions";
import {
  AvatarIllustration,
  BellIcon,
  ClipboardIcon,
  HomeIcon,
  LogoMark,
  LogoutIcon,
  NotesIcon,
  TargetIcon,
} from "@/components/dashboard/icons";

const assignments = [
  {
    id: "1",
    title: "AI Ethics Case Study",
    dueDate: "20-May-2024",
    details: "Review an AI ethics case and explain fairness, transparency, and accountability risks.",
    savedAnswer: "",
    feedback: {
      marks: "17.00",
      total: "25",
      remarks: "Good examples. Add clearer links to ethical principles.",
    },
  },
  {
    id: "2",
    title: "Data Privacy Analysis",
    dueDate: "28-May-2024",
    details: "Analyze a real-world data privacy scenario and identify potential risks.",
    savedAnswer: "The scenario includes risks around consent, retention, and access control.",
    feedback: {
      marks: "18.50",
      total: "25",
      remarks: "Good work. Please explain the mitigation steps more clearly.",
    },
  },
  {
    id: "3",
    title: "Logistics Problem Set",
    dueDate: "05-Jun-2024",
    details: "Solve the listed logistics problems and show the reasoning for each answer.",
    savedAnswer: "",
    feedback: {
      marks: "-",
      total: "25",
      remarks: "Feedback will appear after submission.",
    },
  },
];

export function AssignmentsScreen() {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("2");
  const [answer, setAnswer] = useState(assignments[1].savedAnswer);
  const [message, setMessage] = useState("Viewing Data Privacy Analysis.");

  const selectedAssignment =
    assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? assignments[0];

  function viewAssignment(assignmentId: string) {
    const assignment = assignments.find((item) => item.id === assignmentId);

    if (!assignment) {
      return;
    }

    setSelectedAssignmentId(assignment.id);
    setAnswer(assignment.savedAnswer);
    setMessage(`Viewing ${assignment.title}.`);
  }

  function handleSaveDraft() {
    setMessage(`Draft saved for ${selectedAssignment.title}.`);
  }

  function handleSubmitAssignment() {
    const hasAnswer = answer.trim().length > 0;
    setMessage(
      hasAnswer
        ? `Assignment submitted for ${selectedAssignment.title}.`
        : `Please type an answer before submitting ${selectedAssignment.title}.`,
    );
  }

  function handleNotificationClick() {
    setMessage("No new notifications.");
  }

  return (
    <div className="assignment-shell">
      <header className="assignment-topbar">
        <div className="assignment-brand">
          <LogoMark className="assignment-logo" />
          <span>SWAIS</span>
        </div>
        <div className="assignment-top-actions">
          <button
            type="button"
            className="assignment-bell"
            aria-label="Notifications"
            onClick={handleNotificationClick}
          >
            <BellIcon className="assignment-bell-icon" />
          </button>
          <form action={logout}>
            <button type="submit" className="assignment-logout-inline">
              <LogoutIcon className="assignment-logout-icon" />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </header>

      <div className="assignment-body">
        <aside className="assignment-sidebar">
          <nav className="assignment-nav">
            <a href="/dashboard">
              <HomeIcon className="assignment-nav-icon" />
              <span>Dashboard</span>
            </a>
            <a href="/dashboard/assignments" className="active">
              <ClipboardIcon className="assignment-nav-icon" />
              <span>Assignments</span>
            </a>
            <a href="#">
              <NotesIcon className="assignment-nav-icon" />
              <span>My Submissions</span>
            </a>
            <a href="#">
              <TargetIcon className="assignment-nav-icon" />
              <span>Profile</span>
            </a>
          </nav>

          <div className="assignment-sidebar-divider" />
          <form action={logout}>
            <button type="submit" className="assignment-sidebar-logout">
              <LogoutIcon className="assignment-nav-icon" />
              <span>Logout</span>
            </button>
          </form>
        </aside>

        <main className="assignment-content">
          <section className="assignment-student-card">
            <div className="assignment-avatar">
              <AvatarIllustration className="avatar-icon" />
            </div>
            <div className="student-name-block">
              <span>Student Name</span>
              <strong>Aarav Sharma</strong>
            </div>
            <div className="student-meta-block">
              <span>Admission No.</span>
              <strong className="chip-purple">ADM001</strong>
            </div>
            <div className="student-meta-block">
              <span>Class</span>
              <strong className="chip-green">9</strong>
            </div>
            <div className="student-meta-block">
              <span>Section</span>
              <strong className="chip-purple">B</strong>
            </div>
            <div className="student-meta-block">
              <span>Roll No.</span>
              <strong className="chip-yellow">25</strong>
            </div>
          </section>

          <section className="assignment-card">
            <h1>Assignments</h1>
            <div className="assignment-table-wrap">
              <table className="assignment-screen-table">
                <thead>
                  <tr>
                    <th>Assignment ID</th>
                    <th>Assignment Title</th>
                    <th>Due Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className={assignment.id === selectedAssignment.id ? "is-selected" : undefined}
                    >
                      <td>{assignment.id}</td>
                      <td>{assignment.title}</td>
                      <td>{assignment.dueDate}</td>
                      <td>
                        <button
                          type="button"
                          className={
                            assignment.id === selectedAssignment.id
                              ? "assignment-submit-link active"
                              : "assignment-submit-link"
                          }
                          onClick={() => viewAssignment(assignment.id)}
                        >
                          View / Submit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="assignment-card assignment-details-card">
            <h2>Assignment Details</h2>
            <div className="assignment-detail-copy">
              <span>Assignment Title:</span>
              <strong>{selectedAssignment.title}</strong>
            </div>
            <div className="assignment-detail-copy">
              <span>Assignment Details:</span>
              <p>{selectedAssignment.details}</p>
            </div>
            <div className="assignment-detail-copy">
              <span>Due Date:</span>
              <strong className="assignment-due">{selectedAssignment.dueDate}</strong>
            </div>
          </section>

          <section className="assignment-card assignment-work-card">
            <div className="assignment-submit-panel">
              <h2>Submit Your Assignment</h2>
              <label htmlFor="assignment-answer">
                Your Answer <span>*</span>
              </label>
              <textarea
                id="assignment-answer"
                value={answer}
                placeholder="Type your answer here..."
                onChange={(event) => setAnswer(event.target.value)}
              />
              <label htmlFor="assignment-file">Upload File (Optional)</label>
              <input id="assignment-file" type="file" onChange={() => setMessage("File selected.")} />
              <div className="assignment-submit-actions">
                <button type="button" className="assignment-draft-btn" onClick={handleSaveDraft}>
                  Save Draft
                </button>
                <button
                  type="button"
                  className="assignment-submit-btn"
                  onClick={handleSubmitAssignment}
                >
                  Submit Assignment
                </button>
              </div>
            </div>

            <div className="assignment-feedback-panel">
              <h2>Teacher Feedback</h2>
              <div className="feedback-box">
                <span>Marks Obtained</span>
                <strong>
                  {selectedAssignment.feedback.marks} <em>/ {selectedAssignment.feedback.total}</em>
                </strong>
                <div className="feedback-line" />
                <span>Teacher Remarks</span>
                <p>{selectedAssignment.feedback.remarks}</p>
              </div>
            </div>
          </section>

          <section className="assignment-status-message" aria-live="polite">
            {message}
          </section>

          <section className="assignment-note">
            <strong>i</strong>
            <span>Note: Once submitted, you will not be able to edit your answer.</span>
          </section>

          <footer className="assignment-footer">&copy; 2024 SWAIS. All rights reserved.</footer>
        </main>
      </div>
    </div>
  );
}
