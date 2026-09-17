import json
import os
from urllib.parse import quote
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from typing import Any


TRACKS = {
    "Fast Reader": {
        "title": "Fast Reader Material",
        "summary": (
            "Short, challenge-focused material for students who read "
            "quickly and score strongly."
        ),
        "steps": [
            "Read the chapter summary and mark unfamiliar terms.",
            "Attempt higher-order questions before reviewing notes.",
            "Create a one-page revision map for the chapter.",
            "Take a timed quiz and move to enrichment practice.",
        ],
    },
    "Average Reader": {
        "title": "Average Reader Material",
        "summary": (
            "Balanced explanations, guided practice, and review checkpoints."
        ),
        "steps": [
            "Read the chapter in two focused sections.",
            "Write three key points after each section.",
            "Review solved examples or teacher notes.",
            "Attempt the quiz, revise weak areas, then retry missed questions.",
        ],
    },
    "Slow Reader": {
        "title": "Slow Reader Material",
        "summary": (
            "Step-by-step material with smaller reading blocks and extra "
            "comprehension support."
        ),
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
    """Classify the learner primarily from reading time."""

    if reading_time_minutes <= 15:
        return "Fast Reader"

    if reading_time_minutes <= 30:
        return "Average Reader"

    return "Slow Reader"


class MockLearningPathLLM:
    """Deterministic fallback used only when no real AI provider is configured."""

    provider_name = "mock-free-llm"

    def generate_path(
        self,
        chapter_title: str,
        classification: str,
        metrics: dict[str, int],
    ) -> dict[str, Any]:
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
        self.base_url = os.getenv(
            "DEEPSEEK_BASE_URL",
            "https://api.deepseek.com",
        ).rstrip("/")
        self.model = os.getenv(
            "DEEPSEEK_MODEL",
            "deepseek-v4-flash",
        )

    def generate_path(
        self,
        chapter_title: str,
        classification: str,
        metrics: dict[str, int],
    ) -> dict[str, Any]:
        if not self.api_key:
            raise RuntimeError(
                "DEEPSEEK_API_KEY is not configured."
            )

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
                        "Return only valid JSON with keys: summary, focus_area, "
                        "steps, recommended_materials."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(prompt),
                },
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
            raise RuntimeError(
                _deepseek_http_error_message(error)
            ) from error

        except URLError as error:
            raise RuntimeError(
                f"DeepSeek connection failed: {error.reason}"
            ) from error

        except (
            KeyError,
            IndexError,
            json.JSONDecodeError,
        ) as error:
            raise RuntimeError(
                "DeepSeek returned an invalid learning path response."
            ) from error

        track = TRACKS[classification]

        return {
            "provider": self.provider_name,
            "chapter_title": chapter_title,
            "classification": classification,
            "track_title": track["title"],
            "summary": ai_path.get("summary") or track["summary"],
            "focus_area": ai_path.get("focus_area") or _focus_area(metrics),
            "steps": _list_or_default(
                ai_path.get("steps"),
                track["steps"],
            ),
            "recommended_materials": _list_or_default(
                ai_path.get("recommended_materials"),
                [
                    f"{track['title']} - {chapter_title} reading notes",
                    f"{chapter_title} recap worksheet",
                    f"{chapter_title} adaptive quiz practice",
                ],
            ),
        }

    def _post_chat_completion(
        self,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
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
            return json.loads(
                response.read().decode("utf-8")
            )


class GeminiLearningPathLLM:
    """Gemini adapter using Google AI Studio's generateContent REST API."""

    provider_name = "gemini"

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.base_url = os.getenv(
            "GEMINI_BASE_URL",
            "https://generativelanguage.googleapis.com",
        ).rstrip("/")
        self.model = os.getenv(
            "GEMINI_MODEL",
            "gemini-2.5-flash",
        )

    def generate_path(
        self,
        chapter_title: str,
        classification: str,
        metrics: dict[str, int],
    ) -> dict[str, Any]:
        if not self.api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not configured."
            )

        prompt = {
            "chapter_title": chapter_title,
            "classification": classification,
            "metrics": metrics,
            "instructions": (
                "Return concise JSON only: summary, focus_area, "
                "steps, recommended_materials."
            ),
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
            raise RuntimeError(
                _gemini_http_error_message(error)
            ) from error

        except URLError as error:
            raise RuntimeError(
                f"Gemini connection failed: {error.reason}"
            ) from error

        except (
            KeyError,
            IndexError,
            json.JSONDecodeError,
        ) as error:
            raise RuntimeError(
                "Gemini returned an invalid learning path response."
            ) from error

        track = TRACKS[classification]

        return {
            "provider": self.provider_name,
            "chapter_title": chapter_title,
            "classification": classification,
            "track_title": track["title"],
            "summary": ai_path.get("summary") or track["summary"],
            "focus_area": ai_path.get("focus_area") or _focus_area(metrics),
            "steps": _list_or_default(
                ai_path.get("steps"),
                track["steps"],
            ),
            "recommended_materials": _list_or_default(
                ai_path.get("recommended_materials"),
                [
                    f"{track['title']} - {chapter_title} reading notes",
                    f"{chapter_title} recap worksheet",
                    f"{chapter_title} adaptive quiz practice",
                ],
            ),
        }

    def _generate_content(
        self,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        model = quote(self.model, safe="")

        request = Request(
            f"{self.base_url}/v1beta/models/{model}:generateContent"
            f"?key={self.api_key}",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urlopen(request, timeout=25) as response:
            return json.loads(
                response.read().decode("utf-8")
            )


# -------------------------------------------------------
# TRANSLATION
# -------------------------------------------------------

def translate_text_with_gemini(
    text: str,
    target_language: str,
    source_language: str = "auto-detect",
) -> str:
    client = GeminiLearningPathLLM()

    if not client.api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    if source_language.strip().lower() in {
        "auto-detect",
        "auto",
        "",
    }:
        prompt = (
            f"First identify the language of the following text internally. "
            f"Then translate the text into {target_language}. "
            "Do not translate into the detected language; translate INTO "
            "the requested target language. "
            "Preserve names, numbers, formatting, punctuation and subject "
            "terminology. "
            "Return only the translated text. "
            "Do not mention the detected language. "
            "Do not add explanations, labels, quotation marks, or notes.\n\n"
            f"Text:\n{text}"
        )
    else:
        prompt = (
            f"Translate the following school-learning text from "
            f"{source_language} into {target_language}. "
            "Preserve names, numbers, formatting, punctuation and subject "
            "terminology. "
            "Return only the translated text, without explanations or "
            "quotation marks.\n\n"
            f"Text:\n{text}"
        )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4096,
        },
    }

    try:
        translated = _gemini_text(
            client._generate_content(payload)
        ).strip()

    except HTTPError as error:
        raise RuntimeError(
            _gemini_http_error_message(error)
        ) from error

    except URLError as error:
        raise RuntimeError(
            f"Gemini connection failed: {error.reason}"
        ) from error

    except (
        KeyError,
        IndexError,
        json.JSONDecodeError,
    ) as error:
        raise RuntimeError(
            "Gemini returned an invalid translation response."
        ) from error

    if not translated:
        raise RuntimeError(
            "Gemini returned an empty translation."
        )

    return translated


def generate_quiz_with_gemini(
    topic: str,
    difficulty: str,
    question_count: int,
) -> list[dict[str, Any]]:
    client = GeminiLearningPathLLM()

    if not client.api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    prompt = {
        "task": "Generate a school quiz",
        "topic": topic,
        "difficulty": difficulty,
        "question_count": question_count,
        "instructions": (
            "Return JSON only with key quiz. quiz must contain exactly "
            "question_count multiple-choice questions. Each item must have "
            "question, options (exactly 4 unique strings), answer "
            "(exact text from options), and explanation."
        ),
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
            "temperature": 0.5,
            "maxOutputTokens": 4096,
        },
    }

    try:
        data = _loads_json_object(
            _gemini_text(
                client._generate_content(payload)
            )
        )

    except HTTPError as error:
        raise RuntimeError(
            _gemini_http_error_message(error)
        ) from error

    except URLError as error:
        raise RuntimeError(
            f"Gemini connection failed: {error.reason}"
        ) from error

    except (
        KeyError,
        IndexError,
        json.JSONDecodeError,
    ) as error:
        raise RuntimeError(
            "Gemini returned an invalid quiz response."
        ) from error

    normalized = []

    for item in data.get("quiz", []):
        options = [
            str(value).strip()
            for value in item.get("options", [])
            if str(value).strip()
        ]

        answer = str(
            item.get("answer")
            or item.get("correct_answer")
            or ""
        ).strip()

        question = str(
            item.get("question")
            or ""
        ).strip()

        if question and len(options) == 4 and answer in options:
            normalized.append(
                {
                    "question": question,
                    "options": options,
                    "answer": answer,
                    "correct_answer": answer,
                    "explanation": str(
                        item.get("explanation") or ""
                    ).strip(),
                }
            )

    if len(normalized) < question_count:
        raise RuntimeError(
            "Gemini did not return enough valid quiz questions. "
            "Please generate again."
        )

    return normalized[:question_count]


def generate_study_content_with_gemini(
    chapter_title: str,
    chapter_text: str,
    classification: str,
) -> dict[str, Any]:
    client = GeminiLearningPathLLM()

    if not client.api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    reader_instructions = {
        "Fast Reader": (
            "Create compact, high-density study material for a fast reader. "
            "Use concise but information-rich notes. Focus on important facts, "
            "connections, comparisons, higher-order thinking, and challenge "
            "questions. Avoid unnecessary repetition and basic explanations. "
            "The student should be able to revise the chapter quickly."
        ),
        "Average Reader": (
            "Create balanced study material for an average reader. "
            "Explain concepts clearly at a moderate pace. Organize the "
            "material into logical sections. Include key points, guided "
            "checkpoints, examples, and a balanced mixture of understanding "
            "and practice questions."
        ),
        "Slow Reader": (
            "Create supportive study material for a slow reader. "
            "Break the chapter into small, easy-to-read ideas. Use simple "
            "language, short explanations, keyword meanings, recap points, "
            "and step-by-step practice. Repeat important concepts when "
            "helpful for comprehension. Avoid dense paragraphs and difficult "
            "questions at the beginning."
        ),
    }

    prompt = {
        "task": (
            "Generate personalized study content using only the supplied "
            "chapter text."
        ),
        "chapter_title": chapter_title,
        "learner_type": classification,
        "reader_specific_instruction": reader_instructions.get(
            classification,
            reader_instructions["Average Reader"],
        ),
        "chapter_text": chapter_text[:18000],
        "instructions": (
            "The learner type is mandatory and MUST significantly change "
            "the generated content. Do NOT generate generic content that "
            "could be used unchanged for another learner type. "
            "Adapt the explanation depth, sentence length, information "
            "density, difficulty, pacing, examples, and practice questions "
            "to the selected learner type. "

            "For Fast Reader: prioritize concise revision, important facts, "
            "connections, comparisons, higher-order thinking, and challenging "
            "questions. "

            "For Average Reader: provide moderate explanations, logical "
            "sections, checkpoints, examples, and balanced practice. "

            "For Slow Reader: use very short explanations, simple language, "
            "small learning blocks, keyword meanings, repetition of important "
            "ideas, and easier questions before harder questions. "

            "The output for Fast Reader, Average Reader, and Slow Reader "
            "must NOT be identical or merely reworded versions of each other. "

            "Return JSON only with exactly these keys: "
            "simple_notes, key_terms, recap, practice_questions. "

            "simple_notes must contain 5-8 strings. "
            "key_terms must contain objects with term and meaning. "
            "recap must be a concise paragraph. "
            "practice_questions must contain 4-6 questions."
        ),
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
            "temperature": 0.5,
            "maxOutputTokens": 4096,
        },
    }

    try:
        result = _loads_json_object(
            _gemini_text(
                client._generate_content(payload)
            )
        )

    except HTTPError as error:
        raise RuntimeError(
            _gemini_http_error_message(error)
        ) from error

    except URLError as error:
        raise RuntimeError(
            f"Gemini connection failed: {error.reason}"
        ) from error

    except (
        KeyError,
        IndexError,
        json.JSONDecodeError,
    ) as error:
        raise RuntimeError(
            "Gemini returned invalid study content."
        ) from error

    if not result.get("simple_notes") or not result.get(
        "practice_questions"
    ):
        raise RuntimeError(
            "Gemini returned incomplete study content."
        )

    return result


def _deepseek_http_error_message(error: HTTPError) -> str:
    try:
        body = json.loads(
            error.read().decode("utf-8")
        )
        message = body.get("error", {}).get("message")
    except (
        json.JSONDecodeError,
        UnicodeDecodeError,
    ):
        message = None

    if message:
        return f"DeepSeek API error {error.code}: {message}"

    return f"DeepSeek API error {error.code}."


def _gemini_http_error_message(error: HTTPError) -> str:
    try:
        body = json.loads(
            error.read().decode("utf-8")
        )
        message = body.get("error", {}).get("message")
    except (
        json.JSONDecodeError,
        UnicodeDecodeError,
    ):
        message = None

    if message:
        return f"Gemini API error {error.code}: {message}"

    return f"Gemini API error {error.code}."


def _gemini_text(response: dict[str, Any]) -> str:
    parts = response["candidates"][0]["content"]["parts"]

    return "\n".join(
        part.get("text", "")
        for part in parts
    ).strip()


def _loads_json_object(
    content: str,
) -> dict[str, Any]:
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

        parsed = json.loads(
            cleaned[start : end + 1]
        )

    if not isinstance(parsed, dict):
        raise json.JSONDecodeError(
            "Expected a JSON object.",
            cleaned,
            0,
        )

    return parsed


def _list_or_default(
    value: Any,
    default: list[str],
) -> list[str]:
    if isinstance(value, list):
        cleaned = [
            str(item).strip()
            for item in value
            if str(item).strip()
        ]

        if cleaned:
            return cleaned

    return default


def _focus_area(
    metrics: dict[str, int],
) -> str:
    if metrics["comprehension_score"] < 60:
        return (
            "Build comprehension through smaller reading blocks "
            "and recap questions."
        )

    if metrics["quiz_score"] < 60:
        return (
            "Improve quiz accuracy by revising mistakes before retrying."
        )

    if metrics["retry_count"] >= 3:
        return (
            "Reduce repeated attempts with guided review after each quiz."
        )

    return (
        "Maintain pace and deepen understanding with challenge practice."
    )


def get_learning_path_generator() -> MockLearningPathLLM:
    configured_provider = os.getenv(
        "AI_PROVIDER",
        "",
    ).strip().lower()

    provider = configured_provider or (
        "gemini"
        if os.getenv("GEMINI_API_KEY")
        else "mock"
    )

    if provider in {
        "gemini",
        "geminai",
        "google",
        "google-gemini",
    }:
        return GeminiLearningPathLLM()

    if provider == "deepseek":
        return DeepSeekLearningPathLLM()

    return MockLearningPathLLM()