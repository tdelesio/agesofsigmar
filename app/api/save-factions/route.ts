import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Faction } from '../../types';

export async function POST(req: NextRequest) {
  try {
    const { factions } = await req.json();

    if (!factions || !Array.isArray(factions)) {
      return NextResponse.json({ error: 'Missing factions array' }, { status: 400 });
    }

    // Only write in development environment to avoid crashing on read-only serverless file systems like Vercel
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        success: true,
        warning: 'ReadOnlyEnvironment',
        message: 'Saved changes in-browser memory. Local disk write-back skipped (Server is running in production mode).'
      });
    }

    const filePath = path.join(process.cwd(), 'app', 'data', 'default-factions.json');
    fs.writeFileSync(filePath, JSON.stringify(factions, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to write factions to disk:', err);
    return NextResponse.json({ error: 'Failed to write factions to disk: ' + err.message }, { status: 500 });
  }
}
