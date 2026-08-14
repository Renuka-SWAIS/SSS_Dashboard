"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../dashboard-shell";
import { getApiBaseUrl } from "../api-base-url";

const API_BASE_URL = getApiBaseUrl();

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",").pop());
    reader.onerror = () => reject(new Error("Unable to read PDF."));
    reader.readAsDataURL(file);
  });
}

export default function ChapterUploadPage() {
  const [classes, setClasses] = useState([]), [subjects, setSubjects] = useState([]), [chapters, setChapters] = useState([]);
  const [classId, setClassId] = useState(""), [subjectId, setSubjectId] = useState(""), [chapterId, setChapterId] = useState("");
  const [file, setFile] = useState(null), [status, setStatus] = useState(""), [error, setError] = useState(""), [saving, setSaving] = useState(false);

  useEffect(() => { fetch(`${API_BASE_URL}/classes`).then((r) => r.json()).then((d) => setClasses(d.classes || [])).catch(() => setError("Unable to load classes.")); }, []);
  useEffect(() => { setSubjects([]); setSubjectId(""); setChapters([]); setChapterId(""); if (classId) fetch(`${API_BASE_URL}/subjects?class_id=${classId}`).then((r) => r.json()).then((d) => setSubjects(d.subjects || [])); }, [classId]);
  useEffect(() => { setChapters([]); setChapterId(""); if (subjectId) fetch(`${API_BASE_URL}/chapters?subject_id=${subjectId}`).then((r) => r.json()).then((d) => setChapters(d.chapters || [])); }, [subjectId]);

  async function uploadPdf() {
    if (!chapterId || !file) { setError("Select a chapter and PDF file."); return; }
    if (file.type !== "application/pdf" || file.size > 25 * 1024 * 1024) { setError("Select a valid PDF up to 25 MB."); return; }
    setSaving(true); setError(""); setStatus("Uploading PDF...");
    try {
      const response = await fetch(`${API_BASE_URL}/chapter-pdf`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chapter_id: Number(chapterId), file_name: file.name, file_content_base64: await fileToBase64(file) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Upload failed.");
      setStatus(`PDF uploaded successfully for ${chapters.find((item) => String(item.chapter_id) === chapterId)?.chapter_name}.`); setFile(null);
    } catch (uploadError) { setError(uploadError.message); setStatus(""); } finally { setSaving(false); }
  }

  return <DashboardShell><section className="module-page"><div className="module-content-area"><article className="module-card">
    <div className="card-title-row"><div><h2>Upload Chapter PDF</h2><p>Map a PDF to its class, subject and chapter.</p></div></div>
    <div className="learning-form-grid">
      <label><span>Class</span><select value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Select Class</option>{classes.map((item) => <option value={item.class_id} key={item.class_id}>{item.class_name}{item.section_name ? ` - ${item.section_name}` : ""}</option>)}</select></label>
      <label><span>Subject</span><select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!classId}><option value="">Select Subject</option>{subjects.map((item) => <option value={item.subject_id} key={item.subject_id}>{item.subject_name}</option>)}</select></label>
      <label><span>Chapter</span><select value={chapterId} onChange={(e) => setChapterId(e.target.value)} disabled={!subjectId}><option value="">Select Chapter</option>{chapters.map((item) => <option value={item.chapter_id} key={item.chapter_id}>{item.chapter_name}</option>)}</select></label>
      <label><span>PDF file</span><input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
    </div>
    <div className="quiz-submit-row"><button className="primary-button" type="button" onClick={uploadPdf} disabled={saving || !chapterId || !file}>{saving ? "Uploading..." : "Upload PDF"}</button></div>
    {status && <div className="learning-status success">{status}</div>}{error && <div className="learning-status error">{error}</div>}
  </article></div></section></DashboardShell>;
}
