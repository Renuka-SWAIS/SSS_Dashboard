"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../dashboard-shell";
import StudyTabs from "../study-tabs";
import { generateAlert } from "../../services/studentApi";
import { getApiBaseUrl } from "../api-base-url";

const API_BASE_URL = getApiBaseUrl();

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(value));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",").pop());
    reader.onerror = () => reject(new Error("Unable to read selected file."));
    reader.readAsDataURL(file);
  });
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showAiSummary, setShowAiSummary] = useState(false);

  const [alertLoading, setAlertLoading] = useState(false);
  const [alertResponse, setAlertResponse] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  async function loadAssignments(preferredId = null) {
    setLoading(true);
    setLoadError("");
    try {
      const localBackend = typeof window === "undefined"
        ? "http://localhost:8000"
        : `${window.location.protocol}//${window.location.hostname}:8000`;
      const apiCandidates = [...new Set([API_BASE_URL, localBackend])];
      let data = null;
      let lastError = null;

      for (const apiUrl of apiCandidates) {
        try {
          const response = await fetch(`${apiUrl}/assignments/current`, { cache: "no-store" });
          const responseData = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(responseData.detail || `Unable to load assignments (${response.status}).`);
          data = responseData;
          break;
        } catch (requestError) {
          lastError = requestError;
        }
      }

      if (!data) throw lastError || new Error("Unable to load assignments.");
      const rows = Array.isArray(data.assignments) ? data.assignments : [];
      setAssignments(rows);
      setStudentId(data.student_id || null);
      setSelectedAssignment((current) =>
        rows.find((item) => item.assignment_id === (preferredId || current?.assignment_id)) || rows[0] || null
      );
    } catch (error) {
      setAssignments([]);
      setSelectedAssignment(null);
      setLoadError(error.message || "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAssignments(); }, []);

  /* -------------------------------------------------------
     AI ALERT
  ------------------------------------------------------- */

  async function handleAskAi() {
    try {
      setAlertLoading(true);
      setAlertResponse(null);

      const response = await generateAlert({
        assignment_name: selectedAssignment?.assignment_title || "Assignment",
        due_date: selectedAssignment?.due_date || "",
        user_email: "student@example.com",
        client_name: "SSS",
      });

      console.log(
        "GENERATE ALERT RESPONSE:",
        JSON.stringify(response, null, 2)
      );

      setAlertResponse(response);
      setShowAiSummary(true);
    } catch (error) {
      console.log("Generate Alert Error:", error);
      console.log(
        "Response:",
        error.response?.data
      );

      alert("Alert Generation Failed");
    } finally {
      setAlertLoading(false);
    }
  }

  /* -------------------------------------------------------
     FILE SELECT
  ------------------------------------------------------- */

  function handleFileChange(event) {
    const file = event.target.files?.[0];

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

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Only PDF, DOC, DOCX, JPG and PNG files are allowed."
      );

      event.target.value = "";
      setSelectedFile(null);

      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("File size must be less than 10 MB.");

      event.target.value = "";
      setSelectedFile(null);

      return;
    }

    console.log(
      "Selected File:",
      file
    );

    setSelectedFile(file);
  }

  /* -------------------------------------------------------
     REMOVE FILE
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     SUBMIT ASSIGNMENT
  ------------------------------------------------------- */

  async function handleSubmitAssignment() {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    if (!selectedAssignment || !studentId) {
      alert("Please select an assignment first.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/assignment-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          assignment_id: selectedAssignment.assignment_id,
          assignment_title: selectedAssignment.assignment_title,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          file_content_base64: await fileToBase64(selectedFile),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Unable to submit assignment.");
      alert(`${selectedFile.name} submitted successfully.`);
      setSelectedFile(null);
      await loadAssignments(selectedAssignment.assignment_id);
    } catch (error) {
      alert(error.message || "Assignment submission failed.");
    }
  }

  return (
    <DashboardShell>
      <section className="module-page">
        <StudyTabs />

        <div className="module-content-area">

          {/* -------------------------------------------------------
              ASSIGNMENT LIST
          ------------------------------------------------------- */}

          <div className="assignment-layout">

            <article className="module-card assignment-list-card">

              <div className="card-title-row">

                <h2>
                  Your Assignments
                </h2>

                <button
                  className="soft-button"
                  type="button"
                  onClick={() => loadAssignments()}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>

              </div>

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
                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {assignments.map((assignment) => (

                      <tr
                        className={selectedAssignment?.assignment_id === assignment.assignment_id ? "highlight-row" : ""}
                        key={assignment.assignment_id}
                      >

                        <td>
                          {assignment.number}
                        </td>

                        <td>
                          {assignment.assignment_title}
                        </td>

                        <td>
                          {formatDate(assignment.due_date)}
                        </td>

                        <td>

                          <span
                            className={`status-pill ${(assignment.status || "Not Started")
                              .toLowerCase()
                              .replaceAll(
                                " ",
                                "-"
                              )}`}
                          >
                            {assignment.status || "Not Started"}
                          </span>

                        </td>

                        <td>

                          <button
                            className="table-action"
                            type="button"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setSelectedFile(null);
                              setShowAiSummary(false);
                            }}
                          >
                            {assignment.action || "Start"}
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                  {!loading && assignments.length === 0 && (
                    <tr><td colSpan="5">{loadError || "No assignments available."}</td></tr>
                  )}

                </tbody>

              </table>

              <div className="tip-box">
                Tip: Submit your assignments on time
                to get early feedback and improve
                your score!
              </div>

            </article>

            {/* -------------------------------------------------------
                ASSIGNMENT DETAILS
            ------------------------------------------------------- */}

            <article className="module-card assignment-upload-card">

              <div className="card-title-row">

                <h2>
                  {selectedAssignment?.assignment_title || "Select an assignment"}
                </h2>

                <span className={`status-pill ${(selectedAssignment?.status || "not-started").toLowerCase().replaceAll(" ", "-")}`}>
                  {selectedAssignment?.status || "Not Started"}
                </span>

              </div>

              <div className="meta-row">

                <span>
                  Due Date: {formatDate(selectedAssignment?.due_date)}
                </span>

                <span>
                  {selectedAssignment?.subject_name || selectedAssignment?.chapter_name || "Assignment"}
                </span>

              </div>

              <p>
                {selectedAssignment?.assignment_text || "Select an assignment to view its instructions."}
              </p>

              {/* -------------------------------------------------------
                  AI ALERT
              ------------------------------------------------------- */}

              <div className="quiz-submit-row assignment-ai-row">

                <button
                  className="primary-button"
                  type="button"
                  onClick={handleAskAi}
                  disabled={alertLoading || !selectedAssignment}
                >
                  {alertLoading
                    ? "Generating..."
                    : "Ask AI"}
                </button>

              </div>

              {showAiSummary && (

                <div className="assignment-ai-summary">

                  <strong>
                    AI Summary
                  </strong>

                  <p>
                    {selectedAssignment?.assignment_text || "Read the assignment instructions carefully and submit before the due date."}
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

              {/* -------------------------------------------------------
                  FILE UPLOAD
              ------------------------------------------------------- */}

              <div className="upload-zone">

                <div className="upload-icon">
                  Upload
                </div>

                <strong>
                  Drag & drop your file here
                </strong>

                <span>
                  or
                </span>

                {/* Hidden File Input */}

                  <input
                    id="assignment-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    disabled={!selectedAssignment}
                  style={{
                    display: "none",
                  }}
                />

                {/* Browse Button */}

                <label
                  htmlFor="assignment-file"
                  className="soft-button"
                  style={{
                    cursor: "pointer",
                    display: "inline-block",
                    opacity: selectedAssignment ? 1 : 0.55,
                    pointerEvents: selectedAssignment ? "auto" : "none",
                  }}
                >
                  Browse Files
                </label>

                <small>
                  Supported formats:
                  PDF, DOC, DOCX, JPG, PNG
                  (Max 10 MB)
                </small>

                {/* -------------------------------------------------------
                    SELECTED FILE
                ------------------------------------------------------- */}

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
                      ).toFixed(2)}
                      {" "}MB
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

              {/* -------------------------------------------------------
                  SUBMIT ASSIGNMENT
              ------------------------------------------------------- */}

              <div className="submit-row">

                <div>

                  {selectedFile ? (

                    <>
                      <p>
                        File ready:
                        {" "}
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
                        Last saved:
                        {" "}
                        25 May 2024,
                        04:30 PM
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
                  disabled={!selectedFile || !selectedAssignment || !studentId}
                >
                  Submit Assignment
                </button>

              </div>

            </article>

          </div>

          {/* -------------------------------------------------------
              WORKFLOW
          ------------------------------------------------------- */}

          <article className="module-card workflow-card">

            <h2>
              Assignment Submission & Feedback
            </h2>

            <div className="workflow-steps">

              <div>
                <span>
                  1
                </span>

                <p>
                  Upload / Type Assignment
                </p>
              </div>

              <div>
                <span>
                  2
                </span>

                <p>
                  Teacher Review & Feedback
                </p>
              </div>

              <div>
                <span>
                  3
                </span>

                <p>
                  Revise (If Needed)
                </p>
              </div>

              <div>
                <span>
                  4
                </span>

                <p>
                  Final Submission Done
                </p>
              </div>

            </div>

          </article>

        </div>
      </section>
    </DashboardShell>
  );
}
