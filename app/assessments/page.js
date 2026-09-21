"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import DashboardShell from "../dashboard-shell";
import StudyTabs from "../study-tabs";
import { useSearchParams } from "next/navigation";

import { getApiBaseUrl } from "../api-base-url";

import {
  generateQuiz,
  evaluateQuiz,
} from "../../services/studentApi";

const API_BASE_URL = getApiBaseUrl();

const MOCK_TEST_DURATION_SECONDS = 15 * 60;

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
          Good progress. Continue practising concepts
          and try to provide more detailed explanations
          in long-answer questions.
        </p>
      </div>
    </article>
  );
}

/* =========================================================
   MOCK TIMER FORMAT
========================================================= */

function formatMockTimer(totalSeconds) {
  const safeSeconds = Math.max(
    0,
    Number(totalSeconds) || 0
  );

  const minutes = Math.floor(
    safeSeconds / 60
  );

  const seconds =
    safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

/* =========================================================
   MAIN ASSESSMENT CONTENT
========================================================= */

function AssessmentsContent() {
  const searchParams = useSearchParams();

  const requestedTab =
    searchParams.get("tab") ||
    searchParams.get("view");

  /* =======================================================
     STUDENT EMAIL
  ======================================================= */

  const [studentEmail, setStudentEmail] =
    useState("");

  /* =======================================================
     MAIN TAB

     Unit Test removed completely.
     Mock Test is the default.
  ======================================================= */

  const [activeOption, setActiveOption] =
    useState(
      requestedTab === "student-analysis"
        ? "student-analysis"
        : requestedTab === "teacher-remark"
          ? "teacher-remark"
          : "mock-test"
    );

  /* =======================================================
     MOCK TEST
  ======================================================= */

  const [quizChapters, setQuizChapters] =
    useState([]);

    const [selectedClass, setSelectedClass] =
  useState("");

  const [classes, setClasses] =
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

  const [mockResult, setMockResult] =
    useState(null);

  const [mockDifficulty, setMockDifficulty] =
    useState("easy");

  const [mockQuestionCount, setMockQuestionCount] =
    useState(5);

  /* =======================================================
     SGS-STYLE MOCK TEST STATE
  ======================================================= */

  const [mockPhase, setMockPhase] =
    useState("setup");

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [reviewedQuestions, setReviewedQuestions] =
    useState({});

  const [mockTimeLeft, setMockTimeLeft] =
    useState(MOCK_TEST_DURATION_SECONDS);

  const [showSubmitConfirmation, setShowSubmitConfirmation] =
    useState(false);

  const [autoSubmitted, setAutoSubmitted] =
    useState(false);

  /* =======================================================
     DEBUG
  ======================================================= */

  useEffect(() => {
    console.log(
      "🔥 MOCK PHASE:",
      mockPhase
    );

    console.log(
      "🔥 MOCK QUESTIONS:",
      mockQuestions.length
    );

    console.log(
      "🔥 MOCK ANSWERS:",
      mockAnswers
    );

    console.log(
      "🔥 MOCK SUBMITTED:",
      mockSubmitted
    );

    console.log(
      "🔥 MOCK RESULT:",
      mockResult
    );
  }, [
    mockPhase,
    mockQuestions,
    mockAnswers,
    mockSubmitted,
    mockResult,
  ]);

  /* =======================================================
     LOAD LOGGED-IN STUDENT EMAIL
  ======================================================= */

  useEffect(() => {
    async function loadStudentEmail() {
      try {
        const storedSession =
          window.sessionStorage.getItem(
            "sssUserSession"
          ) ||
          window.localStorage.getItem(
            "sssUserSession"
          );

        let session = storedSession
          ? JSON.parse(storedSession)
          : null;

        if (!session?.email) {
          const loginServiceUrl =
            process.env.NEXT_PUBLIC_LOGIN_URL ||
            window.location.origin;

          const sessionResponse =
            await fetch(
              `${loginServiceUrl}/api/auth/session`,
              {
                credentials: "include",
                cache: "no-store",
              }
            );

          if (sessionResponse.ok) {
            session =
              await sessionResponse
                .json()
                .catch(() => null);
          }
        }

        const email = (
          session?.email ||
          session?.user?.email ||
          ""
        ).trim();

        if (!email) {
          throw new Error(
            "Logged-in student email is unavailable."
          );
        }

        console.log(
          "LOGGED-IN STUDENT EMAIL:",
          email
        );

        setStudentEmail(email);
      } catch (error) {
        console.error(
          "STUDENT EMAIL LOAD ERROR:",
          error
        );

        setStudentEmail("");
      }
    }

    loadStudentEmail();
  }, []);

  /* =======================================================
     LOAD QUIZ CHAPTERS
  ======================================================= */
useEffect(() => {
  async function loadClasses() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/classes`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          `Classes API failed: ${response.status}`
        );
      }

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.classes)
          ? data.classes
          : [];

      setClasses(rows);
    } catch (error) {
      console.error(
        "CLASSES LOAD ERROR:",
        error
      );

      setClasses([]);
    }
  }

  loadClasses();
}, []);
  /* =======================================================
     UNIQUE SUBJECTS
  ======================================================= */

  const subjects = useMemo(() => {
    const subjectList =
      quizChapters
        .map(
          (item) =>
            item?.subject
        )
        .filter(Boolean);

    return [
      ...new Set(subjectList),
    ];
  }, [quizChapters]);

  /* =======================================================
     CHAPTERS FOR SUBJECT
  ======================================================= */

  const subjectChapters =
    useMemo(() => {
      return quizChapters.filter(
        (item) =>
          item?.subject ===
          selectedSubject
      );
    }, [
      quizChapters,
      selectedSubject,
    ]);

  /* =======================================================
     CURRENT CHAPTER
  ======================================================= */

  const currentMockChapter =
    useMemo(() => {
      return quizChapters.find(
        (item) =>
          String(
            item?.chapter_id
          ) ===
          String(
            selectedMockChapter
          )
      );
    }, [
      quizChapters,
      selectedMockChapter,
    ]);

  /* =======================================================
     ANSWERED COUNT
  ======================================================= */

  const answeredCount =
    Object.keys(
      mockAnswers
    ).length;

  const unansweredCount =
    Math.max(
      0,
      mockQuestions.length -
        answeredCount
    );

  /* =======================================================
     CHANGE SUBJECT
  ======================================================= */

  function handleSubjectChange(
    event
  ) {
    const subject =
      event.target.value;

    setSelectedSubject(
      subject
    );

    const chaptersForSubject =
      quizChapters.filter(
        (item) =>
          item?.subject ===
          subject
      );

    if (
      chaptersForSubject.length >
      0
    ) {
      setSelectedMockChapter(
        String(
          chaptersForSubject[0]
            .chapter_id
        )
      );
    } else {
      setSelectedMockChapter(
        ""
      );
    }

    resetMockTest();
  }

  /* =======================================================
     CHANGE CHAPTER
  ======================================================= */

  function handleChapterChange(
    event
  ) {
    setSelectedMockChapter(
      event.target.value
    );

    resetMockTest();
  }

  /* =======================================================
     GENERATE MOCK TEST
  ======================================================= */

  async function handleMockTest() {
    if (!studentEmail) {
      alert(
        "Student email not found."
      );
      return;
    }

    if (!currentMockChapter) {
      alert(
        "Please select a chapter."
      );
      return;
    }

    setMockLoading(true);

    setMockSubmitted(false);
    setMockEvaluation(null);
    setMockResult(null);

    setMockQuestions([]);
    setMockAnswers({});
    setReviewedQuestions({});

    setCurrentQuestion(0);

    setMockTimeLeft(
      MOCK_TEST_DURATION_SECONDS
    );

    setAutoSubmitted(false);
    setShowSubmitConfirmation(false);

    try {
      const topic =
        `${currentMockChapter.subject}: ${currentMockChapter.chapter_title}`;
const payload = {
  topic,
  chapter_id: currentMockChapter.chapter_id,
  difficulty: "easy",
  num_questions: 5,
  user_email: studentEmail,
  client_name: "SSS",
};
      console.log(
  "🔥 SELECTED MOCK CHAPTER:",
  currentMockChapter
);

console.log(
  "🔥 CHAPTER ID:",
  currentMockChapter?.chapter_id
);

console.log(
  "🔥 MOCK TEST REQUEST:",
  JSON.stringify(
    payload,
    null,
    2
  )
);

      const response =
        await generateQuiz(
          payload
        );

      console.log(
        "🔥 MOCK TEST RESPONSE:",
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
        generatedQuestions.length ===
        0
      ) {
        throw new Error(
          "No quiz questions were generated."
        );
      }

      setMockQuestions(
        generatedQuestions
      );

      setMockAnswers({});

      setReviewedQuestions({});

      setCurrentQuestion(0);

      setMockTimeLeft(
        MOCK_TEST_DURATION_SECONDS
      );

      setMockSubmitted(false);

      setMockEvaluation(null);

      setMockResult(null);

      setAutoSubmitted(false);

      setShowSubmitConfirmation(
        false
      );

      setMockPhase(
        "testing"
      );
    } catch (error) {
      console.error(
        "🔥 MOCK TEST GENERATION ERROR:",
        error
      );

      alert(
        error?.message ||
          "Failed to generate mock test."
      );
    } finally {
      setMockLoading(false);
    }
  }

  /* =======================================================
     EVALUATE MOCK TEST

     allowIncomplete = true is used ONLY when the timer
     reaches zero. Unanswered questions are submitted
     as empty answers.
  ======================================================= */

  async function handleMockEvaluation(
    allowIncomplete = false
  ) {
    console.log(
      "🔥 MOCK TEST EVALUATION STARTED"
    );

    if (
      mockQuestions.length ===
      0
    ) {
      alert(
        "No mock-test questions available."
      );
      return;
    }

    if (!studentEmail) {
      alert(
        "Student email is unavailable."
      );
      return;
    }

    if (!allowIncomplete) {
      const unansweredQuestions =
        mockQuestions.filter(
          (_, index) =>
            mockAnswers[index] ===
            undefined
        );

      if (
        unansweredQuestions.length >
        0
      ) {
        alert(
          `Please answer all ${mockQuestions.length} questions before submitting.`
        );
        return;
      }
    }

    try {
      setMockLoading(true);

      const answers =
        mockQuestions.map(
          (
            question,
            index
          ) => {
            const selectedOptionIndex =
              mockAnswers[index];

            const studentAnswer =
              selectedOptionIndex !==
              undefined
                ? question.options?.[
                    selectedOptionIndex
                  ] || ""
                : "";

            return {
              question:
                question.question,

              student_answer:
                studentAnswer,

              correct_answer:
                question.correct_answer,
            };
          }
        );

      const submission = {
        user_email:
          studentEmail,

        submission_data: {
          answers,
        },
      };

      console.log(
        "🔥 MOCK EVALUATION REQUEST:",
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
        "🔥 FULL MOCK EVALUATION RESPONSE:",
        JSON.stringify(
          result,
          null,
          2
        )
      );

      const score =
        Number(
          result?.score ??
            result?.correct_answers ??
            0
        );

      const total =
        Number(
          result?.total_questions ??
            mockQuestions.length
        );

      const percentage =
        total > 0
          ? Math.round(
              (score / total) *
                100
            )
          : 0;

      setMockEvaluation(
        result
      );

      setMockResult({
        score,
        total,
        percentage,
      });

      setMockSubmitted(true);

      setMockPhase(
        "results"
      );

      setShowSubmitConfirmation(
        false
      );

      setAutoSubmitted(
        allowIncomplete
      );

      console.log(
        "🔥 FINAL SCORE:",
        score
      );

      console.log(
        "🔥 FINAL TOTAL:",
        total
      );

      console.log(
        "🔥 FINAL PERCENTAGE:",
        percentage
      );
    } catch (error) {
      console.error(
        "🔥 MOCK TEST EVALUATION ERROR:",
        error
      );

      alert(
        error?.response?.data
          ?.detail ||
          error?.message ||
          "Mock Test Evaluation Failed"
      );
    } finally {
      setMockLoading(false);
    }
  }

  /* =======================================================
     TIMER

     When timer reaches zero:
     - automatically submit
     - unanswered questions become empty answers
     - show results
  ======================================================= */

  useEffect(() => {
    if (
      mockPhase !==
        "testing" ||
      mockSubmitted ||
      autoSubmitted
    ) {
      return undefined;
    }

    if (
      mockTimeLeft <= 0
    ) {
      console.log(
        "⏰ TIME UP - AUTO SUBMITTING MOCK TEST"
      );

      setShowSubmitConfirmation(
        false
      );

      handleMockEvaluation(
        true
      );

      return undefined;
    }

    const timer =
      window.setTimeout(
        () => {
          setMockTimeLeft(
            (previous) =>
              Math.max(
                previous - 1,
                0
              )
          );
        },
        1000
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    mockPhase,
    mockTimeLeft,
    mockSubmitted,
    autoSubmitted,
  ]);

  /* =======================================================
     SELECT ANSWER
  ======================================================= */

  function handleMockAnswerChange(
    questionIndex,
    optionIndex
  ) {
    if (
      mockSubmitted ||
      mockPhase !==
        "testing"
    ) {
      return;
    }

    setMockAnswers(
      (previous) => ({
        ...previous,

        [questionIndex]:
          optionIndex,
      })
    );
  }

  /* =======================================================
     MARK / REMOVE REVIEW
  ======================================================= */

  function toggleReview(
    questionIndex
  ) {
    if (
      mockSubmitted ||
      mockPhase !==
        "testing"
    ) {
      return;
    }

    setReviewedQuestions(
      (previous) => ({
        ...previous,

        [questionIndex]:
          !previous[
            questionIndex
          ],
      })
    );
  }

  /* =======================================================
     RESET ANSWERS ONLY

     IMPORTANT:
     Questions stay.
     Timer stays.
     Current question stays.
     Review marks stay.

     ONLY selected answers are cleared.
  ======================================================= */

  function resetMockAnswers() {
    if (
      mockSubmitted ||
      mockPhase !==
        "testing"
    ) {
      return;
    }

    console.log(
      "🧹 RESETTING ANSWERS ONLY"
    );

    setMockAnswers({});
  }

  /* =======================================================
     RESET / NEW TEST
  ======================================================= */

  function resetMockTest() {
    setMockQuestions([]);

    setMockAnswers({});

    setMockSubmitted(false);

    setMockEvaluation(null);

    setMockResult(null);

    setMockLoading(false);

    setMockPhase("setup");

    setCurrentQuestion(0);

    setReviewedQuestions({});

    setMockTimeLeft(
      MOCK_TEST_DURATION_SECONDS
    );

    setShowSubmitConfirmation(
      false
    );

    setAutoSubmitted(false);
  }

  /* =======================================================
     LOCAL SCORE
  ======================================================= */

  const mockScore =
    useMemo(() => {
      if (
        !mockSubmitted ||
        mockQuestions.length ===
          0
      ) {
        return null;
      }

      return mockQuestions.reduce(
        (
          total,
          question,
          index
        ) => {
          const selectedIndex =
            mockAnswers[index];

          const selectedAnswer =
            selectedIndex !==
            undefined
              ? question.options?.[
                  selectedIndex
                ]
              : "";

          return (
            total +
            (selectedAnswer ===
            question.correct_answer
              ? 1
              : 0)
          );
        },
        0
      );
    }, [
      mockSubmitted,
      mockQuestions,
      mockAnswers,
    ]);

  /* =======================================================
     API SCORE
  ======================================================= */

  const mockApiScore =
    mockEvaluation
      ?.evaluation_report
      ?.total_score ??
    mockEvaluation?.score ??
    mockEvaluation
      ?.evaluation_data
      ?.total_score ??
    null;

  /* =======================================================
     EVALUATION TEXT
  ======================================================= */

  const mockEvaluationText =
    mockEvaluation
      ?.evaluation_report
      ?.textual_report ||
    mockEvaluation
      ?.evaluation_report
      ?.feedback ||
    mockEvaluation
      ?.textual_report ||
    mockEvaluation?.feedback ||
    "Evaluation completed successfully.";

  /* =======================================================
     FINAL SCORE
  ======================================================= */

  const finalMockScore =
    mockResult?.score ??
    (mockApiScore !== null
      ? Number(
          mockApiScore
        )
      : mockScore !== null
        ? Number(
            mockScore
          )
        : 0);

  const finalMockTotal =
    mockResult?.total ??
    mockQuestions.length;

  const finalMockPercentage =
    mockResult?.percentage ??
    (finalMockTotal > 0 &&
    mockSubmitted
      ? Math.round(
          (finalMockScore /
            finalMockTotal) *
            100
        )
      : null);

  /* =======================================================
     ACTIVE QUESTION
  ======================================================= */

  const activeQuestion =
    mockQuestions[
      currentQuestion
    ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardShell>
      <section className="module-page">

        <StudyTabs />

        <div className="module-content-area assessment-content-area">

          {/* =================================================
              ASSESSMENT TABS

              UNIT TEST REMOVED
          ================================================= */}

          <div className="module-action-grid assessment-option-grid">

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
              MOCK TEST
          ================================================= */}

          {activeOption ===
            "mock-test" && (

            <div className="quiz-layout assessment-layout">

              {/* =================================================
                  LEFT SIDE
              ================================================= */}

              <article className="module-card purple-module">

                <div className="card-title-row">

                  <h2>
                    Mock Test
                  </h2>

                  <span
                    className={`status-pill ${
                      mockSubmitted
                        ? "completed"
                        : mockQuestions.length >
                            0
                          ? "in-progress"
                          : "in-progress"
                    }`}
                  >
                    {mockSubmitted
                      ? "Completed"
                      : mockQuestions.length >
                          0
                        ? "In Progress"
                        : "Ready"}
                  </span>

                </div>

                {/* =================================================
                    SUBJECT + CHAPTER + DIFFICULTY + QUESTIONS
                ================================================= */}
{mockPhase === "setup" && (

  <div className="mock-selection-grid">

    {/* CLASS */}
    <label className="assignment-field">

      <span>
        Class
      </span>
<select
  value={selectedClass}
  onChange={(event) => {
    setSelectedClass(event.target.value);
    setSelectedSubject("");
    setSelectedMockChapter("");
  }}
  disabled={mockLoading}
>
  <option value="">
    Select Class
  </option>

  {classes.map((item) => (
    <option
      key={item.class_id}
      value={item.class_id}
    >
      {item.class_name}
    </option>
  ))}
</select>

    </label>


    {/* SUBJECT */}
    <label className="assignment-field">

      <span>
        Subject
      </span>

      <select
        value={selectedSubject}
        onChange={handleSubjectChange}
        disabled={mockLoading}
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
        value={selectedMockChapter}
        onChange={handleChapterChange}
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
              key={chapter.chapter_id}
              value={chapter.chapter_id}
            >
              {chapter.chapter_title}
            </option>
          )
        )}

      </select>

    </label>

  </div>

)}

                {/* =================================================
                    CHAPTER META
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
  Questions: 5
</span>

                  </div>

                )}

                {/* =================================================
                    GENERATE
                ================================================= */}
{mockPhase === "setup" && (
  <div className="quiz-submit-row">
    <button
      className="primary-button"
      type="button"
      onPointerDown={(event) => {
        event.preventDefault();

        if (
          mockLoading ||
          !currentMockChapter ||
          !studentEmail
        ) {
          return;
        }

        handleMockTest();
      }}
      disabled={
        mockLoading ||
        !currentMockChapter ||
        !studentEmail
      }
    >
      {mockLoading
        ? "Generating..."
        : "Generate Mock Test"}
    </button>
  </div>
)}
                {/* =================================================
                    TIMER
                ================================================= */}

                {mockPhase ===
                  "testing" && (

                  <div className="mock-test-timer">

                    <span>
                      Time Left
                    </span>

                    <strong
                      className={
                        mockTimeLeft <=
                        120
                          ? "urgent"
                          : ""
                      }
                    >
                      {
                        formatMockTimer(
                          mockTimeLeft
                        )
                      }
                    </strong>

                  </div>

                )}

                {/* =================================================
                    CURRENT QUESTION
                ================================================= */}

                {mockPhase ===
                  "testing" &&
                  activeQuestion && (

                  <div className="quiz-question-list">

                    <fieldset
                      className="quiz-question"
                      disabled={
                        mockSubmitted ||
                        mockLoading
                      }
                    >

                      <legend>
                        {currentQuestion +
                          1}
                        .{" "}
                        {
                          activeQuestion.question
                        }
                      </legend>

                      <div className="quiz-options">

                        {(
                          activeQuestion.options ||
                          []
                        ).map(
                          (
                            option,
                            optionIndex
                          ) => {

                            const selected =
                              mockAnswers[
                                currentQuestion
                              ] ===
                              optionIndex;

                            return (
                              <label
                                key={
                                  optionIndex
                                }
                                className={`quiz-option ${
                                  selected
                                    ? "selected"
                                    : ""
                                }`}
                              >

                                <input
                                  type="radio"
                                  name={`mock-question-${currentQuestion}`}
                                  checked={
                                    selected
                                  }
                                  disabled={
                                    mockSubmitted ||
                                    mockLoading
                                  }
                                  onChange={() =>
                                    handleMockAnswerChange(
                                      currentQuestion,
                                      optionIndex
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

                  </div>

                )}

                {/* =================================================
                    PREVIOUS / REVIEW / NEXT
                ================================================= */}

                {mockPhase ===
                  "testing" &&
                  mockQuestions.length >
                    0 && (

                  <div className="quiz-submit-row">

                    <button
                      className="soft-button"
                      type="button"
                      disabled={
                        mockLoading ||
                        currentQuestion ===
                          0
                      }
                      onClick={() =>
                        setCurrentQuestion(
                          (
                            previous
                          ) =>
                            Math.max(
                              0,
                              previous -
                                1
                            )
                        )
                      }
                    >
                      Previous
                    </button>

                    <button
                      className={`soft-button ${
                        reviewedQuestions[
                          currentQuestion
                        ]
                          ? "review-active"
                          : ""
                      }`}
                      type="button"
                      disabled={
                        mockLoading
                      }
                      onClick={() =>
                        toggleReview(
                          currentQuestion
                        )
                      }
                    >
                      {reviewedQuestions[
                        currentQuestion
                      ]
                        ? "Remove Review Mark"
                        : "Mark for Review"}
                    </button>

                    <button
                      className="soft-button"
                      type="button"
                      disabled={
                        mockLoading ||
                        currentQuestion >=
                          mockQuestions.length -
                            1
                      }
                      onClick={() =>
                        setCurrentQuestion(
                          (
                            previous
                          ) =>
                            Math.min(
                              mockQuestions.length -
                                1,
                              previous +
                                1
                            )
                        )
                      }
                    >
                      Next
                    </button>

                  </div>

                )}

                {/* =================================================
                    TEST ACTIONS
                ================================================= */}

                {mockPhase ===
                  "testing" &&
                  mockQuestions.length >
                    0 && (

                  <div className="quiz-submit-row">

                    {/* RESET ANSWERS ONLY */}

                    <button
                      className="soft-button"
                      type="button"
                      onClick={
                        resetMockAnswers
                      }
                      disabled={
                        mockLoading ||
                        mockSubmitted
                      }
                    >
                      Reset Answers
                    </button>

                    {/* SUBMIT */}

                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => {
                        console.log(
                          "🔥 SUBMIT MOCK TEST CLICKED"
                        );

                        setShowSubmitConfirmation(
                          true
                        );
                      }}
                      disabled={
                        mockLoading ||
                        mockSubmitted
                      }
                    >
                      Submit Mock Test
                    </button>

                  </div>

                )}

                {/* =================================================
                    SUBMIT CONFIRMATION
                ================================================= */}

                {showSubmitConfirmation && (

                  <div className="quiz-confirmation">

                    <div className="quiz-confirmation-box">

                      <h3>
                        Submit Mock Test?
                      </h3>

                      <p>
                        You answered{" "}
                        {answeredCount}{" "}
                        of{" "}
                        {mockQuestions.length}{" "}
                        questions.
                      </p>

                      {unansweredCount >
                        0 && (

                        <div className="submission-warning">

                          {
                            unansweredCount
                          }{" "}
                          question
                          {unansweredCount >
                          1
                            ? "s"
                            : ""}{" "}
                          {unansweredCount >
                          1
                            ? "are"
                            : "is"}{" "}
                          unanswered.

                        </div>

                      )}

                      <div className="quiz-submit-row">

                        <button
                          className="soft-button"
                          type="button"
                          onClick={() =>
                            setShowSubmitConfirmation(
                              false
                            )
                          }
                          disabled={
                            mockLoading
                          }
                        >
                          Continue Test
                        </button>

                        <button
                          className="primary-button"
                          type="button"
                          onClick={() => {
                            setShowSubmitConfirmation(
                              false
                            );

                            handleMockEvaluation(
                              false
                            );
                          }}
                          disabled={
                            mockLoading
                          }
                        >
                          {mockLoading
                            ? "Submitting..."
                            : "Yes, Submit"}
                        </button>

                      </div>

                    </div>

                  </div>

                )}

                {/* =================================================
                    RESULTS - LEFT SIDE
                ================================================= */}

                {mockPhase ===
                  "results" &&
                  mockSubmitted && (

                  <div className="quiz-score-card assessment-ai-card">

                    {autoSubmitted && (

                      <div className="submission-warning">

                        Time completed, so the
                        mock test was submitted
                        automatically.

                      </div>

                    )}

                    <strong>
                      Mock Test Completed
                    </strong>

                    <p>
                      Your answers have been
                      evaluated successfully.
                    </p>

                    {mockEvaluation && (

                      <>
                        <strong>
                          Evaluation Report
                        </strong>

                        <p>
                          {
                            mockEvaluationText
                          }
                        </p>

                        {/* =================================================
    QUESTION-WISE RESULT REVIEW
================================================= */}

<div className="mock-question-review">

  <h3>
    Question-wise Results
  </h3>

  {mockQuestions.map((question, index) => {

    const selectedIndex =
      mockAnswers[index];

    const selectedAnswer =
      selectedIndex !== undefined
        ? question.options?.[selectedIndex] || ""
        : "";

    const correctAnswer =
      question.correct_answer ||
      question.answer ||
      "";

    const explanation =
      question.explanation ||
      "Explanation is not available for this question.";

    const isAnswered =
      selectedIndex !== undefined;

    const isCorrect =
      isAnswered &&
      selectedAnswer === correctAnswer;

    return (
      <div
        key={`result-${index}`}
        className={`mock-result-question ${
          isCorrect
            ? "result-correct"
            : isAnswered
              ? "result-wrong"
              : "result-unanswered"
        }`}
      >

        {/* Question + Status */}

        <div className="mock-result-question-header">

          <strong>
            Question {index + 1}
          </strong>

          <span>
            {isCorrect
              ? "Correct"
              : isAnswered
                ? "Wrong"
                : "Unanswered"}
          </span>

        </div>

        {/* Question */}

        <p className="mock-result-question-text">
          {question.question}
        </p>

        {/* Answers */}

        <div className="mock-answer-review">

          <div>
            <span>
              Your Answer
            </span>

            <strong>
              {selectedAnswer ||
                "Not answered"}
            </strong>
          </div>

          <div>
            <span>
              Correct Answer
            </span>

            <strong>
              {correctAnswer ||
                "Not available"}
            </strong>
          </div>

        </div>

        {/* Explanation */}

        <div className="mock-answer-explanation">

          <span>
            Why?
          </span>

          <p>
            {explanation}
          </p>

        </div>

      </div>
    );
  })}

</div>

                      </>


                    )}

                  </div>

                )}

              </article>

              {/* =================================================
                  RIGHT SIDE
              ================================================= */}

              <aside className="module-card latest-result-card">

                <h2>
                  {mockPhase ===
                  "results"
                    ? "Mock Test Result"
                    : "Question Palette"}
                </h2>

                {/* =================================================
                    QUESTION PALETTE
                ================================================= */}

                {mockQuestions.length >
                  0 && (

                  <div className="mock-question-palette">

                    {mockQuestions.map(
                      (
                        question,
                        index
                      ) => (

                        <button
                          key={`${question.question}-${index}`}
                          className={`${
                            currentQuestion ===
                            index
                              ? "current"
                              : ""
                          } ${
                            mockAnswers[
                              index
                            ] !==
                            undefined
                              ? "answered"
                              : ""
                          } ${
                            reviewedQuestions[
                              index
                            ]
                              ? "reviewed"
                              : ""
                          }`}
                          type="button"
                          onClick={() =>
                            setCurrentQuestion(
                              index
                            )
                          }
                          aria-label={`Open question ${
                            index +
                            1
                          }`}
                        >
                          {
                            index +
                            1
                          }
                        </button>

                      )
                    )}

                  </div>

                )}

                {/* =================================================
                    TESTING SIDEBAR
                ================================================= */}

                {mockPhase ===
                  "testing" &&
                  mockQuestions.length >
                    0 && (

                  <>

                    <div className="mock-progress-details">

                      <div>
                        <span>
                          Answered
                        </span>

                        <strong>
                          {
                            answeredCount
                          }
                          /
                          {
                            mockQuestions.length
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          For Review
                        </span>

                        <strong>
                          {
                            Object.values(
                              reviewedQuestions
                            ).filter(
                              Boolean
                            ).length
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Unanswered
                        </span>

                        <strong>
                          {
                            unansweredCount
                          }
                        </strong>
                      </div>

                    </div>

                  </>

                )}

                {/* =================================================
                    RESULTS SIDEBAR
                ================================================= */}

                {mockPhase ===
                  "results" &&
                  mockSubmitted && (

                  <>

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
                          {
                            finalMockScore
                          }{" "}
                          /{" "}
                          {
                            finalMockTotal
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Percentage
                        </span>

                        <strong className="score-text">
                          {finalMockPercentage !==
                          null
                            ? `${finalMockPercentage}%`
                            : "-"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Status
                        </span>

                        <strong>
                          Completed
                        </strong>
                      </div>

                    </div>

                    <div className="quiz-submit-row">

                      <button
                        className="primary-button"
                        type="button"
                        onClick={
                          resetMockTest
                        }
                        disabled={
                          mockLoading
                        }
                      >
                        Generate New Test
                      </button>

                    </div>

                  </>

                )}

              </aside>

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