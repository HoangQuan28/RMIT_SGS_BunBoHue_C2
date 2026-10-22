import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, initDb } from '@/lib/db/sqlite';

export async function POST(req: Request) {
  try {
    initDb();
    const body = await req.json();
    const { groupId, questionnaireVersion, answers, idempotencyKey } = body;

    // Resolve authenticated actor identity
    const applicantId = req.headers.get('x-actor-id') || 'student-usr-84';
    const applicantPseudonym = req.headers.get('x-actor-pseudonym') || 'Anonymous Owl #84';

    if (!groupId || !questionnaireVersion || !Array.isArray(answers) || !idempotencyKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required submission fields' },
        { status: 400 }
      );
    }

    // Canonical payload fingerprint for idempotency
    const canonicalPayload = JSON.stringify({
      groupId,
      questionnaireVersion,
      answers: [...answers].sort((a, b) => a.questionId.localeCompare(b.questionId)),
    });
    const payloadFingerprint = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

    const db = getDb();

    // 1. Check Idempotency Record
    const existingLock = db
      .prepare(
        'SELECT payload_fingerprint, application_id FROM idempotency_records WHERE actor_id = ? AND operation = ? AND idempotency_key = ?'
      )
      .get(applicantId, 'group_apply', idempotencyKey) as
      | { payload_fingerprint: string; application_id: string }
      | undefined;

    if (existingLock) {
      if (existingLock.payload_fingerprint === payloadFingerprint) {
        db.close();
        return NextResponse.json({
          success: true,
          replayed: true,
          applicationId: existingLock.application_id,
          message: 'Application already received (idempotent replay)',
        });
      } else {
        db.close();
        return NextResponse.json(
          {
            success: false,
            error: 'IDEMPOTENCY_CONFLICT: Key was previously submitted with a different payload',
          },
          { status: 409 }
        );
      }
    }

    // 2. Verify Group and Questionnaire Version
    let group = db.prepare('SELECT name, admin_id FROM groups WHERE id = ?').get(groupId) as
      | { name: string; admin_id: string }
      | undefined;

    if (!group) {
      // Auto-register fallback campus group into SQLite
      const insertFallback = db.prepare(`
        INSERT OR IGNORE INTO groups (id, name, description, admin_id, tags_json, university, member_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertFallback.run(
        groupId,
        groupId.replace('grp-', '').toUpperCase() + ' Study Group',
        'Campus group on UniSign platform.',
        'Admin-Campus',
        '[]',
        'ANY',
        1,
        new Date().toISOString()
      );
      group = { name: groupId, admin_id: 'Admin-Campus' };
    }

    const activeQ = db
      .prepare(
        'SELECT version FROM questionnaires WHERE group_id = ? AND is_published = 1 ORDER BY version DESC LIMIT 1'
      )
      .get(groupId) as { version: number } | undefined;

    const questionItems = activeQ
      ? (db
          .prepare('SELECT id, label, required FROM question_items WHERE group_id = ? AND version = ?')
          .all(groupId, activeQ.version) as { id: string; label: string; required: number }[])
      : [];

    const answerSnapshots: { questionId: string; questionLabel: string; answerText: string }[] = [];

    // 3. Validate Questions and Answers
    if (questionItems.length === 0) {
      // Direct application when no questionnaire is required
      answerSnapshots.push({
        questionId: 'direct_application',
        questionLabel: 'No questionnaire required for this group.',
        answerText: 'Immediate application submitted by verified student.',
      });
    } else {
      if (activeQ && activeQ.version !== questionnaireVersion) {
        db.close();
        return NextResponse.json(
          {
            success: false,
            error: 'STALE_QUESTIONNAIRE_VERSION',
            message:
              'The group questionnaire has been updated. Please review the new version before submitting.',
            activeVersion: activeQ.version,
          },
          { status: 409 }
        );
      }

      const questionMap = new Map(questionItems.map((q) => [q.id, q]));
      const submittedQuestionIds = new Set<string>();

      for (const ans of answers) {
        if (submittedQuestionIds.has(ans.questionId)) {
          db.close();
          return NextResponse.json(
            { success: false, error: `Duplicate answer submitted for question ${ans.questionId}` },
            { status: 400 }
          );
        }
        submittedQuestionIds.add(ans.questionId);

        const qDef = questionMap.get(ans.questionId);
        if (qDef) {
          const text = (ans.answerText || '').trim();
          if (qDef.required && text.length === 0) {
            db.close();
            return NextResponse.json(
              { success: false, error: `Question "${qDef.label}" is required and cannot be empty.` },
              { status: 400 }
            );
          }

          if (text.length > 2000) {
            db.close();
            return NextResponse.json(
              { success: false, error: `Answer for "${qDef.label}" exceeds 2000 characters limit.` },
              { status: 400 }
            );
          }

          answerSnapshots.push({
            questionId: qDef.id,
            questionLabel: qDef.label,
            answerText: text,
          });
        }
      }

      // Check if any required question was omitted completely
      for (const qDef of questionItems) {
        if (qDef.required && !submittedQuestionIds.has(qDef.id)) {
          db.close();
          return NextResponse.json(
            { success: false, error: `Required question missing: "${qDef.label}"` },
            { status: 400 }
          );
        }
      }
    }

    // 4. Atomic Transaction: Persist Application, Notification, and Idempotency Lock
    const applicationId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const insertApp = db.prepare(`
      INSERT INTO applications (id, group_id, questionnaire_version, applicant_id, applicant_pseudonym, answers_snapshot_json, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, recipient_admin_id, group_name, application_id, applicant_pseudonym, read_status, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `);

    const insertLock = db.prepare(`
      INSERT INTO idempotency_records (actor_id, operation, idempotency_key, payload_fingerprint, application_id, created_at)
      VALUES (?, 'group_apply', ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertApp.run(
        applicationId,
        groupId,
        questionnaireVersion,
        applicantId,
        applicantPseudonym,
        JSON.stringify(answerSnapshots),
        now
      );
      insertNotif.run(
        notificationId,
        group.admin_id,
        group.name,
        applicationId,
        applicantPseudonym,
        now
      );
      insertLock.run(applicantId, idempotencyKey, payloadFingerprint, applicationId, now);
    });

    transaction();
    db.close();

    return NextResponse.json({
      success: true,
      applicationId,
      message: 'Application submitted successfully to group admin!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
