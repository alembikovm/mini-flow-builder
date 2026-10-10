// A single scrubbing transaction. The begin/end pair wraps every intermediate
// `updateStyle` call inside one history entry, so a 50-sample drag is one
// undo. Call `begin` on `onBeginScrub`, `end` on `onEndScrub` from any shared
// input primitive that supports scrubbing.

import { useCallback } from 'react';
import { useEditor } from '../../app/store';

export function useScrub(label: string): { begin: () => void; end: () => void; cancel: () => void } {
  const beginTx = useEditor((s) => s.beginTx);
  const commitTx = useEditor((s) => s.commitTx);
  const cancelTx = useEditor((s) => s.cancelTx);
  const begin = useCallback(() => beginTx(label), [beginTx, label]);
  const end = useCallback(() => commitTx(), [commitTx]);
  const cancel = useCallback(() => cancelTx(), [cancelTx]);
  return { begin, end, cancel };
}
