import { NumberInput, Row, Section, SegmentedControl } from '../../../shared/ui';
import { useEditor } from '../../../app/store';
import { useScrub } from '../../../features/edit-style';
import type { SpacerNode } from '../../../core/model';
import { fixedSizeValue, SIZE_MODE_OPTIONS, sizeWithMode } from './common';

export function SpacerInspector({ node }: { node: SpacerNode }) {
  const updateStyle = useEditor((s) => s.updateStyle);
  const scrub = useScrub('spacer');
  const s = node.style;
  return (
    <Section title="Size">
      <Row label="Height">
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <SegmentedControl
            value={s.height?.mode ?? 'fixed'}
            options={SIZE_MODE_OPTIONS}
            onChange={(m) => updateStyle(node.id, { height: sizeWithMode(s.height, m) })}
          />
          {s.height?.mode === 'fixed' && (
            <NumberInput
              value={fixedSizeValue(s.height)}
              min={0}
              onBeginScrub={scrub.begin}
              onEndScrub={scrub.end}
              onChange={(v) => updateStyle(node.id, { height: { mode: 'fixed', value: v } })}
            />
          )}
        </div>
      </Row>
    </Section>
  );
}
