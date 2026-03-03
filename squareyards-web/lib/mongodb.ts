import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";

const MONGODB_DB = process.env.MONGODB_DB || "estateperks";

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: Cached | undefined;
}

const cached: Cached = global.mongooseCache || { conn: null, promise: null };
global.mongooseCache = cached;

let mongoEnvHydrated = false;

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function hydrateMongoEnvFromWorkspace() {
  if (mongoEnvHydrated) return;
  mongoEnvHydrated = true;

  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, ".env.local"),
    path.resolve(cwd, ".env"),
    path.resolve(cwd, "..", ".env.local"),
    path.resolve(cwd, "..", ".env"),
  ];

  for (const filePath of candidates) {
    loadEnvFile(filePath);
    if (process.env.MONGODB_URI) break;
  }
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  hydrateMongoEnvFromWorkspace();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName: MONGODB_DB,
      autoIndex: true,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
