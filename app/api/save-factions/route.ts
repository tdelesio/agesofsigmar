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

    // Only skip disk write if in a read-only serverless environment like Vercel
    if (process.env.VERCEL) {
      return NextResponse.json({
        success: true,
        warning: 'ReadOnlyEnvironment',
        message: 'Saved changes in-browser memory. Local disk write-back skipped (Server is running on serverless Vercel).'
      });
    }

    const filePath = path.join(process.cwd(), 'app', 'data', 'default-factions.json');
    try {
      fs.writeFileSync(filePath, JSON.stringify(factions, null, 2), 'utf-8');
    } catch (fsErr: any) {
      if (fsErr.code === 'EROFS') {
        return NextResponse.json({
          success: true,
          warning: 'ReadOnlyEnvironment',
          message: 'Saved changes in-browser memory. Local disk write-back skipped (File system is read-only).'
        });
      }
      throw fsErr;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to write factions to disk:', err);
    return NextResponse.json({ error: 'Failed to write factions to disk: ' + err.message }, { status: 500 });
  }
}
