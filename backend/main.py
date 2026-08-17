import os
import base64
import binascii
from contextlib import contextmanager
from datetime import date, timedelta
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
    translate_text_with_gemini,
    generate_quiz_with_gemini,
    generate_study_content_with_gemini,
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
        "http://localhost:3000/student",
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


class TextTranslationInput(BaseModel):
    text: str = Field(..., min_length=1, max_length=12000)
    target_language: str = Field(..., min_length=2, max_length=80)
    source_language: str | None = Field(default=None, max_length=80)
    user_email: str | None = Field(default=None, max_length=150)


class QuizGenerationInput(BaseModel):
    topic: str = Field(..., min_length=1, max_length=300)
    difficulty: str = Field(default="easy", max_length=40)
    num_questions: int = Field(default=5, ge=1, le=10)
    user_email: str | None = Field(default=None, max_length=150)
    client_name: str | None = Field(default=None, max_length=80)


class QuizEvaluationInput(BaseModel):
    submission_data: dict
    user_email: str | None = None


class StudyContentGenerationInput(BaseModel):
    student_id: int = Field(..., ge=1)
    chapter_id: int = Field(..., ge=1)
    classification: str = Field(..., min_length=3, max_length=40)


@app.post("/ai/generate-study-content")
def generate_study_content(payload: StudyContentGenerationInput):
    query = """SELECT content_title, full_text_content FROM sss_chapter_content
               WHERE chapter_id = %s AND NULLIF(BTRIM(full_text_content), '') IS NOT NULL LIMIT 1;"""
    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(query, (payload.chapter_id,))
                chapter = cursor.fetchone()
    except psycopg.Error as error:
        raise HTTPException(status_code=500, detail="Unable to fetch chapter content.") from error
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter content not found.")
    try:
        content = generate_study_content_with_gemini(
            chapter["content_title"], chapter["full_text_content"], payload.classification
        )
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    return {"student_id": payload.student_id, "chapter_id": payload.chapter_id,
            "chapter_title": chapter["content_title"], "classification": payload.classification,
            "generated_content": content}


@app.post("/quiz/generate")
def generate_quiz(payload: QuizGenerationInput):
    try:
        questions = generate_quiz_with_gemini(payload.topic.strip(), payload.difficulty, payload.num_questions)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    return {"status": "success", "topic": payload.topic, "quiz_data": questions}


@app.get("/quiz-chapters")
def get_quiz_chapters():
    query = """
        SELECT content.chapter_id, content.content_title AS chapter_title,
               content.subject, content.full_text_content
        FROM sss_chapter_content content
        WHERE NULLIF(BTRIM(content.full_text_content), '') IS NOT NULL
        ORDER BY content.subject, content.content_title, content.chapter_id;
    """
    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(query)
                return {"chapters": cursor.fetchall()}
    except psycopg.Error as error:
        raise HTTPException(status_code=500, detail="Unable to fetch quiz chapters.") from error


@app.post("/quiz/evaluate")
def evaluate_quiz(payload: QuizEvaluationInput):
    answers = payload.submission_data.get("answers", [])
    correct = sum(
        1 for item in answers
        if str(item.get("student_answer", "")).strip() == str(item.get("correct_answer", "")).strip()
        and item.get("correct_answer") is not None
    )
    total = len(answers)
    percentage = round((correct / total) * 100, 2) if total else 0
    report = {"correct_answers": correct, "total_questions": total, "score": correct,
              "percentage": percentage, "feedback": "Excellent work!" if percentage >= 80 else "Review the chapter and try again."}
    return {"status": "success", "evaluation_report": report, **report}


@app.post("/translate")
def translate_text(payload: TextTranslationInput):
    source_text = payload.text.strip()
    if not source_text:
        raise HTTPException(status_code=400, detail="Enter text to translate.")
    try:
        translated_text = translate_text_with_gemini(
            source_text,
            payload.target_language,
            payload.source_language or "auto-detect",
        )
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    return {
        "status": "success",
        "source_language": payload.source_language or "auto-detect",
        "target_language": payload.target_language,
        "translated_text": translated_text,
    }


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
def get_current_student(
    email: str = Query(..., min_length=3, max_length=150),
):
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
          AND LOWER(BTRIM(student.student_email)) = LOWER(BTRIM(%s))
        ORDER BY
            CASE WHEN student.admission_no IS NULL THEN 1 ELSE 0 END,
            student.student_id
        LIMIT 1;
    """

    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(query, (email,))
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
        raise HTTPException(status_code=404, detail="No active student found for the logged-in email.")

    return {"student": student}


def get_due_status(due_date):
    days_left = (due_date - date.today()).days
    if days_left < 0:
        return {"label": "Overdue", "priority": "high", "days_left": days_left, "is_countable": True}
    if days_left <= 2:
        return {"label": "Due soon", "priority": "high", "days_left": days_left, "is_countable": True}
    if days_left <= 7:
        return {"label": "Upcoming", "priority": "medium", "days_left": days_left, "is_countable": True}
    return {"label": "Scheduled", "priority": "low", "days_left": days_left, "is_countable": False}


def ensure_assignment_result_upload_columns(cursor) -> None:
    cursor.execute(
        """
        ALTER TABLE sss_assignment_results
        ADD COLUMN IF NOT EXISTS submitted_file_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS submitted_file_type VARCHAR(160),
        ADD COLUMN IF NOT EXISTS submitted_file_size BIGINT,
        ADD COLUMN IF NOT EXISTS submitted_file_content BYTEA,
        ADD COLUMN IF NOT EXISTS submission_text TEXT;
        """
    )


@app.get("/assignments/current")
def get_current_assignments():
    """Return assignments for the current student's class with latest submission state."""
    query = """
        WITH current_student AS (
            SELECT student_id, class_id
            FROM sss_student_master
            WHERE COALESCE(record_status, 'Active') = 'Active'
              AND COALESCE(is_active, true) = true
            ORDER BY CASE WHEN admission_no IS NULL THEN 1 ELSE 0 END, student_id
            LIMIT 1
        )
        SELECT
            assignment.assignment_id,
            assignment.assignment_title,
            assignment.assignment_text,
            assignment.due_date,
            assignment.class_id,
            assignment.subject_id,
            subject.subject_name,
            chapter.chapter_name,
            student.student_id,
            submission.assignment_result_id AS submission_id,
            submission.status AS submission_status,
            submission.submitted_at,
            submission.submitted_file_name,
            submission.submitted_file_size,
            submission.submission_text AS typed_answer
        FROM current_student student
        JOIN sss_assignment_master assignment ON assignment.class_id = student.class_id
        LEFT JOIN sss_subject_master subject ON subject.subject_id = assignment.subject_id
        LEFT JOIN sss_chapter_master chapter ON chapter.chapter_id = assignment.chapter_id
        LEFT JOIN LATERAL (
            SELECT saved.assignment_result_id, saved.status, saved.submitted_at,
                   saved.submitted_file_name, saved.submitted_file_size, saved.submission_text
            FROM sss_assignment_results saved
            WHERE saved.student_id = student.student_id
              AND saved.assignment_id = assignment.assignment_id
              AND LOWER(COALESCE(saved.record_status, 'Active')) = 'active'
            ORDER BY saved.submitted_at DESC NULLS LAST, saved.assignment_result_id DESC
            LIMIT 1
        ) submission ON TRUE
        WHERE COALESCE(assignment.record_status, 'Active') = 'Active'
        ORDER BY assignment.due_date ASC NULLS LAST, assignment.assignment_id DESC
        LIMIT 50;
    """
    assignment_only_query = """
        WITH current_student AS (
            SELECT student_id, class_id
            FROM sss_student_master
            WHERE COALESCE(record_status, 'Active') = 'Active'
              AND COALESCE(is_active, true) = true
            ORDER BY CASE WHEN admission_no IS NULL THEN 1 ELSE 0 END, student_id
            LIMIT 1
        )
        SELECT assignment.assignment_id, assignment.assignment_title,
               assignment.assignment_text, assignment.due_date, assignment.class_id,
               assignment.subject_id, subject.subject_name, chapter.chapter_name,
               student.student_id, NULL::bigint AS submission_id,
               NULL::varchar AS submission_status, NULL::timestamptz AS submitted_at,
               NULL::varchar AS submitted_file_name, NULL::integer AS submitted_file_size,
               NULL::text AS typed_answer
        FROM current_student student
        JOIN sss_assignment_master assignment ON assignment.class_id = student.class_id
        LEFT JOIN sss_subject_master subject ON subject.subject_id = assignment.subject_id
        LEFT JOIN sss_chapter_master chapter ON chapter.chapter_id = assignment.chapter_id
        WHERE COALESCE(assignment.record_status, 'Active') = 'Active'
        ORDER BY assignment.due_date ASC NULLS LAST, assignment.assignment_id DESC
        LIMIT 50;
    """
    all_assignments_query = assignment_only_query.replace(
        "JOIN sss_assignment_master assignment ON assignment.class_id = student.class_id",
        "CROSS JOIN sss_assignment_master assignment",
    )

    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                ensure_assignment_result_upload_columns(cursor)
                cursor.execute(query)
                rows = cursor.fetchall()
    except psycopg.errors.UndefinedTable:
        try:
            with get_connection() as connection:
                with connection.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(assignment_only_query)
                    rows = cursor.fetchall()
        except psycopg.Error as error:
            raise HTTPException(
                status_code=500,
                detail="Assignment tables are missing. Confirm sss_assignment_master and sss_assignment_results exist.",
            ) from error
    except psycopg.Error as error:
        raise HTTPException(status_code=500, detail="Unable to fetch assignments.") from error

    if not rows:
        try:
            with get_connection() as connection:
                with connection.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(all_assignments_query)
                    rows = cursor.fetchall()
        except psycopg.Error as error:
            raise HTTPException(status_code=500, detail="Unable to fetch assignments.") from error

    assignments = []
    for number, row in enumerate(rows, start=1):
        item = dict(row)
        item["number"] = number
        item["status"] = "Submitted" if item.get("submission_id") else "Not Started"
        item["action"] = "View" if item.get("submission_id") else "Start"
        assignments.append(item)

    return {
        "student_id": assignments[0]["student_id"] if assignments else None,
        "assignments": assignments,
    }


@app.get("/notifications")
def get_notifications():
    student_query = """
        SELECT student.student_id, student.class_id,
               COALESCE(NULLIF(BTRIM(class.class_name), ''), student.class_id::text) AS class_name
        FROM sss_student_master student
        LEFT JOIN sss_class_master class ON class.class_id = student.class_id
        WHERE COALESCE(student.record_status, 'Active') = 'Active'
          AND COALESCE(student.is_active, true) = true
        ORDER BY CASE WHEN student.admission_no IS NULL THEN 1 ELSE 0 END, student.student_id
        LIMIT 1;
    """
    assignment_query = """
        SELECT assignment.assignment_id, assignment.assignment_title, assignment.assignment_text,
               assignment.due_date, subject.subject_name, chapter.chapter_name
        FROM sss_assignment_master assignment
        LEFT JOIN sss_subject_master subject ON subject.subject_id = assignment.subject_id
        LEFT JOIN sss_chapter_master chapter ON chapter.chapter_id = assignment.chapter_id
        WHERE assignment.class_id = %s
          AND COALESCE(assignment.record_status, 'Active') = 'Active'
          AND assignment.due_date IS NOT NULL
          AND assignment.due_date <= %s
        ORDER BY assignment.due_date ASC, assignment.assignment_id DESC
        LIMIT 12;
    """
    notice_query = """
        SELECT notice_id, notice_title, notice_text, notice_date, applicable_class,
               COALESCE(is_read, false) AS is_read
        FROM sss_notice_board
        WHERE COALESCE(record_status, 'Active') = 'Active'
          AND (applicable_class IS NULL OR BTRIM(applicable_class) = ''
               OR LOWER(applicable_class) IN ('all', LOWER(%s)))
        ORDER BY COALESCE(is_read, false), notice_date DESC NULLS LAST, notice_id DESC
        LIMIT 10;
    """

    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(student_query)
                student = cursor.fetchone()
                if student is None:
                    raise HTTPException(status_code=404, detail="No active student found.")
                cursor.execute(assignment_query, (student["class_id"], date.today() + timedelta(days=7)))
                assignment_rows = cursor.fetchall()
                cursor.execute(notice_query, (student["class_name"],))
                notice_rows = cursor.fetchall()
    except HTTPException:
        raise
    except psycopg.errors.UndefinedTable as error:
        raise HTTPException(
            status_code=500,
            detail="Notification source table is missing. Confirm SSS assignment, subject, chapter, and notice tables exist.",
        ) from error
    except psycopg.Error as error:
        raise HTTPException(status_code=500, detail="Unable to fetch notifications.") from error

    assignments = []
    for row in assignment_rows:
        status = get_due_status(row["due_date"])
        assignments.append({
            "type": "assignment", "id": f"assignment-{row['assignment_id']}",
            "title": row.get("assignment_title") or "Assignment",
            "body": row.get("assignment_text") or "", "due_date": row.get("due_date"),
            "subject_name": row.get("subject_name"), "chapter_name": row.get("chapter_name"),
            **status,
        })

    notices = [{
        "type": "notice", "id": f"notice-{row['notice_id']}",
        "title": row.get("notice_title") or "Notice", "message": row.get("notice_text") or "-",
        "notice_date": row.get("notice_date"), "applicable_class": row.get("applicable_class") or "All",
        "is_read": bool(row.get("is_read")), "priority": "low", "is_countable": not bool(row.get("is_read")),
    } for row in notice_rows]

    notifications = [*assignments, *notices]
    return {
        "student": student,
        "count": sum(1 for item in notifications if item.get("is_countable")),
        "assignments": assignments, "notices": notices, "notifications": notifications,
    }


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

    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                ensure_assignment_result_upload_columns(cursor)
                cursor.execute(
                    """
                    SELECT assignment_result_id
                    FROM sss_assignment_results
                    WHERE student_id = %s AND assignment_id = %s
                      AND LOWER(COALESCE(record_status, 'Active')) = 'active'
                    ORDER BY assignment_result_id DESC
                    LIMIT 1;
                    """,
                    (submission.student_id, submission.assignment_id),
                )
                existing = cursor.fetchone()
                values = (
                    typed_answer or None,
                    submission.file_name,
                    submission.file_type,
                    len(file_content) if file_content is not None else None,
                    file_content,
                )
                if existing:
                    cursor.execute(
                        """
                        UPDATE sss_assignment_results
                        SET status = 'Submitted', submitted_at = CURRENT_TIMESTAMP,
                            submission_text = %s, submitted_file_name = %s,
                            submitted_file_type = %s, submitted_file_size = %s,
                            submitted_file_content = %s, version_no = COALESCE(version_no, 0) + 1
                        WHERE assignment_result_id = %s
                        RETURNING assignment_result_id, student_id, assignment_id, status,
                                  submitted_at, submission_text AS typed_answer,
                                  submitted_file_name AS file_name,
                                  submitted_file_type AS file_type,
                                  submitted_file_size AS file_size;
                        """,
                        (*values, existing["assignment_result_id"]),
                    )
                else:
                    cursor.execute(
                        """
                        INSERT INTO sss_assignment_results (
                            student_id, assignment_id, status, submitted_at,
                            submission_text, submitted_file_name, submitted_file_type,
                            submitted_file_size, submitted_file_content
                        ) VALUES (%s, %s, 'Submitted', CURRENT_TIMESTAMP, %s, %s, %s, %s, %s)
                        RETURNING assignment_result_id, student_id, assignment_id, status,
                                  submitted_at, submission_text AS typed_answer,
                                  submitted_file_name AS file_name,
                                  submitted_file_type AS file_type,
                                  submitted_file_size AS file_size;
                        """,
                        (submission.student_id, submission.assignment_id, *values),
                    )
                saved_submission = cursor.fetchone()
                connection.commit()
    except psycopg.errors.UndefinedTable as error:
        raise HTTPException(
            status_code=500,
            detail="Assignment result table is missing. Confirm sss_assignment_results exists.",
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
            assignment_result_id AS id,
            student_id,
            assignment_id,
            submission_text AS typed_answer,
            submitted_file_name AS file_name,
            submitted_file_type AS file_type,
            submitted_file_size AS file_size,
            status,
            submitted_at
        FROM sss_assignment_results
        WHERE student_id = %s
          AND assignment_id = %s
          AND LOWER(COALESCE(record_status, 'Active')) = 'active'
        ORDER BY submitted_at DESC NULLS LAST, assignment_result_id DESC
        LIMIT 1;
    """

    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                ensure_assignment_result_upload_columns(cursor)
                cursor.execute(query, (student_id, assignment_id))
                submission = cursor.fetchone()
    except psycopg.errors.UndefinedTable as error:
        raise HTTPException(
            status_code=500,
            detail="Assignment result table is missing. Confirm sss_assignment_results exists.",
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

@app.get("/classes")
def get_classes():
    query = """SELECT class_id, class_name, section_name, academic_year FROM sss_class_master
               WHERE LOWER(COALESCE(record_status, 'Active')) = 'active'
               ORDER BY class_name, section_name, class_id;"""
    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(query)
                return {"classes": cursor.fetchall()}
    except psycopg.Error as error:
        raise HTTPException(status_code=500, detail="Unable to fetch classes.") from error


@app.get("/subjects")
def get_subjects(class_id: int = Query(..., ge=1)):
    query = """SELECT subject_id, class_id, subject_name, subject_code FROM sss_subject_master
               WHERE class_id = %s AND LOWER(COALESCE(record_status, 'Active')) = 'active'
               ORDER BY subject_name, subject_id;"""
    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(query, (class_id,))
                return {"subjects": cursor.fetchall()}
    except psycopg.Error as error:
        raise HTTPException(status_code=500, detail="Unable to fetch subjects.") from error


@app.get("/chapters")
def get_chapters(subject_id: int = Query(..., ge=1)):
    query = """SELECT chapter_id, subject_id, chapter_no, chapter_name, chapter_description
               FROM sss_chapter_master
               WHERE subject_id = %s AND LOWER(COALESCE(record_status, 'Active')) = 'active'
               ORDER BY COALESCE(chapter_order, chapter_no), chapter_id;"""
    try:
        with get_connection() as connection:
            with connection.cursor(row_factory=dict_row) as cursor:
                cursor.execute(query, (subject_id,))
                return {"chapters": cursor.fetchall()}
    except psycopg.Error as error:
        raise HTTPException(status_code=500, detail="Unable to fetch chapters.") from error


@app.get("/chapter-content")
def get_chapter_content(chapter_id: int = Query(..., ge=1)):

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
