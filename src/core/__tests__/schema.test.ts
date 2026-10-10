import { describe, expect, it } from 'vitest';
import { createSeedDoc } from '../seed';
import { parseDoc, safeParseDoc } from '../schema';
import { deserializeDoc, safeDeserializeDoc, serializeDoc } from '../serialize';

describe('schema', () => {
  it('round-trips the seed doc', () => {
    const doc = createSeedDoc();
    const json = serializeDoc(doc);
    const back = deserializeDoc(json);
    expect(back).toEqual(doc);
  });

  it('parseDoc accepts a valid seed doc', () => {
    const doc = createSeedDoc();
    expect(() => parseDoc(doc)).not.toThrow();
  });

  it('safeParseDoc returns ok:false on malformed input', () => {
    const bad = { schemaVersion: 1, screens: 'nope' };
    const res = safeParseDoc(bad);
    expect(res.ok).toBe(false);
  });

  it('safeDeserializeDoc returns ok:false on invalid JSON', () => {
    const res = safeDeserializeDoc('not json');
    expect(res.ok).toBe(false);
  });

  it('rejects unknown keys inside a node style (strict mode)', () => {
    const doc = createSeedDoc();
    const firstId = Object.keys(doc.nodes)[0]!;
    const firstNode = doc.nodes[firstId]!;
    const polluted = {
      ...doc,
      nodes: {
        ...doc.nodes,
        [firstId]: { ...firstNode, style: { ...firstNode.style, bogus: 1 } },
      },
    };
    const res = safeParseDoc(polluted);
    expect(res.ok).toBe(false);
  });
});
