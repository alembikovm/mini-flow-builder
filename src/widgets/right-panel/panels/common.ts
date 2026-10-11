
import type { NodeStyle, SizeValue } from '../../../core/model';

export const SIZE_MODE_OPTIONS = [
  { value: 'fill' as const, label: 'Fill' },
  { value: 'hug' as const, label: 'Hug' },
  { value: 'fixed' as const, label: 'Fixed' },
];

export function sizeWithMode(
  current: SizeValue | undefined,
  mode: SizeValue['mode'],
): SizeValue {
  if (mode === 'fill') return { mode: 'fill' };
  if (mode === 'hug') return { mode: 'hug' };
  const existing = current?.mode === 'fixed' ? current.value : 100;
  return { mode: 'fixed', value: existing };
}

export function fixedSizeValue(v: SizeValue | undefined): number {
  return v?.mode === 'fixed' ? v.value : 0;
}

export const DEFAULT_PADDING = { top: 0, right: 0, bottom: 0, left: 0 } as const;

export function withStyle(style: NodeStyle, patch: Partial<NodeStyle>): Partial<NodeStyle> {
  return { ...style, ...patch };
}
