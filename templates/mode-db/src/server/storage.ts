// varion dev creates the database and writes DB_* into .env
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function db(): mysql.Pool {
  pool ??= mysql.createPool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3317),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 4,
  });
  return pool;
}

export async function openStorage(): Promise<string> {
  await db().query('SELECT 1');
  return `MariaDB ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
}

export async function clicksOf(key: string): Promise<number> {
  const [rows] = await db().query<mysql.RowDataPacket[]>(
    'SELECT total FROM clicks WHERE player = ?',
    [key],
  );
  return rows.length ? Number(rows[0].total) : 0;
}

export async function addClick(key: string): Promise<number> {
  await db().execute(
    'INSERT INTO clicks (player, total) VALUES (?, 1) ON DUPLICATE KEY UPDATE total = total + 1',
    [key],
  );
  return clicksOf(key);
}

export async function closeStorage(): Promise<void> {
  const current = pool;
  pool = null;
  await current?.end();
}
