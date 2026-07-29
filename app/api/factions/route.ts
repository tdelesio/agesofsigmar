import { NextRequest, NextResponse } from 'next/server';
import { query, ensureDatabaseSetup } from '../../../lib/db';

// Force dynamic execution for these API routes since they talk to a database
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Ensure table exists and is seeded with static data if database is empty
    await ensureDatabaseSetup();

    const res = await query('SELECT data FROM factions ORDER BY name ASC');
    const factions = res.rows.map(row => row.data);

    return NextResponse.json({ success: true, factions });
  } catch (err: any) {
    console.error('[API Factions] GET Failed:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve factions from database: ' + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { factions } = await req.json();

    if (!factions || !Array.isArray(factions)) {
      return NextResponse.json({ success: false, error: 'Missing factions array' }, { status: 400 });
    }

    await ensureDatabaseSetup();

    for (const faction of factions) {
      await query(
        `INSERT INTO factions (id, name, spearhead_name, data, updated_at) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
         ON CONFLICT (id) DO UPDATE SET name = $2, spearhead_name = $3, data = $4, updated_at = CURRENT_TIMESTAMP`,
        [faction.id, faction.name, faction.spearheadName, JSON.stringify(faction)]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API Factions] POST Failed:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to save factions to database: ' + err.message },
      { status: 500 }
    );
  }
}
