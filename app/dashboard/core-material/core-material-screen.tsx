"use client";

import { useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

const quizQuestions: Record<string, QuizQuestion[]> = {
  "AI Fundamentals Quiz": [
    {
      question: "What does AI stand for?",
      options: ["Automated Internet", "Artificial Intelligence", "Applied Information"],
      answer: "Artificial Intelligence",
    },
    {
      question: "Which of these is an example of AI?",
      options: ["Voice assistant", "Plain notebook", "Wooden desk"],
      answer: "Voice assistant",
    },
    {
      question: "What is the goal of AI systems?",
      options: ["To copy files only", "To perform intelligent tasks", "To print pages"],
      answer: "To perform intelligent tasks",
    },
    {
      question: "Which field helps AI learn from data?",
      options: ["Machine Learning", "Carpentry", "Painting"],
      answer: "Machine Learning",
    },
    {
      question: "A chatbot is mainly used to do what?",
      options: ["Hold conversations", "Store pencils", "Measure temperature"],
      answer: "Hold conversations",
    },
  ],
  "ML Basics Quiz": [
    {
      question: "What does machine learning mainly use to improve performance?",
      options: ["Data", "Chalk", "Paper clips"],
      answer: "Data",
    },
    {
      question: "Which learning type uses labeled examples?",
      options: ["Supervised learning", "Random learning", "Silent learning"],
      answer: "Supervised learning",
    },
    {
      question: "What is a model in machine learning?",
      options: ["A learned pattern for prediction", "A school timetable", "A hardware cable"],
      answer: "A learned pattern for prediction",
    },
    {
      question: "Which task predicts a category?",
      options: ["Classification", "Decoration", "Duplication"],
      answer: "Classification",
    },
    {
      question: "Which task predicts a number?",
      options: ["Regression", "Translation only", "Sorting books"],
      answer: "Regression",
    },
  ],
  "AI Concepts Quiz": [
    {
      question: "Which concept means an AI gives understandable reasons?",
      options: ["Explainability", "Opacity", "Compression"],
      answer: "Explainability",
    },
    {
      question: "Which issue happens when training data is unfair?",
      options: ["Bias", "Brightness", "Battery drain"],
      answer: "Bias",
    },
    {
      question: "What does an intelligent agent usually do?",
      options: ["Perceives and acts", "Only sleeps", "Only prints"],
      answer: "Perceives and acts",
    },
    {
      question: "Which AI area helps computers understand text?",
      options: ["Natural Language Processing", "Mechanical drawing", "Gardening"],
      answer: "Natural Language Processing",
    },
    {
      question: "Which is important when using AI responsibly?",
      options: ["Privacy", "Ignoring users", "Deleting all rules"],
      answer: "Privacy",
    },
  ],
  "Neural Networks Quiz": [
    {
      question: "What is a basic unit in a neural network called?",
      options: ["Neuron", "Folder", "Pixel only"],
      answer: "Neuron",
    },
    {
      question: "What do weights control in a neural network?",
      options: ["Connection strength", "Screen size", "Keyboard color"],
      answer: "Connection strength",
    },
    {
      question: "Which layer receives the original data?",
      options: ["Input layer", "Paint layer", "Final bell"],
      answer: "Input layer",
    },
    {
      question: "Which layer gives the final prediction?",
      options: ["Output layer", "Dust layer", "Cover page"],
      answer: "Output layer",
    },
    {
      question: "Training a network means adjusting what?",
      options: ["Weights", "Desk height", "Font name only"],
      answer: "Weights",
    },
  ],
};

const chapters = [
  {
    no: "1",
    id: "101",
    name: "AI Fundamentals",
    description: "Foundational ideas behind artificial intelligence, agents, and simple use cases.",
    materials: [
      {
        type: "PDF",
        title: "AI Fundamentals - Study Notes",
        description: "Overview notes covering AI definitions, examples, and applications.",
        file: "ai_fundamentals_notes.pdf",
        action: "Download",
        tone: "red",
      },
      {
        type: "Video",
        title: "What is AI?",
        description: "Introductory video explaining AI with classroom examples.",
        file: "ai_intro_video.mp4",
        action: "Watch",
        tone: "purple",
      },
      {
        type: "Text",
        title: "AI Key Points",
        description: "Quick revision points for the chapter.",
        file: "-",
        action: "View",
        tone: "orange",
      },
    ],
    quizzes: [
      {
        title: "AI Fundamentals Quiz",
        marks: "20",
        duration: "20 mins",
        result: "16.00 / 20",
        status: "Completed",
        action: "Review",
      },
    ],
  },
  {
    no: "2",
    id: "102",
    name: "Machine Learning Basics",
    description: "Introduction to machine learning concepts, models, and basic learning methods.",
    materials: [
      {
        type: "PDF",
        title: "ML Basics - Study Notes",
        description: "Detailed notes on ML concepts, types of learning and algorithms.",
        file: "ml_basics_notes.pdf",
        action: "Download",
        tone: "red",
      },
      {
        type: "Video",
        title: "Introduction to ML",
        description: "Video lecture explaining the basics of Machine Learning.",
        file: "ml_intro_video.mp4",
        action: "Watch",
        tone: "purple",
      },
      {
        type: "Text",
        title: "Key Points Summary",
        description: "Important points and quick revision notes.",
        file: "-",
        action: "View",
        tone: "orange",
      },
    ],
    quizzes: [
      {
        title: "ML Basics Quiz",
        marks: "25",
        duration: "30 mins",
        result: "18.50 / 25",
        status: "Completed",
        action: "Review",
      },
      {
        title: "AI Concepts Quiz",
        marks: "20",
        duration: "20 mins",
        result: "-",
        status: "Not Attempted",
        action: "Start Quiz",
      },
    ],
  },
  {
    no: "3",
    id: "103",
    name: "Neural Networks",
    description: "Basic neural network structure, layers, activation, and simple training ideas.",
    materials: [
      {
        type: "PDF",
        title: "Neural Networks Notes",
        description: "Chapter notes covering neurons, weights, layers, and outputs.",
        file: "neural_networks_notes.pdf",
        action: "Download",
        tone: "red",
      },
      {
        type: "Video",
        title: "Neural Networks Explained",
        description: "A short visual explanation of how neural networks learn patterns.",
        file: "neural_networks_video.mp4",
        action: "Watch",
        tone: "purple",
      },
      {
        type: "Text",
        title: "Network Revision Summary",
        description: "Important formulae and quick definitions for revision.",
        file: "-",
        action: "View",
        tone: "orange",
      },
    ],
    quizzes: [
      {
        title: "Neural Networks Quiz",
        marks: "30",
        duration: "35 mins",
        result: "-",
        status: "Not Attempted",
        action: "Start Quiz",
      },
    ],
  },
];

export function CoreMaterialScreen() {
  const [selectedChapterId, setSelectedChapterId] = useState("102");
  const [message, setMessage] = useState("Viewing Machine Learning Basics.");
  const [activeQuizTitle, setActiveQuizTitle] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [submittedScores, setSubmittedScores] = useState<Record<string, number>>({});

  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId) ?? chapters[0];
  const activeQuestions = activeQuizTitle ? quizQuestions[activeQuizTitle] ?? [] : [];
  const latestQuiz = useMemo(() => {
    const submittedQuiz = selectedChapter.quizzes.find((quiz) => submittedScores[quiz.title] !== undefined);

    return submittedQuiz ?? selectedChapter.quizzes.find((quiz) => quiz.status === "Completed");
  }, [selectedChapter, submittedScores]);

  function viewChapter(chapterId: string) {
    const chapter = chapters.find((item) => item.id === chapterId);

    if (!chapter) {
      return;
    }

    setSelectedChapterId(chapter.id);
    setActiveQuizTitle(null);
    setQuizAnswers({});
    setMessage(`Viewing ${chapter.name}.`);
  }

  function handleMaterialAction(action: string, title: string, file: string) {
    const target = file === "-" ? title : file;
    setMessage(`${action} opened for ${target}.`);
  }

  function handleQuizAction(action: string, title: string) {
    setActiveQuizTitle(title);
    setQuizAnswers({});
    setMessage(`${action} selected for ${title}. Answer all 5 questions and submit.`);
  }

  function selectQuizAnswer(questionIndex: number, answer: string) {
    setQuizAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionIndex]: answer,
    }));
  }

  function submitQuiz() {
    if (!activeQuizTitle) {
      return;
    }

    if (activeQuestions.some((_, index) => !quizAnswers[index])) {
      setMessage("Please answer all 5 questions before submitting the quiz.");
      return;
    }

    const quiz = selectedChapter.quizzes.find((item) => item.title === activeQuizTitle);
    const totalMarks = Number(quiz?.marks ?? activeQuestions.length);
    const marksPerQuestion = totalMarks / activeQuestions.length;
    const correctAnswers = activeQuestions.filter(
      (question, index) => quizAnswers[index] === question.answer,
    ).length;
    const score = correctAnswers * marksPerQuestion;

    setSubmittedScores((currentScores) => ({
      ...currentScores,
      [activeQuizTitle]: score,
    }));
    setMessage(
      `Quiz submitted. You scored ${score.toFixed(2)} / ${totalMarks} (${correctAnswers} of 5 correct).`,
    );
  }

  return (
    <div className="dashboard-shell">
      <DashboardSidebar activeItem="Core Material" />

      <main className="dashboard-main-content">
        <div className="dashboard-main-wrap">
          <DashboardHeader
            name="Aarav Sharma"
            role="Student"
            admissionNo="ADM001"
            className="9"
            section="B"
            rollNo="25"
          />

          <div className="core-page">
            <section className="core-panel core-chapters">
              <div className="core-panel-title core-blue">
                <span className="core-title-icon">[]</span>
                <h2>Chapters</h2>
              </div>
              <table className="core-table">
                <thead>
                  <tr>
                    <th>Chapter No.</th>
                    <th>Chapter ID</th>
                    <th>Chapter Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.map((chapter) => (
                    <tr
                      key={chapter.id}
                      className={chapter.id === selectedChapter.id ? "is-selected" : undefined}
                    >
                      <td>{chapter.no}</td>
                      <td>{chapter.id}</td>
                      <td>{chapter.name}</td>
                      <td>
                        <button
                          type="button"
                          className={
                            chapter.id === selectedChapter.id ? "core-action active" : "core-action"
                          }
                          onClick={() => viewChapter(chapter.id)}
                        >
                          View Chapter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="core-panel core-details">
              <div className="core-panel-title core-purple">
                <span className="core-title-icon">[]</span>
                <h2>Selected Chapter Details</h2>
              </div>
              <dl className="core-details-list">
                <div>
                  <dt>Chapter No.</dt>
                  <dd>{selectedChapter.no}</dd>
                </div>
                <div>
                  <dt>Chapter Name</dt>
                  <dd>{selectedChapter.name}</dd>
                </div>
                <div>
                  <dt>Description</dt>
                  <dd>{selectedChapter.description}</dd>
                </div>
              </dl>
            </section>

            <section className="core-panel core-materials">
              <div className="core-panel-title core-green">
                <span className="core-title-icon">[]</span>
                <h2>Chapter Content &amp; Study Material</h2>
              </div>
              <table className="core-table material-table">
                <thead>
                  <tr>
                    <th>Content Type</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>File / Link</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedChapter.materials.map((item) => (
                    <tr key={item.title}>
                      <td>
                        <span className={`file-badge ${item.tone}`}>{item.type[0]}</span>
                        {item.type}
                      </td>
                      <td>{item.title}</td>
                      <td>{item.description}</td>
                      <td>{item.file}</td>
                      <td>
                        <button
                          type="button"
                          className={`material-action ${item.tone}`}
                          onClick={() => handleMaterialAction(item.action, item.title, item.file)}
                        >
                          {item.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="core-panel core-quizzes">
              <div className="core-panel-title core-red">
                <span className="core-title-icon">@</span>
                <h2>Quizzes in this Chapter</h2>
              </div>
              <table className="core-table quiz-table">
                <thead>
                  <tr>
                    <th>Quiz Title</th>
                    <th>Total Marks</th>
                    <th>Duration</th>
                    <th>Your Result</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedChapter.quizzes.map((quiz) => {
                    const submittedScore = submittedScores[quiz.title];
                    const isCompleted = quiz.status === "Completed" || submittedScore !== undefined;
                    const quizResult =
                      submittedScore !== undefined
                        ? `${submittedScore.toFixed(2)} / ${quiz.marks}`
                        : quiz.result;

                    return (
                    <tr key={quiz.title}>
                      <td>{quiz.title}</td>
                      <td>{quiz.marks}</td>
                      <td>{quiz.duration}</td>
                      <td>
                        <span
                          className={
                            isCompleted ? "quiz-status done" : "quiz-status pending"
                          }
                        >
                          {isCompleted ? "Completed" : quiz.status}
                        </span>
                        <strong className={isCompleted ? "quiz-score" : undefined}>
                          {quizResult}
                        </strong>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={
                            isCompleted ? "quiz-action review" : "quiz-action start"
                          }
                          onClick={() => handleQuizAction(quiz.action, quiz.title)}
                        >
                          {isCompleted ? "Review" : quiz.action}
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            {activeQuizTitle ? (
              <section className="core-panel core-quiz-box">
                <div className="core-panel-title core-orange">
                  <span className="core-title-icon">?</span>
                  <h2>{activeQuizTitle}</h2>
                </div>
                <div className="core-quiz-content">
                  {activeQuestions.map((question, questionIndex) => (
                    <fieldset className="core-question" key={question.question}>
                      <legend>
                        {questionIndex + 1}. {question.question}
                      </legend>
                      <div className="core-options">
                        {question.options.map((option) => (
                          <label key={option}>
                            <input
                              type="radio"
                              name={`quiz-question-${questionIndex}`}
                              checked={quizAnswers[questionIndex] === option}
                              onChange={() => selectQuizAnswer(questionIndex, option)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <button type="button" className="core-submit-quiz" onClick={submitQuiz}>
                    Submit Quiz
                  </button>
                </div>
              </section>
            ) : null}

            <section className="latest-result">
              <div className="latest-icon">OK</div>
              <div>
                <h2>Latest Quiz Result</h2>
                <span>Quiz Title</span>
                <strong>{latestQuiz?.title ?? "No completed quiz yet"}</strong>
              </div>
              <div>
                <span>Score</span>
                <strong className="quiz-score">
                  {latestQuiz
                    ? submittedScores[latestQuiz.title] !== undefined
                      ? `${submittedScores[latestQuiz.title].toFixed(2)} / ${latestQuiz.marks}`
                      : latestQuiz.result
                    : "-"}
                </strong>
              </div>
              <div>
                <span>Completed</span>
                <strong>{latestQuiz ? "Yes" : "No"}</strong>
              </div>
              <div>
                <span>Completed On</span>
                <strong>{latestQuiz ? "20-May-2024 10:45 AM" : "-"}</strong>
              </div>
            </section>

            <section className="core-status" aria-live="polite">
              {message}
            </section>

            <section className="core-note">
              <strong>i</strong>
              <span>
                Note: You can attempt the quiz only once. Make sure to review your answers before
                submitting.
              </span>
            </section>

            <footer className="core-footer">&copy; 2024 SWAIS. All rights reserved.</footer>
          </div>
        </div>
      </main>
    </div>
  );
}
