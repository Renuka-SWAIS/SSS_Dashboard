"use client";

import { useEffect, useMemo, useState } from "react";
import { translateText } from "../services/studentApi";

const chapterSubjects = [
  "Social Science",
  "Maths",
  "Hindi",
  "Telugu",
];

const chapterLessons = [
  "Lesson 1",
  "Lesson 2",
  "Lesson 3",
  "Lesson 4",
  "Lesson 5",
  "Lesson 6",
  "Lesson 7",
  "Lesson 8",
  "Lesson 9",
  "Lesson 10",
];

const languages = [
  "English",
  "Telugu",
  "Hindi",
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_CHAPTER_API ||
  "http://localhost:2084";

export default function ChapterSelector({
  showReader = false,
}) {
  const [selectedSubject, setSelectedSubject] =
    useState("");

  const [selectedLesson, setSelectedLesson] =
    useState("");

  const [chapterContent, setChapterContent] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* -------------------------------------------------------
     TRANSLATION
  ------------------------------------------------------- */

  const [selectedLanguage, setSelectedLanguage] =
    useState("English");

  const [translatedContent, setTranslatedContent] =
    useState("");

  const [translationLoading, setTranslationLoading] =
    useState(false);

  const [translationError, setTranslationError] =
    useState("");

  /* -------------------------------------------------------
     AUDIO
  ------------------------------------------------------- */

  const [isReading, setIsReading] =
    useState(false);

  const [isPaused, setIsPaused] =
    useState(false);

  const [speechSupported, setSpeechSupported] =
    useState(false);

  /* -------------------------------------------------------
     DISPLAY CONTENT
  ------------------------------------------------------- */

  const displayText =
    selectedLanguage !== "English" &&
    translatedContent
      ? translatedContent
      : chapterContent?.full_text_content || "";

  const paragraphs = useMemo(() => {
    if (!displayText) {
      return [];
    }

    return displayText
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [displayText]);

  /* -------------------------------------------------------
     SPEECH SUPPORT
  ------------------------------------------------------- */

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window;

    setSpeechSupported(supported);

    return () => {
      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /* -------------------------------------------------------
     STOP AUDIO WHEN CONTENT / LANGUAGE CHANGES
  ------------------------------------------------------- */

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    setIsReading(false);
    setIsPaused(false);
  }, [
    chapterContent,
    translatedContent,
    selectedLanguage,
  ]);

  /* -------------------------------------------------------
     GET AVAILABLE VOICES
  ------------------------------------------------------- */

  function getVoiceForLanguage(language) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return null;
    }

    const voices = window.speechSynthesis.getVoices();

    let languageCode = "en-IN";

    if (language === "Telugu") {
      languageCode = "te-IN";
    } else if (language === "Hindi") {
      languageCode = "hi-IN";
    }

    const exactVoice = voices.find(
      (voice) =>
        voice.lang.toLowerCase() ===
        languageCode.toLowerCase()
    );

    if (exactVoice) {
      return exactVoice;
    }

    const matchingVoice = voices.find(
      (voice) =>
        voice.lang
          .toLowerCase()
          .startsWith(
            languageCode.split("-")[0].toLowerCase()
          )
    );

    return matchingVoice || null;
  }

  /* -------------------------------------------------------
     READ ALOUD
  ------------------------------------------------------- */

  function handleReadAloud() {
    if (
      !speechSupported ||
      !chapterContent ||
      !displayText
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const textToRead = `${
      chapterContent.content_title || ""
    }. ${displayText}`;

    const utterance =
      new SpeechSynthesisUtterance(textToRead);

    /* -----------------------------------------------
       LANGUAGE
    ------------------------------------------------ */

    if (selectedLanguage === "Telugu") {
      utterance.lang = "te-IN";
    } else if (selectedLanguage === "Hindi") {
      utterance.lang = "hi-IN";
    } else {
      utterance.lang = "en-IN";
    }

    /* -----------------------------------------------
       TRY TO SELECT CORRECT VOICE
    ------------------------------------------------ */

    const selectedVoice =
      getVoiceForLanguage(selectedLanguage);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.92;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsReading(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error(
        "Speech synthesis error:",
        event
      );

      setIsReading(false);
      setIsPaused(false);
    };

    setIsReading(true);
    setIsPaused(false);

    window.speechSynthesis.speak(utterance);
  }

  /* -------------------------------------------------------
     PAUSE / RESUME
  ------------------------------------------------------- */

  function handlePauseResume() {
    if (
      !speechSupported ||
      !isReading
    ) {
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }

  /* -------------------------------------------------------
     STOP
  ------------------------------------------------------- */

  function handleStopReading() {
    if (!speechSupported) {
      return;
    }

    window.speechSynthesis.cancel();

    setIsReading(false);
    setIsPaused(false);
  }

  /* -------------------------------------------------------
     GET CHAPTER CONTENT
  ------------------------------------------------------- */

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !selectedSubject ||
      !selectedLesson
    ) {
      setError(
        "Please select a subject and lesson."
      );

      setChapterContent(null);
      setTranslatedContent("");

      return;
    }

    setLoading(true);
    setError("");

    setChapterContent(null);
    setTranslatedContent("");
    setTranslationError("");
    setSelectedLanguage("English");

    handleStopReading();

    const params = new URLSearchParams({
      subject: selectedSubject,
      lesson: selectedLesson,
    });

    const url =
      `${API_BASE_URL}/chapter-content?${params.toString()}`;

    console.log(
      "================================="
    );

    console.log(
      "CHAPTER API BASE URL:",
      API_BASE_URL
    );

    console.log(
      "CHAPTER API URL:",
      url
    );

    console.log(
      "SUBJECT:",
      selectedSubject
    );

    console.log(
      "LESSON:",
      selectedLesson
    );

    console.log(
      "================================="
    );

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      console.log(
        "CHAPTER RESPONSE STATUS:",
        response.status
      );

      const data =
        await response
          .json()
          .catch(() => null);

      console.log(
        "CHAPTER RESPONSE DATA:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Chapter API failed with status ${response.status}`
        );
      }

      setChapterContent(data);

      setSelectedLanguage("English");
      setTranslatedContent("");
    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "CHAPTER FETCH FAILED:",
        error
      );

      console.error(
        "ERROR MESSAGE:",
        error?.message
      );

      console.error(
        "API URL:",
        url
      );

      console.error(
        "================================="
      );

      setError(
        error?.message ||
          "Unable to connect to chapter backend."
      );
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     TRANSLATE CHAPTER
  ------------------------------------------------------- */

  async function handleLanguageChange(event) {
    const language = event.target.value;

    setSelectedLanguage(language);
    setTranslationError("");

    handleStopReading();

    /* -----------------------------------------------
       ENGLISH = ORIGINAL CONTENT
    ------------------------------------------------ */

    if (language === "English") {
      setTranslatedContent("");
      return;
    }

    /* -----------------------------------------------
       CHECK CHAPTER
    ------------------------------------------------ */

    if (!chapterContent?.full_text_content) {
      setTranslationError(
        "Please load chapter content first."
      );

      return;
    }

    try {
      setTranslationLoading(true);
      setTranslatedContent("");

      const response =
        await translateText({
          text:
            chapterContent.full_text_content,

          target_language: language,

          user_email:
            "student@example.com",

          client_name: "SSS",
        });

      console.log(
        "CHAPTER TRANSLATION RESPONSE:",
        response
      );

      if (
        response?.status ===
        "success"
      ) {
        const translated =
          response.translated_text ||
          response.translation ||
          response.text ||
          "";

        if (!translated) {
          throw new Error(
            "Translation response did not contain translated text."
          );
        }

        setTranslatedContent(
          translated
        );
      } else {
        /*
         * Some backend responses may return
         * translated text without status.
         */

        const translated =
          response?.translated_text ||
          response?.translation ||
          response?.text ||
          "";

        if (translated) {
          setTranslatedContent(
            translated
          );
        } else {
          throw new Error(
            response?.detail ||
              "Translation failed."
          );
        }
      }
    } catch (error) {
      console.error(
        "CHAPTER TRANSLATION ERROR:",
        error
      );

      console.error(
        "BACKEND RESPONSE:",
        error?.response?.data
      );

      setTranslationError(
        error?.response?.data?.detail ||
          error?.message ||
          "Unable to translate chapter content."
      );
    } finally {
      setTranslationLoading(false);
    }
  }

  return (
    <>
      {/* ---------------------------------------------------
          CHAPTER SELECTOR
      --------------------------------------------------- */}

      <form
        className="chapter-selector chapter-page-selector"
        aria-label="Chapter selection"
        onSubmit={handleSubmit}
      >
        <select
          value={selectedSubject}
          aria-label="Select subject"
          onChange={(event) =>
            setSelectedSubject(
              event.target.value
            )
          }
        >
          <option
            value=""
            disabled
          >
            Select Subject...
          </option>

          {chapterSubjects.map(
            (subject) => (
              <option
                value={subject}
                key={subject}
              >
                {subject}
              </option>
            )
          )}
        </select>

        <select
          value={selectedLesson}
          aria-label="Select lesson"
          onChange={(event) =>
            setSelectedLesson(
              event.target.value
            )
          }
        >
          <option
            value=""
            disabled
          >
            Select Book Title...
          </option>

          {chapterLessons.map(
            (lesson) => (
              <option
                value={lesson}
                key={lesson}
              >
                {lesson}
              </option>
            )
          )}
        </select>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Loading"
            : "Go"}
        </button>
      </form>

      {/* ---------------------------------------------------
          CHAPTER CONTENT
      --------------------------------------------------- */}

      {showReader && (
        <div
          className="chapter-content-area"
          aria-live="polite"
        >
          {/* LOADING */}

          {loading && (
            <article className="chapter-message-card">
              <div className="loading-line" />

              <p>
                Loading chapter content...
              </p>
            </article>
          )}

          {/* ERROR */}

          {!loading && error && (
            <article className="chapter-message-card error">
              <h2>
                Content not available
              </h2>

              <p>
                {error}
              </p>
            </article>
          )}

          {/* CHAPTER */}

          {!loading &&
            chapterContent && (
              <article className="chapter-content-card">

                {/* HEADER */}

                <div className="chapter-content-header">

                  <div>
                    <h2>
                      {
                        chapterContent.content_title ||
                        selectedLesson
                      }
                    </h2>
                  </div>

                  <div
                    className="chapter-audio-controls"
                    aria-label="Chapter controls"
                  >

                    {/* LANGUAGE */}

                    <select
                      value={
                        selectedLanguage
                      }
                      onChange={
                        handleLanguageChange
                      }
                      disabled={
                        translationLoading
                      }
                      aria-label="Select language"
                    >
                      {languages.map(
                        (language) => (
                          <option
                            key={language}
                            value={language}
                          >
                            {language}
                          </option>
                        )
                      )}
                    </select>

                    {/* READ ALOUD */}

                    <button
                      type="button"
                      onClick={
                        handleReadAloud
                      }
                      disabled={
                        !speechSupported ||
                        translationLoading ||
                        !displayText
                      }
                    >
                      {isReading
                        ? "Restart Audio"
                        : "Read Aloud"}
                    </button>

                    {/* PAUSE / RESUME */}

                    <button
                      type="button"
                      onClick={
                        handlePauseResume
                      }
                      disabled={
                        !speechSupported ||
                        !isReading
                      }
                    >
                      {isPaused
                        ? "Resume"
                        : "Pause"}
                    </button>

                    {/* STOP */}

                    <button
                      type="button"
                      onClick={
                        handleStopReading
                      }
                      disabled={
                        !speechSupported ||
                        !isReading
                      }
                    >
                      Stop
                    </button>

                  </div>
                </div>

                {/* TRANSLATION STATUS */}

                {translationLoading && (
                  <p className="chapter-audio-note">
                    Translating chapter...
                  </p>
                )}

                {translationError && (
                  <p className="chapter-audio-note">
                    {translationError}
                  </p>
                )}

                {!speechSupported && (
                  <p className="chapter-audio-note">
                    Audio reading is not supported
                    in this browser.
                  </p>
                )}

                {/* CONTENT */}

                <div className="chapter-text">

                  {paragraphs.length >
                  0 ? (
                    paragraphs.map(
                      (
                        paragraph,
                        index
                      ) => (
                        <p
                          key={`${paragraph.slice(
                            0,
                            18
                          )}-${index}`}
                        >
                          {paragraph}
                        </p>
                      )
                    )
                  ) : (
                    <p>
                      {displayText ||
                        "No chapter content available."}
                    </p>
                  )}

                </div>

              </article>
            )}
        </div>
      )}
    </>
  );
}