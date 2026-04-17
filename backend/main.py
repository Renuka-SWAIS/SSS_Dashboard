from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from psycopg import Connection
from psycopg.rows import dict_row

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = FastAPI(title='SGS Validation API')


class StudentValidationRequest(BaseModel):
    email: EmailStr


class StudentValidationResponse(BaseModel):
    email: EmailStr
    is_allowed: bool
    reason: str


@lru_cache(maxsize=1)
def get_connection_string() -> str:
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        return database_url

    host = os.getenv('PGHOST', 'localhost')
    port = os.getenv('PGPORT', '5432')
    user = os.getenv('PGUSER', 'postgres')
    password = os.getenv('PGPASSWORD', 'swati1007')
    database = os.getenv('PGDATABASE', 'sgs_local')

    return f'postgresql://{user}:{password}@{host}:{port}/{database}'


@app.get('/health')
def health_check() -> dict[str, str]:
    return {'status': 'ok'}


@app.post('/validate/student-access', response_model=StudentValidationResponse)
def validate_student_access(payload: StudentValidationRequest) -> StudentValidationResponse:
    email = payload.email.strip().lower()

    if not email:
        raise HTTPException(status_code=400, detail='Email is required.')

    query = '''
        select student_email, is_active
        from student_master
        where lower(student_email) = %s
        limit 1
    '''

    try:
        with Connection.connect(get_connection_string(), row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(query, (email,))
                row = cur.fetchone()
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f'Database validation failed: {exc}') from exc

    if not row:
        return StudentValidationResponse(
            email=email,
            is_allowed=False,
            reason='not_found',
        )

    if row.get('is_active') is not True:
        return StudentValidationResponse(
            email=email,
            is_allowed=False,
            reason='inactive',
        )

    return StudentValidationResponse(
        email=email,
        is_allowed=True,
        reason='active',
    )
