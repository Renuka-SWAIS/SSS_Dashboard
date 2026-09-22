"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../dashboard-shell";
import StudyTabs from "../study-tabs";
import {
  generateQuiz,
  evaluateQuiz,
} from "../../services/studentApi";
import { getApiBaseUrl } from "../api-base-url";

const API_BASE_URL = getApiBaseUrl();

export default function QuizzesPage() {
  /* =========================================================
     CLASS / SUBJECT / CHAPTER
  ========================================================= */

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);

  const [selectedClass, setSelectedClass] =
    useState("");

  const [selectedSubject, setSelectedSubject] =
    useState("");

  const [selectedChapter, setSelectedChapter] =
    useState("");

  /* =========================================================
     QUIZ
  ========================================================= */

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [quizRequested, setQuizRequested] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] =
    useState(null);

  /* =========================================================
     LOAD CLASSES
  ========================================================= */

  useEffect(() => {
    async function loadClasses() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/classes`,
          {
            cache: "no-store",
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            "Unable to load classes."
          );
        }

        const rows = Array.isArray(
          data?.classes
        )
          ? data.classes
          : [];

        setClasses(rows);

        if (rows.length > 0) {
          setSelectedClass(
            String(rows[0].class_id)
          );
        }
      } catch (error) {
        console.error(
          "CLASS LOAD ERROR:",
          error
        );

        setClasses([]);
      }
    }

    loadClasses();
  }, []);

  /* =========================================================
     LOAD SUBJECTS WHEN CLASS CHANGES
  ========================================================= */

  useEffect(() => {
    async function loadSubjects() {
      if (!selectedClass) {
        setSubjects([]);
        setSelectedSubject("");
        return;
      }

      try {
        setSubjects([]);
        setSelectedSubject("");
        setChapters([]);
        setSelectedChapter("");

        const response = await fetch(
          `${API_BASE_URL}/subjects?class_id=${encodeURIComponent(
            selectedClass
          )}`,
          {
            cache: "no-store",
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            "Unable to load subjects."
          );
        }

        const rows = Array.isArray(
          data?.subjects
        )
          ? data.subjects
          : [];

        setSubjects(rows);

        if (rows.length > 0) {
          setSelectedSubject(
            String(rows[0].subject_id)
          );
        }
      } catch (error) {
        console.error(
          "SUBJECT LOAD ERROR:",
          error
        );

        setSubjects([]);
        setSelectedSubject("");
      }
    }

    loadSubjects();
  }, [selectedClass]);

  /* =========================================================
     LOAD CHAPTERS WHEN SUBJECT CHANGES
  ========================================================= */

  useEffect(() => {
    async function loadChapters() {
      if (!selectedSubject) {
        setChapters([]);
        setSelectedChapter("");
        return;
      }

      try {
        setChapters([]);
        setSelectedChapter("");

        const response = await fetch(
          `${API_BASE_URL}/chapters?subject_id=${encodeURIComponent(
            selectedSubject
          )}`,
          {
            cache: "no-store",
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            "Unable to load chapters."
          );
        }

        const rows = Array.isArray(
          data?.chapters
        )
          ? data.chapters
          : [];

        setChapters(rows);

        if (rows.length > 0) {
          setSelectedChapter(
            String(rows[0].chapter_id)
          );
        }
      } catch (error) {
        console.error(
          "CHAPTER LOAD ERROR:",
          error
        );

        setChapters([]);
        setSelectedChapter("");
      }
    }

    loadChapters();
  }, [selectedSubject]);

  /* =========================================================
     CURRENT SELECTIONS
  ========================================================= */

  const currentClass = useMemo(() => {
    return classes.find(
      (item) =>
        String(item.class_id) ===
        String(selectedClass)
    );
  }, [classes, selectedClass]);

  const currentSubject = useMemo(() => {
    return subjects.find(
      (item) =>
        String(item.subject_id) ===
        String(selectedSubject)
    );
  }, [subjects, selectedSubject]);

  const currentChapter = useMemo(() => {
    return chapters.find(
      (item) =>
        String(item.chapter_id) ===
        String(selectedChapter)
    );
  }, [chapters, selectedChapter]);

  const chapterTitle =
    currentChapter?.chapter_name ||
    "Select a chapter";

  /* =========================================================
     SCORE
  ========================================================= */

  const score = useMemo(() => {
    return questions.reduce(
      (total, question, index) => {
        const selectedOption =
          answers[index];

        if (
          selectedOption === undefined
        ) {
          return total;
        }

        const selectedText =
          question.options?.[
            selectedOption
          ];

        const correctAnswer =
          question.correct_answer ||
          question.answer ||
          "";

        return selectedText ===
          correctAnswer
          ? total + 1
          : total;
      },
      0
    );
  }, [answers, questions]);

  const allAnswered =
    questions.length > 0 &&
    Object.keys(answers).length ===
      questions.length;

  const marks = score * 5;

  /* =========================================================
     ASK AI
  ========================================================= */

  async function handleAskAi() {
    if (!selectedClass) {
      alert("Please select a class.");
      return;
    }

    if (!selectedSubject) {
      alert("Please select a subject.");
      return;
    }

    if (!currentChapter) {
      alert("Please select a chapter.");
      return;
    }

    try {
      setLoading(true);

      /*
       * IMPORTANT:
       * chapter_id is sent to the backend.
       *
       * Backend uses chapter_id to fetch:
       * sss_chapter_content.full_text_content
       *
       * Gemini then generates questions from
       * that actual textbook content.
       */

      const payload = {
        topic: `${currentSubject?.subject_name || ""}: ${
          currentChapter.chapter_name || ""
        }`,
        chapter_id:
          currentChapter.chapter_id,
        difficulty: "easy",
        num_questions: 5,
        client_name: "SSS",
      };

      console.log(
        "🔥 QUIZ REQUEST:",
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
        "🔥 QUIZ API RESPONSE:",
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

      setQuestions(
        generatedQuestions
      );

      setQuizRequested(true);
      setAnswers({});
      setSubmitted(false);
      setEvaluation(null);
    } catch (error) {
      console.error(
        "🔥 QUIZ GENERATION ERROR:",
        error
      );

      alert(
        error?.message ||
          "Quiz Generation Failed"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     SUBMIT
  ========================================================= */

  async function handleSubmit() {
    if (!allAnswered) {
      return;
    }

    try {
      setLoading(true);

      const submission = {
        submission_data: {
          answers: questions.map(
            (question, index) => ({
              question:
                question.question,

              student_answer:
                question.options?.[
                  answers[index]
                ] || "",

              correct_answer:
                question.correct_answer ||
                question.answer ||
                "",
            })
          ),
        },
      };

      console.log(
        "🔥 QUIZ EVALUATION REQUEST:",
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
        "🔥 QUIZ EVALUATION RESPONSE:",
        JSON.stringify(
          result,
          null,
          2
        )
      );

      setEvaluation(
        result?.evaluation_report ||
          null
      );

      setSubmitted(true);
    } catch (error) {
      console.error(
        "QUIZ EVALUATION ERROR:",
        error
      );

      alert(
        error?.message ||
          "Quiz Evaluation Failed"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     RESET
  ========================================================= */

 function handleReset() {
  setAnswers({});
  setSubmitted(false);
  setEvaluation(null);
}
  /* =========================================================
     CLASS CHANGE
  ========================================================= */

  function handleClassChange(
    event
  ) {
    setSelectedClass(
      event.target.value
    );

    handleReset();
  }

  /* =========================================================
     SUBJECT CHANGE
  ========================================================= */

  function handleSubjectChange(
    event
  ) {
    setSelectedSubject(
      event.target.value
    );

    handleReset();
  }

  /* =========================================================
     CHAPTER CHANGE
  ========================================================= */

  function handleChapterChange(
    event
  ) {
    setSelectedChapter(
      event.target.value
    );

    handleReset();
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <DashboardShell>
      <section className="module-page">
        <StudyTabs />

        <div className="module-content-area">

         <div
  className="quiz-layout"
  style={{ alignItems: "start" }}
>
            {/* =================================================
                LEFT QUIZ CARD
            ================================================= */}

            <article className="module-card quiz-card">

              <div className="card-title-row">

                <h2>
                  {chapterTitle}
                </h2>

                <span
                  className={`status-pill ${
                    submitted
                      ? "completed"
                      : "not-attempted"
                  }`}
                >
                  {submitted
                    ? "Completed"
                    : "Not Attempted"}
                </span>

              </div>

              {/* =================================================
                  META
              ================================================= */}

              <div className="meta-row">

                <span>
                  Total Marks: 25
                </span>

                <span>
                  Questions:{" "}
                  {quizRequested
                    ? questions.length
                    : 0}
                </span>

                <span>
                  Duration: 30 mins
                </span>

              </div>

              {/* =================================================
                  CLASS
              ================================================= */}

              <label className="assignment-field">

                <span>
                  Class
                </span>

                <select
                  value={
                    selectedClass
                  }
                  onChange={
                    handleClassChange
                  }
                  disabled={
                    loading
                  }
                >

                  <option value="">
                    Select Class
                  </option>

                  {classes.map(
                    (item) => (
                      <option
                        key={
                          item.class_id
                        }
                        value={
                          item.class_id
                        }
                      >
                        {item.class_name}
                        {item.section_name
                          ? ` - ${item.section_name}`
                          : ""}
                      </option>
                    )
                  )}

                </select>

              </label>

              {/* =================================================
                  SUBJECT
              ================================================= */}

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
                    loading ||
                    !selectedClass
                  }
                >

                  <option value="">
                    Select Subject
                  </option>

                  {subjects.map(
                    (item) => (
                      <option
                        key={
                          item.subject_id
                        }
                        value={
                          item.subject_id
                        }
                      >
                        {
                          item.subject_name
                        }
                      </option>
                    )
                  )}

                </select>

              </label>

              {/* =================================================
                  CHAPTER
              ================================================= */}

              <label className="assignment-field">

                <span>
                  Chapter
                </span>

                <select
                  value={
                    selectedChapter
                  }
                  onChange={
                    handleChapterChange
                  }
                  disabled={
                    loading ||
                    !selectedSubject
                  }
                >

                  <option value="">
                    Select Chapter
                  </option>

                  {chapters.map(
                    (item) => (
                      <option
                        key={
                          item.chapter_id
                        }
                        value={
                          item.chapter_id
                        }
                      >
                        {item.chapter_no
                          ? `${item.chapter_no}. `
                          : ""}
                        {
                          item.chapter_name
                        }
                      </option>
                    )
                  )}

                </select>

              </label>

              {/* =================================================
                  SELECTED CHAPTER INFO
              ================================================= */}

              {currentChapter && (
                <div className="meta-row">

                  <span>
                    {
                      currentClass?.class_name ||
                      "-"
                    }
                  </span>

                  <span>
                    {
                      currentSubject?.subject_name ||
                      "-"
                    }
                  </span>

                  <span>
                    {
                      currentChapter.chapter_name
                    }
                  </span>

                  <span>
                    Questions: 5
                  </span>

                </div>
              )}

              {/* =================================================
                  ASK AI
              ================================================= */}

              {!quizRequested && (
                <div className="quiz-submit-row">

                  <button
                    className="primary-button"
                    type="button"
                    onClick={
                      handleAskAi
                    }
                    disabled={
                      loading ||
                      !selectedClass ||
                      !selectedSubject ||
                      !selectedChapter
                    }
                  >
                    {loading
                      ? "Generating..."
                      : "Ask AI"}
                  </button>

                </div>
              )}

              {/* =================================================
                  QUESTIONS
              ================================================= */}

              {quizRequested && (
                <>

                  <div className="quiz-question-list">

                    {questions.map(
                      (
                        item,
                        questionIndex
                      ) => (

                        <fieldset
                          className="quiz-question"
                          key={
                            questionIndex
                          }
                          disabled={
                            submitted ||
                            loading
                          }
                        >

                          <legend>
                            {questionIndex +
                              1}
                            .{" "}
                            {
                              item.question
                            }
                          </legend>

                          <div className="quiz-options">

                            {(
                              item.options ||
                              []
                            ).map(
                              (
                                option,
                                optionIndex
                              ) => {

                                const optionId =
                                  `q-${questionIndex}-${optionIndex}`;

                                const selected =
                                  answers[
                                    questionIndex
                                  ] ===
                                  optionIndex;

                                const correct =
                                  submitted &&
                                  option ===
                                    (item.correct_answer ||
                                      item.answer);

                                const wrong =
                                  submitted &&
                                  selected &&
                                  option !==
                                    (item.correct_answer ||
                                      item.answer);

                                return (
                                  <label
                                    key={
                                      optionIndex
                                    }
                                    htmlFor={
                                      optionId
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
                                      id={
                                        optionId
                                      }
                                      type="radio"
                                      name={`question-${questionIndex}`}
                                      checked={
                                        selected
                                      }
                                      disabled={
                                        submitted ||
                                        loading
                                      }
                                      onChange={() =>
  setAnswers((previous) => {
    const currentAnswer =
      previous[questionIndex];

    if (currentAnswer === optionIndex) {
      const updatedAnswers = {
        ...previous,
      };

      delete updatedAnswers[questionIndex];

      return updatedAnswers;
    }

    return {
      ...previous,
      [questionIndex]: optionIndex,
    };
  })
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

                  {!allAnswered &&
                    !submitted && (
                      <p className="quiz-warning">
                        Please answer all
                        questions before
                        submitting.
                      </p>
                    )}

                  <div className="quiz-submit-row">

                    <button
                      className="primary-button"
                      type="button"
                      onClick={
                        handleSubmit
                      }
                      disabled={
                        !allAnswered ||
                        submitted ||
                        loading
                      }
                    >
                      {loading
                        ? "Submitting..."
                        : "Submit Quiz"}
                    </button>

                    <button
                      className="soft-button"
                      type="button"
                      onClick={
                        handleReset
                      }
                      disabled={
                        loading
                      }
                    >
                      Reset
                    </button>

                  </div>

                </>
              )}

            </article>

            {/* =================================================
                RIGHT RESULT CARD
            ================================================= */}

            <article className="module-card latest-result-card">

              <h2>
                Quiz Result
              </h2>

              <div className="result-grid quiz-result-grid">

                <div>

                  <span>
                    Class
                  </span>

                  <strong>
                    {
                      currentClass?.class_name ||
                      "-"
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    Subject
                  </span>

                  <strong>
                    {
                      currentSubject?.subject_name ||
                      "-"
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    Chapter Title
                  </span>

                  <strong>
                    {chapterTitle}
                  </strong>

                </div>

                <div>

                  <span>
                    Score
                  </span>

                  <strong>
                    {submitted
                      ? evaluation?.total_score ??
                        `${marks} / 25`
                      : "- / 25"}
                  </strong>

                </div>

                <div>

                  <span>
                    Correct Answers
                  </span>

                  <strong>
                    {submitted
                      ? evaluation?.correct_answers ??
                        `${score}/${questions.length}`
                      : "-"}
                  </strong>

                </div>

                <div>

                  <span>
                    Status
                  </span>

                  <strong>
                    {submitted
                      ? "Completed"
                      : quizRequested
                        ? "In Progress"
                        : "Pending"}
                  </strong>

                </div>

              </div>

              {/* =================================================
                  EVALUATION REPORT
              ================================================= */}

              {submitted &&
                evaluation?.corrections &&
                evaluation.corrections
                  .length > 0 && (

                  <div
                    style={{
                      marginTop: 20,
                    }}
                  >

                    <h3>
                      Evaluation Report
                    </h3>

                    {evaluation.corrections.map(
                      (
                        item,
                        index
                      ) => (

                        <div
                          key={index}
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "12px",
                            marginBottom:
                              "12px",
                            borderRadius:
                              "8px",
                          }}
                        >

                          <p>
                            <strong>
                              Question:
                            </strong>{" "}
                            {
                              item.question
                            }
                          </p>

                          <p>
                            <strong>
                              Your Answer:
                            </strong>{" "}
                            {
                              item.student_answer
                            }
                          </p>

                          <p>
                            <strong>
                              Correct Answer:
                            </strong>{" "}
                            {
                              item.correct_answer
                            }
                          </p>

                          <p>
                            <strong>
                              Explanation:
                            </strong>{" "}
                            {
                              item.explanation
                            }
                          </p>

                        </div>

                      )
                    )}

                  </div>

                )}

            </article>

          </div>

        </div>

      </section>
    </DashboardShell>
  );
}