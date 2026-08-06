import json
import os
from urllib.parse import quote
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from typing import Any


TRACKS = {
    "Fast Reader": {
        "title": "Fast Reader Material",
        "summary": "Short, challenge-focused material for students who read quickly and score strongly.",
        "steps": [
            "Read the chapter summary and mark unfamiliar terms.",
            "Attempt higher-order questions before reviewing notes.",
            "Create a one-page revision map for the chapter.",
            "Take a timed quiz and move to enrichment practice.",
        ],
    },
    "Average Reader": {
        "title": "Average Reader Material",
        "summary": "Balanced explanations, guided practice, and review checkpoints.",
        "steps": [
            "Read the chapter in two focused sections.",
            "Write three key points after each section.",
            "Review solved examples or teacher notes.",
            "Attempt the quiz, revise weak areas, then retry missed questions.",
        ],
    },
    "Slow Reader": {
        "title": "Slow Reader Material",
        "summary": "Step-by-step material with smaller reading blocks and extra comprehension support.",
        "steps": [
            "Read one small section at a time with audio support if needed.",
            "Underline keywords and write their meanings.",
            "Use short recap notes before each quiz attempt.",
            "Practice easier questions first, then retry with teacher/AI hints.",
        ],
    },
}


def classify_reader(
    reading_time_minutes: int,
    quiz_score: int,
    retry_count: int,
    comprehension_score: int,
) -> str:
    """Classify the learner using transparent rules until a real model is connected."""
    score = 0

    if reading_time_minutes <= 20:
        score += 2
    elif reading_time_minutes <= 40:
        score += 1

    if quiz_score >= 85:
        score += 2
    elif quiz_score >= 60:
        score += 1

    if comprehension_score >= 85:
        score += 2
    elif comprehension_score >= 60:
        score += 1

    if retry_count == 0:
        score += 1
    elif retry_count >= 3:
        score -= 1

    if score >= 5:
        return "Fast Reader"
    if score >= 3:
        return "Average Reader"
    return "Slow Reader"


class MockLearningPathLLM:
    """Deterministic fallback used only when no real AI provider is configured."""

    provider_name = "mock-free-llm"

    def generate_path(self, chapter_title: str, classification: str, metrics: dict[str, int]) -> dict[str, Any]:
        track = TRACKS[classification]
        focus = _focus_area(metrics)

        return {
            "provider": self.provider_name,
            "chapter_title": chapter_title,
            "classification": classification,
            "track_title": track["title"],
            "summary": track["summary"],
            "focus_area": focus,
            "steps": track["steps"],
            "recommended_materials": [
                f"{track['title']} - {chapter_title} reading notes",
                f"{chapter_title} recap worksheet",
                f"{chapter_title} adaptive quiz practice",
            ],
        }


class DeepSeekLearningPathLLM:
    """DeepSeek adapter using the OpenAI-compatible /chat/completions API."""

    provider_name = "deepseek"

    def __init__(self):
        self.api_key = os.getenv("DEEPSEEK_API_KEY")
        self.base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
        self.model = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")

    def generate_path(self, chapter_title: str, classification: str, metrics: dict[str, int]) -> dict[str, Any]:
        if not self.api_key:
            raise RuntimeError("DEEPSEEK_API_KEY is not configured.")

        prompt = {
            "chapter_title": chapter_title,
            "classification": classification,
            "metrics": metrics,
            "required_json_shape": {
                "summary": "short learner-friendly summary",
                "focus_area": "main improvement area",
                "steps": ["4 to 6 concrete study steps"],
                "recommended_materials": ["3 recommended materials"],
            },
        }
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You create personalized school study paths. "
                        "Return only valid JSON with keys: summary, focus_area, steps, recommended_materials."
                    ),
                },
                {"role": "user", "content": json.dumps(prompt)},
            ],
            "response_format": {"type": "json_object"},
            "max_tokens": 900,
            "temperature": 0.4,
        }

        try:
            response = self._post_chat_completion(payload)
            content = response["choices"][0]["message"]["content"]
            ai_path = json.loads(content)
        except HTTPError as error:
            raise RuntimeError(_deepseek_http_error_message(error)) from error
        except URLError as error:
            raise RuntimeError(f"DeepSeek connection failed: {error.reason}") from error
        except (KeyError, IndexError, json.JSONDecodeError) as error:
            raise RuntimeError("DeepSeek returned an invalid learning path response.") from error

        track = TRACKS[classification]

        return {
            "provider": self.provider_name,
            "chapter_title": chapter_title,
            "classification": classification,
            "track_title": track["title"],
            "summary": ai_path.get("summary") or track["summary"],
            "focus_area": ai_path.get("focus_area") or _focus_area(metrics),
            "steps": _list_or_default(ai_path.get("steps"), track["steps"]),
            "recommended_materials": _list_or_default(
                ai_path.get("recommended_materials"),
                [
                    f"{track['title']} - {chapter_title} reading notes",
                    f"{chapter_title} recap worksheet",
                    f"{chapter_title} adaptive quiz practice",
                ],
            ),
        }

    def _post_chat_completion(self, payload: dict[str, Any]) -> dict[str, Any]:
        request = Request(
            f"{self.base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urlopen(request, timeout=25) as response:
            return json.loads(response.read().decode("utf-8"))


class GeminiLearningPathLLM:
    """Gemini adapter using Google AI Studio's generateContent REST API."""

    provider_name = "gemini"

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.base_url = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com").rstrip("/")
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    def generate_path(self, chapter_title: str, classification: str, metrics: dict[str, int]) -> dict[str, Any]:
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured.")

        prompt = {
            "chapter_title": chapter_title,
            "classification": classification,
            "metrics": metrics,
            "instructions": "Return concise JSON only: summary, focus_area, steps, recommended_materials.",
        }
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": json.dumps(prompt)}],
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.4,
                "maxOutputTokens": 2048,
            },
        }

        try:
            response = self._generate_content(payload)
            content = _gemini_text(response)
            ai_path = _loads_json_object(content)
        except HTTPError as error:
            raise RuntimeError(_gemini_http_error_message(error)) from error
        except URLError as error:
            raise RuntimeError(f"Gemini connection failed: {error.reason}") from error
        except (KeyError, IndexError, json.JSONDecodeError) as error:
            raise RuntimeError("Gemini returned an invalid learning path response.") from error

        track = TRACKS[classification]

        return {
            "provider": self.provider_name,
            "chapter_title": chapter_title,
            "classification": classification,
            "track_title": track["title"],
            "summary": ai_path.get("summary") or track["summary"],
            "focus_area": ai_path.get("focus_area") or _focus_area(metrics),
            "steps": _list_or_default(ai_path.get("steps"), track["steps"]),
            "recommended_materials": _list_or_default(
                ai_path.get("recommended_materials"),
                [
                    f"{track['title']} - {chapter_title} reading notes",
                    f"{chapter_title} recap worksheet",
                    f"{chapter_title} adaptive quiz practice",
                ],
            ),
        }

    def _generate_content(self, payload: dict[str, Any]) -> dict[str, Any]:
        model = quote(self.model, safe="")
        request = Request(
            f"{self.base_url}/v1beta/models/{model}:generateContent?key={self.api_key}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urlopen(request, timeout=25) as response:
            return json.loads(response.read().decode("utf-8"))


def translate_text_with_gemini(text: str, target_language: str, source_language: str = "auto-detect") -> str:
    client = GeminiLearningPathLLM()
    if not client.api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    prompt = (
        f"Translate the following school-learning text from {source_language} into {target_language}. "
        "Preserve names, numbers, formatting and subject terminology. Return only the translated text, "
        "without explanations or quotation marks.\n\n" + text
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 4096},
    }
    try:
        translated = _gemini_text(client._generate_content(payload)).strip()
    except HTTPError as error:
        raise RuntimeError(_gemini_http_error_message(error)) from error
    except URLError as error:
        raise RuntimeError(f"Gemini connection failed: {error.reason}") from error
    except (KeyError, IndexError, json.JSONDecodeError) as error:
        raise RuntimeError("Gemini returned an invalid translation response.") from error
    if not translated:
        raise RuntimeError("Gemini returned an empty translation.")
    return translated


def generate_quiz_with_gemini(topic: str, difficulty: str, question_count: int) -> list[dict[str, Any]]:
    client = GeminiLearningPathLLM()
    if not client.api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    prompt = {
        "task": "Generate a school quiz",
        "topic": topic,
        "difficulty": difficulty,
        "question_count": question_count,
        "instructions": (
            "Return JSON only with key quiz. quiz must contain exactly question_count multiple-choice "
            "questions. Each item must have question, options (exactly 4 unique strings), answer "
            "(exact text from options), and explanation."
        ),
    }
    payload = {
        "contents": [{"role": "user", "parts": [{"text": json.dumps(prompt)}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.5,
            "maxOutputTokens": 4096,
        },
    }
    try:
        data = _loads_json_object(_gemini_text(client._generate_content(payload)))
    except HTTPError as error:
        raise RuntimeError(_gemini_http_error_message(error)) from error
    except URLError as error:
        raise RuntimeError(f"Gemini connection failed: {error.reason}") from error
    except (KeyError, IndexError, json.JSONDecodeError) as error:
        raise RuntimeError("Gemini returned an invalid quiz response.") from error

    normalized = []
    for item in data.get("quiz", []):
        options = [str(value).strip() for value in item.get("options", []) if str(value).strip()]
        answer = str(item.get("answer") or item.get("correct_answer") or "").strip()
        question = str(item.get("question") or "").strip()
        if question and len(options) == 4 and answer in options:
            normalized.append({
                "question": question,
                "options": options,
                "answer": answer,
                "correct_answer": answer,
                "explanation": str(item.get("explanation") or "").strip(),
            })
    if len(normalized) < question_count:
        raise RuntimeError("Gemini did not return enough valid quiz questions. Please generate again.")
    return normalized[:question_count]


def generate_study_content_with_gemini(chapter_title: str, chapter_text: str, classification: str) -> dict[str, Any]:
    client = GeminiLearningPathLLM()
    if not client.api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    prompt = {
        "task": "Generate personalized study content using only the supplied chapter text",
        "chapter_title": chapter_title,
        "learner_type": classification,
        "chapter_text": chapter_text[:18000],
        "instructions": (
            "Return JSON only with simple_notes (5-8 strings), key_terms (objects with term and meaning), "
            "recap (string), and practice_questions (4-6 strings). For Fast Reader add challenge; "
            "for Average Reader use balanced checkpoints; for Slow Reader use short simple points."
        ),
    }
    payload = {
        "contents": [{"role": "user", "parts": [{"text": json.dumps(prompt)}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.4, "maxOutputTokens": 4096},
    }
    try:
        result = _loads_json_object(_gemini_text(client._generate_content(payload)))
    except HTTPError as error:
        raise RuntimeError(_gemini_http_error_message(error)) from error
    except URLError as error:
        raise RuntimeError(f"Gemini connection failed: {error.reason}") from error
    except (KeyError, IndexError, json.JSONDecodeError) as error:
        raise RuntimeError("Gemini returned invalid study content.") from error
    if not result.get("simple_notes") or not result.get("practice_questions"):
        raise RuntimeError("Gemini returned incomplete study content.")
    return result


def _deepseek_http_error_message(error: HTTPError) -> str:
    try:
        body = json.loads(error.read().decode("utf-8"))
        message = body.get("error", {}).get("message")
    except (json.JSONDecodeError, UnicodeDecodeError):
        message = None

    if message:
        return f"DeepSeek API error {error.code}: {message}"

    return f"DeepSeek API error {error.code}."


def _gemini_http_error_message(error: HTTPError) -> str:
    try:
        body = json.loads(error.read().decode("utf-8"))
        message = body.get("error", {}).get("message")
    except (json.JSONDecodeError, UnicodeDecodeError):
        message = None

    if message:
        return f"Gemini API error {error.code}: {message}"

    return f"Gemini API error {error.code}."


def _gemini_text(response: dict[str, Any]) -> str:
    parts = response["candidates"][0]["content"]["parts"]
    return "\n".join(part.get("text", "") for part in parts).strip()


def _loads_json_object(content: str) -> dict[str, Any]:
    cleaned = content.strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        parsed = json.loads(cleaned[start : end + 1])

    if not isinstance(parsed, dict):
        raise json.JSONDecodeError("Expected a JSON object.", cleaned, 0)

    return parsed


def _list_or_default(value: Any, default: list[str]) -> list[str]:
    if isinstance(value, list):
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        if cleaned:
            return cleaned

    return default


def _focus_area(metrics: dict[str, int]) -> str:
    if metrics["comprehension_score"] < 60:
        return "Build comprehension through smaller reading blocks and recap questions."
    if metrics["quiz_score"] < 60:
        return "Improve quiz accuracy by revising mistakes before retrying."
    if metrics["retry_count"] >= 3:
        return "Reduce repeated attempts with guided review after each quiz."
    return "Maintain pace and deepen understanding with challenge practice."


def get_learning_path_generator() -> MockLearningPathLLM:
    configured_provider = os.getenv("AI_PROVIDER", "").strip().lower()
    provider = configured_provider or ("gemini" if os.getenv("GEMINI_API_KEY") else "mock")

    if provider in {"gemini", "geminai", "google", "google-gemini"}:
        return GeminiLearningPathLLM()

    if provider == "deepseek":
        return DeepSeekLearningPathLLM()

    return MockLearningPathLLM()
