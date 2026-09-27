"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import DashboardShell from "../dashboard-shell";
import StudyTabs from "../study-tabs";
import { generateAlert } from "../../services/studentApi";
import { getApiBaseUrl } from "../api-base-url";

const API_BASE_URL = getApiBaseUrl();

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      resolve(
        String(reader.result || "")
          .split(",")
          .pop()
      );

    reader.onerror = () =>
      reject(
        new Error("Unable to read selected file.")
      );

    reader.readAsDataURL(file);
  });
}

function getStatusClass(status) {
  return String(status || "Not Started")
    .toLowerCase()
    .replaceAll(" ", "-");
}

function AssignmentsContent() {
  const searchParams = useSearchParams();

  const activeTab =
    searchParams.get("tab") ||
    "my-assignments";

  const [assignments, setAssignments] =
    useState([]);

  const [selectedAssignment, setSelectedAssignment] =
    useState(null);

  const [studentId, setStudentId] =
    useState(null);

  const [studentEmail, setStudentEmail] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [showAiSummary, setShowAiSummary] =
    useState(false);

  const [alertLoading, setAlertLoading] =
    useState(false);

  const [alertResponse, setAlertResponse] =
    useState(null);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const submittedAssignments =
    assignments.filter((assignment) => {
      const status = String(
        assignment.status || ""
      ).toLowerCase();

      return (
        status === "completed" ||
        status === "submitted" ||
        status === "reviewed"
      );
    });

  const submittedCount =
    submittedAssignments.length;

  const remainingCount = Math.max(
    assignments.length - submittedCount,
    0
  );

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments(
    preferredId = null
  ) {
    setLoading(true);
    setLoadError("");

    try {
      const localBackend =
        typeof window === "undefined"
          ? "http://localhost:8000"
          : `${window.location.protocol}//${window.location.hostname}:8000`;

      const apiCandidates = [
        ...new Set([
          API_BASE_URL,
          localBackend,
        ]),
      ];

      const storedSession =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(
              "sssUserSession"
            ) ||
            window.localStorage.getItem(
              "sssUserSession"
            )
          : null;

      const session = storedSession
        ? JSON.parse(storedSession)
        : null;

      const storedEmail = (
        session?.email ||
        session?.user?.email ||
        ""
      ).trim();

      if (!storedEmail) {
        throw new Error(
          "Student email not found. Please login again."
        );
      }

      let data = null;
      let lastError = null;

      for (const apiUrl of apiCandidates) {
        try {
          const response = await fetch(
            `${apiUrl}/assignments/current?email=${encodeURIComponent(
              storedEmail
            )}`,
            {
              cache: "no-store",
            }
          );

          const responseData =
            await response
              .json()
              .catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              responseData.detail ||
                `Unable to load assignments (${response.status}).`
            );
          }

          data = responseData;
          break;
        } catch (requestError) {
          lastError = requestError;
        }
      }

      if (!data) {
        throw (
          lastError ||
          new Error(
            "Unable to load assignments."
          )
        );
      }

      const rows = Array.isArray(
        data.assignments
      )
        ? data.assignments
        : [];

      setAssignments(rows);

      setStudentId(
        data.student_id || null
      );

      setStudentEmail(
        data.student_email ||
          storedEmail
      );

      setSelectedAssignment((current) =>
        rows.find(
          (item) =>
            item.assignment_id ===
            (preferredId ||
              current?.assignment_id)
        ) ||
        rows[0] ||
        null
      );
    } catch (error) {
      setAssignments([]);
      setSelectedAssignment(null);

      setLoadError(
        error.message ||
          "Unable to load assignments."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAskAi() {
    if (!studentEmail) {
      alert(
        "Student email not found. Please login again."
      );
      return;
    }

    if (!selectedAssignment) {
      alert(
        "Please select an assignment first."
      );
      return;
    }

    try {
      setAlertLoading(true);
      setAlertResponse(null);

      const response =
        await generateAlert({
          assignment_name:
            selectedAssignment.assignment_title ||
            "Assignment",

          due_date:
            selectedAssignment.due_date ||
            "",

          user_email:
            studentEmail,

          client_name: "SSS",
        });

      setAlertResponse(response);
      setShowAiSummary(true);
    } catch (error) {
      alert(
        error.response?.data?.detail ||
          error.message ||
          "Alert Generation Failed"
      );
    } finally {
      setAlertLoading(false);
    }
  }

  function handleFileChange(event) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      alert(
        "Only PDF, DOC, DOCX, JPG and PNG files are allowed."
      );

      event.target.value = "";
      setSelectedFile(null);

      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(
        "File size must be less than 10 MB."
      );

      event.target.value = "";
      setSelectedFile(null);

      return;
    }

    setSelectedFile(file);
  }

  function handleRemoveFile() {
    setSelectedFile(null);

    const fileInput =
      document.getElementById(
        "assignment-file"
      );

    if (fileInput) {
      fileInput.value = "";
    }
  }

  async function handleSubmitAssignment() {
    if (!selectedFile) {
      alert(
        "Please select a file first."
      );
      return;
    }

    if (
      !selectedAssignment ||
      !studentId
    ) {
      alert(
        "Please select an assignment first."
      );
      return;
    }

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/assignment-submissions`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              student_id:
                studentId,

              assignment_id:
                selectedAssignment.assignment_id,

              assignment_title:
                selectedAssignment.assignment_title,

              file_name:
                selectedFile.name,

              file_type:
                selectedFile.type,

              file_size:
                selectedFile.size,

              file_content_base64:
                await fileToBase64(
                  selectedFile
                ),
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to submit assignment."
        );
      }

      alert(
        `${selectedFile.name} submitted successfully.`
      );

      setSelectedFile(null);

      await loadAssignments(
        selectedAssignment.assignment_id
      );
    } catch (error) {
      alert(
        error.message ||
          "Assignment submission failed."
      );
    }
  }

  async function handleAssignmentAction(
    assignment
  ) {
    setSelectedAssignment(
      assignment
    );

    setSelectedFile(null);
    setShowAiSummary(false);
    setAlertResponse(null);

    if (
      assignment.action === "View"
    ) {
      if (!studentId) {
        alert(
          "Student information is not available."
        );
        return;
      }

      const fileUrl =
        `${API_BASE_URL}/assignment-submissions/file` +
        `?student_id=${studentId}` +
        `&assignment_id=${assignment.assignment_id}`;

      window.open(
        fileUrl,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    if (
      assignment.action !==
        "Start" ||
      !studentId
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/assignments/start?student_id=${studentId}&assignment_id=${assignment.assignment_id}`,
          {
            method: "POST",
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to start assignment."
        );
      }

      await loadAssignments(
        assignment.assignment_id
      );
    } catch (error) {
      console.error(
        "Start Assignment Error:",
        error
      );

      alert(
        error.message ||
          "Unable to start assignment."
      );
    }
  }

  function renderAssignmentTable({
    showAction = true,
  } = {}) {
    return (
      <div className="assignment-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>

              <th>
                Assignment Title
              </th>

              <th>
                Due Date
              </th>

              <th>
                Status
              </th>

              {showAction && (
                <th>
                  Action
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {assignments.map(
              (assignment) => (
                <tr
                  className={
                    selectedAssignment?.assignment_id ===
                    assignment.assignment_id
                      ? "highlight-row"
                      : ""
                  }
                  key={
                    assignment.assignment_id
                  }
                >
                  <td>
                    {assignment.number}
                  </td>

                  <td>
                    {
                      assignment.assignment_title
                    }
                  </td>

                  <td>
                    {formatDate(
                      assignment.due_date
                    )}
                  </td>

                  <td>
                    <span
                      className={`status-pill ${getStatusClass(
                        assignment.status
                      )}`}
                    >
                      {assignment.status ||
                        "Not Started"}
                    </span>
                  </td>

                  {showAction && (
                    <td>
                      <button
                        className="table-action"
                        type="button"
                        onClick={() =>
                          handleAssignmentAction(
                            assignment
                          )
                        }
                      >
                        {assignment.action ||
                          "Start"}
                      </button>
                    </td>
                  )}
                </tr>
              )
            )}

            {!loading &&
              assignments.length ===
                0 && (
                <tr>
                  <td
                    colSpan={
                      showAction
                        ? "5"
                        : "4"
                    }
                  >
                    {loadError ||
                      "No assignments available."}
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    );
  }

  function renderAssignmentDetails() {
    return (
      <article className="module-card assignment-upload-card">
        <div
  className="card-title-row"
  style={{
    alignItems: "flex-start",
    gap: "12px",
  }}
>
  <h2
    style={{
      flex: 1,
      minWidth: 0,
      margin: 0,
    }}
  >
    {selectedAssignment.assignment_title}
  </h2>

  <span
    className={`status-pill ${getStatusClass(
      selectedAssignment.status ||
        selectedAssignment.submission_status
    )}`}
    style={{
      flexShrink: 0,
      whiteSpace: "nowrap",
    }}
  >
    {selectedAssignment.status ||
      selectedAssignment.submission_status ||
      "Not Started"}
  </span>
</div>

        <p>
          {selectedAssignment?.assignment_text ||
            "Select an assignment to view its instructions."}
        </p>

        {showAiSummary && (
          <div className="assignment-ai-summary">
            <strong>
              AI Summary
            </strong>

            <p>
              {selectedAssignment?.assignment_text ||
                "Read the assignment instructions carefully and submit before the due date."}
            </p>

            {alertResponse && (
              <div>
                <strong>
                  Alert Response
                </strong>

                <p>
                  {typeof alertResponse ===
                  "string"
                    ? alertResponse
                    : alertResponse.message ||
                      alertResponse.alert ||
                      "Alert generated successfully."}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="upload-zone">
          <div className="upload-icon">
            Upload
          </div>

          <strong>
            Drag & drop your file here
          </strong>

          <span>or</span>

          <input
            id="assignment-file"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={
              handleFileChange
            }
            disabled={
              !selectedAssignment
            }
            style={{
              display: "none",
            }}
          />

          <label
            htmlFor="assignment-file"
            className="soft-button"
            style={{
              cursor: "pointer",
              display: "inline-block",
              opacity:
                selectedAssignment
                  ? 1
                  : 0.55,
              pointerEvents:
                selectedAssignment
                  ? "auto"
                  : "none",
            }}
          >
            Browse Files
          </label>

          <small>
            Supported formats:
            PDF, DOC, DOCX, JPG,
            PNG (Max 10 MB)
          </small>

          {selectedFile && (
            <div
              style={{
                marginTop: "16px",
              }}
            >
              <p>
                <strong>
                  Selected File:
                </strong>{" "}
                {selectedFile.name}
              </p>

              <p>
                Size:{" "}
                {(
                  selectedFile.size /
                  1024 /
                  1024
                ).toFixed(2)}{" "}
                MB
              </p>

              <button
                type="button"
                className="soft-button"
                onClick={
                  handleRemoveFile
                }
              >
                Remove File
              </button>
            </div>
          )}
        </div>

        <div className="submit-row">
          <div>
            {selectedFile ? (
              <>
                <p>
                  File ready:{" "}
                  {selectedFile.name}
                </p>

                <p>
                  Ready to submit
                </p>
              </>
            ) : (
              <>
                <p>
                  No file uploaded yet
                </p>

                <p>
                  Select a file to submit
                </p>
              </>
            )}
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={
              handleSubmitAssignment
            }
            disabled={
              !selectedFile ||
              !selectedAssignment ||
              !studentId
            }
          >
            Submit Assignment
          </button>
        </div>
      </article>
    );
  }

  function renderFeedbackMarks() {
    const submittedAssignments =
      assignments.filter((assignment) => {
        const status = String(
          assignment.status ||
            assignment.submission_status ||
            ""
        ).toLowerCase();

        return (
          status === "completed" ||
          status === "submitted" ||
          status === "reviewed"
        );
      });

    return (
      <article className="module-card">
        <div className="card-title-row">
          <div>
            <h2>Feedback & Marks</h2>

            <p className="module-subtitle">
              Assignment submission details,
              marks and feedback
            </p>
          </div>

          <button
            className="soft-button"
            type="button"
            onClick={() =>
              loadAssignments()
            }
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>
        </div>

        {submittedAssignments.length > 0 ? (
          <div className="assignment-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Assignment</th>
                  <th>Submission</th>
                  <th>Submitted Date</th>
                  <th>Marks</th>
                  <th>Feedback</th>
                </tr>
              </thead>

              <tbody>
                {submittedAssignments.map(
                  (assignment) => {
                    const marks =
                      assignment.marks ??
                      null;

                    const totalMarks =
                      assignment.total_marks ??
                      null;

                    const feedback =
                      assignment.feedback ??
                      assignment.teacher_feedback ??
                      null;

                    return (
                      <tr
                        key={
                          assignment.assignment_id
                        }
                      >
                        <td>
                          {assignment.number}
                        </td>

                        <td>
                          {
                            assignment.assignment_title
                          }
                        </td>

                        <td>
                          <span
                            className={`status-pill ${getStatusClass(
                              assignment.status ||
                                assignment.submission_status
                            )}`}
                          >
                            {assignment.status ||
                              assignment.submission_status ||
                              "Submitted"}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            assignment.submitted_at
                          )}
                        </td>

                        <td>
                          {marks !== null
                            ? totalMarks
                              ? `${marks}/${totalMarks}`
                              : marks
                            : "—"}
                        </td>

                        <td>
                          {feedback || "—"}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tip-box">
            —
          </div>
        )}
      </article>
    );
  }

  return (
    <DashboardShell>
      <section className="module-page">
        <StudyTabs />

        <div className="module-content-area">

          {/* 1. MY ASSIGNMENTS */}

          {activeTab ===
            "my-assignments" && (
            <>
              <article className="module-card assignment-list-card">
                <div className="card-title-row">
                  <h2>
                    Your Assignments
                  </h2>

                  <div className="assignment-summary">
                    <span>
                      Submitted:{" "}
                      <strong>
                        {submittedCount}
                      </strong>
                    </span>

                    <span>
                      Remaining:{" "}
                      <strong>
                        {remainingCount}
                      </strong>
                    </span>
                  </div>

                  <button
                    className="soft-button"
                    type="button"
                    onClick={() =>
                      loadAssignments()
                    }
                    disabled={loading}
                  >
                    {loading
                      ? "Loading..."
                      : "Refresh"}
                  </button>
                </div>

                {renderAssignmentTable()}
              </article>

              <div className="tip-box">
                Tip: Submit your assignments
                on time to get early feedback
                and improve your score!
              </div>
            </>
          )}

          {/* 2. SUBMIT ASSIGNMENT */}

          {activeTab ===
            "submit-assignment" && (
            <>
              <div
                className="assignment-layout"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1.35fr) minmax(360px, 0.65fr)",
                  gap: "20px",
                  alignItems: "stretch",
                }}
              >
                <article className="module-card assignment-list-card">
                  <div className="card-title-row">
                    <div>
                      <h2>
                        Select Assignment
                      </h2>

                      <p className="module-subtitle">
                        Select an assignment
                        below to submit your
                        work.
                      </p>
                    </div>

                    <button
                      className="soft-button"
                      type="button"
                      onClick={() =>
                        loadAssignments()
                      }
                      disabled={loading}
                    >
                      {loading
                        ? "Loading..."
                        : "Refresh"}
                    </button>
                  </div>

                  {renderAssignmentTable({
                    showAction: true,
                  })}
                </article>

                {renderAssignmentDetails()}
              </div>

              <article className="module-card workflow-card">
                <h2>
                  Assignment Submission
                  Workflow
                </h2>

                <div className="workflow-steps">
                  <div>
                    <span>1</span>
                    <p>
                      Upload / Type
                      Assignment
                    </p>
                  </div>

                  <div>
                    <span>2</span>
                    <p>
                      Teacher Review &
                      Feedback
                    </p>
                  </div>

                  <div>
                    <span>3</span>
                    <p>
                      Revise (If Needed)
                    </p>
                  </div>

                  <div>
                    <span>4</span>
                    <p>
                      Final Submission Done
                    </p>
                  </div>
                </div>
              </article>
            </>
          )}

          {/* 3. FEEDBACK & MARKS */}

          {activeTab ===
            "feedback-marks" && (
            <>
              {renderFeedbackMarks()}
            </>
          )}

        </div>
      </section>
    </DashboardShell>
  );
}

export default function AssignmentsPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell>
          <section className="module-page">
            <StudyTabs />

            <div className="module-content-area">
              <article className="module-card">
                Loading assignments...
              </article>
            </div>
          </section>
        </DashboardShell>
      }
    >
      <AssignmentsContent />
    </Suspense>
  );
}