"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../dashboard-shell";
import StudyTabs from "../study-tabs";
import { generateQuiz, evaluateQuiz } from "../../services/studentApi";
import { getApiBaseUrl } from "../api-base-url";

const API_BASE_URL = getApiBaseUrl();

export default function QuizzesPage() {
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [quizRequested, setQuizRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/quiz-chapters`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { const rows = data.chapters || []; setChapters(rows); if (rows.length) setSelectedChapter(String(rows[0].chapter_id)); })
      .catch(() => setChapters([]));
  }, []);

  const currentChapter = chapters.find((item) => String(item.chapter_id) === selectedChapter);
  const chapterTitle = currentChapter?.chapter_title || "Select a chapter";

  const score = useMemo(() => {
    return questions.reduce((total, question, index) => {
      const selectedOption = answers[index];

      if (selectedOption === undefined) {
        return total;
      }

      const selectedText = question.options[selectedOption];

      return selectedText === question.answer ? total + 1 : total;
    }, 0);
  }, [answers, questions]);

  const allAnswered =
    questions.length > 0 &&
    Object.keys(answers).length === questions.length;

  const marks = score * 5;

  async function handleAskAi() {
    try {
      setLoading(true);

      const response = await generateQuiz({
  topic: chapterTitle,
  difficulty: "easy",
  num_questions: 5,
  user_email: "student@example.com",
  client_name: "SSS",
});

      console.log("Quiz API Response:", response);

      setQuestions(response.quiz_data || []);
      setQuizRequested(true);
      setAnswers({});
      setSubmitted(false);
      setEvaluation(null);
    } catch (error) {
      console.log("Quiz Generation Error:", error);
      console.log(error.response?.data);

      alert("Quiz Generation Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!allAnswered) return;

    try {
      const submission = {
        submission_data: {
          answers: questions.map((q, index) => ({
            question: q.question,
            student_answer: q.options[answers[index]],
            correct_answer: q.answer,
          })),
        },
      };

      const result = await evaluateQuiz(submission);

      console.log("Evaluation Response:", result);

      setEvaluation(result.evaluation_report);
      setSubmitted(true);
    } catch (error) {
      console.log("Evaluation Error:", error);
      console.log(error.response?.data);

      alert("Quiz Evaluation Failed");
    }
  }

  function handleReset() {
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setQuizRequested(false);
    setEvaluation(null);
  }

  return (
        <DashboardShell>
      <section className="module-page">
        <StudyTabs />

        <div className="module-content-area">
          <div className="quiz-layout">

            <article className="module-card quiz-card">

              <div className="card-title-row">
                <h2>{chapterTitle}</h2>

                <span
                  className={`status-pill ${
                    submitted ? "completed" : "not-attempted"
                  }`}
                >
                  {submitted ? "Completed" : "Not Attempted"}
                </span>
              </div>

              <div className="meta-row">
                <span>Total Marks: 25</span>
                <span>
                  Questions: {quizRequested ? questions.length : 0}
                </span>
                <span>Duration: 30 mins</span>
              </div>

              <label className="assignment-field">
                <span>Chapter</span>
                <select value={selectedChapter} onChange={(event) => { setSelectedChapter(event.target.value); handleReset(); }}>
                  {chapters.map((chapter) => <option value={chapter.chapter_id} key={chapter.chapter_id}>{chapter.subject} - {chapter.chapter_title}</option>)}
                </select>
              </label>

              {!quizRequested && (
                <div className="quiz-submit-row">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handleAskAi}
                    disabled={loading || !selectedChapter}
                  >
                    {loading ? "Generating..." : "Ask AI"}
                  </button>
                </div>
              )}

              {quizRequested && (
                <>
                  <div className="quiz-question-list">
                    {questions.map((item, questionIndex) => (
                      <fieldset
                        className="quiz-question"
                        key={questionIndex}
                        disabled={submitted}
                      >
                        <legend>
                          {questionIndex + 1}. {item.question}
                        </legend>

                        <div className="quiz-options">
                          {item.options.map((option, optionIndex) => {

                            const optionId = `q-${questionIndex}-${optionIndex}`;

                            const selected =
                              answers[questionIndex] === optionIndex;

                            const correct =
                              submitted &&
                              option === item.answer;

                            const wrong =
                              submitted &&
                              selected &&
                              option !== item.answer;

                            return (
                              <label
                                key={optionIndex}
                                htmlFor={optionId}
                                className={`quiz-option ${
                                  selected ? "selected" : ""
                                } ${
                                  correct ? "correct" : ""
                                } ${
                                  wrong ? "wrong" : ""
                                }`}
                              >
                                <input
                                  id={optionId}
                                  type="radio"
                                  name={`question-${questionIndex}`}
                                  checked={selected}
                                  onChange={() =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [questionIndex]: optionIndex,
                                    }))
                                  }
                                />

                                <span>{option}</span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}
                  </div>

                  {!allAnswered && !submitted && (
                    <p className="quiz-warning">
                      Please answer all questions before submitting.
                    </p>
                  )}

                  <div className="quiz-submit-row">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={handleSubmit}
                      disabled={!allAnswered || submitted}
                    >
                      Submit Quiz
                    </button>

                    <button
                      className="soft-button"
                      type="button"
                      onClick={handleReset}
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}

            </article>
                        <article className="module-card latest-result-card">
              <h2>Quiz Result</h2>

              <div className="result-grid quiz-result-grid">
                <div>
                  <span>Chapter Title</span>
                  <strong>{chapterTitle}</strong>
                </div>

                <div>
                  <span>Score</span>
                  <strong>
                    {submitted
                      ? evaluation?.total_score || `${marks} / 25`
                      : "- / 25"}
                  </strong>
                </div>

                <div>
                  <span>Correct Answers</span>
                  <strong>
  {submitted
    ? evaluation?.total_score || `${score}/${questions.length}`
    : "-"}
</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    {submitted
                      ? "Completed"
                      : quizRequested
                      ? "In Progress"
                      : "Pending"}
                  </strong>
                </div>
              </div>

              {submitted &&
                evaluation?.corrections &&
                evaluation.corrections.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h3>Evaluation Report</h3>

                    {evaluation.corrections.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          border: "1px solid #ddd",
                          padding: "12px",
                          marginBottom: "12px",
                          borderRadius: "8px",
                        }}
                      >
                        <p>
                          <strong>Question:</strong> {item.question}
                        </p>

                        <p>
                          <strong>Your Answer:</strong>{" "}
                          {item.student_answer}
                        </p>

                        <p>
                          <strong>Correct Answer:</strong>{" "}
                          {item.correct_answer}
                        </p>

                        <p>
                          <strong>Explanation:</strong>{" "}
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
            </article>

          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
