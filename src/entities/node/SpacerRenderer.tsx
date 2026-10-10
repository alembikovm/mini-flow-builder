import { memo } from 'react';
import type { SpacerNode } from '../../core/model';
import { fillChildStyle, nodeContainerStyle } from './styleToCss';
import type { NodeRendererProps } from './NodeRenderer';

export const SpacerRenderer = memo(function SpacerRenderer({
  node,
  theme,
  parentDirection,
}: NodeRendererProps & { node: SpacerNode }) {
  const container = nodeContainerStyle(node, theme);
  const childFill = fillChildStyle(node, parentDirection ?? 'vertical');
  return <div data-node-id={node.id} style={{ ...container, ...childFill }} />;
});
