import { Pool } from "pg";

declare global {
  var __sgsPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    return new Pool({
      connectionString,
    });
  }

  return new Pool({
    host: process.env.PGHOST ?? "localhost",
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER ?? "postgres",
    password: process.env.PGPASSWORD ?? "",
    database: process.env.PGDATABASE ?? "sgs_local",
  });
}

export const db = global.__sgsPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__sgsPool = db;
}
