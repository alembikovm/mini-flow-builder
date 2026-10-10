import { ColorInput, NumberInput, PaddingBox, Row, SegmentedControl, Section } from '../../../shared/ui';
import { useEditor } from '../../../app/store';
import { useScrub } from '../../../features/edit-style';
import type { StackNode } from '../../../core/model';
import { DEFAULT_PADDING } from './common';
import { SizeRow } from './SizeRow';

const DIRECTION_OPTIONS = [
  { value: 'vertical' as const, label: '↓', title: 'Vertical' },
  { value: 'horizontal' as const, label: '→', title: 'Horizontal' },
];

const ALIGN_OPTIONS = [
  { value: 'start' as const, label: '⬒' },
  { value: 'center' as const, label: '✚' },
  { value: 'end' as const, label: '⬓' },
  { value: 'stretch' as const, label: '⇕' },
];

const JUSTIFY_OPTIONS = [
  { value: 'start' as const, label: '⇤' },
  { value: 'center' as const, label: '↔' },
  { value: 'end' as const, label: '⇥' },
  { value: 'space-between' as const, label: '⇔' },
];

export function StackInspector({ node }: { node: StackNode }) {
  const updateStyle = useEditor((s) => s.updateStyle);
  const scrub = useScrub('stack');
  const s = node.style;
  return (
    <>
      <Section title="Layout">
        <Row label="Direction">
          <SegmentedControl
            value={s.direction ?? 'vertical'}
            options={DIRECTION_OPTIONS}
            onChange={(v) => updateStyle(node.id, { direction: v })}
          />
        </Row>
        <Row label="Align">
          <SegmentedControl
            value={s.align ?? 'stretch'}
            options={ALIGN_OPTIONS}
            onChange={(v) => updateStyle(node.id, { align: v })}
          />
        </Row>
        <Row label="Justify">
          <SegmentedControl
            value={s.justify ?? 'start'}
            options={JUSTIFY_OPTIONS}
            onChange={(v) => updateStyle(node.id, { justify: v })}
          />
        </Row>
        <Row label="Gap">
          <NumberInput
            value={s.gap ?? 0}
            min={0}
            onBeginScrub={scrub.begin}
            onEndScrub={scrub.end}
            onChange={(v) => updateStyle(node.id, { gap: v })}
          />
        </Row>
      </Section>

      <Section title="Size">
        <SizeRow nodeId={node.id} axis="width" value={s.width} />
        <SizeRow nodeId={node.id} axis="height" value={s.height} />
      </Section>

      <Section title="Spacing">
        <PaddingBox
          value={s.padding ?? DEFAULT_PADDING}
          onChange={(p) => updateStyle(node.id, { padding: p })}
          onBeginScrub={scrub.begin}
          onEndScrub={scrub.end}
        />
      </Section>

      <Section title="Fill">
        <ColorInput value={s.fill} onChange={(c) => updateStyle(node.id, { fill: c })} />
      </Section>

      <Section title="Corner & border">
        <Row label="Radius">
          <NumberInput
            value={s.cornerRadius ?? 0}
            min={0}
            onBeginScrub={scrub.begin}
            onEndScrub={scrub.end}
            onChange={(v) => updateStyle(node.id, { cornerRadius: v })}
          />
        </Row>
        <Row label="Border">
          <NumberInput
            value={s.border?.width ?? 0}
            min={0}
            onBeginScrub={scrub.begin}
            onEndScrub={scrub.end}
            onChange={(v) =>
              updateStyle(node.id, {
                border: {
                  width: v,
                  color: s.border?.color ?? { light: '#000000', dark: '#FFFFFF' },
                },
              })
            }
          />
        </Row>
        {s.border && s.border.width > 0 && (
          <Row label="Color">
            <ColorInput
              value={s.border.color}
              onChange={(c) =>
                updateStyle(node.id, {
                  border: { width: s.border?.width ?? 1, color: c },
                })
              }
            />
          </Row>
        )}
      </Section>
    </>
  );
}
