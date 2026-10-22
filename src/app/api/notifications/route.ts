import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db/sqlite';

// GET all notifications for the authenticated admin
export async function GET(req: Request) {
  try {
    initDb();
    const actorId = req.headers.get('x-actor-id') || 'Admin-Krypton';
    const db = getDb();

    const notifs = db
      .prepare(
        'SELECT * FROM notifications WHERE recipient_admin_id = ? ORDER BY created_at DESC'
      )
      .all(actorId) as any[];

    db.close();

    return NextResponse.json({
      success: true,
      notifications: notifs.map((n) => ({
        id: n.id,
        groupId: n.group_id,
        groupName: n.group_name,
        applicationId: n.application_id,
        applicantPseudonym: n.applicant_pseudonym,
        read: Boolean(n.read_status),
        createdAt: n.created_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH to mark notification as read
export async function PATCH(req: Request) {
  try {
    initDb();
    const body = await req.json();
    const { notificationId } = body;
    const actorId = req.headers.get('x-actor-id') || 'Admin-Krypton';

    if (!notificationId) {
      return NextResponse.json({ success: false, error: 'Missing notificationId' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('UPDATE notifications SET read_status = 1 WHERE id = ? AND recipient_admin_id = ?').run(
      notificationId,
      actorId
    );
    db.close();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
