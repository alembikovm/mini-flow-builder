import { memo, useState } from 'react';
import type { OptionsNode } from '../../core/model';
import { fillChildStyle, nodeContainerStyle } from './styleToCss';
import type { NodeRendererProps } from './NodeRenderer';

export const OptionsRenderer = memo(function OptionsRenderer({
  node,
  theme,
  parentDirection,
  preview,
}: NodeRendererProps & { node: OptionsNode }) {
  const container = nodeContainerStyle(node, theme);
  const childFill = fillChildStyle(node, parentDirection ?? 'vertical');
  // Local, non-persistent selection: it only matters in preview mode.
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const onPick = (optId: string): void => {
    if (!preview) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (node.props.selectionMode === 'single') {
        next.clear();
        next.add(optId);
      } else {
        if (next.has(optId)) next.delete(optId);
        else next.add(optId);
      }
      return next;
    });
  };

  return (
    <div data-node-id={node.id} style={{ ...container, ...childFill, display: 'flex', flexDirection: 'column' }}>
      {node.props.options.map((opt) => {
        const isSelected = selected.has(opt.id);
        return (
          <div
            key={opt.id}
            data-option-id={opt.id}
            onClick={() => onPick(opt.id)}
            style={{
              padding: '12px 14px',
              border: `1px solid ${isSelected ? '#2563EB' : '#D4D4D8'}`,
              background: isSelected ? '#E6EEFC' : 'transparent',
              borderRadius: 10,
              cursor: preview ? 'pointer' : 'default',
              userSelect: 'none',
              fontSize: 15,
            }}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  );
});
