// Subscribes to a single node by id and renders it. Each NodeMount only
// re-renders when its own node's reference changes in the store — this is
// what makes "change one node, don't re-render siblings" true for free, and
// is also where the ESLint boundary that forbids entities → app is kept
// clean: entities render pure data; the store subscription lives here.

import { useCallback } from 'react';
import type { Action, NodeId } from '../../core/model';
import { useEditor } from '../../app/store';
import { NodeRenderer } from '../../entities/node';

export type NodeMountProps = {
  id: NodeId;
  parentDirection?: 'vertical' | 'horizontal';
};

export function NodeMount({ id, parentDirection }: NodeMountProps) {
  const node = useEditor((s) => s.history.doc.nodes[id]);
  const theme = useEditor((s) => s.theme);
  const preview = useEditor((s) => s.preview);
  const setCurrentScreen = useEditor((s) => s.setCurrentScreen);
  const setPreview = useEditor((s) => s.setPreview);

  const onAction = useCallback(
    (action: Action) => {
      if (action.type === 'navigate') setCurrentScreen(action.screenId);
      else if (action.type === 'close') setPreview(false);
    },
    [setCurrentScreen, setPreview],
  );

  if (!node) return null;
  return (
    <NodeRenderer
      node={node}
      theme={theme}
      preview={preview}
      onAction={onAction}
      {...(parentDirection !== undefined ? { parentDirection } : {})}
      renderChild={(childId, dir) => <NodeMount key={childId} id={childId} parentDirection={dir} />}
    />
  );
}
