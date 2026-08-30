"use client";

import { useState } from "react";
import DashboardShell from "../dashboard-shell";
import StudyTabs from "../study-tabs";
import ChapterSelector from "../chapter-selector";
import { generateContent } from "../../services/studentApi";

export default function StudyMaterialPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerateContent() {
    try {
      setLoading(true);

      const response = await generateContent({
        topic: "Machine Learning Basics",
        learning_capacity: "beginner",
      });

      setContent(response.generated_content);
    } catch (error) {
      console.error("Content Generation Error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell>
      <section className="module-page">

        {/* Study Tabs */}
        <StudyTabs />

        <div className="module-content-area">

          {/* =========================================
              CLASS / SUBJECT / CHAPTER SELECTOR
          ========================================= */}

          <ChapterSelector showReader={true} />

          {/* =========================================
              AI STUDY MATERIAL
          ========================================= */}

          <article className="module-card material-card">

            <div className="card-title-row">

              <h2>
                AI Study Material
              </h2>

              <button
                className="table-action"
                type="button"
                onClick={handleGenerateContent}
                disabled={loading}
              >
                {loading
                  ? "Generating..."
                  : "Generate AI Content"}
              </button>

            </div>

          </article>

          {/* =========================================
              AI GENERATED CONTENT
          ========================================= */}

          {content && (
            <article className="module-card">

              <h2>
                AI Generated Content
              </h2>

              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                }}
              >
                {typeof content === "string"
                  ? content
                  : JSON.stringify(content, null, 2)}
              </pre>

            </article>
          )}

        </div>
      </section>
    </DashboardShell>
  );
}