import "server-only";

import neo4j, { Driver, Session, Integer } from "neo4j-driver";

declare global {
  // eslint-disable-next-line no-var
  var __traceNeo4jDriver: Driver | undefined;
  // eslint-disable-next-line no-var
  var __traceNeo4jDriverKey: string | undefined;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and configure CognoDB.`,
    );
  }
  return value;
}

function connectionKey(uri: string, username: string, password: string): string {
  return `${uri}|${username}|${password.length}:${password.slice(0, 4)}`;
}

export function getDriver(): Driver {
  const uri = requireEnv("COGNODB_URI");
  const username = requireEnv("COGNODB_USERNAME");
  const password = requireEnv("COGNODB_PASSWORD");
  const key = connectionKey(uri, username, password);

  if (global.__traceNeo4jDriver && global.__traceNeo4jDriverKey === key) {
    return global.__traceNeo4jDriver;
  }

  if (global.__traceNeo4jDriver) {
    void global.__traceNeo4jDriver.close().catch(() => undefined);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    disableLosslessIntegers: true,
    connectionTimeout: 20_000,
  });

  global.__traceNeo4jDriver = driver;
  global.__traceNeo4jDriverKey = key;

  return driver;
}

export async function withSession<T>(
  work: (session: Session) => Promise<T>,
): Promise<T> {
  const session = getDriver().session();
  try {
    return await work(session);
  } finally {
    await session.close();
  }
}

export async function verifyConnectivity(): Promise<void> {
  await getDriver().verifyConnectivity();
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (neo4j.isInt(value)) return (value as Integer).toNumber();
  return Number(value ?? 0);
}

export function serializeValue(value: unknown): unknown {
  if (value == null) return value;
  if (neo4j.isInt(value)) return (value as Integer).toNumber();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toString" in value) {
    const maybeDate = value as {
      year?: unknown;
      month?: unknown;
      day?: unknown;
    };
    if (
      typeof maybeDate.year === "object" ||
      typeof maybeDate.month === "number" ||
      typeof maybeDate.day === "number"
    ) {
      try {
        return String(value);
      } catch {
        return value;
      }
    }
  }
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeValue(v);
    }
    return out;
  }
  return value;
}

export function propsOf(
  recordProps: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return (serializeValue(recordProps ?? {}) as Record<string, unknown>) ?? {};
}
