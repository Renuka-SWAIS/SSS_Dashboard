import { db } from "@/lib/db";

export async function isStudentEmailAllowed(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  const result = await db.query(
    `
      select 1
      from student_master
      where lower(student_email) = $1
        and is_active = true
      limit 1
    `,
    [normalizedEmail],
  );

  return (result.rowCount ?? 0) > 0;
}
