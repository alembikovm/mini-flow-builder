import { memo } from 'react';
import type { ButtonNode } from '../../core/model';
import { fillChildStyle, nodeContainerStyle } from './styleToCss';
import type { NodeRendererProps } from './NodeRenderer';

export const ButtonRenderer = memo(function ButtonRenderer({
  node,
  theme,
  parentDirection,
  preview,
  onAction,
}: NodeRendererProps & { node: ButtonNode }) {
  const container = nodeContainerStyle(node, theme);
  const childFill = fillChildStyle(node, parentDirection ?? 'vertical');
  return (
    <div
      data-node-id={node.id}
      onClick={preview && onAction ? () => onAction(node.props.action) : undefined}
      style={{
        ...container,
        ...childFill,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: preview ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {node.props.label}
    </div>
  );
});
