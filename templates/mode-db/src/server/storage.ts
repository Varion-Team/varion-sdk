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

// counts one more visit of the player and returns how many there are now
export async function addVisit(key: string): Promise<number> {
  await db().execute(
    'INSERT INTO visits (player, total) VALUES (?, 1) ON DUPLICATE KEY UPDATE total = total + 1',
    [key],
  );
  const [rows] = await db().query<mysql.RowDataPacket[]>(
    'SELECT total FROM visits WHERE player = ?',
    [key],
  );
  return rows.length ? Number(rows[0].total) : 1;
}

export async function closeStorage(): Promise<void> {
  const current = pool;
  pool = null;
  await current?.end();
}
