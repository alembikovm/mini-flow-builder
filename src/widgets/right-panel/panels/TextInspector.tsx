import { ColorInput, NumberInput, Row, Section, SegmentedControl, TextArea } from '../../../shared/ui';
import { useEditor } from '../../../app/store';
import { useScrub } from '../../../features/edit-style';
import type { TextNode } from '../../../core/model';

const WEIGHTS = [
  { value: '400' as const, label: '400' },
  { value: '500' as const, label: '500' },
  { value: '600' as const, label: '600' },
  { value: '700' as const, label: '700' },
];

const ALIGN = [
  { value: 'left' as const, label: '⇤' },
  { value: 'center' as const, label: '↔' },
  { value: 'right' as const, label: '⇥' },
];

export function TextInspector({ node }: { node: TextNode }) {
  const updateProps = useEditor((s) => s.updateProps);
  const updateStyle = useEditor((s) => s.updateStyle);
  const scrub = useScrub('text');
  const s = node.style;

  return (
    <>
      <Section title="Content">
        <TextArea
          value={node.props.content}
          onChange={(e) =>
            updateProps(node.id, 'text', { content: e.target.value }, `text:${node.id}:content`)
          }
        />
      </Section>
      <Section title="Typography">
        <Row label="Size">
          <NumberInput
            value={s.fontSize ?? 16}
            min={6}
            max={200}
            onBeginScrub={scrub.begin}
            onEndScrub={scrub.end}
            onChange={(v) => updateStyle(node.id, { fontSize: v })}
          />
        </Row>
        <Row label="Weight">
          <SegmentedControl
            value={String(s.fontWeight ?? 400) as '400' | '500' | '600' | '700'}
            options={WEIGHTS}
            onChange={(v) =>
              updateStyle(node.id, { fontWeight: Number(v) as 400 | 500 | 600 | 700 })
            }
          />
        </Row>
        <Row label="Align">
          <SegmentedControl
            value={s.textAlign ?? 'left'}
            options={ALIGN}
            onChange={(v) => updateStyle(node.id, { textAlign: v })}
          />
        </Row>
      </Section>
      <Section title="Color">
        <ColorInput value={s.textColor} onChange={(c) => updateStyle(node.id, { textColor: c })} />
      </Section>
    </>
  );
}
