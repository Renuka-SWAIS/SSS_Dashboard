-- Assignment submission table for student assignment uploads.

CREATE TABLE IF NOT EXISTS sss_assignment_submissions (
    id BIGSERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    assignment_id INTEGER NOT NULL,
    assignment_title VARCHAR(180) NOT NULL,
    typed_answer TEXT,
    file_name VARCHAR(255),
    file_type VARCHAR(120),
    file_size INTEGER CHECK (file_size IS NULL OR file_size <= 10485760),
    file_content BYTEA,
    status VARCHAR(32) NOT NULL DEFAULT 'Submitted',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        NULLIF(BTRIM(COALESCE(typed_answer, '')), '') IS NOT NULL
        OR file_content IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_sss_assignment_submissions_student_id
ON sss_assignment_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_sss_assignment_submissions_assignment_id
ON sss_assignment_submissions(assignment_id);

CREATE INDEX IF NOT EXISTS idx_sss_assignment_submissions_submitted_at
ON sss_assignment_submissions(submitted_at DESC);