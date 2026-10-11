
import type { Doc } from './model';
import { parseDoc, safeParseDoc } from './schema';

export function serializeDoc(doc: Doc): string {
  return JSON.stringify(doc, null, 2);
}

export function deserializeDoc(raw: string): Doc {
  return parseDoc(JSON.parse(raw));
}

export function safeDeserializeDoc(raw: string): ReturnType<typeof safeParseDoc> {
  try {
    const parsed = JSON.parse(raw);
    return safeParseDoc(parsed);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
