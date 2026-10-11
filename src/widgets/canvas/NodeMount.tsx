
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
