/**
 * Connexion MongoDB avec cache pour Vercel serverless
 * Réutilise la connexion entre invocations (warm)
 */

import { MongoClient } from "mongodb";

let cached = global.mongoCache;
if (!cached) {
  cached = global.mongoCache = { client: null, db: null };
}

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI manquant");

  if (cached.db) return cached.db;

  const client = await MongoClient.connect(uri);
  cached.client = client;
  cached.db = client.db("edu_manage");
  return cached.db;
}
