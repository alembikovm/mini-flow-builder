// Pure dispatcher. The renderer receives a resolved `node` object (not an id)
// so React.memo can bail out on shallow prop equality: when a store update
// doesn't change this node's reference, the whole subtree below is skipped.
//
// Recursion into children is delegated via `renderChild`, which the widgets
// layer provides — it subscribes to each child by id separately. Keeping that
// outside entities is what preserves the import boundary (entities never reach
// into the store).

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
  /** Called when a Button is clicked in preview mode. */
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
