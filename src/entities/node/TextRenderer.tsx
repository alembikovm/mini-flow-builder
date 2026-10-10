import { memo } from 'react';
import type { TextNode } from '../../core/model';
import { fillChildStyle, nodeContainerStyle } from './styleToCss';
import type { NodeRendererProps } from './NodeRenderer';

export const TextRenderer = memo(function TextRenderer({
  node,
  theme,
  parentDirection,
}: NodeRendererProps & { node: TextNode }) {
  const container = nodeContainerStyle(node, theme);
  const childFill = fillChildStyle(node, parentDirection ?? 'vertical');
  return (
    <div
      data-node-id={node.id}
      style={{ ...container, ...childFill, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
    >
      {node.props.content}
    </div>
  );
});
