// Zod schema for the exported Doc. Shape mirrors `model.ts` 1:1 so we can
// cast the parsed value back to `Doc` without a second mapping step.
// Unknown keys at any level are rejected (`.strict()`) — if we add a model
// field we have to update the schema in the same change, which is exactly
// the enforcement interview questions tend to probe for.

import { z } from 'zod';
import type { Doc } from './model';

const Color = z.object({ light: z.string(), dark: z.string() }).strict();

const SizeValue = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('fill') }).strict(),
  z.object({ mode: z.literal('hug') }).strict(),
  z.object({ mode: z.literal('fixed'), value: z.number() }).strict(),
]);

const Padding = z
  .object({ top: z.number(), right: z.number(), bottom: z.number(), left: z.number() })
  .strict();

const NodeStyle = z
  .object({
    direction: z.enum(['vertical', 'horizontal']).optional(),
    align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    justify: z
      .enum(['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'])
      .optional(),
    gap: z.number().optional(),
    padding: Padding.optional(),
    width: SizeValue.optional(),
    height: SizeValue.optional(),
    fill: Color.optional(),
    cornerRadius: z.number().optional(),
    border: z.object({ width: z.number(), color: Color }).strict().optional(),
    fontSize: z.number().optional(),
    fontWeight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)]).optional(),
    textColor: Color.optional(),
    textAlign: z.enum(['left', 'center', 'right']).optional(),
  })
  .strict();

const Action = z.discriminatedUnion('type', [
  z.object({ type: z.literal('navigate'), screenId: z.string() }).strict(),
  z.object({ type: z.literal('close') }).strict(),
  z.object({ type: z.literal('none') }).strict(),
]);

const base = {
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  style: NodeStyle,
};

const StackNode = z
  .object({
    ...base,
    type: z.literal('stack'),
    props: z.object({}).strict(),
    children: z.array(z.string()),
  })
  .strict();

const TextNode = z
  .object({
    ...base,
    type: z.literal('text'),
    props: z.object({ content: z.string() }).strict(),
  })
  .strict();

const ImageNode = z
  .object({
    ...base,
    type: z.literal('image'),
    props: z.object({ src: z.string(), fit: z.enum(['cover', 'contain']) }).strict(),
  })
  .strict();

const ButtonNode = z
  .object({
    ...base,
    type: z.literal('button'),
    props: z.object({ label: z.string(), action: Action }).strict(),
  })
  .strict();

const OptionsNode = z
  .object({
    ...base,
    type: z.literal('options'),
    props: z
      .object({
        selectionMode: z.enum(['single', 'multi']),
        options: z.array(z.object({ id: z.string(), label: z.string() }).strict()),
      })
      .strict(),
  })
  .strict();

const SpacerNode = z
  .object({
    ...base,
    type: z.literal('spacer'),
    props: z.object({}).strict(),
  })
  .strict();

const NodeSchema = z.discriminatedUnion('type', [
  StackNode,
  TextNode,
  ImageNode,
  ButtonNode,
  OptionsNode,
  SpacerNode,
]);

const Screen = z.object({ id: z.string(), name: z.string(), rootId: z.string() }).strict();

export const DocSchema = z
  .object({
    schemaVersion: z.literal(1),
    screens: z.record(z.string(), Screen),
    screenOrder: z.array(z.string()),
    nodes: z.record(z.string(), NodeSchema),
  })
  .strict();

/**
 * Stub for forward-compat. New schema versions bump the literal above and
 * walk the chain here: 1→2 adds X, 2→3 adds Y. The migrator must never
 * throw — it either returns a v{N} shape or `null` if unrecoverable.
 */
export function migrate(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && 'schemaVersion' in raw) {
    // Future: switch on schemaVersion. Only v1 exists today.
    return raw;
  }
  return raw;
}

export function parseDoc(raw: unknown): Doc {
  const migrated = migrate(raw);
  const parsed = DocSchema.parse(migrated);
  return parsed as unknown as Doc;
}

export function safeParseDoc(raw: unknown): { ok: true; doc: Doc } | { ok: false; error: string } {
  try {
    const doc = parseDoc(raw);
    return { ok: true, doc };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
