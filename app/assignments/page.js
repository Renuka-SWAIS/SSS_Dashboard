"use client";

import { useState } from "react";
import DashboardShell from "../dashboard-shell";
import StudyTabs from "../study-tabs";
import { generateAlert } from "../../services/studentApi";

const assignments = [
  ["1", "AI Ethics Case Study", "20 May 2024", "Submitted", "View"],
  ["2", "Data Privacy Analysis", "28 May 2024", "In Progress", "Continue"],
  ["3", "Logistics Problem Set", "05 Jun 2024", "Not Started", "Start"],
  ["4", "Algorithm Bias Report", "12 Jun 2024", "Not Started", "Start"],
  ["5", "Sustainable Supply Chain", "20 Jun 2024", "Not Started", "Start"],
];

export default function AssignmentsPage() {
  const [showAiSummary, setShowAiSummary] = useState(false);

  const [alertLoading, setAlertLoading] = useState(false);
  const [alertResponse, setAlertResponse] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  /* -------------------------------------------------------
     AI ALERT
  ------------------------------------------------------- */

  async function handleAskAi() {
    try {
      setAlertLoading(true);
      setAlertResponse(null);

      const response = await generateAlert({
        assignment_name: "Data Privacy Analysis",
        due_date: "2024-05-28",
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

  function handleSubmitAssignment() {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    console.log(
      "Ready to submit:",
      selectedFile
    );

    /*
      Backend submission API will be connected here
      after confirming the Swagger request-body fields.
    */

    alert(
      `${selectedFile.name} is ready for submission.`
    );
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
                >
                  View All
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

                  {assignments.map(
                    ([
                      number,
                      title,
                      dueDate,
                      status,
                      action,
                    ]) => (

                      <tr
                        className={
                          status ===
                          "In Progress"
                            ? "highlight-row"
                            : ""
                        }
                        key={number}
                      >

                        <td>
                          {number}
                        </td>

                        <td>
                          {title}
                        </td>

                        <td>
                          {dueDate}
                        </td>

                        <td>

                          <span
                            className={`status-pill ${status
                              .toLowerCase()
                              .replaceAll(
                                " ",
                                "-"
                              )}`}
                          >
                            {status}
                          </span>

                        </td>

                        <td>

                          <button
                            className="table-action"
                            type="button"
                          >
                            {action}
                          </button>

                        </td>

                      </tr>

                    )
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
                  Assignment 2:
                  Data Privacy Analysis
                </h2>

                <span className="status-pill in-progress">
                  In Progress
                </span>

              </div>

              <div className="meta-row">

                <span>
                  Due Date: 28 May 2024
                </span>

                <span>
                  Max Marks: 25
                </span>

              </div>

              <p>
                Analyze a real-world data privacy
                scenario and identify potential risks.
                Suggest proper mitigation strategies.
              </p>

              {/* -------------------------------------------------------
                  AI ALERT
              ------------------------------------------------------- */}

              <div className="quiz-submit-row assignment-ai-row">

                <button
                  className="primary-button"
                  type="button"
                  onClick={handleAskAi}
                  disabled={alertLoading}
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
                    Data Privacy Analysis asks you
                    to study how personal data can be
                    exposed or misused, identify privacy
                    risks, and recommend practical
                    safeguards such as consent, access
                    control, encryption, and responsible
                    data handling.
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
                  disabled={!selectedFile}
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