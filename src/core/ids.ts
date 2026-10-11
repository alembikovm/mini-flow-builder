import { customAlphabet } from 'nanoid';

const nano = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 10);

export const newNodeId = (): string => `n_${nano()}`;
export const newScreenId = (): string => `s_${nano()}`;
export const newOptionId = (): string => `o_${nano()}`;
