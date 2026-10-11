// Dev-only: adds a screen with ~500 text nodes in a single commit. Used to
// measure that per-node render isolation works — see docs/decisions.md M8.

import { useCallback } from 'react';
import { useEditor } from '../../app/store';
import {
  addNode as opsAddNode,
  addScreen as opsAddScreen,
} from '../../core/ops';
import type { ScreenId } from '../../core/model';

const STRESS_COUNT = 500;

export function StressButton() {
  const onClick = useCallback(() => {
    let newScreen: ScreenId = '';
    useEditor.getState().commit('stress test', (d) => {
      newScreen = opsAddScreen(d, `Stress ${STRESS_COUNT}`);
      const screen = d.screens[newScreen];
      if (!screen) return;
      for (let i = 0; i < STRESS_COUNT; i++) {
        const id = opsAddNode(d, 'text', { parentId: screen.rootId });
        const node = d.nodes[id];
        if (node && node.type === 'text') {
          node.props.content = `Row ${i + 1}`;
          node.style.padding = { top: 4, right: 8, bottom: 4, left: 8 };
        }
      }
    });
    if (newScreen) useEditor.getState().setCurrentScreen(newScreen);
  }, []);

  return (
    <button
      onClick={onClick}
      style={{
        marginTop: 12,
        width: '100%',
        padding: '6px 10px',
        fontSize: 12,
        background: 'var(--mfb-bg-sunken)',
        border: '1px dashed var(--mfb-border-strong)',
        borderRadius: 4,
        cursor: 'pointer',
      }}
      title={`Dev: generate a screen with ${STRESS_COUNT} nodes`}
    >
      ⚡ Stress test ({STRESS_COUNT} nodes)
    </button>
  );
}
