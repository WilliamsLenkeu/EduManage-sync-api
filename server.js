/**
 * API Sync EduManage — push/pull vers MongoDB
 * MVP : stockage simple, pas d'auth
 */

import express from "express";
import { MongoClient } from "mongodb";

const app = express();
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3001;

if (!MONGODB_URI) {
  console.error("MONGODB_URI requis. Créez .env à partir de .env.example");
  process.exit(1);
}

let db;

async function connectDb() {
  const client = await MongoClient.connect(MONGODB_URI);
  db = client.db("edu_manage");
  console.log("MongoDB connecté");
}

const COLLECTIONS = [
  "establishments",
  "school_years",
  "terms",
  "sequences",
  "classes",
  "subjects",
  "class_subjects",
  "students",
  "student_classes",
  "tuition_payments",
  "grades",
];

function getCollection(entityType) {
  if (!COLLECTIONS.includes(entityType)) {
    throw new Error(`Type inconnu: ${entityType}`);
  }
  return db.collection(entityType);
}

// POST /sync/push — reçoit les changements, upsert dans MongoDB
app.post("/sync/push", async (req, res) => {
  try {
    const { changes } = req.body || {};
    if (!Array.isArray(changes)) {
      return res.status(400).json({ error: "changes requis (array)" });
    }
    const accepted = [];
    for (const c of changes) {
      const { id, entity_type, entity_id, operation, payload } = c;
      if (!entity_type || !entity_id || !operation) continue;
      const col = getCollection(entity_type);
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
    res.json({ accepted });
  } catch (err) {
    console.error("Push error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /sync/pull?since=ISO8601 — retourne les documents modifiés depuis since
app.get("/sync/pull", async (req, res) => {
  try {
    const since = req.query.since || "1970-01-01T00:00:00Z";
    const items = [];
    for (const entityType of COLLECTIONS) {
      const col = getCollection(entityType);
      const cursor = col.find({
        updated_at: { $gt: since },
      });
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
    res.json(items);
  } catch (err) {
    console.error("Pull error:", err);
    res.status(500).json({ error: err.message });
  }
});

connectDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Sync API écoute sur http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Erreur connexion MongoDB:", err);
    process.exit(1);
  });
