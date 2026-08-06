"use client";

import { useState } from "react";
import DashboardShell from "../dashboard-shell";
import StudyTabs from "../study-tabs";
import { getApiBaseUrl } from "../api-base-url";

const API_BASE_URL = getApiBaseUrl();
const languages = ["English", "Hindi", "Telugu", "Tamil", "Marathi", "Gujarati", "Kannada", "Bengali"];
const sampleText = "Democracy means that people choose their representatives through regular elections.";

export default function AiTranslatorPage() {
  const [sourceLanguage, setSourceLanguage] = useState("auto-detect");
  const [targetLanguage, setTargetLanguage] = useState("Hindi");
  const [text, setText] = useState(sampleText);
  const [translatedText, setTranslatedText] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleTranslate() {
    if (!text.trim()) { setError("Please enter text to translate."); return; }
    setLoading(true); setError(""); setStatus("Translating text..."); setTranslatedText("");
    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), source_language: sourceLanguage, target_language: targetLanguage })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Unable to translate text.");
      setTranslatedText(data.translated_text || "");
      setStatus("Translation ready.");
    } catch (translateError) {
      setError(translateError.message || "Unable to translate text."); setStatus("");
    } finally { setLoading(false); }
  }

  async function handleCopy() {
    if (translatedText && navigator.clipboard) {
      await navigator.clipboard.writeText(translatedText); setStatus("Translated text copied.");
    }
  }

  function handleSpeak() {
    if (!translatedText || !("speechSynthesis" in window)) { setError("Text to voice is not supported in this browser."); return; }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(translatedText);
    speech.lang = targetLanguage === "Hindi" ? "hi-IN" : targetLanguage === "Telugu" ? "te-IN" : "en-IN";
    window.speechSynthesis.speak(speech);
  }

  return (
    <DashboardShell>
      <section className="module-page">
        <StudyTabs />
        <div className="module-content-area">
          <article className="module-card translator-card">
            <div className="card-title-row">
              <div><h2>AI Translator</h2><p>Translate study text into another language script.</p></div>
              <span className="status-pill in-progress">AI Tool</span>
            </div>
            <div className="translator-grid">
              <section className="translator-panel">
                <div className="translator-controls">
                  <label><span>Source</span><select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)}><option value="auto-detect">Auto Detect</option>{languages.map((language) => <option key={language}>{language}</option>)}</select></label>
                  <label><span>Target</span><select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>{languages.map((language) => <option key={language}>{language}</option>)}</select></label>
                </div>
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste study text here" maxLength={12000} />
              </section>
              <section className="translator-panel output">
                <div className="translator-output-head"><strong>Translated Text</strong><div>
                  <button className="soft-button" type="button" onClick={handleCopy} disabled={!translatedText}>Copy</button>
                  <button className="soft-button" type="button" onClick={handleSpeak} disabled={!translatedText}>Speak</button>
                  <button className="soft-button" type="button" onClick={() => window.speechSynthesis?.cancel()}>Stop</button>
                </div></div>
                <div className="translator-output" aria-live="polite">{translatedText || "Translation will appear here."}</div>
              </section>
            </div>
            {error && <div className="learning-status error" role="alert">{error}</div>}
            {status && <div className="learning-status success" role="status">{status}</div>}
            <div className="quiz-submit-row"><button className="primary-button" type="button" onClick={handleTranslate} disabled={loading}>{loading ? "Translating..." : "Translate"}</button></div>
          </article>
          <div className="note-box">Use AI Translator for study notes, chapter paragraphs, and assignment instructions.</div>
        </div>
      </section>
    </DashboardShell>
  );
}
