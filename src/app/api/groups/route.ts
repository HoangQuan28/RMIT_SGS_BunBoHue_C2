import { NextResponse } from 'next/server';
import { initDb, getDb } from '@/lib/db/sqlite';
import { searchAndRankGroups } from '@/lib/search/semanticService';

export async function GET(req: Request) {
  try {
    initDb();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const tagsParam = searchParams.get('tags') || '';
    const selectedTags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];

    const groups = await searchAndRankGroups(query, selectedTags);

    const db = getDb();
    const activeTags = db
      .prepare('SELECT tag, occurrence_count FROM discussion_topics ORDER BY occurrence_count DESC')
      .all();
    db.close();

    return NextResponse.json({
      success: true,
      groups,
      activeTags,
    });
  } catch (error: any) {
    if (error.message?.includes('SEMANTIC_SEARCH_UNAVAILABLE')) {
      return NextResponse.json(
        { success: false, error: 'SEMANTIC_SEARCH_UNAVAILABLE', details: error.message },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
