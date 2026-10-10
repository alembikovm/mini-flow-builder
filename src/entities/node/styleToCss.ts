// Map our NodeStyle (a deliberate subset of layout props that round-trip to
// native) to React.CSSProperties. Only properties set on the model are
// emitted; everything else inherits.

import type { CSSProperties } from 'react';
import type { Color, Node, NodeStyle, SizeValue, Theme } from './types';

const alignToFlex = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
} as const;

const justifyToFlex: Record<NonNullable<NodeStyle['justify']>, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
};

function size(v: SizeValue | undefined, kind: 'width' | 'height'): string | number | undefined {
  if (!v) return undefined;
  if (v.mode === 'fill') return '100%';
  if (v.mode === 'hug') return kind === 'width' ? 'auto' : 'auto';
  return v.value;
}

function color(c: Color | undefined, theme: Theme): string | undefined {
  if (!c) return undefined;
  return theme === 'dark' ? c.dark : c.light;
}

export function nodeContainerStyle(node: Node, theme: Theme): CSSProperties {
  const s = node.style;
  const css: CSSProperties = {};

  // Flex container (only meaningful on stack, but harmless elsewhere).
  if (node.type === 'stack') {
    css.display = 'flex';
    css.flexDirection = s.direction === 'horizontal' ? 'row' : 'column';
    if (s.align) css.alignItems = alignToFlex[s.align];
    if (s.justify) css.justifyContent = justifyToFlex[s.justify];
    if (s.gap !== undefined) css.gap = s.gap;
  }

  if (s.padding) {
    css.paddingTop = s.padding.top;
    css.paddingRight = s.padding.right;
    css.paddingBottom = s.padding.bottom;
    css.paddingLeft = s.padding.left;
  }

  const w = size(s.width, 'width');
  const h = size(s.height, 'height');
  if (w !== undefined) css.width = w;
  if (h !== undefined) css.height = h;

  // Parent context: fill works relative to flex parent via flex: 1 on the main
  // axis. We approximate this by setting flex-grow when `fill` is used; for a
  // cross-axis fill the parent's `align: stretch` already handles width/height.
  if (s.width?.mode === 'fill') css.flexShrink = 1;
  if (s.height?.mode === 'fill') css.flexShrink = 1;

  const fill = color(s.fill, theme);
  if (fill) css.background = fill;

  if (s.cornerRadius !== undefined) css.borderRadius = s.cornerRadius;
  if (s.border) {
    const bc = color(s.border.color, theme);
    css.border = `${s.border.width}px solid ${bc ?? 'transparent'}`;
  }

  // Text style (only rendered by text/button; harmless elsewhere).
  if (s.fontSize !== undefined) css.fontSize = s.fontSize;
  if (s.fontWeight !== undefined) css.fontWeight = s.fontWeight;
  const tc = color(s.textColor, theme);
  if (tc) css.color = tc;
  if (s.textAlign) css.textAlign = s.textAlign;

  return css;
}

/**
 * `fill` on the main axis of the parent should participate in flex. We can't
 * know the parent direction from the child alone, so the renderer attaches
 * this helper separately and the StackRenderer applies it to each child.
 */
export function fillChildStyle(
  child: Node,
  parentDirection: 'vertical' | 'horizontal',
): CSSProperties {
  const css: CSSProperties = {};
  const main = parentDirection === 'vertical' ? child.style.height : child.style.width;
  const cross = parentDirection === 'vertical' ? child.style.width : child.style.height;
  if (main?.mode === 'fill') {
    css.flexGrow = 1;
    css.flexBasis = 0;
  }
  if (cross?.mode === 'fill') {
    css.alignSelf = 'stretch';
  }
  return css;
}
