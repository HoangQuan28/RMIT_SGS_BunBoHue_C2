import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'whispersync.db');

export function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  return db;
}

export function initDb() {
  const db = getDb();

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      admin_id TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      university TEXT NOT NULL,
      member_count INTEGER NOT NULL DEFAULT 1,
      embedding_blob BLOB,
      embedding_model TEXT,
      description_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS discussion_topics (
      tag TEXT PRIMARY KEY,
      occurrence_count INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS questionnaires (
      group_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      PRIMARY KEY (group_id, version)
    );

    CREATE TABLE IF NOT EXISTS question_items (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      label TEXT NOT NULL,
      required INTEGER NOT NULL DEFAULT 1,
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (group_id, version) REFERENCES questionnaires(group_id, version) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      questionnaire_version INTEGER NOT NULL,
      applicant_id TEXT NOT NULL,
      applicant_pseudonym TEXT NOT NULL,
      answers_snapshot_json TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS idempotency_records (
      actor_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      payload_fingerprint TEXT NOT NULL,
      application_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (actor_id, operation, idempotency_key)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_admin_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      group_name TEXT NOT NULL,
      application_id TEXT NOT NULL,
      applicant_pseudonym TEXT NOT NULL,
      read_status INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );
  `);

  // Auto-migrate legacy groups schema if created_at is absent
  try {
    const groupCols = db.pragma('table_info(groups)') as { name: string }[];
    if (groupCols && groupCols.length > 0 && !groupCols.some((col) => col.name === 'created_at')) {
      db.exec("ALTER TABLE groups ADD COLUMN created_at TEXT NOT NULL DEFAULT '2026-10-22T00:00:00Z'");
    }
  } catch {
    // Ignore migration errors if column already exists
  }

  // Seed baseline discussion topics strictly derived from initial channel messages
  const initialTags = [
    { tag: '#OS', count: 14 },
    { tag: '#Midterm', count: 21 },
    { tag: '#Capstone', count: 35 },
    { tag: '#Review', count: 18 },
    { tag: '#ExamArchive', count: 52 },
    { tag: '#BeginnerHelp', count: 29 },
    { tag: '#DistributedSystems', count: 44 },
    { tag: '#Calculus2', count: 27 },
  ];

  const insertTopic = db.prepare(`
    INSERT OR REPLACE INTO discussion_topics (tag, occurrence_count) VALUES (?, ?)
  `);
  for (const t of initialTags) {
    insertTopic.run(t.tag, t.count);
  }

  // Seed initial study groups if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM groups').get() as { count: number };
  if (count.count === 0) {
    const seedGroups = [
      {
        id: 'grp-capstone-ai',
        name: 'COSC2759 Autonomous Systems & AI Capstone',
        description: 'Multi-campus capstone syndicate focused on robotics perception, deep reinforcement learning, and distributed AI agents. Looking for frontend and ML team members.',
        admin_id: 'Admin-Krypton',
        tags: ['#Capstone', '#DistributedSystems', '#Review'],
        university: 'RMIT',
        member_count: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 'grp-os-security',
        name: 'HCMUT Operating Systems & Kernel Security',
        description: 'In-depth study group exploring Linux kernel internals, memory safety, eBPF telemetry, and multi-threaded systems concurrency.',
        admin_id: 'Admin-Argon',
        tags: ['#OS', '#Midterm', '#ExamArchive'],
        university: 'HCMUT',
        member_count: 8,
        created_at: new Date().toISOString()
      },
      {
        id: 'grp-calculus-hust',
        name: 'HUST Advanced Calculus & Linear Algebra Circle',
        description: 'Comprehensive problem solving for multivariable calculus, vector fields, and linear algebra matrices for engineering undergraduates.',
        admin_id: 'Admin-Xenon',
        tags: ['#Calculus2', '#BeginnerHelp', '#Midterm'],
        university: 'HUST',
        member_count: 12,
        created_at: new Date().toISOString()
      },
      {
        id: 'grp-zero-trust-sec',
        name: 'Cross-Campus Zero-Trust & TideCloak Cryptography',
        description: 'Decentralized systems and threshold cryptography club. Building resilient applications where no single administrator or server has unilateral data access.',
        admin_id: 'Admin-Krypton',
        tags: ['#DistributedSystems', '#Capstone', '#ExamArchive'],
        university: 'ANY',
        member_count: 15,
        created_at: new Date().toISOString()
      }
    ];

    const insertGroup = db.prepare(`
      INSERT INTO groups (id, name, description, admin_id, tags_json, university, member_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertQ = db.prepare(`
      INSERT INTO questionnaires (group_id, version, is_published, created_at) VALUES (?, ?, 1, ?)
    `);

    const insertQI = db.prepare(`
      INSERT INTO question_items (id, group_id, version, label, required, order_index) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const g of seedGroups) {
      insertGroup.run(g.id, g.name, g.description, g.admin_id, JSON.stringify(g.tags), g.university, g.member_count, g.created_at);
      insertQ.run(g.id, 1, g.created_at);
      insertQI.run(`qi-${g.id}-1`, g.id, 1, 'What is your background and year of study?', 1, 0);
      insertQI.run(`qi-${g.id}-2`, g.id, 1, 'How many hours per week can you contribute to group syncs?', 1, 1);
      insertQI.run(`qi-${g.id}-3`, g.id, 1, 'Share a link to your GitHub, project portfolio, or previous work (optional).', 0, 2);
    }
  }

  db.close();
}
