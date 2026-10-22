import { pipeline } from '@huggingface/transformers';
import { getDb } from '@/lib/db/sqlite';

let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      revision: 'e4ce9877abf3ed58b02d64a974b7858c42b10543',
    });
  }
  return extractorPromise;
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0.0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function embedText(text: string): Promise<Float32Array> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return new Float32Array(output.data);
}

export interface RankedGroup {
  id: string;
  name: string;
  description: string;
  adminId: string;
  tags: string[];
  university: string;
  memberCount: number;
  semanticScore: number;
  matchingTagCount: number;
}

export async function searchAndRankGroups(
  query: string,
  selectedTags: string[]
): Promise<RankedGroup[]> {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM groups').all() as any[];

  // 1. Tag Subset Filtering
  const normalizedSelectedTags = selectedTags.map((t) => t.trim().toLowerCase());
  const filteredRows = rows.filter((r) => {
    if (normalizedSelectedTags.length === 0) return true;
    const groupTags: string[] = JSON.parse(r.tags_json).map((t: string) => t.trim().toLowerCase());
    return groupTags.some((gt) => normalizedSelectedTags.includes(gt));
  });

  // 2. Query Embedding (Strictly outside DB write lock)
  let queryVector: Float32Array | null = null;
  const hasQuery = query.trim().length > 0;
  if (hasQuery) {
    try {
      queryVector = await embedText(query);
    } catch (err: any) {
      db.close();
      throw new Error(`SEMANTIC_SEARCH_UNAVAILABLE: ${err.message}`);
    }
  }

  // 3. Compute Embeddings & Scores for Groups
  const ranked: RankedGroup[] = [];

  for (const row of filteredRows) {
    const groupTags: string[] = JSON.parse(row.tags_json);
    let groupVector: Float32Array;

    if (row.embedding_blob) {
      groupVector = new Float32Array(
        row.embedding_blob.buffer,
        row.embedding_blob.byteOffset,
        row.embedding_blob.byteLength / 4
      );
    } else {
      // Lazy compute description embedding & persist
      groupVector = await embedText(`${row.name}. ${row.description}`);
      const buffer = Buffer.from(groupVector.buffer);
      db.prepare('UPDATE groups SET embedding_blob = ?, embedding_model = ? WHERE id = ?').run(
        buffer,
        'Xenova/all-MiniLM-L6-v2',
        row.id
      );
    }

    let semanticScore = 0.0;
    if (queryVector) {
      semanticScore = cosineSimilarity(queryVector, groupVector);
    }

    // Matching selected tags count
    const matchingTagCount = groupTags.filter((gt) =>
      normalizedSelectedTags.includes(gt.trim().toLowerCase())
    ).length;

    ranked.push({
      id: row.id,
      name: row.name,
      description: row.description,
      adminId: row.admin_id,
      tags: groupTags,
      university: row.university,
      memberCount: row.member_count,
      semanticScore,
      matchingTagCount,
    });
  }

  db.close();

  // 4. Deterministic Ranking Contract
  ranked.sort((a, b) => {
    if (hasQuery) {
      // Primary: Semantic cosine similarity desc
      if (Math.abs(b.semanticScore - a.semanticScore) > 0.0001) {
        return b.semanticScore - a.semanticScore;
      }
      // Secondary: Matching selected tag count desc
      if (b.matchingTagCount !== a.matchingTagCount) {
        return b.matchingTagCount - a.matchingTagCount;
      }
      // Tertiary: Stable group ID asc
      return a.id.localeCompare(b.id);
    } else {
      // Browsing / Tags-only mode
      if (b.matchingTagCount !== a.matchingTagCount) {
        return b.matchingTagCount - a.matchingTagCount;
      }
      if (b.memberCount !== a.memberCount) {
        return b.memberCount - a.memberCount;
      }
      return a.id.localeCompare(b.id);
    }
  });

  return ranked;
}
