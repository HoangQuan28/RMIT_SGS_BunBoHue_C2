import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db/sqlite';

// Designated sample groups with NO questionnaire required (instant application)
const NO_QUESTIONNAIRE_GROUPS = [
  'grp-ueh-analytics',
  'grp-ftu-trade',
  'grp-neu-fintech',
  'grp-tdtu-studio',
  'grp-dtu-soft',
  'grp-hcmussh-soc',
];

// Publicly readable for students to fill out questionnaire
export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    initDb();
    const { groupId } = params;

    // 5-6 sample groups explicitly require NO questionnaire
    if (NO_QUESTIONNAIRE_GROUPS.includes(groupId)) {
      return NextResponse.json({
        success: true,
        version: 1,
        questions: [],
        noQuestionnaireRequired: true,
        defaultJoinAllowed: true,
        message: 'No questionnaire required for this group. You may submit your application immediately.',
      });
    }

    const db = getDb();

    // Get active questionnaire from SQLite
    const qRow = db
      .prepare('SELECT version FROM questionnaires WHERE group_id = ? AND is_published = 1 ORDER BY version DESC LIMIT 1')
      .get(groupId) as { version: number } | undefined;

    if (!qRow) {
      // Fallback questions for study groups that require application vetting
      const fallbackQuestions = [
        { id: `q-${groupId}-1`, label: 'Chuyên ngành và năm học hiện tại của bạn tại trường?', required: true, orderIndex: 0 },
        { id: `q-${groupId}-2`, label: 'Mục tiêu hoặc kỹ năng chính bạn muốn chia sẻ với nhóm?', required: true, orderIndex: 1 },
        { id: `q-${groupId}-3`, label: 'Đường dẫn portfolio, dự án GitHub hoặc chứng chỉ (nếu có)?', required: false, orderIndex: 2 },
      ];
      db.close();
      return NextResponse.json({
        success: true,
        version: 1,
        questions: fallbackQuestions,
        defaultJoinAllowed: false,
      });
    }

    const items = db
      .prepare('SELECT id, label, required, order_index FROM question_items WHERE group_id = ? AND version = ? ORDER BY order_index ASC')
      .all(groupId, qRow.version) as any[];

    db.close();

    return NextResponse.json({
      success: true,
      version: qRow.version,
      questions: items.map((i) => ({
        id: i.id,
        label: i.label,
        required: Boolean(i.required),
        orderIndex: i.order_index,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Admin only: updates and publishes new version
export async function PUT(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    initDb();
    const { groupId } = params;
    const authHeader = req.headers.get('authorization') || '';
    // Resolve session admin
    const actorId = req.headers.get('x-actor-id') || 'Admin-Krypton';

    const db = getDb();
    const group = db.prepare('SELECT admin_id FROM groups WHERE id = ?').get(groupId) as { admin_id: string } | undefined;

    if (!group) {
      db.close();
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    if (group.admin_id !== actorId) {
      db.close();
      return NextResponse.json({ success: false, error: 'FORBIDDEN: Only designated group admin can edit questionnaire' }, { status: 403 });
    }

    const body = await req.json();
    const { questions } = body; // Array of { label: string, required: boolean }

    if (!Array.isArray(questions)) {
      db.close();
      return NextResponse.json({ success: false, error: 'Questions must be an array' }, { status: 400 });
    }

    // Atomic version bump
    const currentQ = db.prepare('SELECT MAX(version) as max_v FROM questionnaires WHERE group_id = ?').get(groupId) as { max_v: number | null };
    const nextVersion = (currentQ?.max_v || 0) + 1;
    const now = new Date().toISOString();

    const insertQ = db.prepare('INSERT INTO questionnaires (group_id, version, is_published, created_at) VALUES (?, ?, 1, ?)');
    const insertQI = db.prepare('INSERT INTO question_items (id, group_id, version, label, required, order_index) VALUES (?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction(() => {
      insertQ.run(groupId, nextVersion, now);
      questions.forEach((q, idx) => {
        const qId = `qi-${groupId}-v${nextVersion}-${idx + 1}`;
        insertQI.run(qId, groupId, nextVersion, q.label.trim(), q.required ? 1 : 0, idx);
      });
    });

    transaction();
    db.close();

    return NextResponse.json({
      success: true,
      version: nextVersion,
      message: `Questionnaire updated to Version ${nextVersion}`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
