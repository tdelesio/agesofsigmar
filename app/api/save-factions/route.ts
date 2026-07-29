import { NextRequest, NextResponse } from 'next/server';
import { query, getClient, ensureDatabaseSetup } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { factions } = await req.json();

    if (!factions || !Array.isArray(factions)) {
      return NextResponse.json({ success: false, error: 'Missing factions array' }, { status: 400 });
    }

    // Ensure database setup
    await ensureDatabaseSetup();

    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // Delete all existing factions to ensure deleted factions are removed
      await client.query('DELETE FROM factions');

      // Insert the new set of factions
      for (const faction of factions) {
        await client.query(
          `INSERT INTO factions (id, name, spearhead_name, data, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [faction.id, faction.name, faction.spearheadName, JSON.stringify(faction)]
        );
      }

      await client.query('COMMIT');
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API Save Factions] POST Failed:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to save factions to database: ' + err.message },
      { status: 500 }
    );
  }
}
