// Subscribes to a single node by id and renders it. Each NodeMount only
// re-renders when its own node's reference changes in the store — this is
// what makes "change one node, don't re-render siblings" true for free, and
// is also where the ESLint boundary that forbids entities → app is kept
// clean: entities render pure data; the store subscription lives here.

import type { NodeId } from '../../core/model';
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
  if (!node) return null;
  return (
    <NodeRenderer
      node={node}
      theme={theme}
      preview={preview}
      {...(parentDirection !== undefined ? { parentDirection } : {})}
      renderChild={(childId, dir) => <NodeMount key={childId} id={childId} parentDirection={dir} />}
    />
  );
}
