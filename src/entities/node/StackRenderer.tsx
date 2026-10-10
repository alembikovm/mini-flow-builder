import { memo } from 'react';
import type { StackNode } from '../../core/model';
import { fillChildStyle, nodeContainerStyle } from './styleToCss';
import type { NodeRendererProps } from './NodeRenderer';

export const StackRenderer = memo(function StackRenderer({
  node,
  theme,
  parentDirection,
  renderChild,
}: NodeRendererProps & { node: StackNode }) {
  const container = nodeContainerStyle(node, theme);
  const direction = node.style.direction === 'horizontal' ? 'horizontal' : 'vertical';
  const childFill = fillChildStyle(node, parentDirection ?? 'vertical');
  return (
    <div data-node-id={node.id} style={{ ...container, ...childFill }}>
      {node.children.map((childId) => renderChild(childId, direction))}
    </div>
  );
});
