// Re-export the model types this layer needs so renderers import from a stable
// local file rather than reaching into src/core/model.ts directly.
export type { Color, Node, NodeStyle, SizeValue } from '../../core/model';

// Palette the renderer picks from. Defined locally so entities don't depend on
// the store layer (ESLint boundaries would reject that import).
export type Theme = 'light' | 'dark';
