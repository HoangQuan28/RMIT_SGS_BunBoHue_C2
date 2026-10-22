import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const tagsParam = searchParams.get('tags');
    const selectedTags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];
    const country = searchParams.get('country') || 'All countries';
    const university = searchParams.get('university') || 'All universities';
    const major = searchParams.get('major') || 'All majors';
    const level = searchParams.get('level') || 'All levels';

    let queryBuilder = supabase.from('groups').select('*');

    if (country !== 'All countries') {
      queryBuilder = queryBuilder.eq('country', country);
    }
    if (university !== 'All universities') {
      queryBuilder = queryBuilder.eq('university', university);
    }
    if (major !== 'All majors') {
      queryBuilder = queryBuilder.eq('major', major);
    }
    if (level !== 'All levels') {
      queryBuilder = queryBuilder.eq('level', level);
    }
    if (selectedTags.length > 0) {
      queryBuilder = queryBuilder.contains('tags', selectedTags);
    }

    const { data: groups, error } = await queryBuilder;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ groups: groups || [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
