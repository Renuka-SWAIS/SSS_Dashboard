import api from "./api";

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
  const response = await api.post(
    "/quiz/generate",
    data
  );

  return response.data;
};

/* -------------------------------------------------------
   TRANSLATE
------------------------------------------------------- */

export const translateText = async (data) => {
  const response = await api.post(
    "/translate",
    data
  );

  return response.data;
};

/* -------------------------------------------------------
   QUIZ EVALUATION
------------------------------------------------------- */

export const evaluateQuiz = async (data) => {
  const response = await api.post(
    "/quiz/evaluate",
    data
  );

  return response.data;
};

/* -------------------------------------------------------
   SELF ASSESSMENT
------------------------------------------------------- */

export const selfAssessment = async (data) => {
  const response = await api.post(
    "/assess/self",
    data
  );

  return response.data;
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