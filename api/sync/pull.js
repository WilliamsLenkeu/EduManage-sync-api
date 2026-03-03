/**
 * GET /api/sync/pull?since=ISO8601 — Vercel serverless
 */

import { getDb } from "../../lib/db.js";

const COLLECTIONS = [
  "establishments", "school_years", "terms", "sequences",
  "classes", "subjects", "class_subjects", "students",
  "student_classes", "tuition_payments", "grades",
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const since = req.query.since || "1970-01-01T00:00:00Z";
    const db = await getDb();
    const items = [];

    for (const entityType of COLLECTIONS) {
      const col = db.collection(entityType);
      const cursor = col.find({ updated_at: { $gt: since } });
      for await (const doc of cursor) {
        const { _id, ...rest } = doc;
        items.push({
          entity_type: entityType,
          entity_id: doc.id,
          payload: rest,
        });
      }
    }

    items.sort((a, b) => (a.payload.updated_at || "").localeCompare(b.payload.updated_at || ""));
    return res.status(200).json(items);
  } catch (err) {
    console.error("Pull error:", err);
    return res.status(500).json({ error: err.message });
  }
}
