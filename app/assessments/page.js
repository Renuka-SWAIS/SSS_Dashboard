"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import DashboardShell from "../dashboard-shell";
import StudyTabs from "../study-tabs";
import { useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "../api-base-url";

import {
  selfAssessment,
  generateQuiz,
  evaluateQuiz,
} from "../../services/studentApi";

const API_BASE_URL = getApiBaseUrl();

/* =========================================================
   UNIT TEST
   ========================================================= */

const unitTest = {
  title: "Unit Test",
  subject: "Social Science",
  chapter: "Democratic India",
  question:
    "Explain why elections are important in a democratic country like India.",
  studentAnswer:
    "Elections are important because people can choose their leaders. If leaders do not work properly, citizens can vote for another leader in the next election.",
};

/* =========================================================
   STUDENT ANALYSIS
   ========================================================= */

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
            <strong className="score-text">88%</strong>
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

/* =========================================================
   TEACHER REMARK
   ========================================================= */

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
          Good progress. Continue practising concepts and try
          to provide more detailed explanations in long-answer
          questions.
        </p>
      </div>
    </article>
  );
}

/* =========================================================
   MAIN ASSESSMENT CONTENT
   ========================================================= */

function AssessmentsContent() {
  const searchParams = useSearchParams();

  const tabFromUrl =
    searchParams.get("tab") || "unit-test";

  /* -------------------------------------------------------
     MAIN TAB
     ------------------------------------------------------- */

  const [activeOption, setActiveOption] =
    useState(tabFromUrl);

  /* -------------------------------------------------------
     UNIT TEST STATE
     ------------------------------------------------------- */

  const [showEvaluation, setShowEvaluation] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [assessmentResult, setAssessmentResult] =
    useState(null);

  /* -------------------------------------------------------
     MOCK TEST STATE
     ------------------------------------------------------- */

  const [quizChapters, setQuizChapters] =
    useState([]);

  const [selectedSubject, setSelectedSubject] =
    useState("");

  const [selectedMockChapter, setSelectedMockChapter] =
    useState("");

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

  const [mockDifficulty, setMockDifficulty] =
    useState("easy");

  const [mockQuestionCount, setMockQuestionCount] =
    useState(5);

  /* =======================================================
     LOAD SUBJECTS + CHAPTERS
     ======================================================= */

  useEffect(() => {
    async function loadQuizChapters() {
      try {
        console.log(
          "QUIZ CHAPTER API:",
          `${API_BASE_URL}/quiz-chapters`
        );

        const response = await fetch(
          `${API_BASE_URL}/quiz-chapters`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Quiz chapters API failed: ${response.status}`
          );
        }

        const data = await response.json();

        console.log(
          "QUIZ CHAPTER DATA:",
          data
        );

        const rows = Array.isArray(data.chapters)
          ? data.chapters
          : [];

        setQuizChapters(rows);

        if (rows.length > 0) {
          const firstSubject =
            rows[0].subject || "";

          const firstChapter =
            rows[0].chapter_id;

          setSelectedSubject(firstSubject);
          setSelectedMockChapter(
            String(firstChapter)
          );
        }
      } catch (error) {
        console.error(
          "QUIZ CHAPTER LOAD ERROR:",
          error
        );

        setQuizChapters([]);
      }
    }

    loadQuizChapters();
  }, []);

  /* =======================================================
     UNIQUE SUBJECTS
     ======================================================= */

  const subjects = useMemo(() => {
    const subjectList = quizChapters
      .map((item) => item.subject)
      .filter(Boolean);

    return [...new Set(subjectList)];
  }, [quizChapters]);

  /* =======================================================
     CHAPTERS FOR SELECTED SUBJECT
     ======================================================= */

  const subjectChapters = useMemo(() => {
    return quizChapters.filter(
      (item) =>
        item.subject === selectedSubject
    );
  }, [
    quizChapters,
    selectedSubject,
  ]);

  /* =======================================================
     CURRENT CHAPTER
     ======================================================= */

  const currentMockChapter = useMemo(() => {
    return quizChapters.find(
      (item) =>
        String(item.chapter_id) ===
        String(selectedMockChapter)
    );
  }, [
    quizChapters,
    selectedMockChapter,
  ]);

  /* =======================================================
     CHANGE SUBJECT
     ======================================================= */

  function handleSubjectChange(event) {
    const subject = event.target.value;

    setSelectedSubject(subject);

    const chaptersForSubject =
      quizChapters.filter(
        (item) =>
          item.subject === subject
      );

    if (chaptersForSubject.length > 0) {
      setSelectedMockChapter(
        String(
          chaptersForSubject[0].chapter_id
        )
      );
    } else {
      setSelectedMockChapter("");
    }

    resetMockTest();
  }

  /* =======================================================
     CHANGE CHAPTER
     ======================================================= */

  function handleChapterChange(event) {
    setSelectedMockChapter(
      event.target.value
    );

    resetMockTest();
  }

  /* =======================================================
     UNIT TEST
     ======================================================= */

  function handleUnitTest() {
    setActiveOption("unit-test");
    setShowEvaluation(false);
    setAssessmentResult(null);
  }

  /* =======================================================
     AI UNIT TEST EVALUATION
     ======================================================= */

  async function handleAiEvaluation() {
    try {
      setLoading(true);

      const response =
        await selfAssessment({
          user_email:
            "student@example.com",

          performance_data: {
            subject: unitTest.subject,
            chapter: unitTest.chapter,
            question: unitTest.question,
            student_answer:
              unitTest.studentAnswer,
          },
        });

      console.log(
        "FULL ASSESSMENT RESPONSE:",
        JSON.stringify(
          response,
          null,
          2
        )
      );

      setAssessmentResult(response);
      setShowEvaluation(true);
      setActiveOption("unit-test");
    } catch (error) {
      console.error(
        "Assessment Error:",
        error
      );

      console.error(
        "Response:",
        error?.response?.data
      );

      alert("Assessment Failed");
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     MOCK TEST GENERATION
     ======================================================= */

  async function handleMockTest() {
    if (!currentMockChapter) {
      alert(
        "Please select a subject and chapter."
      );

      return;
    }

    try {
      setMockLoading(true);

      console.log(
        "GENERATING QUIZ FOR:",
        currentMockChapter.subject,
        currentMockChapter.chapter_title
      );

      /*
       * IMPORTANT
       *
       * The topic sent to the AI contains BOTH
       * subject and chapter.
       *
       * This removes the old Social Science hardcode.
       */

      const topic =
        `${currentMockChapter.subject}: ${currentMockChapter.chapter_title}`;

      console.log(
        "AI QUIZ TOPIC:",
        topic
      );

      const response =
        await generateQuiz({
          topic: topic,

          difficulty:
            mockDifficulty,

          num_questions:
            Number(mockQuestionCount),

          user_email:
            "student@example.com",

          client_name:
            "SSS",
        });

      console.log(
        "FULL MOCK TEST RESPONSE:",
        JSON.stringify(
          response,
          null,
          2
        )
      );

      const generatedQuestions =
        Array.isArray(
          response?.quiz_data
        )
          ? response.quiz_data
          : [];

      if (
        generatedQuestions.length === 0
      ) {
        alert(
          "AI did not generate any questions."
        );

        return;
      }

      setMockQuestions(
        generatedQuestions
      );

      setMockAnswers({});

      setMockSubmitted(false);

      setMockEvaluation(null);

      setActiveOption("mock-test");
    } catch (error) {
      console.error(
        "Mock Test Generation Error:",
        error
      );

      console.error(
        "Response:",
        error?.response?.data
      );

      alert(
        "Mock Test Generation Failed"
      );
    } finally {
      setMockLoading(false);
    }
  }

  /* =======================================================
     MOCK TEST EVALUATION
     ======================================================= */

  async function handleMockEvaluation() {
    if (
      mockQuestions.length === 0
    ) {
      return;
    }

    try {
      setMockLoading(true);

      const submission = {
        user_email:
          "student@example.com",

        submission_data: {
          answers:
            mockQuestions.map(
              (
                question,
                index
              ) => ({
                question:
                  question.question,

                student_answer:
                  question.options?.[
                    mockAnswers[index]
                  ] || "",

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
        await evaluateQuiz(
          submission
        );

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
      console.error(
        "Mock Test Evaluation Error:",
        error
      );

      console.error(
        "Response:",
        error?.response?.data
      );

      alert(
        "Mock Test Evaluation Failed"
      );
    } finally {
      setMockLoading(false);
    }
  }

  /* =======================================================
     RESET MOCK TEST
     ======================================================= */

  function resetMockTest() {
    setMockQuestions([]);

    setMockAnswers({});

    setMockSubmitted(false);

    setMockEvaluation(null);
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <DashboardShell>
      <section className="module-page">

        <StudyTabs />

        <div className="module-content-area assessment-content-area">

          {/* =================================================
              ASSESSMENT OPTIONS
          ================================================= */}

          <div className="module-action-grid assessment-option-grid">

            <button
              className={`module-action ${
                activeOption ===
                "unit-test"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={
                handleUnitTest
              }
            >
              Unit Test
            </button>

            <button
              className={`module-action ${
                activeOption ===
                "mock-test"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() =>
                setActiveOption(
                  "mock-test"
                )
              }
            >
              Mock Test
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

          {/* =================================================
              UNIT TEST
          ================================================= */}

          {activeOption ===
            "unit-test" && (

            <div className="quiz-layout assessment-layout">

              <article className="module-card purple-module">

                <div className="card-title-row">

                  <h2>
                    {unitTest.title}
                  </h2>

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
                      1.{" "}
                      {unitTest.question}
                    </legend>

                    <div className="assessment-answer-box">

                      <span>
                        Student Answer
                      </span>

                      <p>
                        {
                          unitTest.studentAnswer
                        }
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
                    onClick={
                      handleUnitTest
                    }
                  >
                    Reset
                  </button>

                </div>

              </article>

              {/* UNIT TEST RESULT */}

              <article className="module-card latest-result-card">

                <h2>
                  AI Evaluation
                </h2>

                <div className="result-grid quiz-result-grid">

                  <div>
                    <span>
                      Chapter
                    </span>

                    <strong>
                      {
                        unitTest.chapter
                      }
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
                                ?.chart_data_per_subject?.[0]
                                ?.score ??
                              0
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
                      {
                        assessmentResult
                          ?.assessment_data
                          ?.textual_report ||
                        "No evaluation report available"
                      }
                    </p>

                  </div>
                )}

              </article>

            </div>
          )}

          {/* =================================================
              MOCK TEST
          ================================================= */}

          {activeOption ===
            "mock-test" && (

            <div className="quiz-layout assessment-layout">

              <article className="module-card purple-module">

                <div className="card-title-row">

                  <h2>
                    Mock Test
                  </h2>

                  <span
                    className={`status-pill ${
                      mockSubmitted
                        ? "completed"
                        : "in-progress"
                    }`}
                  >
                    {mockSubmitted
                      ? "Completed"
                      : "Ready"}
                  </span>

                </div>

                {/* =================================================
                    SUBJECT + CHAPTER SELECTION
                ================================================= */}

                <div className="mock-selection-grid">

                  {/* SUBJECT */}

                  <label className="assignment-field">

                    <span>
                      Subject
                    </span>

                    <select
                      value={
                        selectedSubject
                      }
                      onChange={
                        handleSubjectChange
                      }
                      disabled={
                        mockLoading
                      }
                    >

                      <option value="">
                        Select Subject
                      </option>

                      {subjects.map(
                        (subject) => (
                          <option
                            key={subject}
                            value={subject}
                          >
                            {subject}
                          </option>
                        )
                      )}

                    </select>

                  </label>

                  {/* CHAPTER */}

                  <label className="assignment-field">

                    <span>
                      Chapter
                    </span>

                    <select
                      value={
                        selectedMockChapter
                      }
                      onChange={
                        handleChapterChange
                      }
                      disabled={
                        mockLoading ||
                        !selectedSubject
                      }
                    >

                      <option value="">
                        Select Chapter
                      </option>

                      {subjectChapters.map(
                        (chapter) => (
                          <option
                            key={
                              chapter.chapter_id
                            }
                            value={
                              chapter.chapter_id
                            }
                          >
                            {
                              chapter.chapter_title
                            }
                          </option>
                        )
                      )}

                    </select>

                  </label>

                  {/* DIFFICULTY */}

                  <label className="assignment-field">

                    <span>
                      Difficulty
                    </span>

                    <select
                      value={
                        mockDifficulty
                      }
                      onChange={(event) =>
                        setMockDifficulty(
                          event.target.value
                        )
                      }
                      disabled={
                        mockLoading
                      }
                    >

                      <option value="easy">
                        Easy
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="hard">
                        Hard
                      </option>

                    </select>

                  </label>

                  {/* NUMBER OF QUESTIONS */}

                  <label className="assignment-field">

                    <span>
                      Questions
                    </span>

                    <select
                      value={
                        mockQuestionCount
                      }
                      onChange={(event) =>
                        setMockQuestionCount(
                          Number(
                            event.target.value
                          )
                        )
                      }
                      disabled={
                        mockLoading
                      }
                    >

                      <option value={5}>
                        5
                      </option>

                      <option value={10}>
                        10
                      </option>

                      <option value={15}>
                        15
                      </option>

                      <option value={20}>
                        20
                      </option>

                    </select>

                  </label>

                </div>

                {/* =================================================
                    SELECTED CHAPTER INFO
                ================================================= */}

                {currentMockChapter && (
                  <div className="meta-row">

                    <span>
                      {
                        currentMockChapter.subject
                      }
                    </span>

                    <span>
                      {
                        currentMockChapter.chapter_title
                      }
                    </span>

                    <span>
                      Difficulty:{" "}
                      {mockDifficulty}
                    </span>

                    <span>
                      Questions:{" "}
                      {mockQuestionCount}
                    </span>

                  </div>
                )}

                {/* =================================================
                    GENERATE BUTTON
                ================================================= */}

                {mockQuestions.length ===
                  0 && (

                  <div className="quiz-submit-row">

                    <button
                      className="primary-button"
                      type="button"
                      onClick={
                        handleMockTest
                      }
                      disabled={
                        mockLoading ||
                        !currentMockChapter
                      }
                    >
                      {mockLoading
                        ? "Generating..."
                        : "Generate Mock Test"}
                    </button>

                  </div>
                )}

                {/* =================================================
                    QUESTIONS
                ================================================= */}

                {mockQuestions.length >
                  0 && (

                  <>

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
                              {questionIndex +
                                1}
                              .{" "}
                              {
                                question.question
                              }
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
                                        disabled={
                                          mockSubmitted
                                        }
                                        onChange={() =>
                                          setMockAnswers(
                                            (
                                              previous
                                            ) => ({
                                              ...previous,
                                              [questionIndex]:
                                                optionIndex,
                                            })
                                          )
                                        }
                                      />

                                      <span>
                                        {
                                          option
                                        }
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

                    {/* =================================================
                        SUBMIT / RESET
                    ================================================= */}

                    <div className="quiz-submit-row">

                      <button
                        className="primary-button"
                        type="button"
                        disabled={
                          mockSubmitted ||
                          mockLoading ||
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
                        disabled={
                          mockLoading
                        }
                      >
                        Reset
                      </button>

                    </div>

                  </>
                )}

              </article>

              {/* =================================================
                  MOCK TEST RESULT
              ================================================= */}

              <article className="module-card latest-result-card">

                <h2>
                  Mock Test Result
                </h2>

                <div className="result-grid quiz-result-grid">

                  <div>
                    <span>
                      Subject
                    </span>

                    <strong>
                      {
                        currentMockChapter
                          ?.subject ||
                        "-"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Chapter
                    </span>

                    <strong>
                      {
                        currentMockChapter
                          ?.chapter_title ||
                        "-"
                      }
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
                              ?.total_score ??
                            mockEvaluation
                              ?.score ??
                            mockEvaluation
                              ?.evaluation_data
                              ?.total_score ??
                            "Evaluated"
                          )
                        : "- / -"}

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

                {/* =================================================
                    EVALUATION REPORT
                ================================================= */}

                {mockSubmitted &&
                  mockEvaluation && (

                  <div className="quiz-score-card assessment-ai-card">

                    <strong>
                      Mock Test Evaluation
                    </strong>

                    <p>
                      {
                        mockEvaluation
                          ?.evaluation_report
                          ?.textual_report ||
                        mockEvaluation
                          ?.evaluation_report
                          ?.feedback ||
                        mockEvaluation
                          ?.textual_report ||
                        "Evaluation completed successfully."
                      }
                    </p>

                  </div>
                )}

              </article>

            </div>
          )}

          {/* =================================================
              STUDENT ANALYSIS
          ================================================= */}

          {activeOption ===
            "student-analysis" && (
            <StudentAnalysisView />
          )}

          {/* =================================================
              TEACHER REMARK
          ================================================= */}

          {activeOption ===
            "teacher-remark" && (
            <TeacherRemarkView />
          )}

        </div>
      </section>
    </DashboardShell>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function AssessmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="module-page">
          Loading assessments...
        </div>
      }
    >
      <AssessmentsContent />
    </Suspense>
  );
}