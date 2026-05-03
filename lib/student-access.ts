import { db } from "@/lib/db";

export type StudentAccessRecord = {
  studentId: number | null;
  fullName: string | null;
  classId: number | null;
  className: string | null;
  section: string | null;
  rollNo: string | null;
  studentEmail: string;
  isActive: boolean;
};

export async function getStudentAccessRecord(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const result = await db.query<StudentAccessRecord>(
    `
      select
        sm.student_id as "studentId",
        nullif(trim(sm.full_name), '') as "fullName",
        sm.class_id as "classId",
        nullif(trim(cm.class_name), '') as "className",
        nullif(trim(sm.section), '') as "section",
        nullif(trim(sm.roll_no), '') as "rollNo",
        sm.student_email as "studentEmail",
        sm.is_active as "isActive"
      from student_master sm
      left join class_master cm on cm.class_id = sm.class_id
      where lower(sm.student_email) = $1
      limit 1
    `,
    [normalizedEmail],
  );

  return result.rows[0] ?? null;
}

export async function isStudentEmailAllowed(email: string) {
  const studentRecord = await getStudentAccessRecord(email);

  return studentRecord?.isActive === true;
}
