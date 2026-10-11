
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
