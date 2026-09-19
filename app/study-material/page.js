"use client";

import DashboardShell from "../dashboard-shell";
import StudyTabs from "../study-tabs";
import ChapterSelector from "../chapter-selector";

export default function StudyMaterialPage() {
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

        </div>
      </section>
    </DashboardShell>
  );
}