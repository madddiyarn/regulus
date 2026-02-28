import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/satellites - Get all satellites
 * Data sourced from Space-Track.org
 */
export async function GET(request: Request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let satellites;

    if (search) {
      satellites = await sql`
        SELECT * FROM satellites
        WHERE name ILIKE ${`%${search}%`} OR norad_id ILIKE ${`%${search}%`}
        ORDER BY name
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      satellites = await sql`
        SELECT * FROM satellites
        ORDER BY name
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    return NextResponse.json({
      satellites,
      dataSource: 'Space-Track.org',
    });
  } catch (error) {
    console.error('[v0] Error fetching satellites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch satellites' },
      { status: 500 }
    );
  }
}
