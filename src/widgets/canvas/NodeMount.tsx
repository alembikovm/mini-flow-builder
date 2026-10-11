// Subscribes to a single node by id and renders it. Memoized on
// `{id, parentDirection}` so a parent re-render doesn't cascade into
// children: each NodeMount only re-renders when its own node reference
// changes in the store, which is the real isolation boundary.
//
// NOTE: `renderChild` is a module-level stable callback. An earlier version
// used an inline arrow that referenced `NodeMount` itself (self-reference);
// React Fast Refresh wraps components in HMR hooks, and that self-reference
// through an inline closure produced a *different* NodeMount type for each
// render — React then re-mounted every child instead of reconciling, and
// memo never engaged. Keeping renderChild at module scope avoids that.

import { memo, useCallback } from 'react';
import type { Action, NodeId } from '../../core/model';
import { useEditor } from '../../app/store';
import { NodeRenderer } from '../../entities/node';

export type NodeMountProps = {
  id: NodeId;
  parentDirection?: 'vertical' | 'horizontal';
};

declare global {
  interface Window {
    __mfbRenderCount?: number;
  }
}

const renderChild = (
  childId: NodeId,
  dir: 'vertical' | 'horizontal',
): React.ReactElement => <NodeMount key={childId} id={childId} parentDirection={dir} />;

function NodeMountInner({ id, parentDirection }: NodeMountProps): React.ReactElement | null {
  const node = useEditor((s) => s.history.doc.nodes[id]);
  const theme = useEditor((s) => s.theme);
  const preview = useEditor((s) => s.preview);
  const setCurrentScreen = useEditor((s) => s.setCurrentScreen);
  const setPreview = useEditor((s) => s.setPreview);

  if (import.meta.env.DEV && typeof window !== 'undefined') {
    window.__mfbRenderCount = (window.__mfbRenderCount ?? 0) + 1;
  }

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
      renderChild={renderChild}
    />
  );
}

export const NodeMount = memo(NodeMountInner);
