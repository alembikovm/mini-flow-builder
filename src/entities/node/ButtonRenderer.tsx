import { memo } from 'react';
import type { ButtonNode } from '../../core/model';
import { fillChildStyle, nodeContainerStyle } from './styleToCss';
import type { NodeRendererProps } from './NodeRenderer';

export const ButtonRenderer = memo(function ButtonRenderer({
  node,
  theme,
  parentDirection,
}: NodeRendererProps & { node: ButtonNode }) {
  const container = nodeContainerStyle(node, theme);
  const childFill = fillChildStyle(node, parentDirection ?? 'vertical');
  return (
    <div
      data-node-id={node.id}
      style={{
        ...container,
        ...childFill,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {node.props.label}
    </div>
  );
});
