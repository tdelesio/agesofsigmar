import { Pool, PoolClient } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool(
  connectionString
    ? { connectionString }
    : {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER || 'spearhead_user',
        password: process.env.POSTGRES_PASSWORD || 'spearhead_password',
        database: process.env.POSTGRES_DB || 'spearhead_db',
      }
);

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('[Database Query]', { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

/**
 * Ensures the 'factions' table exists and is seeded with default data.
 * This runs on connection initialization or when API is hit.
 */
export async function ensureDatabaseSetup() {
  try {
    // 1. Create table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS factions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        spearhead_name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Check if table is empty
    const checkRes = await query('SELECT count(*) FROM factions');
    const count = parseInt(checkRes.rows[0].count);

    if (count === 0) {
      console.log('[Database] No factions found. Performing automatic bootstrap seeding...');
      // Read default-factions.json
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'app', 'data', 'default-factions.json');
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const factions = JSON.parse(fileContent);

        if (Array.isArray(factions)) {
          console.log(`[Database] Seeding ${factions.length} default factions into database...`);
          const client = await getClient();
          try {
            await client.query('BEGIN');
            for (const faction of factions) {
              await client.query(
                `INSERT INTO factions (id, name, spearhead_name, data) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (id) DO UPDATE SET name = $2, spearhead_name = $3, data = $4, updated_at = CURRENT_TIMESTAMP`,
                [faction.id, faction.name, faction.spearheadName, JSON.stringify(faction)]
              );
            }
            await client.query('COMMIT');
            console.log('[Database] Seeding completed successfully.');
          } catch (err) {
            await client.query('ROLLBACK');
            console.error('[Database] Seeding transaction failed, rolled back.', err);
            throw err;
          } finally {
            client.release();
          }
        }
      } else {
        console.warn(`[Database] default-factions.json not found at ${filePath}. Skipping auto-seed.`);
      }
    }
  } catch (err) {
    console.error('[Database] Failed to execute database setup:', err);
  }
}
