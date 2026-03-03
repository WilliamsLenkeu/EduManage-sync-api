/**
 * POST /api/sync/push — Vercel serverless
 */

import { getDb } from "../../lib/db.js";

const COLLECTIONS = [
  "establishments", "school_years", "terms", "sequences",
  "classes", "subjects", "class_subjects", "students",
  "student_classes", "tuition_payments", "grades",
];

function getCollection(db, entityType) {
  if (!COLLECTIONS.includes(entityType)) throw new Error(`Type inconnu: ${entityType}`);
  return db.collection(entityType);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { changes } = req.body || {};
    if (!Array.isArray(changes)) {
      return res.status(400).json({ error: "changes requis (array)" });
    }

    const db = await getDb();
    const accepted = [];

    for (const c of changes) {
      const { id, entity_type, entity_id, operation, payload } = c;
      if (!entity_type || !entity_id || !operation) continue;

      const col = getCollection(db, entity_type);
      if (operation === "delete") {
        await col.updateOne(
          { id: entity_id },
          { $set: { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() } }
        );
      } else if (payload && (operation === "insert" || operation === "update")) {
        const doc = { ...payload, id: entity_id, updated_at: new Date().toISOString() };
        await col.updateOne({ id: entity_id }, { $set: doc }, { upsert: true });
      }
      accepted.push(id || entity_id);
    }

    return res.status(200).json({ accepted });
  } catch (err) {
    console.error("Push error:", err);
    return res.status(500).json({ error: err.message });
  }
}
