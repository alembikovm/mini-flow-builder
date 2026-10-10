import { customAlphabet } from 'nanoid';

// 10-char URL-safe id. Short enough to inspect in dev tools, large enough to
// avoid collisions in a single document (< 1e-6 at 10k nodes).
const nano = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 10);

export const newNodeId = (): string => `n_${nano()}`;
export const newScreenId = (): string => `s_${nano()}`;
export const newOptionId = (): string => `o_${nano()}`;
