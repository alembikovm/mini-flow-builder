
import { memo } from 'react';
import type { Action, Node, NodeId } from '../../core/model';
import type { Theme } from './types';
import { StackRenderer } from './StackRenderer';
import { TextRenderer } from './TextRenderer';
import { ImageRenderer } from './ImageRenderer';
import { ButtonRenderer } from './ButtonRenderer';
import { OptionsRenderer } from './OptionsRenderer';
import { SpacerRenderer } from './SpacerRenderer';

export type RenderChild = (childId: NodeId, parentDirection: 'vertical' | 'horizontal') => React.ReactNode;

export type NodeRendererProps = {
  node: Node;
  theme: Theme;
  preview: boolean;
  parentDirection?: 'vertical' | 'horizontal';
  renderChild: RenderChild;
  onAction?: (action: Action) => void;
};

export const NodeRenderer = memo(function NodeRenderer(props: NodeRendererProps) {
  const { node } = props;
  switch (node.type) {
    case 'stack':
      return <StackRenderer {...props} node={node} />;
    case 'text':
      return <TextRenderer {...props} node={node} />;
    case 'image':
      return <ImageRenderer {...props} node={node} />;
    case 'button':
      return <ButtonRenderer {...props} node={node} />;
    case 'options':
      return <OptionsRenderer {...props} node={node} />;
    case 'spacer':
      return <SpacerRenderer {...props} node={node} />;
  }
});
