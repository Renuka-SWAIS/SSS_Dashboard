"use client";

import { useState } from "react";
import DashboardShell from "../dashboard-shell";
import {
  translateText,
  voiceToText,
  audioTranslator,
} from "../../services/studentApi";

export default function SettingsPage() {
  /* -------------------------------------------------------
     TRANSLATE
  ------------------------------------------------------- */

  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleTranslate() {
    try {
      setLoading(true);

      const response = await translateText({
        text: "Welcome to SSS School",
        target_language: "Telugu",
        user_email: "student@example.com",
        client_name: "SSS",
      });

      console.log("Translate Response:", response);

      if (response?.status === "success") {
        setResult(
          response.translated_text ||
            response.translation ||
            "Translation received"
        );
      } else {
        setResult("Translation failed");
      }
    } catch (error) {
      console.log("Translation Error:", error);
      console.log("Backend Response:", error.response?.data);

      alert("Translation Failed");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     VOICE TO TEXT
  ------------------------------------------------------- */

  const [voiceFile, setVoiceFile] = useState(null);
  const [voiceResult, setVoiceResult] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);

  async function handleVoiceToText() {
    if (!voiceFile) {
      alert("Please select an audio file");
      return;
    }

    try {
      setVoiceLoading(true);

      const formData = new FormData();

      formData.append("file", voiceFile);
      formData.append("language", "English");
      formData.append(
        "user_email",
        "student@example.com"
      );
      formData.append("client_name", "SSS");

      console.log(
        "VOICE TO TEXT REQUEST:",
        voiceFile.name
      );

      const response = await voiceToText(formData);

      console.log(
        "Voice To Text Response:",
        response
      );

      if (response?.status === "success") {
        setVoiceResult(
          response.text ||
            response.transcribed_text ||
            response.transcription ||
            "Voice converted successfully"
        );
      } else {
        setVoiceResult(
          response?.text ||
            response?.transcribed_text ||
            response?.transcription ||
            "Voice-to-text completed"
        );
      }
    } catch (error) {
      console.log(
        "Voice To Text Error:",
        error
      );

      console.log(
        "Backend Response:",
        error.response?.data
      );

      alert("Voice To Text Failed");
    } finally {
      setVoiceLoading(false);
    }
  }

  /* -------------------------------------------------------
     AUDIO TRANSLATOR
  ------------------------------------------------------- */

  const [audioFile, setAudioFile] = useState(null);
  const [audioResult, setAudioResult] = useState("");
  const [audioLoading, setAudioLoading] = useState(false);

  async function handleAudioTranslator() {
    if (!audioFile) {
      alert("Please select an audio file");
      return;
    }

    try {
      setAudioLoading(true);

      const formData = new FormData();

      formData.append("file", audioFile);
      formData.append(
        "source_language",
        "English"
      );
      formData.append(
        "target_language",
        "Telugu"
      );
      formData.append(
        "user_email",
        "student@example.com"
      );
      formData.append(
        "client_name",
        "SSS"
      );

      console.log(
        "AUDIO TRANSLATOR REQUEST:",
        audioFile.name
      );

      const response =
        await audioTranslator(formData);

      console.log(
        "Audio Translator Response:",
        response
      );

      if (response?.status === "success") {
        setAudioResult(
          response.translated_text ||
            response.translation ||
            response.text ||
            "Audio translated successfully"
        );
      } else {
        setAudioResult(
          response?.translated_text ||
            response?.translation ||
            response?.text ||
            "Audio translation completed"
        );
      }
    } catch (error) {
      console.log(
        "Audio Translator Error:",
        error
      );

      console.log(
        "Backend Response:",
        error.response?.data
      );

      alert("Audio Translator Failed");
    } finally {
      setAudioLoading(false);
    }
  }

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  return (
    <DashboardShell>
      <section className="module-page">

        <div className="module-content-area">

          {/* ------------------------------------------------
              TRANSLATE
          ------------------------------------------------ */}

          <article className="module-card blue-module">

            <h2>Translate</h2>

            <button
              className="primary-button"
              type="button"
              onClick={handleTranslate}
              disabled={loading}
            >
              {loading
                ? "Translating..."
                : "Translate"}
            </button>

            {result && (
              <>
                <h3>Translated Text</h3>

                <p>{result}</p>
              </>
            )}

          </article>


          {/* ------------------------------------------------
              VOICE TO TEXT
          ------------------------------------------------ */}

          <article className="module-card blue-module">

            <h2>Voice To Text</h2>

            <input
              type="file"
              accept="audio/*"
              onChange={(event) => {
                setVoiceFile(
                  event.target.files?.[0] || null
                );

                setVoiceResult("");
              }}
            />

            {voiceFile && (
              <p>
                Selected file:{" "}
                <strong>
                  {voiceFile.name}
                </strong>
              </p>
            )}

            <button
              className="primary-button"
              type="button"
              onClick={handleVoiceToText}
              disabled={
                voiceLoading || !voiceFile
              }
            >
              {voiceLoading
                ? "Converting..."
                : "Convert Voice To Text"}
            </button>

            {voiceResult && (
              <>
                <h3>Transcribed Text</h3>

                <p>{voiceResult}</p>
              </>
            )}

          </article>


          {/* ------------------------------------------------
              AUDIO TRANSLATOR
          ------------------------------------------------ */}

          <article className="module-card blue-module">

            <h2>Audio Translator</h2>

            <input
              type="file"
              accept="audio/*"
              onChange={(event) => {
                setAudioFile(
                  event.target.files?.[0] || null
                );

                setAudioResult("");
              }}
            />

            {audioFile && (
              <p>
                Selected file:{" "}
                <strong>
                  {audioFile.name}
                </strong>
              </p>
            )}

            <div className="meta-row">

              <span>
                Source: English
              </span>

              <span>
                Target: Telugu
              </span>

            </div>

            <button
              className="primary-button"
              type="button"
              onClick={handleAudioTranslator}
              disabled={
                audioLoading || !audioFile
              }
            >
              {audioLoading
                ? "Translating..."
                : "Translate Audio"}
            </button>

            {audioResult && (
              <>
                <h3>Audio Translation</h3>

                <p>{audioResult}</p>
              </>
            )}

          </article>

        </div>

      </section>
    </DashboardShell>
  );
}