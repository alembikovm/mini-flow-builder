import { NumberInput, Row, Section, SegmentedControl, TextInput } from '../../../shared/ui';
import { useEditor } from '../../../app/store';
import { useScrub } from '../../../features/edit-style';
import type { ImageNode } from '../../../core/model';
import { fixedSizeValue, SIZE_MODE_OPTIONS, sizeWithMode } from './common';

const FIT = [
  { value: 'cover' as const, label: 'Cover' },
  { value: 'contain' as const, label: 'Contain' },
];

export function ImageInspector({ node }: { node: ImageNode }) {
  const updateProps = useEditor((s) => s.updateProps);
  const updateStyle = useEditor((s) => s.updateStyle);
  const scrub = useScrub('image');
  const s = node.style;

  return (
    <>
      <Section title="Source">
        <TextInput
          value={node.props.src}
          placeholder="https://..."
          onChange={(e) =>
            updateProps(node.id, 'image', { src: e.target.value }, `image:${node.id}:src`)
          }
        />
      </Section>
      <Section title="Fit">
        <SegmentedControl
          value={node.props.fit}
          options={FIT}
          onChange={(v) => updateProps(node.id, 'image', { fit: v })}
          full
        />
      </Section>
      <Section title="Size">
        <Row label="Width">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <SegmentedControl
              value={s.width?.mode ?? 'fill'}
              options={SIZE_MODE_OPTIONS}
              onChange={(m) => updateStyle(node.id, { width: sizeWithMode(s.width, m) })}
            />
            {s.width?.mode === 'fixed' && (
              <NumberInput
                value={fixedSizeValue(s.width)}
                min={0}
                onBeginScrub={scrub.begin}
                onEndScrub={scrub.end}
                onChange={(v) => updateStyle(node.id, { width: { mode: 'fixed', value: v } })}
              />
            )}
          </div>
        </Row>
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
        <Row label="Radius">
          <NumberInput
            value={s.cornerRadius ?? 0}
            min={0}
            onBeginScrub={scrub.begin}
            onEndScrub={scrub.end}
            onChange={(v) => updateStyle(node.id, { cornerRadius: v })}
          />
        </Row>
      </Section>
    </>
  );
}
