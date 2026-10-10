import { NumberInput, Row, SegmentedControl } from '../../../shared/ui';
import { useEditor } from '../../../app/store';
import { useScrub } from '../../../features/edit-style';
import type { NodeId, SizeValue } from '../../../core/model';
import { fixedSizeValue, SIZE_MODE_OPTIONS, sizeWithMode } from './common';

export function SizeRow({
  nodeId,
  axis,
  value,
}: {
  nodeId: NodeId;
  axis: 'width' | 'height';
  value: SizeValue | undefined;
}) {
  const updateStyle = useEditor((s) => s.updateStyle);
  const scrub = useScrub(`${axis}`);
  const mode = value?.mode ?? 'hug';
  return (
    <Row label={axis === 'width' ? 'Width' : 'Height'}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <SegmentedControl
          value={mode}
          options={SIZE_MODE_OPTIONS}
          onChange={(m) => updateStyle(nodeId, { [axis]: sizeWithMode(value, m) })}
        />
        {mode === 'fixed' && (
          <NumberInput
            value={fixedSizeValue(value)}
            min={0}
            onBeginScrub={scrub.begin}
            onEndScrub={scrub.end}
            onChange={(v) => updateStyle(nodeId, { [axis]: { mode: 'fixed', value: v } })}
          />
        )}
      </div>
    </Row>
  );
}
