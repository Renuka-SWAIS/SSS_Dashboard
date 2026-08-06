import os
import base64
import binascii
from contextlib import contextmanager
from pathlib import Path



import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from ai_learning_path_service import (
    MockLearningPathLLM,
    classify_reader,
    get_learning_path_generator,
)


LESSON_TO_CHAPTER_ID = {
    "Lesson 1": 1,
    "Lesson 2": 2,
    "Lesson 3": 3,
    "Lesson 4": 4,
    "Lesson 5": 5,
    "Lesson 6": 6,
    "Lesson 7": 7,
    "Lesson 8": 8,
    "Lesson 9": 9,
    "Lesson 10": 10,
}
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

app = FastAPI(title="sss Chapter Content API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost:3004",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3004",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LearningProfileInput(BaseModel):
    student_id: int = Field(..., ge=1)
    chapter_id: int = Field(..., ge=1)
    chapter_title: str = Field(..., min_length=1, max_length=160)
    reading_time_minutes: int = Field(..., ge=0, le=600)
    quiz_score: int = Field(..., ge=0, le=100)
    retry_count: int = Field(..., ge=0, le=50)
    comprehension_score: int = Field(..., ge=0, le=100)


class AssignmentSubmissionInput(BaseModel):
    student_id: int = Field(..., ge=1)
    assignment_id: int = Field(..., ge=1)
    assignment_title: str = Field(..., min_length=1, max_length=180)
    typed_answer: str | None = Field(default=None, max_length=20000)
    file_name: str | None = Field(default=None, max_length=255)
    file_type: str | None = Field(default=None, max_length=120)
    file_size: int | None = Field(default=None, ge=0, le=10 * 1024 * 1024)
    file_content_base64: str | None = None    


def get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(
            status_code=500,
            detail="DATABASE_URL is not configured for the FastAPI backend.",
        )
    return database_url


@contextmanager
def get_connection():
    with psycopg.connect(get_database_url()) as connection:
        yield connection


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def database_health_check():
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
    except psycopg.Error as error:
        raise HTTPException(status_code=503, detail="Database connection failed.") from error

    return {"status": "ok", "database": "connected"}

@app.get("/students/current")
def get_current_student():
    query = """
        SELECT
            student.student_id,
            student.full_name,
            student.roll_no,
            student.admission_no,
            COALESCE(class.class_name, student.class_id::text) AS class_name,
            COALESCE(student.section, class.section_name) AS section
        FROM sss_student_master student
        LEFT JOIN sss_class_master class
          ON class.class_id = student.class_id
        WHERE COALESCE(student.record_status, 'Active') = 'Active'
          AND COALESCE(student.is_active, true) = true
        ORDER BY
            CASE WHEN student.admission_no IS NULL THEN 1 ELSE 0 END,
            student.student_id
        LIMIT 1;
    """

    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(query)
                student = cursor.fetchone()
    except psycopg.errors.UndefinedTable as error:
        raise HTTPException(
            status_code=500,
            detail="Student master table is missing. Create sss_student_master in PostgreSQL.",
        ) from error
    except psycopg.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch student details.",
        ) from error

    if student is None:
        raise HTTPException(status_code=404, detail="No active student found.")

    return {"student": student}


def build_learning_profile_payload(profile: LearningProfileInput):
    classification = classify_reader(
        profile.reading_time_minutes,
        profile.quiz_score,
        profile.retry_count,
        profile.comprehension_score,
    )
    metrics = {
        "reading_time_minutes": profile.reading_time_minutes,
        "quiz_score": profile.quiz_score,
        "retry_count": profile.retry_count,
        "comprehension_score": profile.comprehension_score,
    }
    try:
        path = get_learning_path_generator().generate_path(
            profile.chapter_title,
            classification,
            metrics,
        )
    except RuntimeError as error:
        path = MockLearningPathLLM().generate_path(
            profile.chapter_title,
            classification,
            metrics,
        )
        path["provider_error"] = str(error)

    return classification, path


def decode_submission_file(submission: AssignmentSubmissionInput) -> bytes | None:
    if not submission.file_content_base64:
        return None

    try:
        file_content = base64.b64decode(
            submission.file_content_base64,
            validate=True,
        )
    except (binascii.Error, ValueError) as error:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file content is invalid.",
        ) from error

    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Uploaded file must be 10 MB or smaller.",
        )

    return file_content


@app.post("/assignment-submissions")
def submit_assignment(submission: AssignmentSubmissionInput):
    typed_answer = (submission.typed_answer or "").strip()
    file_content = decode_submission_file(submission)

    if not typed_answer and file_content is None:
        raise HTTPException(
            status_code=400,
            detail="Type an answer or upload a file before submitting.",
        )

    if file_content is not None and not submission.file_name:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file name is required.",
        )

    query = """
        INSERT INTO sss_assignment_submissions (
            student_id,
            assignment_id,
            assignment_title,
            typed_answer,
            file_name,
            file_type,
            file_size,
            file_content,
            status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Submitted')
        RETURNING
            id,
            student_id,
            assignment_id,
            assignment_title,
            typed_answer,
            file_name,
            file_type,
            file_size,
            status,
            submitted_at;
    """

    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    query,
                    (
                        submission.student_id,
                        submission.assignment_id,
                        submission.assignment_title,
                        typed_answer or None,
                        submission.file_name,
                        submission.file_type,
                        len(file_content) if file_content is not None else None,
                        file_content,
                    ),
                )
                saved_submission = cursor.fetchone()
                connection.commit()
    except psycopg.errors.UndefinedTable as error:
        raise HTTPException(
            status_code=500,
            detail="Assignment submission table is missing. Create sss_assignment_submissions in PostgreSQL.",
        ) from error
    except psycopg.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to save assignment submission.",
        ) from error

    return {"submission": saved_submission}

@app.get("/assignment-submissions")
def get_assignment_submission(
    student_id: int = Query(..., ge=1),
    assignment_id: int = Query(..., ge=1),
):
    query = """
        SELECT
            id,
            student_id,
            assignment_id,
            assignment_title,
            typed_answer,
            file_name,
            file_type,
            file_size,
            status,
            submitted_at
        FROM sss_assignment_submissions
        WHERE student_id = %s
          AND assignment_id = %s
        ORDER BY submitted_at DESC
        LIMIT 1;
    """

    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(query, (student_id, assignment_id))
                submission = cursor.fetchone()
    except psycopg.errors.UndefinedTable as error:
        raise HTTPException(
            status_code=500,
            detail="Assignment submission table is missing. Create sss_assignment_submissions in PostgreSQL.",
        ) from error
    except psycopg.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch assignment submission.",
        ) from error

    if submission is None:
        raise HTTPException(
            status_code=404,
            detail="No assignment submission found.",
        )

    return {"submission": submission}

@app.get("/chapter-content")
def get_chapter_content(
    subject: str = Query(..., min_length=1),
    lesson: str = Query(..., min_length=1),
):
    if subject != "Social Science":
        raise HTTPException(
            status_code=404,
            detail="No chapter content found for this subject yet.",
        )

    chapter_id = LESSON_TO_CHAPTER_ID.get(lesson)
    if chapter_id is None:
        raise HTTPException(
            status_code=404,
            detail="No chapter content found for this lesson yet.",
        )

    query = """
        SELECT content_title, full_text_content
        FROM sss_chapter_content
        WHERE chapter_id = %s
        LIMIT 1;
    """

    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(query, (chapter_id,))
                row = cursor.fetchone()
    except psycopg.errors.UndefinedTable as error:
        raise HTTPException(
            status_code=500,
            detail="Chapter content table is missing. Create sss_chapter_content in PostgreSQL.",
        ) from error
    except psycopg.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch chapter content.",
        ) from error

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="No chapter content found for this selection.",
        )

    return {
        "chapter_id": chapter_id,
        "content_title": row["content_title"],
        "full_text_content": row["full_text_content"],
    }


@app.post("/learning-path/generate")
def generate_learning_path(profile: LearningProfileInput):
    """Return an AI learning path without saving it."""
    classification, path = build_learning_profile_payload(profile)

    return {
        "student_id": profile.student_id,
        "chapter_id": profile.chapter_id,
        "classification": classification,
        "learning_path": path,
    }


@app.post("/student-learning-profile")
def save_student_learning_profile(profile: LearningProfileInput):
    """Save the latest learning profile for a student/chapter pair."""
    classification, path = build_learning_profile_payload(profile)

    query = """
        INSERT INTO sss_student_learning_profiles (
            student_id,
            chapter_id,
            chapter_title,
            reading_time_minutes,
            quiz_score,
            retry_count,
            comprehension_score,
            reader_classification,
            generated_path
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (student_id, chapter_id)
        DO UPDATE SET
            chapter_title = EXCLUDED.chapter_title,
            reading_time_minutes = EXCLUDED.reading_time_minutes,
            quiz_score = EXCLUDED.quiz_score,
            retry_count = EXCLUDED.retry_count,
            comprehension_score = EXCLUDED.comprehension_score,
            reader_classification = EXCLUDED.reader_classification,
            generated_path = EXCLUDED.generated_path,
            updated_at = NOW()
        RETURNING *;
    """

    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    query,
                    (
                        profile.student_id,
                        profile.chapter_id,
                        profile.chapter_title,
                        profile.reading_time_minutes,
                        profile.quiz_score,
                        profile.retry_count,
                        profile.comprehension_score,
                        classification,
                        Jsonb(path),
                    ),
                )
                saved_profile = cursor.fetchone()
                connection.commit()
    except psycopg.errors.UndefinedTable as error:
        raise HTTPException(
            status_code=500,
            detail="Learning profile table is missing. Run backend/migrations/001_ai_learning_path.sql manually.",
        ) from error
    except psycopg.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to save student learning profile.",
        ) from error

    return {
        "profile": saved_profile,
        "learning_path": path,
    }


@app.get("/student-learning-profile")
def get_student_learning_profile(
    student_id: int = Query(..., ge=1),
    chapter_id: int = Query(..., ge=1),
):
    query = """
        SELECT *
        FROM sss_student_learning_profiles
        WHERE student_id = %s AND chapter_id = %s
        LIMIT 1;
    """

    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(query, (student_id, chapter_id))
                profile = cursor.fetchone()
    except psycopg.errors.UndefinedTable as error:
        raise HTTPException(
            status_code=500,
            detail="Learning profile table is missing. Run backend/migrations/001_ai_learning_path.sql manually.",
        ) from error
    except psycopg.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch student learning profile.",
        ) from error

    if profile is None:
        raise HTTPException(status_code=404, detail="No learning profile found for this student and chapter.")

    return {"profile": profile}
