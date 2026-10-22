import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db/sqlite';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    initDb();
    const { id: applicationId } = params;
    const actorId = req.headers.get('x-actor-id') || 'Admin-Krypton';

    const db = getDb();
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as any;

    if (!app) {
      db.close();
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const group = db.prepare('SELECT admin_id, name FROM groups WHERE id = ?').get(app.group_id) as any;

    // Authorization: Actor must either be the applicant or the group admin
    const isApplicant = app.applicant_id === actorId;
    const isGroupAdmin = group && group.admin_id === actorId;

    if (!isApplicant && !isGroupAdmin) {
      db.close();
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN: You are not authorized to view this application' },
        { status: 403 }
      );
    }

    db.close();

    return NextResponse.json({
      success: true,
      application: {
        id: app.id,
        groupId: app.group_id,
        groupName: group ? group.name : 'Unknown Group',
        applicantPseudonym: app.applicant_pseudonym,
        questionnaireVersion: app.questionnaire_version,
        submittedAt: app.submitted_at,
        answers: JSON.parse(app.answers_snapshot_json),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
