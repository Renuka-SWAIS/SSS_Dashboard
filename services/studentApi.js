import api from "./api";
import { getApiBaseUrl } from "../app/api-base-url";

/* -------------------------------------------------------
   CONTENT GENERATION
------------------------------------------------------- */

export const generateContent = async (data) => {
  const response = await api.post(
    "/content/generate",
    data
  );

  return response.data;
};

/* -------------------------------------------------------
   QUIZ GENERATION
------------------------------------------------------- */

export const generateQuiz = async (data) => {
  const response = await fetch(`${getApiBaseUrl()}/quiz/generate`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || "Quiz generation failed.");
  return result;
};

/* -------------------------------------------------------
   TRANSLATE
------------------------------------------------------- */

export const translateText = async (data) => {
  const response = await fetch(`${getApiBaseUrl()}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || "Translation failed.");
  return result;
};

/* -------------------------------------------------------
   QUIZ EVALUATION
------------------------------------------------------- */

export const evaluateQuiz = async (data) => {
  const response = await fetch(`${getApiBaseUrl()}/quiz/evaluate`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || "Quiz evaluation failed.");
  return result;
};

/* -------------------------------------------------------
   SELF ASSESSMENT
------------------------------------------------------- */

export const selfAssessment = async (data) => {
  const baseUrl = (
    process.env.NEXT_PUBLIC_AI_API || ""
  ).replace(/\/+$/, "");

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_AI_API is not configured.");
  }

  const response = await fetch(
    `${baseUrl}/assess/self`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json().catch(() => ({}));

  console.log(
    "🔥 SELF ASSESSMENT STATUS:",
    response.status
  );

  console.log(
    "🔥 SELF ASSESSMENT RESPONSE:",
    result
  );

  if (!response.ok) {
    throw new Error(
      result?.detail ||
      result?.message ||
      `Self assessment failed: ${response.status}`
    );
  }

  return result;
};
/* -------------------------------------------------------
   TEXT TO VOICE
------------------------------------------------------- */

export const textToVoice = async (data) => {
  const response = await api.post(
    "/text-to-voice",
    data
  );

  return response.data;
};

/* -------------------------------------------------------
   VOICE TO TEXT
------------------------------------------------------- */

export const voiceToText = async (formData) => {
  const response = await api.post(
    "/voice-to-text",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/* -------------------------------------------------------
   AUDIO TRANSLATOR
------------------------------------------------------- */

export const audioTranslator = async (formData) => {
  const response = await api.post(
    "/audio-translator",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/* -------------------------------------------------------
   GENERATE ALERT
------------------------------------------------------- */

export const generateAlert = async (data) => {
  const response = await api.post(
    "/alerts/generate",
    data
  );

  return response.data;
};
