"use client";

import { useState } from "react";
import DashboardShell from "../dashboard-shell";
import StudyTabs from "../study-tabs";
import { useSearchParams } from "next/navigation";

import {
  selfAssessment,
  generateQuiz,
  evaluateQuiz,
} from "../../services/studentApi";

const unitTest = {
  title: "Unit Test",
  subject: "Social Science",
  chapter: "Democratic India",
  question:
    "Explain why elections are important in a democratic country like India.",
  studentAnswer:
    "Elections are important because people can choose their leaders. If leaders do not work properly, citizens can vote for another leader in the next election.",
};

/* -------------------------------------------------------
   CHART COMPONENTS
------------------------------------------------------- */

function RingChart({ label = "365", caption = "Total Students" }) {
  return (
    <div className="ring-chart">
      <div className="ring-number">{label}</div>
      <span>{caption}</span>
    </div>
  );
}

function MiniBars() {
  return (
    <span className="mini-bars">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function LineChart({ labels, values, dashed = false }) {
  const max = Math.max(...values);

  const points = values
    .map(
      (value, index) =>
        `${24 + index * 58},${150 - (value / max) * 116}`
    )
    .join(" ");

  return (
    <div className="chart-panel">
      <svg viewBox="0 0 380 190">
        {[40, 75, 110, 145].map((y) => (
          <line
            key={y}
            className="chart-grid-line"
            x1="18"
            x2="354"
            y1={y}
            y2={y}
          />
        ))}

        <polyline
          className={dashed ? "line-dashed" : "line-solid"}
          points={points}
        />

        {values.map((value, index) => {
          const x = 24 + index * 58;
          const y = 150 - (value / max) * 116;

          return (
            <circle
              key={index}
              className="line-dot"
              cx={x}
              cy={y}
              r="5"
            />
          );
        })}
      </svg>

      <div className="chart-labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function BarChart() {
  const bars = [42, 30, 48, 72, 60, 74, 104];

  return (
    <div className="bar-chart">
      {bars.map((height, index) => (
        <div className="bar-stack" key={index}>
          <span style={{ height: `${height}px` }} />

          <i
            style={{
              height: `${Math.max(18, height - 22)}px`,
            }}
          />
        </div>
      ))}

      <div className="chart-labels">
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map(
          (month) => (
            <span key={month}>{month}</span>
          )
        )}
      </div>
    </div>
  );
}

function Heatmap({ compact = false }) {
  const colors = [
    "green",
    "lime",
    "yellow",
    "orange",
    "red",
  ];

  const rows = compact
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    : ["Mon", "Tue", "Wed", "Thu", "Sat"];

  const cols = compact
    ? ["Math", "Phys", "Chem", "Bio", "Eng"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  return (
    <div
      className={`heatmap ${
        compact ? "subject-heatmap" : ""
      }`}
    >
      <div className="heatmap-body">
        {rows.map((row, rowIndex) => (
          <div className="heatmap-row" key={row}>
            <span>{row}</span>

            {cols.map((col, colIndex) => (
              <i
                key={col}
                className={
                  colors[
                    (rowIndex + colIndex * 2) %
                      colors.length
                  ]
                }
              />
            ))}
          </div>
        ))}
      </div>

      <div className="heatmap-labels">
        {cols.map((col) => (
          <span key={col}>{col}</span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   STUDENT ANALYSIS
------------------------------------------------------- */

function StudentAnalysisView() {
  return (
    <div className="assessment-analysis-grid">
      <article className="module-card">
        <div className="card-title-row">
          <h2>Student Analysis</h2>

          <span className="status-pill completed">
            Performance
          </span>
        </div>

        <div className="result-grid quiz-result-grid">
          <div>
            <span>Student</span>
            <strong>Aarav</strong>
          </div>

          <div>
            <span>Class</span>
            <strong>Class 9 - A</strong>
          </div>

          <div>
            <span>Overall Score</span>

            <strong className="score-text">
              88%
            </strong>
          </div>
        </div>
      </article>

      <article className="module-card">
        <h2>Subject Performance</h2>

        <div className="analysis-list">
          <div className="analysis-row">
            <span>Mathematics</span>
            <strong>97%</strong>
          </div>

          <div className="analysis-row">
            <span>Science</span>
            <strong>80%</strong>
          </div>

          <div className="analysis-row">
            <span>English</span>
            <strong>78%</strong>
          </div>

          <div className="analysis-row">
            <span>Social Studies</span>
            <strong>88%</strong>
          </div>
        </div>
      </article>
    </div>
  );
}

/* -------------------------------------------------------
   TEACHER REMARK
------------------------------------------------------- */

function TeacherRemarkView() {
  return (
    <article className="module-card">
      <div className="card-title-row">
        <h2>Teacher Remark</h2>

        <span className="status-pill completed">
          Available
        </span>
      </div>

      <div className="assessment-answer-box">
        <span>Teacher Remark</span>

        <p>
          Good progress. Continue practising concepts and
          try to provide more detailed explanations in
          long-answer questions.
        </p>
      </div>
    </article>
  );
}

/* -------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------- */

export default function AssessmentsPage() {
  const searchParams = useSearchParams();

  const tabFromUrl =
    searchParams.get("tab") || "unit-test";

  const [activeOption, setActiveOption] =
    useState(tabFromUrl);

  const [showEvaluation, setShowEvaluation] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [assessmentResult, setAssessmentResult] =
    useState(null);

  const [mockQuestions, setMockQuestions] =
    useState([]);

  const [mockAnswers, setMockAnswers] =
    useState({});

  const [mockSubmitted, setMockSubmitted] =
    useState(false);

  const [mockLoading, setMockLoading] =
    useState(false);

  const [mockEvaluation, setMockEvaluation] =
    useState(null);

  /* -------------------------------------------------------
     UNIT TEST TAB
  ------------------------------------------------------- */

  function handleUnitTest() {
    setActiveOption("unit-test");
    setShowEvaluation(false);
    setAssessmentResult(null);
  }

  /* -------------------------------------------------------
     AI EVALUATION
  ------------------------------------------------------- */

  async function handleAiEvaluation() {
    try {
      setLoading(true);

      const response = await selfAssessment({
        user_email: "student@example.com",

        performance_data: {
          subject: unitTest.subject,
          chapter: unitTest.chapter,
          question: unitTest.question,
          student_answer: unitTest.studentAnswer,
        },
      });

      console.log(
        "FULL ASSESSMENT RESPONSE:",
        JSON.stringify(response, null, 2)
      );

      setAssessmentResult(response);
      setShowEvaluation(true);
      setActiveOption("unit-test");
    } catch (error) {
      console.log(
        "Assessment Error:",
        error
      );

      console.log(
        "Response:",
        error.response?.data
      );

      alert("Assessment Failed");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     MOCK TEST GENERATION
  ------------------------------------------------------- */

  async function handleMockTest() {
    try {
      setMockLoading(true);

      const response = await generateQuiz({
        topic: "Democratic India",
        difficulty: "easy",
        num_questions: 5,
        user_email: "student@example.com",
        client_name: "SSS",
      });

      console.log(
        "FULL MOCK TEST RESPONSE:",
        JSON.stringify(response, null, 2)
      );

      setMockQuestions(response.quiz_data || []);
      setMockAnswers({});
      setMockSubmitted(false);
      setMockEvaluation(null);
      setActiveOption("mock-test");
    } catch (error) {
      console.log(
        "Mock Test Generation Error:",
        error
      );

      console.log(
        "Response:",
        error.response?.data
      );

      alert("Mock Test Generation Failed");
    } finally {
      setMockLoading(false);
    }
  }

  /* -------------------------------------------------------
     MOCK TEST EVALUATION
  ------------------------------------------------------- */

  async function handleMockEvaluation() {
    try {
      setMockLoading(true);

      const submission = {
        user_email: "student@example.com",

        submission_data: {
          answers: mockQuestions.map(
            (question, index) => ({
              question: question.question,

              student_answer:
                question.options[
                  mockAnswers[index]
                ],

              correct_answer:
                question.correct_answer,
            })
          ),
        },
      };

      console.log(
        "MOCK EVALUATION REQUEST:",
        JSON.stringify(
          submission,
          null,
          2
        )
      );

      const result =
        await evaluateQuiz(submission);

      console.log(
        "MOCK TEST EVALUATION:",
        JSON.stringify(
          result,
          null,
          2
        )
      );

      setMockEvaluation(result);
      setMockSubmitted(true);
    } catch (error) {
      console.log(
        "Mock Test Evaluation Error:",
        error
      );

      console.log(
        "Response:",
        error.response?.data
      );

      alert(
        "Mock Test Evaluation Failed"
      );
    } finally {
      setMockLoading(false);
    }
  }

  /* -------------------------------------------------------
     RESET MOCK TEST
  ------------------------------------------------------- */

  function resetMockTest() {
    setMockQuestions([]);
    setMockAnswers({});
    setMockSubmitted(false);
    setMockEvaluation(null);
    setActiveOption("mock-test");
  }

  return (
    <DashboardShell>
      <section className="module-page">
        <StudyTabs />

        <div className="module-content-area assessment-content-area">

          {/* ------------------------------------------------
              ASSESSMENT OPTIONS
          ------------------------------------------------ */}

          <div className="module-action-grid assessment-option-grid">

            <button
              className={`module-action ${
                activeOption === "unit-test"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={handleUnitTest}
            >
              Unit Test
            </button>

            <button
              className={`module-action ${
                activeOption === "mock-test"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={handleMockTest}
              disabled={mockLoading}
            >
              {mockLoading
                ? "Generating..."
                : "Mock Test"}
            </button>

            <button
              className={`module-action ${
                activeOption ===
                "student-analysis"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() =>
                setActiveOption(
                  "student-analysis"
                )
              }
            >
              Student Analysis
            </button>

            <button
              className={`module-action ${
                activeOption ===
                "teacher-remark"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() =>
                setActiveOption(
                  "teacher-remark"
                )
              }
            >
              Teacher Remark
            </button>
          </div>

          {/* ------------------------------------------------
              UNIT TEST
          ------------------------------------------------ */}

          {activeOption === "unit-test" && (
            <div className="quiz-layout assessment-layout">

              <article className="module-card purple-module">

                <div className="card-title-row">
                  <h2>{unitTest.title}</h2>

                  <span
                    className={`status-pill ${
                      showEvaluation
                        ? "completed"
                        : "in-progress"
                    }`}
                  >
                    {showEvaluation
                      ? "Evaluated"
                      : "Ready"}
                  </span>
                </div>

                <div className="meta-row">
                  <span>
                    {unitTest.subject}
                  </span>

                  <span>
                    {unitTest.chapter}
                  </span>

                  <span>
                    Total Marks: 10
                  </span>
                </div>

                <div className="quiz-question-list">

                  <fieldset className="quiz-question">

                    <legend>
                      1. {unitTest.question}
                    </legend>

                    <div className="assessment-answer-box">

                      <span>
                        Student Answer
                      </span>

                      <p>
                        {unitTest.studentAnswer}
                      </p>

                    </div>

                  </fieldset>
                </div>

                <div className="quiz-submit-row">

                  <button
                    className="primary-button"
                    type="button"
                    onClick={
                      handleAiEvaluation
                    }
                    disabled={loading}
                  >
                    {loading
                      ? "Evaluating..."
                      : "AI Evaluation"}
                  </button>

                  <button
                    className="soft-button"
                    type="button"
                    onClick={handleUnitTest}
                  >
                    Reset
                  </button>

                </div>
              </article>

              {/* AI RESULT */}

              <article className="module-card latest-result-card">

                <h2>AI Evaluation</h2>

                <div className="result-grid quiz-result-grid">

                  <div>
                    <span>
                      Chapter
                    </span>

                    <strong>
                      {unitTest.chapter}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Score
                    </span>

                    <strong className="score-text">

                      {showEvaluation
                        ? `${(
                            (
                              assessmentResult
                                ?.assessment_data
                                ?.chart_data_per_subject
                                ?.[0]
                                ?.score ?? 0
                            ) / 10
                          ).toFixed(1)} / 10`
                        : "- / 10"}

                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {showEvaluation
                        ? "Completed"
                        : "Pending"}
                    </strong>
                  </div>

                </div>

                {showEvaluation && (
                  <div className="quiz-score-card assessment-ai-card">

                    <strong>
                      AI Evaluation Report
                    </strong>

                    <p>
                      {assessmentResult
                        ?.assessment_data
                        ?.textual_report ||
                        "No evaluation report available"}
                    </p>

                  </div>
                )}

              </article>
            </div>
          )}

          {/* ------------------------------------------------
              MOCK TEST
          ------------------------------------------------ */}

          {activeOption === "mock-test" && (
            <div className="quiz-layout assessment-layout">

              <article className="module-card purple-module">

                <div className="card-title-row">

                  <h2>Mock Test</h2>

                  <span
                    className={`status-pill ${
                      mockSubmitted
                        ? "completed"
                        : "in-progress"
                    }`}
                  >
                    {mockSubmitted
                      ? "Completed"
                      : "In Progress"}
                  </span>

                </div>

                <div className="meta-row">

                  <span>
                    Social Science
                  </span>

                  <span>
                    Democratic India
                  </span>

                  <span>
                    Total Marks: 25
                  </span>

                  <span>
                    Questions:{" "}
                    {mockQuestions.length}
                  </span>

                </div>

                {/* NO QUESTIONS */}

                {mockQuestions.length === 0 ? (

                  <div className="quiz-submit-row">

                    <button
                      className="primary-button"
                      type="button"
                      onClick={
                        handleMockTest
                      }
                      disabled={mockLoading}
                    >
                      {mockLoading
                        ? "Generating..."
                        : "Generate Mock Test"}
                    </button>

                  </div>

                ) : (

                  <>
                    {/* QUESTIONS */}

                    <div className="quiz-question-list">

                      {mockQuestions.map(
                        (
                          question,
                          questionIndex
                        ) => (

                          <fieldset
                            className="quiz-question"
                            key={
                              questionIndex
                            }
                            disabled={
                              mockSubmitted
                            }
                          >

                            <legend>
                              {questionIndex + 1}.{" "}
                              {question.question}
                            </legend>

                            <div className="quiz-options">

                              {question.options?.map(
                                (
                                  option,
                                  optionIndex
                                ) => {

                                  const selected =
                                    mockAnswers[
                                      questionIndex
                                    ] ===
                                    optionIndex;

                                  /*
                                   * IMPORTANT:
                                   * API returns
                                   * correct_answer
                                   * not answer
                                   */

                                  const correct =
                                    mockSubmitted &&
                                    option ===
                                      question.correct_answer;

                                  const wrong =
                                    mockSubmitted &&
                                    selected &&
                                    option !==
                                      question.correct_answer;

                                  return (
                                    <label
                                      key={
                                        optionIndex
                                      }
                                      className={`quiz-option ${
                                        selected
                                          ? "selected"
                                          : ""
                                      } ${
                                        correct
                                          ? "correct"
                                          : ""
                                      } ${
                                        wrong
                                          ? "wrong"
                                          : ""
                                      }`}
                                    >

                                      <input
                                        type="radio"
                                        name={`mock-question-${questionIndex}`}
                                        checked={
                                          selected
                                        }
                                        onChange={() =>
                                          setMockAnswers(
                                            (
                                              prev
                                            ) => ({
                                              ...prev,
                                              [questionIndex]:
                                                optionIndex,
                                            })
                                          )
                                        }
                                      />

                                      <span>
                                        {option}
                                      </span>

                                    </label>
                                  );
                                }
                              )}

                            </div>

                          </fieldset>
                        )
                      )}

                    </div>

                    {/* SUBMIT */}

                    <div className="quiz-submit-row">

                      <button
                        className="primary-button"
                        type="button"
                        disabled={
                          mockSubmitted ||
                          Object.keys(
                            mockAnswers
                          ).length !==
                            mockQuestions.length
                        }
                        onClick={
                          handleMockEvaluation
                        }
                      >
                        {mockLoading
                          ? "Evaluating..."
                          : "Submit Mock Test"}
                      </button>

                      <button
                        className="soft-button"
                        type="button"
                        onClick={
                          resetMockTest
                        }
                      >
                        Reset
                      </button>

                    </div>
                  </>
                )}
              </article>

              {/* ------------------------------------------------
                  MOCK TEST RESULT
              ------------------------------------------------ */}

              <article className="module-card latest-result-card">

                <h2>
                  Mock Test Result
                </h2>

                <div className="result-grid quiz-result-grid">

                  <div>
                    <span>
                      Chapter
                    </span>

                    <strong>
                      Democratic India
                    </strong>
                  </div>

                  <div>
                    <span>
                      Score
                    </span>

                    <strong className="score-text">

                      {mockSubmitted
                        ? (
                            mockEvaluation
                              ?.evaluation_report
                              ?.total_score ||
                            mockEvaluation
                              ?.score ||
                            mockEvaluation
                              ?.evaluation_data
                              ?.total_score ||
                            "Evaluated"
                          )
                        : "- / 25"}

                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>

                      {mockSubmitted
                        ? "Completed"
                        : mockQuestions.length >
                          0
                        ? "In Progress"
                        : "Pending"}

                    </strong>
                  </div>

                </div>

                {/* Evaluation Report */}

                {mockSubmitted &&
                  mockEvaluation && (
                    <div className="quiz-score-card assessment-ai-card">

                      <strong>
                        Mock Test Evaluation
                      </strong>

                      <p>
                        {mockEvaluation
                          ?.evaluation_report
                          ?.textual_report ||
                          mockEvaluation
                            ?.evaluation_report
                            ?.feedback ||
                          mockEvaluation
                            ?.textual_report ||
                          "Evaluation completed successfully."}
                      </p>

                    </div>
                  )}

              </article>
            </div>
          )}

          {/* ------------------------------------------------
              STUDENT ANALYSIS
          ------------------------------------------------ */}

          {activeOption ===
            "student-analysis" && (
            <StudentAnalysisView />
          )}

          {/* ------------------------------------------------
              TEACHER REMARK
          ------------------------------------------------ */}

          {activeOption ===
            "teacher-remark" && (
            <TeacherRemarkView />
          )}

        </div>
      </section>
    </DashboardShell>
  );
}